
import { NextResponse } from 'next/server';
import { initializeFirebase } from '@/firebase';
import { runBatchScheduler } from '@/lib/scheduled-comment-service';

export const dynamic = 'force-dynamic';

/**
 * Endpoint Pemicu Scheduler Otomatis (Called by Cron-job.org)
 * Menjalankan logika pemeriksaan antrean Shopee Comment di sisi server.
 */
export async function GET() {
  const { firestore } = initializeFirebase();
  
  if (!firestore) {
    return NextResponse.json({ success: false, error: "Firebase not initialized" }, { status: 500 });
  }

  try {
    const result = await runBatchScheduler(firestore);
    return NextResponse.json({
      success: true,
      message: result.processed > 0 ? `Processed ${result.processed} orders.` : "No pending schedules found.",
      processed: result.processed
    });
  } catch (error: any) {
    console.error("[CRON ERROR]", error.message);
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}

export async function POST() {
  return GET();
}
