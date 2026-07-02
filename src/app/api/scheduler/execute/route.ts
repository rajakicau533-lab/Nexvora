import { NextResponse } from 'next/server';

/**
 * @fileOverview Placeholder API Route for Scheduler.
 * Digunakan untuk memverifikasi konektivitas pemicu eksternal (Cron).
 */

export const dynamic = 'force-dynamic';

export async function GET() {
  return NextResponse.json({
    success: true,
    message: "Scheduler endpoint active"
  });
}

/**
 * Mendukung request POST untuk layanan CRON yang hanya mengirimkan POST.
 */
export async function POST() {
  return GET();
}
