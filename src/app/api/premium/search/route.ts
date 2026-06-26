import { NextResponse } from 'next/server';

/**
 * API Route for secure Apify product search.
 * This proxy prevents exposing the API token to the client.
 */
export async function POST(request: Request) {
  const { keyword } = await request.json();
  const APIFY_TOKEN = process.env.APIFY_TOKEN;

  if (!APIFY_TOKEN) {
    return NextResponse.json({ error: "Server configuration missing (APIFY_TOKEN)" }, { status: 500 });
  }

  if (!keyword || keyword.length < 2) {
    return NextResponse.json({ error: "Keyword too short" }, { status: 400 });
  }

  try {
    // Example using a generic Shopee Scraper on Apify
    // You would replace the actor ID with your specific actor
    const actorId = "apify~shopee-scraper"; 
    
    // For MVP/Simulation if actual Apify setup is pending:
    // We simulate a high-quality response to match the "Premium" experience.
    
    const mockData = [
      {
        id: "1",
        title: `${keyword} Premium High Quality`,
        price: "Rp 150.000",
        sold: "1.2k",
        rating: 4.9,
        imageUrl: `https://picsum.photos/seed/${keyword}1/400/400`,
        link: "https://shopee.co.id",
        trends: { daily: "+12%", weekly: "+34%", monthly: "+78%" }
      },
      {
        id: "2",
        title: `${keyword} Viral Koleksi Terbaru`,
        price: "Rp 89.000",
        sold: "4.5k",
        rating: 4.8,
        imageUrl: `https://picsum.photos/seed/${keyword}2/400/400`,
        link: "https://shopee.co.id",
        trends: { daily: "+5%", weekly: "+21%", monthly: "+62%" }
      },
      {
        id: "3",
        title: `${keyword} Limited Edition`,
        price: "Rp 210.000",
        sold: "500+",
        rating: 5.0,
        imageUrl: `https://picsum.photos/seed/${keyword}3/400/400`,
        link: "https://shopee.co.id",
        trends: { daily: "+15%", weekly: "+42%", monthly: "+91%" }
      },
      {
        id: "4",
        title: `${keyword} Termurah Bergaransi`,
        price: "Rp 45.000",
        sold: "10k+",
        rating: 4.7,
        imageUrl: `https://picsum.photos/seed/${keyword}4/400/400`,
        link: "https://shopee.co.id",
        trends: { daily: "+2%", weekly: "+18%", monthly: "+45%" }
      },
      {
        id: "5",
        title: `${keyword} Import Best Seller`,
        price: "Rp 125.000",
        sold: "2.1k",
        rating: 4.9,
        imageUrl: `https://picsum.photos/seed/${keyword}5/400/400`,
        link: "https://shopee.co.id",
        trends: { daily: "+8%", weekly: "+29%", monthly: "+55%" }
      }
    ];

    // In production, you would call:
    /*
    const response = await fetch(`https://api.apify.com/v2/acts/${actorId}/run-sync-get-dataset-items?token=${APIFY_TOKEN}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ search: keyword, maxItems: 5 })
    });
    const data = await response.json();
    return NextResponse.json(data);
    */

    // Returning simulated premium data
    return NextResponse.json(mockData);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
