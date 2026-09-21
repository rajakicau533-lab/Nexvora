import { NextResponse } from "next/server";
import crypto from "crypto";
import { initializeFirebase } from "../../../../firebase/init";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  runTransaction,
  serverTimestamp,
} from "firebase/firestore";

export const dynamic = "force-dynamic";

function verifyKaseraSignature(
  signature: string,
  rawBody: string,
  secret: string
): boolean {
  try {
    const timestampPart = signature
      .split(",")
      .find((part) => part.startsWith("t="));

    const signaturePart = signature
      .split(",")
      .find((part) => part.startsWith("v1="));

    if (!timestampPart || !signaturePart) {
      return false;
    }

    const timestamp = timestampPart.substring(2);
    const receivedSignature =
      signaturePart.substring(3);

    const timestampNumber = Number(timestamp);

    if (!Number.isFinite(timestampNumber)) {
      return false;
    }

    // Maksimal umur webhook 5 menit
    const now = Math.floor(Date.now() / 1000);

    if (Math.abs(now - timestampNumber) > 300) {
      return false;
    }

    const signedPayload =
      `${timestamp}.${rawBody}`;

    const expectedSignature =
      crypto
        .createHmac("sha256", secret)
        .update(signedPayload)
        .digest("hex");

    const receivedBuffer =
      Buffer.from(receivedSignature, "utf8");

    const expectedBuffer =
      Buffer.from(expectedSignature, "utf8");

    if (
      receivedBuffer.length !==
      expectedBuffer.length
    ) {
      return false;
    }

    return crypto.timingSafeEqual(
      receivedBuffer,
      expectedBuffer
    );
  } catch (error) {
    console.error(
      "[KASERA_SIGNATURE_ERROR]",
      error
    );

    return false;
  }
}

export async function GET() {
  return NextResponse.json({
    ok: true,
    service: "kasera-webhook",
    timestamp: new Date().toISOString(),
  });
}

