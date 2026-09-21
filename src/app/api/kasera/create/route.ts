import { NextResponse } from 'next/server';
import { initializeFirebase } from '@/firebase/init';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

/**
 * @fileOverview API untuk membuat transaksi Kasera Pay QRIS resmi.
 * Menghilangkan simulasi dan menggunakan integrasi API Produksi Kasera Pay.
 */

export async function POST(request: Request) {
  const { firestore } = initializeFirebase();
  if (!firestore) {
    return NextResponse.json({ error: "System Error: Firebase not initialized" }, { status: 500 });
  }

  try {
    const body = await request.json();
    const { amountCoins, totalPrice, userId, userEmail } = body;

    if (!amountCoins || !totalPrice || !userId) {
      return NextResponse.json({ error: "Data transaksi tidak lengkap" }, { status: 400 });
    }

    const apiKey = process.env.KASERA_API_KEY;
    if (!apiKey) {
      console.error("[KASERA_CREATE] API Key missing in environment variables");
      return NextResponse.json({ error: "Konfigurasi server tidak lengkap (KASERA_API_KEY missing)" }, { status: 500 });
    }

    // 1. Buat ID referensi unik Nexvora untuk pelacakan internal
    const referenceId = `NXV-${Date.now()}-${userId.slice(0, 4)}`;

    /**
     * 2. PANGGILAN API KASERA PAY RESMI
     * Endpoint: https://api.kaserapay.com/v1/transaction/create
     * Headers: Authorization Bearer [API_KEY]
     * Payload: JSON format
     */
    const response = await fetch("https://api.kaserapay.com/v1/transaction/create", {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        amount: totalPrice,
        reference_id: referenceId,
        callback_url: `https://nexvorastudio.my.id/api/kasera/webhook`,
        payment_method: 'qris'
      })
    });

    const result = await response.json();

    // Validasi respons dari server Kasera
    if (!response.ok || !result.success) {
      console.error("[KASERA_API_ERROR_RESPONSE]", result);
      return NextResponse.json({ 
        error: result.message || "Gagal menghubungi server Kasera Pay" 
      }, { status: response.status || 400 });
    }

    /**
     * 3. Simpan permintaan TopUp ke Firestore
     * Status diset 'pending' sampai webhook konfirmasi diterima.
     * qrisUrl diambil langsung dari data respons Kasera.
     */
    const docRef = await addDoc(collection(firestore, "topup_requests"), {
      userId,
      userEmail,
      amountCoins,
      idrAmount: totalPrice,
      status: "pending",
      method: "qris",
      kaseraReferenceId: referenceId,
      kaseraTransactionId: result.data?.transaction_id || null,
      qrisUrl: result.data?.qr_url || result.data?.payment_url || null,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });

    // 4. Kembalikan data asli dari Kasera ke frontend untuk ditampilkan ke user
    return NextResponse.json({
      success: true,
      data: {
        requestId: docRef.id,
        referenceId: referenceId,
        qrisUrl: result.data?.qr_url || result.data?.payment_url,
        amount: totalPrice,
        expiredAt: result.data?.expiry_date || new Date(Date.now() + 30 * 60 * 1000).toISOString()
      }
    });

  } catch (err: any) {
    console.error("[KASERA_CREATE_CRITICAL_ERROR]:", err);
    return NextResponse.json({ error: "Terjadi kesalahan internal saat memproses QRIS" }, { status: 500 });
  }
}
