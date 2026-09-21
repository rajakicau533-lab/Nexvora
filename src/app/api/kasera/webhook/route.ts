
import { NextResponse } from 'next/server';
import { initializeFirebase } from '@/firebase/init';
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  doc, 
  increment, 
  serverTimestamp,
  writeBatch
} from 'firebase/firestore';
import crypto from 'crypto';

/**
 * Konfigurasi Rute Next.js App Router
 * Memastikan endpoint bersifat dinamis untuk menerima request eksternal secara real-time.
 */
export const dynamic = 'force-dynamic';

/**
 * GET Handler untuk Health Check
 * Digunakan untuk memverifikasi apakah endpoint sudah aktif di server.
 * Akses: https://nexvorastudio.my.id/api/kasera/webhook
 */
export async function GET() {
  return NextResponse.json({
    ok: true,
    service: "kasera-webhook",
    timestamp: new Date().toISOString()
  }, { status: 200 });
}

/**
 * POST Handler untuk Webhook Kasera
 * Menangani notifikasi pembayaran sukses dari server Kasera secara aman.
 */
export async function POST(request: Request) {
  // Inisialisasi Firestore untuk penggunaan server-side
  const { firestore } = initializeFirebase();
  if (!firestore) {
    console.error("[WEBHOOK_KASERA] Firestore initialization failed");
    return NextResponse.json({ error: "Firebase unavailable" }, { status: 500 });
  }

  try {
    // 1. Ambil data mentah untuk verifikasi signature
    const rawBody = await request.text();
    const signature = request.headers.get('Kasera-Signature');
    const webhookSecret = process.env.KASERA_WEBHOOK_SECRET;

    // 2. Verifikasi Keamanan Signature
    if (webhookSecret) {
      if (!signature) {
        console.warn("[WEBHOOK_KASERA] Missing signature header");
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }

      const hmac = crypto.createHmac('sha256', webhookSecret);
      const expectedSignature = hmac.update(rawBody).digest('hex');

      if (signature !== expectedSignature) {
        console.warn("[WEBHOOK_KASERA] Invalid signature detected");
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
    }

    // 3. Parse body request
    let body;
    try {
      body = JSON.parse(rawBody);
    } catch (e) {
      return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
    }

    const { reference_id, status, amount } = body;

    // 4. Validasi Status Pembayaran (Hanya proses jika dibayar/sukses)
    const validStatuses = ['paid', 'success', 'settlement', 'success_payment'];
    const isSuccess = validStatuses.includes(status?.toLowerCase());

    if (!isSuccess) {
      console.log(`[WEBHOOK_KASERA] Status ${status} diabaikan untuk ref: ${reference_id}`);
      return NextResponse.json({ message: "Processed (ignored status)" }, { status: 200 });
    }

    // 5. Cari transaksi 'pending' di Firestore secara atomik
    const topupQuery = query(
      collection(firestore, "topup_requests"), 
      where("kaseraReferenceId", "==", reference_id),
      where("status", "==", "pending")
    );
    
    const snapshot = await getDocs(topupQuery);

    if (snapshot.empty) {
      console.log(`[WEBHOOK_KASERA] Reference ${reference_id} sudah diproses atau tidak valid.`);
      return NextResponse.json({ message: "No action required (already processed)" }, { status: 200 });
    }

    const topupDoc = snapshot.docs[0];
    const topupData = topupDoc.data();

    // 6. Validasi Nominal (Pencegahan manipulasi data)
    if (Number(topupData.idrAmount) !== Number(amount)) {
      console.error(`[WEBHOOK_KASERA] Nominal tidak sesuai untuk ${reference_id}`);
      return NextResponse.json({ error: "Verification failed (amount mismatch)" }, { status: 400 });
    }

    // 7. Eksekusi Batch Update (Atomisitas Data)
    const batch = writeBatch(firestore);
    
    // Update status transaksi menjadi approved
    batch.update(doc(firestore, "topup_requests", topupDoc.id), {
      status: "approved",
      paidAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });

    // Tambahkan koin ke saldo User
    const userRef = doc(firestore, "users", topupData.userId);
    batch.update(userRef, {
      coins: increment(topupData.amountCoins),
      updatedAt: serverTimestamp()
    });

    // Catat log transaksi koin
    const txRef = doc(collection(firestore, "coin_transactions"));
    batch.set(txRef, {
      userId: topupData.userId,
      amount: topupData.amountCoins,
      type: "topup",
      description: `Topup QRIS (Ref: ${reference_id})`,
      createdAt: serverTimestamp()
    });

    // Catat log aktivitas sistem
    const logRef = doc(collection(firestore, "activity_logs"));
    batch.set(logRef, {
      type: "system",
      action: "QRIS_AUTO_PAID",
      details: `Reference: ${reference_id} | Rp${amount}`,
      userId: topupData.userId,
      timestamp: serverTimestamp()
    });

    await batch.commit();

    console.log(`[WEBHOOK_KASERA] BERHASIL: Pembayaran ref ${reference_id} selesai diproses.`);
    return NextResponse.json({ success: true }, { status: 200 });

  } catch (err: any) {
    console.error("[WEBHOOK_KASERA] Internal Error:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
