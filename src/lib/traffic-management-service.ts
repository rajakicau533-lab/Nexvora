/**
 * @fileOverview Traffic Management Service
 * Provides utility functions to handle cleanup and maintenance of traffic orders.
 */

import { 
  Firestore, 
  collection, 
  query, 
  where, 
  getDocs, 
  writeBatch, 
  Timestamp 
} from 'firebase/firestore';

/**
 * Deletes history based on status or age filter.
 */
export async function cleanupTrafficHistory(db: Firestore, type: 'completed' | 'failed' | 'old' | 'all') {
  const ordersRef = collection(db, "traffic_orders");
  let q;

  if (type === 'completed') {
    q = query(ordersRef, where("status", "in", ["COMPLETED", "SUCCESS", "Selesai"]));
  } else if (type === 'failed') {
    q = query(ordersRef, where("status", "in", ["FAILED", "CANCELLED", "Gagal"]));
  } else if (type === 'old') {
    const threeDaysAgo = new Date();
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
    q = query(ordersRef, where("createdAt", "<", Timestamp.fromDate(threeDaysAgo)));
  } else {
    // all except active ones
    q = query(ordersRef, where("status", "not-in", ["PENDING", "PROCESSING", "Pending", "Processing"]));
  }
  
  try {
    const snapshot = await getDocs(q);
    if (snapshot.empty) return 0;

    const batch = writeBatch(db);
    snapshot.docs.forEach(d => batch.delete(d.ref));
    await batch.commit();
    return snapshot.size;
  } catch (err) {
    console.error("Cleanup traffic history error:", err);
    throw err;
  }
}
