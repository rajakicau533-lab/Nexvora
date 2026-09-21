import { NextResponse } from 'next/server';
import { initializeFirebase } from "../../../../firebase/init";
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
 * Health Check Handler
 */
export async function GET() {
  return NextResponse.json({
    ok: true,
    service: "kasera-webhook",
    timestamp: new Date().toISOString()
  });
}

/**
 * Webhook Handler Kasera Pay Resmi (V1)
 */
export async function POST(request: Request) {
  const { firestore } = initializeFirebase();
  if (!firestore) {
    return NextResponse.json({ error: "Firebase unavailable" }, { status: 500 });
  }

  try {
    const rawBody = await request.text();
    const signatureHeader = request.headers.get('Kasera-Signature-V1');
    const webhookSecret = process.env.KASERA_WEBHOOK_SECRET;

    if (!signatureHeader || !webhookSecret) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Parsing Signature: t=<unix>,v1=<hex>
    const parts = signatureHeader.split(',');
    const t = parts.find(p => p.startsWith('t='))?.split('=')[1];
    const v1 = parts.find(p => p.startsWith('v1='))?.split('=')[1];

    if (!t || !v1) {
      return NextResponse.json({ error: "Invalid signature format" }, { status: 400 });
    }

    // Validasi Timestamp (Toleransi 5 menit)
    const now = Math.floor(Date.now() / 1000);
    if (Math.abs(now - parseInt(t)) > 300) {
      return NextResponse.json({ error: "Timestamp expired" }, { status: 403 });
    }

    // Verifikasi HMAC SHA256
    const hmac = crypto.createHmac('sha256', webhookSecret);
    const signedPayload = `${t}.${rawBody}`;
    const expectedSignature = hmac.update(signedPayload).digest('hex');

    if (!crypto.timingSafeEqual(Buffer.from(expectedSignature, 'hex'), Buffer.from(v1, 'hex'))) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 403 });
    }

    const body = JSON.parse(rawBody);
    if (body.type !== "payment.paid") {
      return NextResponse.json({ message: "Ignored event type" }, { status: 200 });
    }

    const { external_id, amount } = body.data;

    // Cari transaksi pending
    const q = query(
      collection(firestore, "topup_requests"), 
      where("kaseraReferenceId", "==", external_id),
      where("status", "==", "pending")
    );
    
    const snapshot = await getDocs(q);
    if (snapshot.empty) {
      return NextResponse.json({ message: "Transaction already processed or not found" }, { status: 200 });
    }

    const topupDoc = snapshot.docs[0];
    const topupData = topupDoc.data();

    // Validasi nominal
    if (Math.round(topupData.idrAmount) !== Math.round(amount)) {
      return NextResponse.json({ error: "Amount mismatch" }, { status: 400 });
    }

    // Proses ATOMIK: Update Status & Saldo
    const batch = writeBatch(firestore);
    
    batch.update(doc(firestore, "topup_requests", topupDoc.id), {
      status: "approved",
      paidAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      processedBy: "kasera-webhook"
    });

    const userRef = doc(firestore, "users", topupData.userId);
    batch.update(userRef, {
      coins: increment(topupData.amountCoins),
      updatedAt: serverTimestamp()
    });

    batch.set(doc(collection(firestore, "coin_transactions")), {
      userId: topupData.userId,
      amount: topupData.amountCoins,
      type: "topup",
      description: `Topup QRIS Berhasil (Ref: ${external_id})`,
      createdAt: serverTimestamp()
    });

    await batch.commit();

    return NextResponse.json({ success: true }, { status: 200 });

  } catch (err: any) {
    console.error("[WEBHOOK_ERROR]:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