export async function POST(request: Request) {
  try {
    const secret =
      process.env.KASERA_WEBHOOK_SECRET;

    if (!secret) {
      return NextResponse.json(
        {
          success: false,
          error:
            "KASERA_WEBHOOK_SECRET belum dikonfigurasi",
        },
        { status: 500 }
      );
    }

    // WAJIB membaca raw body sebelum JSON.parse
    const rawBody = await request.text();

    const signature =
      request.headers.get(
        "Kasera-Signature-V1"
      );

    if (!signature) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Kasera-Signature-V1 tidak ditemukan",
        },
        { status: 401 }
      );
    }

    // Verifikasi signature
    if (
      !verifyKaseraSignature(
        signature,
        rawBody,
        secret
      )
    ) {
      console.error(
        "[KASERA_WEBHOOK] Signature tidak valid"
      );

      return NextResponse.json(
        {
          success: false,
          error: "Invalid signature",
        },
        { status: 401 }
      );
    }

    // Parse JSON
    let event: any;

    try {
      event = JSON.parse(rawBody);
    } catch {
      return NextResponse.json(
        {
          success: false,
          error: "Webhook body bukan JSON",
        },
        { status: 400 }
      );
    }

    console.log(
      "[KASERA_WEBHOOK]",
      JSON.stringify(event)
    );

    // Hanya payment.paid
    if (event?.type !== "payment.paid") {
      return NextResponse.json({
        success: true,
        processed: false,
        message: "Event diabaikan",
      });
    }

    const data =
      event?.data || {};

    /*
     * Ambil ID transaksi dari beberapa kemungkinan
     * struktur response Kasera.
     */
    const transactionId =
      data?.id ||
      data?.transaction_id ||
      data?.payment_request_id;

    const externalId =
      data?.external_id ||
      data?.merchant_ref;

    const eventId =
      request.headers.get(
        "Kasera-Event-Id"
      ) ||
      event?.id ||
      event?.event_id ||
      `${transactionId || externalId}-payment.paid`;

    if (!transactionId && !externalId) {
      return NextResponse.json(
        {
          success: false,
          error:
            "ID transaksi Kasera tidak ditemukan",
        },
        { status: 400 }
      );
    }

    const { firestore } =
      initializeFirebase();

    if (!firestore) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Firebase gagal diinisialisasi",
        },
        { status: 500 }
      );
    }

    // ==========================================
    // CARI TOPUP BERDASARKAN TRANSAKSI KASERA
    // ==========================================

    let topupSnapshot: any = null;

    if (transactionId) {
      const q = query(
        collection(
          firestore,
          "topup_requests"
        ),
        where(
          "kaseraTransactionId",
          "==",
          transactionId
        )
      );

      topupSnapshot =
        await getDocs(q);
    }

    if (
      (!topupSnapshot ||
        topupSnapshot.empty) &&
      externalId
    ) {
      const q = query(
        collection(
          firestore,
          "topup_requests"
        ),
        where(
          "kaseraReferenceId",
          "==",
          externalId
        )
      );

      topupSnapshot =
        await getDocs(q);
    }

    if (
      !topupSnapshot ||
      topupSnapshot.empty
    ) {
      console.error(
        "[KASERA_WEBHOOK] Topup tidak ditemukan",
        {
          transactionId,
          externalId,
        }
      );

      /*
       * Return 200 supaya event yang valid
       * tidak terus dikirim ulang ketika
       * transaksi belum ditemukan.
       */
      return NextResponse.json({
        success: true,
        processed: false,
        message:
          "Topup belum ditemukan",
      });
    }

    const topupDoc =
      topupSnapshot.docs[0];

    const topupRef =
      doc(
        firestore,
        "topup_requests",
        topupDoc.id
      );

    // ==========================================
    // PROSES ATOMIC
    // ==========================================

    await runTransaction(
      firestore,
      async (transaction) => {
        const freshTopup =
          await transaction.get(
            topupRef
          );

        if (!freshTopup.exists()) {
          throw new Error(
            "Data topup tidak ditemukan"
          );
        }

        const topup =
          freshTopup.data();

        /*
         * Kalau sudah paid/completed,
         * jangan tambah koin lagi.
         */
        if (
          topup.status === "paid" ||
          topup.status === "completed"
        ) {
          return;
        }

        /*
         * Anti duplicate event.
         */
        if (
          topup.kaseraEventId ===
          eventId
        ) {
          return;
        }

        const userId =
          topup.userId;

        const amountCoins =
          Number(
            topup.amountCoins || 0
          );

        const expectedAmount =
          Number(
            topup.idrAmount || 0
          );

        if (
          !userId ||
          amountCoins <= 0
        ) {
          throw new Error(
            "Data user atau jumlah koin tidak valid"
          );
        }

        // ========================================
        // VALIDASI NOMINAL
        // ========================================

        const paidAmount =
          Number(
            data?.amount ||
            data?.paid_amount ||
            0
          );

        if (
          paidAmount > 0 &&
          expectedAmount > 0 &&
          paidAmount !== expectedAmount
        ) {
          throw new Error(
            `Nominal pembayaran tidak sesuai. Dibayar ${paidAmount}, seharusnya ${expectedAmount}`
          );
        }

        // ========================================
        // USER
        // ========================================

        /*
         * Dokumen users kamu menggunakan UID
         * sebagai ID dokumen.
         */
        const userRef =
          doc(
            firestore,
            "users",
            userId
          );

        const userSnapshot =
          await transaction.get(
            userRef
          );

        if (!userSnapshot.exists()) {
          throw new Error(
            "User tidak ditemukan: " +
              userId
          );
        }

        const userData =
          userSnapshot.data();

        const currentCoins =
          Number(
            userData.coins || 0
          );

        const newCoins =
          currentCoins +
          amountCoins;

        // ========================================
        // TAMBAH COINS
        // ========================================

        transaction.update(
          userRef,
          {
            coins: newCoins,
            updatedAt:
              serverTimestamp(),
          }
        );

        // ========================================
        // CATAT COIN TRANSACTION
        // ========================================

        const coinTransactionRef =
          doc(
            collection(
              firestore,
              "coin_transactions"
            )
          );

        transaction.set(
          coinTransactionRef,
          {
            amount: amountCoins,

            createdAt:
              serverTimestamp(),

            description:
              `Top Up ${amountCoins} Koin via QRIS Kasera`,

            type: "topup",

            userId,

            kaseraTransactionId:
              transactionId || null,

            kaseraReferenceId:
              externalId || null,

            kaseraEventId:
              eventId,

            paymentMethod:
              "qris",
          }
        );

        // ========================================
        // UPDATE TOPUP
        // ========================================

        transaction.update(
          topupRef,
          {
            status: "paid",

            kaseraStatus: "paid",

            kaseraEventId:
              eventId,

            paidAmount:
              paidAmount ||
              expectedAmount,

            paidAt:
              serverTimestamp(),

            updatedAt:
              serverTimestamp(),
          }
        );
      }
    );

    return NextResponse.json({
      success: true,
      processed: true,
      eventId,
      message:
        "Pembayaran berhasil dan koin telah ditambahkan",
    });
  } catch (error: any) {
    console.error(
      "[KASERA_WEBHOOK_ERROR]",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error:
          error?.message ||
          "Internal webhook error",
      },
      { status: 500 }
    );
  }
}
