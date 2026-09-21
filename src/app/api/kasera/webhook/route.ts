import { NextResponse } from 'next/server';
import { initializeFirebase } from '@/firebase';
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

export const dynamic = 'force-dynamic';

/**
 * GET Handler untuk Health Check
 */
export async function GET() {
  return NextResponse.json({
    ok: true,
    service: "kasera-webhook",
    timestamp: new Date().toISOString()
  }, { status: 200 });
}

/**
 * POST Handler untuk Webhook Kasera Pay Resmi
 * Verifikasi menggunakan Kasera-Signature-V1
 */
export async function POST(request: Request) {
  const { firestore } = initializeFirebase();
  if (!firestore) {
    return NextResponse.json({ error: "Firebase unavailable" }, { status: 500 });
  }

  try {
    const rawBody = await request.text();
    const signatureHeader = request.headers.get('Kasera-Signature-V1');
    const eventId = request.headers.get('Kasera-Event-Id');
    const webhookSecret = process.env.KASERA_WEBHOOK_SECRET;

    // 1. Verifikasi Kehadiran Signature & Secret
    if (!signatureHeader || !webhookSecret) {
      console.warn("[WEBHOOK_KASERA] Unauthorized: Missing signature or secret");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 2. Parsing Signature Header (Format: t=<unix>,v1=<hex>)
    const parts = signatureHeader.split(',');
    const timestampPart = parts.find(p => p.startsWith('t='));
    const signaturePart = parts.find(p => p.startsWith('v1='));

    if (!timestampPart || !signaturePart) {
      return NextResponse.json({ error: "Invalid signature format" }, { status: 400 });
    }

    const t = timestampPart.split('=')[1];
    const v1 = signaturePart.split('=')[1];

    // 3. Verifikasi Timestamp (Tolerance 5 menit / 300 detik)
    const now = Math.floor(Date.now() / 1000);
    const diff = Math.abs(now - parseInt(t));
    if (diff > 300) {
      console.warn("[WEBHOOK_KASERA] Forbidden: Timestamp out of range", { diff });
      return NextResponse.json({ error: "Timestamp expired" }, { status: 403 });
    }

    // 4. Hitung HMAC SHA256 (t + "." + rawBody)
    const hmac = crypto.createHmac('sha256', webhookSecret);
    const signedPayload = `${t}.${rawBody}`;
    const expectedSignature = hmac.update(signedPayload).digest('hex');

    // 5. Secure Comparison menggunakan timingSafeEqual
    const expectedBuffer = Buffer.from(expectedSignature, 'hex');
    const actualBuffer = Buffer.from(v1, 'hex');

    if (expectedBuffer.length !== actualBuffer.length || !crypto.timingSafeEqual(expectedBuffer, actualBuffer)) {
      console.warn("[WEBHOOK_KASERA] Forbidden: Signature mismatch");
      return NextResponse.json({ error: "Invalid signature" }, { status: 403 });
    }

    // 6. Parse Body & Cek Tipe Event
    const body = JSON.parse(rawBody);
    if (body.type !== "payment.paid") {
      return NextResponse.json({ message: "Event type ignored" }, { status: 200 });
    }

    const { external_id, amount, payment_request_id } = body.data;

    // 7. Cari Transaksi di Firestore (Cegah double process)
    const topupQuery = query(
      collection(firestore, "topup_requests"), 
      where("kaseraReferenceId", "==", external_id),
      where("status", "==", "pending")
    );
    
    const snapshot = await getDocs(topupQuery);

    if (snapshot.empty) {
      console.log(`[WEBHOOK_KASERA] Reference ${external_id} already processed or not found.`);
      return NextResponse.json({ message: "Already processed or invalid" }, { status: 200 });
    }

    const topupDoc = snapshot.docs[0];
    const topupData = topupDoc.data();

    // 8. Validasi Nominal (Pencegahan manipulasi)
    if (Number(topupData.idrAmount) !== Number(amount)) {
      console.error(`[WEBHOOK_KASERA] Amount mismatch: DB=${topupData.idrAmount}, Webhook=${amount}`);
      return NextResponse.json({ error: "Amount verification failed" }, { status: 400 });
    }

    // 9. Eksekusi Batch Update (Atomic)
    const batch = writeBatch(firestore);
    
    // Update status transaksi
    batch.update(doc(firestore, "topup_requests", topupDoc.id), {
      status: "approved",
      paidAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      kaseraEventId: eventId || body.id,
      kaseraPaymentRequestId: payment_request_id
    });

    // Tambahkan koin ke User
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
      description: `Topup QRIS (Ref: ${external_id})`,
      createdAt: serverTimestamp()
    });

    // Catat log aktivitas sistem
    const logRef = doc(collection(firestore, "activity_logs"));
    batch.set(logRef, {
      type: "system",
      action: "QRIS_AUTO_PAID",
      details: `Ref: ${external_id} | Rp${amount} | EventId: ${eventId || body.id}`,
      userId: topupData.userId,
      timestamp: serverTimestamp()
    });

    await batch.commit();

    console.log(`[WEBHOOK_KASERA] SUCCESS: Payment for ref ${external_id} processed.`);
    return NextResponse.json({ success: true }, { status: 200 });

  } catch (err: any) {
    console.error("[WEBHOOK_KASERA] Internal Error:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
