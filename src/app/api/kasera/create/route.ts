import { NextResponse } from "next/server";
import { initializeFirebase } from "../../../../firebase/init";
import {
  collection,
  addDoc,
  serverTimestamp,
} from "firebase/firestore";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    // ==============================
    // FIREBASE
    // ==============================
    const { firestore } = initializeFirebase();

    if (!firestore) {
      return NextResponse.json(
        {
          success: false,
          error: "Firebase tidak berhasil diinisialisasi",
        },
        { status: 500 }
      );
    }

    // ==============================
    // REQUEST BODY
    // ==============================
    let body: any;

    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        {
          success: false,
          error: "Request body tidak valid",
        },
        { status: 400 }
      );
    }

    const {
      amountCoins,
      totalPrice,
      userId,
      userEmail,
    } = body || {};

    // ==============================
    // VALIDASI
    // ==============================
    if (!userId) {
      return NextResponse.json(
        {
          success: false,
          error: "userId wajib diisi",
        },
        { status: 400 }
      );
    }

    if (!amountCoins || Number(amountCoins) <= 0) {
      return NextResponse.json(
        {
          success: false,
          error: "Jumlah koin tidak valid",
        },
        { status: 400 }
      );
    }

    if (!totalPrice || Number(totalPrice) <= 0) {
      return NextResponse.json(
        {
          success: false,
          error: "Nominal pembayaran tidak valid",
        },
        { status: 400 }
      );
    }

    // ==============================
    // KASERA API KEY
    // ==============================
    const apiKey = process.env.KASERA_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        {
          success: false,
          error: "Server configuration missing (KASERA_API_KEY)",
        },
        { status: 500 }
      );
    }

    // ==============================
    // REFERENCE ID
    // ==============================
    const referenceId =
      `NXV-${Date.now()}-${String(userId).slice(0, 8)}`;

    // ==============================
    // CREATE KASERA TRANSACTION
    // ==============================
    const kaseraResponse = await fetch(
      "https://pay.kasera.id/v1/transactions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
          "Idempotency-Key": referenceId,
        },
        body: JSON.stringify({
          amount: Number(totalPrice),
          external_id: referenceId,
          merchant_ref: referenceId,
          description: `Top Up ${amountCoins} Koin Nexvora Studio`,
          payment_methods: ["qris"],
        }),
      }
    );

    // ==============================
    // BACA RESPONSE KASERA
    // ==============================
    const responseText = await kaseraResponse.text();

    let result: any = null;

    if (responseText.trim()) {
      try {
        result = JSON.parse(responseText);
      } catch {
        console.error(
          "[KASERA_INVALID_JSON]",
          responseText.substring(0, 1000)
        );

        return NextResponse.json(
          {
            success: false,
            error:
              "KASERA_API_ERROR: response Kasera bukan JSON",
          },
          { status: 502 }
        );
      }
    }

    // ==============================
    // HTTP ERROR DARI KASERA
    // ==============================
    if (!kaseraResponse.ok) {
      console.error("[KASERA_HTTP_ERROR]", {
        status: kaseraResponse.status,
        response: result,
      });

      const kaseraMessage =
        result?.message ||
        result?.error ||
        result?.errors?.[0]?.message ||
        `Kasera HTTP ${kaseraResponse.status}`;

      return NextResponse.json(
        {
          success: false,
          error: `KASERA_API_ERROR: ${kaseraMessage}`,
        },
        { status: kaseraResponse.status }
      );
    }

    // ==============================
    // VALIDASI RESPONSE
    // ==============================
    if (!result) {
      return NextResponse.json(
        {
          success: false,
          error:
            "KASERA_API_ERROR: response kosong",
        },
        { status: 502 }
      );
    }

    const transactionId = result?.id;
    const status = result?.status;
    const paymentMethod = result?.payment_method;

    const qrString =
      result?.payment?.qr_string || null;

    const checkoutUrl =
      result?.checkout_url || null;

    const expiresAt =
      result?.expires_at || null;

    if (!transactionId) {
      console.error(
        "[KASERA_INVALID_RESPONSE]",
        result
      );

      return NextResponse.json(
        {
          success: false,
          error:
            "KASERA_API_ERROR: transaction ID tidak ditemukan",
        },
        { status: 502 }
      );
    }

    if (!qrString) {
      console.error(
        "[KASERA_QRIS_MISSING]",
        result
      );

      return NextResponse.json(
        {
          success: false,
          error:
            "KASERA_API_ERROR: QRIS string tidak ditemukan",
        },
        { status: 502 }
      );
    }

    // ==============================
    // SIMPAN TRANSAKSI KE FIRESTORE
    // ==============================
    const topupRef = await addDoc(
      collection(firestore, "topup_requests"),
      {
        userId: String(userId),
        userEmail: userEmail || null,

        amountCoins: Number(amountCoins),
        idrAmount: Number(totalPrice),

        status: "pending",
        method: "qris",

        kaseraReferenceId: referenceId,
        kaseraTransactionId: transactionId,

        kaseraStatus: status || "pending",
        kaseraPaymentMethod:
          paymentMethod || "qris",

        qrString,
        checkoutUrl,

        expiresAt,

        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      }
    );

    // ==============================
    // RESPONSE KE FRONTEND
    // ==============================
    return NextResponse.json(
      {
        success: true,

        data: {
          requestId: topupRef.id,

          referenceId,

          transactionId,

          status: status || "pending",

          paymentMethod:
            paymentMethod || "qris",

          amount: Number(totalPrice),

          amountCoins: Number(amountCoins),

          qrString,

          checkoutUrl,

          expiresAt,
        },
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error(
      "[KASERA_CREATE_CRITICAL_ERROR]",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error:
          error?.message ||
          "Terjadi kesalahan internal server",
      },
      { status: 500 }
    );
  }
}
