import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  return NextResponse.json({
    success: true,
    message: "Scheduler service is disabled."
  });
}

export async function POST() {
  return GET();
}
