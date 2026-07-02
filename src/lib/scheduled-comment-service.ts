
/**
 * @fileOverview Scheduled Comment Service
 * Menangani pembuatan jadwal dan eksekusi antrean komentar Shopee secara otomatis di sisi server.
 */

import { 
  Firestore, 
  collection, 
  addDoc, 
  doc, 
  updateDoc, 
  increment, 
  serverTimestamp, 
  Timestamp,
  getDoc,
  getDocs,
  query,
  where,
  limit
} from 'firebase/firestore';
import { processTrafficOrder } from '@/ai/flows/process-traffic-order-flow';

/**
 * Membuat entri jadwal komentar baru dan memotong koin user.
 */
export async function createScheduledComment(db: Firestore, data: any) {
  const userRef = doc(db, "users", data.userId);
  
  // Simpan record jadwal
  const scheduledRef = await addDoc(collection(db, "scheduled_comments"), {
    ...data,
    status: "scheduled",
    createdAt: serverTimestamp(),
  });

  // Potong koin
  await updateDoc(userRef, {
    coins: increment(-data.coinUsed)
  });

  // Log transaksi
  await addDoc(collection(db, "coin_transactions"), {
    userId: data.userId,
    amount: -data.coinUsed,
    type: "traffic_order",
    description: `Jadwal Komentar Shopee: ${data.videoLink.slice(0, 30)}...`,
    createdAt: serverTimestamp()
  });

  return scheduledRef.id;
}

/**
 * Menjalankan satu entri jadwal dengan mengirimkannya ke SMM.ID.
 */
export async function executeScheduledComment(
  db: Firestore, 
  commentId: string, 
  item: any, 
  apiSettings: { apiUrl: string; apiKey: string }
) {
  const commentRef = doc(db, "scheduled_comments", commentId);

  // 1. Update status agar tidak diproses ganda (Mutex Lock)
  await updateDoc(commentRef, {
    status: "processing",
    updatedAt: serverTimestamp()
  });

  console.log(`[SCHEDULER EXECUTE] Document: ${commentId}`);

  try {
    // 2. Kirim ke Provider
    const apiResult = await processTrafficOrder({
      apiUrl: apiSettings.apiUrl,
      apiKey: apiSettings.apiKey,
      serviceId: item.serviceId,
      link: item.videoLink,
      quantity: item.quantity,
      comments: item.commentText
    });

    // 3. Log Audit Teknis
    await addDoc(collection(db, "api_logs"), {
      userId: item.userId,
      userEmail: item.userEmail,
      timestamp: serverTimestamp(),
      provider: "SMM.ID (SCHEDULER)",
      link: item.videoLink,
      quantity: item.quantity,
      status: apiResult.success ? "success" : "failed",
      responseBody: apiResult.rawResponse ? (typeof apiResult.rawResponse === 'object' ? JSON.stringify(apiResult.rawResponse) : apiResult.rawResponse) : "No Response",
      errorMessage: apiResult.error || null,
      scheduledCommentId: commentId
    });

    if (apiResult.success && apiResult.orderId) {
      // Sukses
      await updateDoc(commentRef, {
        status: "completed",
        providerOrderId: apiResult.orderId.toString(),
        executedAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      return { success: true };
    } else {
      throw new Error(apiResult.error || "Provider menolak pesanan");
    }
  } catch (err: any) {
    // Gagal: Update status dan refund koin
    await updateDoc(commentRef, {
      status: "failed",
      errorMessage: err.message || "Unknown error",
      updatedAt: serverTimestamp()
    });

    const userRef = doc(db, "users", item.userId);
    await updateDoc(userRef, { coins: increment(item.coinUsed) });

    await addDoc(collection(db, "coin_transactions"), {
      userId: item.userId,
      amount: item.coinUsed,
      type: "topup",
      description: `Refund: Jadwal Komentar Gagal (ID: ${commentId.slice(-6)})`,
      createdAt: serverTimestamp()
    });

    return { success: false, error: err.message };
  }
}

/**
 * Pengecekan Batch: Menjalankan semua antrean yang sudah saatnya dieksekusi.
 */
export async function runBatchScheduler(db: Firestore) {
  // Ambil Config API
  const settingsSnap = await getDoc(doc(db, "system_settings", "provider_config"));
  if (!settingsSnap.exists()) return { success: false, error: "API Config not found" };
  
  const apiSettings = settingsSnap.data() as any;
  if (!apiSettings.apiUrl || !apiSettings.apiKey) return { success: false, error: "API Credentials missing" };

  // Cari antrean yang jatuh tempo
  const now = Timestamp.now();
  const q = query(
    collection(db, "scheduled_comments"),
    where("status", "==", "scheduled"),
    where("scheduledAt", "<=", now),
    limit(10) // Proses 10 antrean per hit untuk stabilitas
  );

  const snapshot = await getDocs(q);
  if (snapshot.empty) return { success: true, processed: 0 };

  console.log(`[SCHEDULER FOUND] ${snapshot.size} orders to process.`);

  const results = [];
  for (const docSnap of snapshot.docs) {
    const res = await executeScheduledComment(db, docSnap.id, docSnap.data(), apiSettings);
    results.push({ id: docSnap.id, success: res.success });
  }

  return { success: true, processed: results.length };
}
