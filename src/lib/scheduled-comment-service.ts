/**
 * @fileOverview Scheduled Comment Service (DEPRECATED)
 * Fitur ini telah dinonaktifkan untuk menjaga stabilitas sistem.
 */

import { Firestore } from 'firebase/firestore';

export async function createScheduledComment(db: Firestore, data: any) {
  throw new Error("Fitur jadwal dinonaktifkan. Gunakan pesanan langsung.");
}

export async function executeScheduledComment(db: Firestore, commentId: string, item: any, apiSettings: any) {
  return { success: false, error: "Service disabled" };
}

export async function runBatchScheduler(db: Firestore) {
  return { processed: 0, message: "Service disabled" };
}

export async function deleteScheduledRecord(db: Firestore, id: string) {
  return;
}
