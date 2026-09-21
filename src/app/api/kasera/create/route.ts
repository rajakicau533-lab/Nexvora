
import { NextResponse } from 'next/server';
import { initializeFirebase } from '@/firebase/init';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

/**
 * @fileOverview API untuk membuat transaksi Kasera Pay QRIS.
 * Melakukan panggilan server-side untuk menjaga kerahasiaan API Key.
 */

export async function POST(request: Request) {
  const { firestore } = initializeFirebase();
  if (!firestore) {
    return NextResponse.json({ error: "System Error: Firebase not initialized" }, { status: 500 });
  }

  try {
    const { amountCoins, totalPrice, userId, userEmail } = await request.json();

    if (!amountCoins || !totalPrice || !userId) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const apiKey = process.env.KASERA_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "Kasera API Key is not configured on server" }, { status: 500 });
    }

    // 1. Buat ID referensi unik
    const referenceId = `NXV-${Date.now()}-${userId.slice(0, 4)}`;

    // 2. Simpan permintaan TopUp ke Firestore dengan status 'pending'
    const docRef = await addDoc(collection(firestore, "topup_requests"), {
      userId,
      userEmail,
      amountCoins,
      idrAmount: totalPrice,
      status: "pending",
      method: "qris",
      kaseraReferenceId: referenceId,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });

    /**
     * PANGGILAN API KASERA (Simulasi Integrasi)
     * Dalam implementasi nyata, ganti dengan endpoint resmi Kasera Pay.
     */
    // const response = await fetch("https://api.kaserapay.com/v1/transaction/create", {
    //   method: 'POST',
    //   headers: {
    //     'Authorization': `Bearer ${apiKey}`,
    //     'Content-Type': 'application/json'
    //   },
    //   body: JSON.stringify({
    //     amount: totalPrice,
    //     reference_id: referenceId,
    //     callback_url: `https://nexvorastudio.my.id/api/kasera/webhook`
    //   })
    // });
    // const result = await response.json();
    
    // Simulasi QRIS URL menggunakan QR Server (Hanya contoh visual)
    const simulatedQrisUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=KASERA-PAYMENT-${referenceId}-${totalPrice}`;

    return NextResponse.json({
      success: true,
      data: {
        requestId: docRef.id,
        referenceId: referenceId,
        qrisUrl: simulatedQrisUrl,
        amount: totalPrice,
        expiredAt: new Date(Date.now() + 30 * 60 * 1000).toISOString() // Berlaku 30 menit
      }
    });

  } catch (err: any) {
    console.error("Kasera Create Error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
