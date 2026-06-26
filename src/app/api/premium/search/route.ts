import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

/**
 * Endpoint Pencarian Riset Produk Premium (Coming Soon Mode)
 * Saat ini dinonaktifkan untuk menjaga stabilitas sistem selama tahap pengembangan.
 */
export async function POST(request: Request) {
  try {
    return NextResponse.json({
      success: false,
      mode: "coming_soon",
      message: "Fitur Riset Produk sedang dalam tahap pengembangan intensif.",
      data: []
    });
  } catch (error: any) {
    return NextResponse.json({ 
      success: false, 
      error: "Sistem sedang dalam pemeliharaan." 
    }, { status: 200 });
  }
}
