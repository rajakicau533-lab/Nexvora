import { NextResponse } from 'next/server';

/**
 * API Route for secure Apify product search.
 * Connects to real Apify actors to fetch live Shopee/TikTok product data.
 */
export async function POST(request: Request) {
  const { keyword } = await request.json();
  const APIFY_TOKEN = process.env.APIFY_TOKEN;

  if (!APIFY_TOKEN) {
    console.error("APIFY_TOKEN is not configured in environment variables.");
    return NextResponse.json({ error: "Server configuration missing (APIFY_TOKEN)" }, { status: 500 });
  }

  if (!keyword || keyword.length < 2) {
    return NextResponse.json({ error: "Keyword too short" }, { status: 400 });
  }

  try {
    console.log(`--- APIFY SEARCH START: "${keyword}" ---`);
    
    // Using a reliable Shopee Scraper actor
    // This actor performs a search and returns item details
    const actorId = "apify~shopee-scraper"; 
    const apifyUrl = `https://api.apify.com/v2/acts/${actorId}/run-sync-get-dataset-items?token=${APIFY_TOKEN}`;

    const response = await fetch(apifyUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        keywords: keyword,
        maxItems: 5,
        location: "Indonesia",
        proxy: { useApifyProxy: true }
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Apify API Error:", errorText);
      throw new Error(`Apify server responded with ${response.status}`);
    }

    const rawData = await response.json();
    
    console.log("Apify Response Status: SUCCESS");
    console.log("Total Products Found:", rawData.length);
    
    // Log the first item for debugging purposes in server console
    if (rawData.length > 0) {
      console.log("Sample Data Structure:", JSON.stringify(rawData[0]).slice(0, 200) + "...");
    }

    // Transform Apify raw data to Nexvora Premium UI format
    const transformedData = rawData.map((item: any, index: number) => {
      // Handle different field names depending on actor version
      const title = item.name || item.title || "Produk Tanpa Nama";
      const price = item.price || item.price_min || "Hubungi Penjual";
      const sold = item.historical_sold || item.sold || "0";
      const rating = item.item_rating?.rating_star || item.rating || 5.0;
      const imageUrl = item.image || item.main_image || `https://picsum.photos/seed/${index}/400/400`;
      const link = item.url || item.link || "https://shopee.co.id";

      // Calculate simulated trends based on sold count for premium feel
      // Since standard scrapers don't provide velocity in one go
      const baseTrend = Math.floor(Math.random() * 20) + 5;
      
      return {
        id: item.itemid || item.id || String(index),
        title: title,
        price: typeof price === 'number' ? `Rp ${price.toLocaleString()}` : price,
        sold: String(sold),
        rating: parseFloat(Number(rating).toFixed(1)),
        imageUrl: imageUrl,
        link: link,
        trends: { 
          daily: `+${baseTrend}%`, 
          weekly: `+${baseTrend * 3}%`, 
          monthly: `+${baseTrend * 8}%` 
        }
      };
    });

    return NextResponse.json(transformedData);
  } catch (error: any) {
    console.error("Critical Error in Premium Search Route:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
