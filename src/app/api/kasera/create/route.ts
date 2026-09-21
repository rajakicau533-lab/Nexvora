import { NextResponse } from 'next/server';
import { initializeFirebase } from '@/firebase/init';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

/**
 * @fileOverview API untuk membuat transaksi Kasera Pay resmi (v1).
 * Endpoint: https://pay.kasera.id/v1/transactions
 */

export async function POST(request: Request) {
  const { firestore } = initializeFirebase();
  if (!firestore) {
    return NextResponse.json({ error: "System Error: Firebase not initialized" }, { status: 500 });
  }

  try {
    const body = await request.json();
    const { amountCoins, totalPrice, userId, userEmail } = body;

    // Validasi input dasar
    if (!totalPrice || !userId) {
      return NextResponse.json({ error: "Data transaksi tidak lengkap" }, { status: 400 });
    }

    const apiKey = process.env.KASERA_API_KEY;
    if (!apiKey) {
      console.error("[KASERA_CREATE] API Key missing in environment variables");
      return NextResponse.json({ error: "Konfigurasi server tidak lengkap" }, { status: 500 });
    }

    // ID referensi unik Nexvora untuk external_id
    const referenceId = `NXV-${Date.now()}-${userId.slice(0, 4)}`;

    /**
     * PANGGILAN API KASERA PAY RESMI v1
     * Dokumentasi: POST https://pay.kasera.id/v1/transactions
     */
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
        description: "Top Up Koin Nexvora Studio",
        payment_methods: ["qris"]
      })
    });

    const result = await response.json();

    // Validasi respons dari server Kasera
    if (!response.ok) {
      console.error("[KASERA_API_ERROR_RESPONSE]", result);
      return NextResponse.json({ 
        error: result.message || "Gagal menghubungi server Kasera Pay" 
      }, { status: response.status || 400 });
    }

    /**
     * Mapping data dari response resmi Kasera v1
     * Field: id, status, payment.qr_string, checkout_url, expires_at
     */
    const transactionId = result.id;
    const status = result.status;
    const qrString = result.payment?.qr_string;
    const checkoutUrl = result.checkout_url;
    const expiresAt = result.expires_at;

    // Konversi qr_string menjadi URL gambar QR Code agar bisa dirender oleh <img> di frontend
    // Hal ini dilakukan untuk menjaga fungsionalitas dashboard tanpa mengubah file UI (page.tsx)
    const qrisUrl = qrString 
      ? `https://api.qrserver.com/v1/create-qr-code/?data=${encodeURIComponent(qrString)}&size=400x400` 
      : null;

    /**
     * Simpan permintaan TopUp ke Firestore dengan status 'pending'
     */
    const docRef = await addDoc(collection(firestore, "topup_requests"), {
      userId,
      userEmail,
      amountCoins,
      idrAmount: totalPrice,
      status: "pending",
      method: "qris",
      kaseraReferenceId: referenceId, // external_id
      kaseraTransactionId: transactionId, // result.id
      qrString: qrString || null,
      qrisUrl: qrisUrl, // Untuk ditampilkan di frontend dialog
      checkoutUrl: checkoutUrl || null,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      expiredAt: expiresAt || null
    });

    // Kembalikan data lengkap ke frontend
    return NextResponse.json({
      success: true,
      data: {
        requestId: docRef.id,
        referenceId: referenceId,
        qrisUrl: qrisUrl,
        qrString: qrString,
        checkoutUrl: checkoutUrl,
        amount: totalPrice,
        expiredAt: expiresAt
      }
    });

  } catch (err: any) {
    console.error("[KASERA_CREATE_CRITICAL_ERROR]:", err);
    return NextResponse.json({ error: "Terjadi kesalahan internal saat memproses pembayaran" }, { status: 500 });
  }
}
