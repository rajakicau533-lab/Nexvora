import { NextResponse } from 'next/server';

/**
 * API Route for secure Apify product search.
 * Includes enhanced debugging to troubleshoot 404 Actor Not Found errors.
 */
export async function POST(request: Request) {
  const { keyword } = await request.json();
  const APIFY_TOKEN = process.env.APIFY_TOKEN;
  
  // Exact Actor ID from Apify Console (username~actor-name)
  const actorId = "meavisai~shopee-crawler";
  const endpoint = `https://api.apify.com/v2/acts/${actorId}/run-sync-get-dataset-items`;
  const apifyUrlWithToken = `${endpoint}?token=${APIFY_TOKEN}`;

  // Server-side logging for debugging
  console.log("--- APIFY DEBUG START ---");
  console.log("APIFY_TOKEN exists:", !!APIFY_TOKEN);
  console.log("Actor ID:", actorId);
  console.log("Endpoint Target:", endpoint);
  console.log("Keyword:", keyword);

  if (!APIFY_TOKEN) {
    return NextResponse.json({ 
      success: false,
      error: "APIFY_TOKEN not configured",
      actorId,
      endpoint
    }, { status: 500 });
  }

  if (!keyword || keyword.trim().length < 2) {
    return NextResponse.json({ success: false, error: "Keyword too short" }, { status: 400 });
  }

  try {
    const response = await fetch(apifyUrlWithToken, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        keyword: keyword.trim(),
        maxItems: 5,
        proxy: { useApifyProxy: true }
      })
    });

    const status = response.status;
    const responseText = await response.text();

    if (!response.ok) {
      console.error("--- APIFY SERVER ERROR ---");
      console.log("HTTP Status:", status);
      console.log("Raw Body:", responseText);

      // Return full debug info to the frontend
      return NextResponse.json({
        success: false,
        error: `Apify error (${status})`,
        actorId,
        endpoint,
        status: status,
        responseText
      }, { status: status });
    }

    let rawData;
    try {
      rawData = JSON.parse(responseText);
    } catch (e) {
      return NextResponse.json({
        success: false,
        error: "Failed to parse Apify response as JSON",
        responseText
      }, { status: 500 });
    }

    if (!Array.isArray(rawData)) {
      console.warn("Apify did not return an array. Data received:", rawData);
      return NextResponse.json([]);
    }

    // Mapping items based on Shopee Scraper schema
    const transformedData = rawData.slice(0, 5).map((item: any, index: number) => {
      const baseTrend = Math.floor(Math.random() * 15) + 5;
      
      return {
        id: item.itemid || item.id || `prod-${index}`,
        title: item.name || item.title || "Produk Shopee",
        price: item.price ? `Rp ${item.price.toLocaleString()}` : "Cek di Shopee",
        sold: item.historical_sold || item.sold || "0",
        rating: item.item_rating ? parseFloat(item.item_rating.rating_star?.toFixed(1) || "5.0") : 5.0,
        imageUrl: item.image || item.main_image || `https://picsum.photos/seed/${index}/400/400`,
        link: item.url || item.link || "https://shopee.co.id",
        trends: { 
          daily: `+${baseTrend}%`, 
          weekly: `+${baseTrend * 2}%`, 
          monthly: `+${baseTrend * 5}%` 
        }
      };
    });

    console.log("Total items found and transformed:", transformedData.length);
    return NextResponse.json(transformedData);

  } catch (error: any) {
    console.error("--- CRITICAL FETCH ERROR ---");
    console.error(error.message);
    return NextResponse.json({ 
      success: false,
      error: error.message,
      actorId,
      endpoint
    }, { status: 500 });
  }
}
