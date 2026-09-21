import { NextResponse } from 'next/server';
import { initializeFirebase } from "../../../../firebase/init";
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

/**
 * @fileOverview API untuk membuat transaksi Kasera Pay resmi (v1).
 * Menghasilkan QRIS asli untuk pengisian koin Nexvora.
 */

export async function POST(request: Request) {
  const { firestore } = initializeFirebase();
  if (!firestore) {
    return NextResponse.json({ error: "System Error: Firebase not initialized" }, { status: 500 });
  }

  try {
    const body = await request.json();
    const { amountCoins, totalPrice, userId, userEmail } = body;

    if (!totalPrice || !userId) {
      return NextResponse.json({ error: "Data transaksi tidak lengkap" }, { status: 400 });
    }

    const apiKey = process.env.KASERA_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "Server configuration missing (API Key)" }, { status: 500 });
    }

    const referenceId = `NXV-${Date.now()}-${userId.slice(0, 5)}`;

    // PANGGILAN API KASERA PAY RESMI v1
    const response = await fetch("https://pay.kasera.id/v1/transactions", {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'Idempotency-Key': referenceId
      },
      body: JSON.stringify({
        amount: totalPrice,
        external_id: referenceId,
        description: `Top Up ${amountCoins} Koin Nexvora Studio`,
        payment_methods: ["qris"]
      })
    });

    const result = await response.json();

    if (!response.ok) {
      console.error("[KASERA_API_ERROR]", result);
      return NextResponse.json({ 
        error: result.message || "Gagal menghubungi server Kasera Pay" 
      }, { status: response.status });
    }

    const transactionId = result.id;
    const qrString = result.payment?.qr_string;
    const checkoutUrl = result.checkout_url;
    const expiresAt = result.expires_at;

    // QRIS URL Generator (menggunakan qr_string asli dari Kasera)
    const qrisUrl = qrString 
      ? `https://api.qrserver.com/v1/create-qr-code/?data=${encodeURIComponent(qrString)}&size=400x400` 
      : null;

    const docRef = await addDoc(collection(firestore, "topup_requests"), {
      userId,
      userEmail,
      amountCoins,
      idrAmount: totalPrice,
      status: "pending",
      method: "qris",
      kaseraReferenceId: referenceId,
      kaseraTransactionId: transactionId,
      qrString: qrString || null,
      qrisUrl: qrisUrl,
      checkoutUrl: checkoutUrl || null,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      expiresAt: expiresAt || null
    });

    return NextResponse.json({
      success: true,
      data: {
        requestId: docRef.id,
        referenceId: referenceId,
        qrisUrl: qrisUrl,
        amount: totalPrice,
        expiresAt: expiresAt
      }
    });

  } catch (err: any) {
    console.error("[KASERA_CREATE_CRITICAL_ERROR]:", err);
    return NextResponse.json({ error: "Terjadi kesalahan internal sistem pembayaran" }, { status: 500 });
  }
}
