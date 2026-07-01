/**
 * @fileOverview Scheduled Comment Service
 * Handles operations related to queuing comments for future execution.
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
  deleteDoc,
  getDoc,
  getDocs,
  query,
  where,
  limit
} from 'firebase/firestore';
import { processTrafficOrder } from '@/ai/flows/process-traffic-order-flow';

export interface ScheduledCommentData {
  userId: string;
  userEmail: string;
  videoLink: string;
  commentText: string;
  quantity: number;
  serviceId: string;
  coinUsed: number;
  scheduledTimestamp: Date;
}

/**
 * Creates a scheduled comment entry and deducts user coins.
 */
export async function createScheduledComment(db: Firestore, data: ScheduledCommentData) {
  const userRef = doc(db, "users", data.userId);
  
  // 1. Create the scheduled record
  const scheduledRef = await addDoc(collection(db, "scheduled_comments"), {
    ...data,
    scheduledTimestamp: Timestamp.fromDate(data.scheduledTimestamp),
    status: "scheduled",
    createdAt: serverTimestamp(),
  });

  // 2. Deduct coins
  await updateDoc(userRef, {
    coins: increment(-data.coinUsed)
  });

  // 3. Log transaction
  await addDoc(collection(db, "coin_transactions"), {
    userId: data.userId,
    amount: -data.coinUsed,
    type: "traffic_order",
    description: `Jadwal Komentar: ${data.videoLink.slice(0, 20)}...`,
    createdAt: serverTimestamp()
  });

  return scheduledRef.id;
}

/**
 * Executes a scheduled comment by sending it to the SMM provider.
 */
export async function executeScheduledComment(
  db: Firestore, 
  commentId: string, 
  item: any, 
  apiSettings: { apiUrl: string; apiKey: string }
) {
  console.log(`[SCHEDULER] Executing Order ID: ${commentId}`);
  const commentRef = doc(db, "scheduled_comments", commentId);

  // 1. Update status to processing
  await updateDoc(commentRef, {
    status: "processing",
    updatedAt: serverTimestamp()
  });

  const apiRequest = {
    apiUrl: apiSettings.apiUrl,
    apiKey: apiSettings.apiKey,
    serviceId: item.serviceId,
    link: item.videoLink,
    quantity: item.quantity,
    comments: item.commentText
  };

  try {
    // 2. Call the provider API
    const apiResult = await processTrafficOrder(apiRequest);

    // 3. Log to technical audit trail (api_logs)
    await addDoc(collection(db, "api_logs"), {
      userId: item.userId,
      userEmail: item.userEmail,
      timestamp: serverTimestamp(),
      provider: "SMM.ID (SCHEDULER)",
      link: item.videoLink,
      quantity: item.quantity,
      serviceId: item.serviceId,
      status: apiResult.success ? "success" : "failed",
      responseBody: apiResult.rawResponse || null,
      errorMessage: apiResult.error || null,
      scheduledCommentId: commentId
    });

    if (apiResult.success && apiResult.orderId) {
      // 4. Update to completed
      await updateDoc(commentRef, {
        status: "completed",
        providerOrderId: apiResult.orderId.toString(),
        providerResponse: apiResult.rawResponse || null,
        executedAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      return { success: true, orderId: apiResult.orderId };
    } else {
      throw new Error(apiResult.error || "Provider rejected the request");
    }
  } catch (err: any) {
    console.error("[SCHEDULER] Critical Error:", err.message);
    
    // 5. Update to failed
    await updateDoc(commentRef, {
      status: "failed",
      error: err.message || "Unknown error",
      updatedAt: serverTimestamp()
    });

    // 6. Refund coins
    const userRef = doc(db, "users", item.userId);
    await updateDoc(userRef, {
      coins: increment(item.coinUsed)
    });

    // 7. Log refund
    await addDoc(collection(db, "coin_transactions"), {
      userId: item.userId,
      amount: item.coinUsed,
      type: "topup",
      description: `Refund Gagal Jadwal (ID: ${commentId.slice(0, 5)})`,
      createdAt: serverTimestamp()
    });

    return { success: false, error: err.message };
  }
}

/**
 * Backend Batch Scheduler: Scans and processes all overdue comments.
 */
export async function runBatchScheduler(db: Firestore) {
  // 1. Get API Settings
  const settingsRef = doc(db, "system_settings", "provider_config");
  const settingsSnap = await getDoc(settingsRef);
  
  if (!settingsSnap.exists()) return { success: false, error: "Settings not found" };
  
  const apiSettings = settingsSnap.data() as { apiUrl: string, apiKey: string };
  if (!apiSettings.apiUrl || !apiSettings.apiKey) return { success: false, error: "API Credentials incomplete" };

  // 2. Query overdue items
  const now = Timestamp.now();
  const q = query(
    collection(db, "scheduled_comments"),
    where("status", "==", "scheduled"),
    where("scheduledTimestamp", "<=", now),
    limit(5)
  );

  const snapshot = await getDocs(q);
  if (snapshot.empty) return { success: true, processed: 0 };
  
  const results = [];
  for (const docSnap of snapshot.docs) {
    const res = await executeScheduledComment(db, docSnap.id, docSnap.data(), apiSettings);
    results.push({ id: docSnap.id, success: res.success });
  }

  return { success: true, processed: results.length, details: results };
}

export async function cancelScheduledComment(db: Firestore, commentId: string, item: any) {
  if (item.status !== 'scheduled') return;
  const commentRef = doc(db, "scheduled_comments", commentId);
  const userRef = doc(db, "users", item.userId);

  await updateDoc(commentRef, { status: "cancelled", updatedAt: serverTimestamp() });
  await updateDoc(userRef, { coins: increment(item.coinUsed) });
  await addDoc(collection(db, "coin_transactions"), {
    userId: item.userId,
    amount: item.coinUsed,
    type: "topup",
    description: `Refund Pembatalan Jadwal (ID: ${commentId.slice(0, 5)})`,
    createdAt: serverTimestamp()
  });
}

export async function deleteScheduledRecord(db: Firestore, commentId: string) {
  await deleteDoc(doc(db, "scheduled_comments", commentId));
}
