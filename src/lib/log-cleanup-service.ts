/**
 * @fileOverview Log Cleanup Service
 * Provides utility functions to manage and delete old API logs.
 */

import { 
  Firestore, 
  collection, 
  query, 
  where, 
  getDocs, 
  writeBatch, 
  Timestamp, 
  doc, 
  setDoc 
} from 'firebase/firestore';

export interface CleanupSettings {
  enabled: boolean;
  intervalDays: number;
}

/**
 * Saves cleanup settings to Firestore
 */
export async function saveCleanupSettings(db: Firestore, settings: CleanupSettings) {
  const settingsRef = doc(db, "system_settings", "log_cleanup_config");
  await setDoc(settingsRef, {
    ...settings,
    updatedAt: Timestamp.now()
  }, { merge: true });
}

/**
 * Calculates and returns the number of logs that are older than the specified days
 */
export async function countOldLogs(db: Firestore, days: number): Promise<number> {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - days);
  
  const q = query(
    collection(db, "api_logs"),
    where("timestamp", "<", Timestamp.fromDate(cutoffDate))
  );
  
  const snapshot = await getDocs(q);
  return snapshot.size;
}

/**
 * Deletes logs older than the specified days in batches
 */
export async function deleteOldLogs(db: Firestore, days: number): Promise<number> {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - days);
  
  const q = query(
    collection(db, "api_logs"),
    where("timestamp", "<", Timestamp.fromDate(cutoffDate))
  );
  
  const snapshot = await getDocs(q);
  if (snapshot.empty) return 0;
  
  const batch = writeBatch(db);
  snapshot.docs.forEach((doc) => {
    batch.delete(doc.ref);
  });
  
  await batch.commit();
  return snapshot.size;
}
