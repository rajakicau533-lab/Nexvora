/**
 * @fileOverview Topup Management Service
 * Handles approval, rejection, and cleanup logic for coin top-up requests.
 */

import { 
  Firestore, 
  doc, 
  updateDoc, 
  addDoc, 
  collection, 
  serverTimestamp, 
  increment,
  writeBatch,
  getDocs,
  query,
  where
} from 'firebase/firestore';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError, type SecurityRuleContext } from '@/firebase/errors';

/**
 * Approves a top-up request, increments user balance, and logs transactions.
 */
export function approveTopupRequest(db: Firestore, request: any, adminUser: any) {
  if (request.status !== 'pending') return;

  const requestRef = doc(db, "topup_requests", request.id);
  const userRef = doc(db, "users", request.userId);

  // 1. Update Request Status
  updateDoc(requestRef, {
    status: 'approved',
    processedAt: serverTimestamp(),
    processedBy: adminUser?.email || 'admin'
  }).catch(async (err) => {
    errorEmitter.emit('permission-error', new FirestorePermissionError({
      path: requestRef.path,
      operation: 'update',
      requestResourceData: { status: 'approved' }
    } satisfies SecurityRuleContext));
  });

  // 2. Increment User Coins
  updateDoc(userRef, {
    coins: increment(request.amountCoins)
  }).catch(async (err) => {
    errorEmitter.emit('permission-error', new FirestorePermissionError({
      path: userRef.path,
      operation: 'update',
      requestResourceData: { coins: request.amountCoins }
    } satisfies SecurityRuleContext));
  });

  // 3. Log Coin Transaction
  const txData = {
    userId: request.userId,
    amount: request.amountCoins,
    type: "topup",
    description: `Topup Approved by Admin: ${request.id.slice(0, 8)}`,
    createdAt: serverTimestamp()
  };
  
  addDoc(collection(db, "coin_transactions"), txData).catch(async (err) => {
    errorEmitter.emit('permission-error', new FirestorePermissionError({
      path: 'coin_transactions',
      operation: 'create',
      requestResourceData: txData
    } satisfies SecurityRuleContext));
  });

  // 4. Log Admin Activity
  const activityData = {
    type: "admin",
    action: "APPROVE_TOPUP",
    userId: adminUser?.uid,
    userEmail: adminUser?.email,
    details: `Approved ${request.amountCoins} coins for ${request.userEmail}`,
    timestamp: serverTimestamp()
  };

  addDoc(collection(db, "activity_logs"), activityData).catch(async (err) => {
    errorEmitter.emit('permission-error', new FirestorePermissionError({
      path: 'activity_logs',
      operation: 'create',
      requestResourceData: activityData
    } satisfies SecurityRuleContext));
  });
}

/**
 * Rejects a top-up request.
 */
export function rejectTopupRequest(db: Firestore, request: any, adminUser: any) {
  if (request.status !== 'pending') return;

  const requestRef = doc(db, "topup_requests", request.id);

  updateDoc(requestRef, {
    status: 'rejected',
    processedAt: serverTimestamp(),
    processedBy: adminUser?.email || 'admin'
  }).catch(async (err) => {
    errorEmitter.emit('permission-error', new FirestorePermissionError({
      path: requestRef.path,
      operation: 'update',
      requestResourceData: { status: 'rejected' }
    } satisfies SecurityRuleContext));
  });

  // Log Admin Activity
  const activityData = {
    type: "admin",
    action: "REJECT_TOPUP",
    userId: adminUser?.uid,
    userEmail: adminUser?.email,
    details: `Rejected topup request ${request.id.slice(0, 8)} from ${request.userEmail}`,
    timestamp: serverTimestamp()
  };

  addDoc(collection(db, "activity_logs"), activityData).catch(async (err) => {
    errorEmitter.emit('permission-error', new FirestorePermissionError({
      path: 'activity_logs',
      operation: 'create',
      requestResourceData: activityData
    } satisfies SecurityRuleContext));
  });
}

/**
 * Deletes history based on status filter.
 */
export async function cleanupTopupHistory(db: Firestore, type: 'approved' | 'rejected' | 'all') {
  const statuses = type === 'all' ? ['approved', 'rejected', 'expired'] : [type];
  const q = query(collection(db, "topup_requests"), where("status", "in", statuses));
  
  try {
    const snapshot = await getDocs(q);
    if (snapshot.empty) return 0;

    const batch = writeBatch(db);
    snapshot.docs.forEach(d => batch.delete(d.ref));
    await batch.commit();
    return snapshot.size;
  } catch (err) {
    console.error("Cleanup history error:", err);
    throw err;
  }
}
