
'use server';
/**
 * @fileOverview NexTitle Pro SEO Internal Generation Engine (Offline Mode).
 * 
 * Menggunakan sistem template dan keyword untuk menghasilkan konten pemasaran
 * tanpa bergantung pada API eksternal.
 */

import { z } from 'genkit';

const NexTitleSeoInputSchema = z.object({
  judul: z.string().describe('Judul produk atau konten dasar.'),
  bahan: z.string().describe('Bahan produk atau detail spesifik.'),
  hook: z.string().describe('Hook awal atau ajakan bertindak.'),
});

const NexTitleSeoOutputSchema = z.object({
  captions: z.array(z.string()).describe('3 pilihan caption judul video yang viral.'),
  hashtags: z.string().describe('7 hashtag viral yang relevan.'),
  hookPros: z.array(z.string()).describe('3 hook promosi yang persuasif.'),
});

export type NexTitleSeoInput = z.infer<typeof NexTitleSeoInputSchema>;
export type NexTitleSeoOutput = z.infer<typeof NexTitleSeoOutputSchema>;

/**
 * Mesin Generator Konten Offline
 * Menghasilkan variasi teks berdasarkan input tanpa menggunakan AI eksternal.
 */
export async function generateNextTitleSeo(input: NexTitleSeoInput): Promise<NexTitleSeoOutput> {
  const { judul, bahan, hook } = input;

  const viralKeywords = ["VIRAL", "TRENDING", "WAJIB PUNYA", "RACUN BANGET", "LAGI RAME", "STOK TERBATAS", "PREMIUM"];
  const marketingPower = ["Bikin Kalap", "Gak Nyangka", "Kualitas Juara", "Solusi Cantik", "Auto FYP", "Terlaris", "Cakep Pol"];
  const ctaWords = ["Cek Keranjang Kuning", "Link di Bio", "Order Sekarang", "Komen MAU", "Cek Keranjang Oren", "Klik Link di Bio"];

  // Helper untuk ambil item acak
  const pick = (arr: string[]) => arr[Math.floor(Math.random() * arr.length)];

  // 1. Generate 3 Captions
  const captions = [
    `${pick(viralKeywords)}! ${judul} ${bahan} ini emang beneran ${pick(marketingPower)} banget! ${pick(ctaWords)}!`,
    `Gak nyangka ${judul} ${bahan} se-${pick(marketingPower)} ini. ${pick(ctaWords)} sebelum kehabisan!`,
    `Rekomendasi ${judul} ${bahan} buat kalian yang mau tampil ${pick(viralKeywords)}. ${pick(ctaWords)}!`,
  ];

  // 2. Generate Hashtags
  const hashtags = [
    `#${judul.replace(/\s+/g, '').toLowerCase()}`,
    `#${bahan.replace(/\s+/g, '').toLowerCase()}`,
    `#affiliate`,
    `#racunshopee`,
    `#racuntiktok`,
    `#viral`,
    `#trending`
  ].join(' ');

  // 3. Generate 3 Hook Pros
  const hookPros = [
    `Pernah ngerasa bingung cari ${judul} yang bener-bener ${bahan}? Aku juga gitu awalnya, tapi setelah nemu ini langsung jatuh cinta. ${hook}. Jangan sampai nyesel pas stok abis!`,
    `Rahasia tampil keren dengan ${judul}. Bahannya ${bahan} asli, adem dan nyaman banget. Buat kalian yang mau samaan, langsung ${hook}. Mumpung lagi ada promo spesial!`,
    `Wajib punya sih ini! ${judul} paling viral di TikTok/Shopee. Detail ${bahan}-nya cakep banget. Yang mau spill harga, ${hook} sekarang juga ya!`,
  ];

  // Simulasi loading sedikit agar tetap terasa premium
  await new Promise(resolve => setTimeout(resolve, 800));

  return {
    captions,
    hashtags,
    hookPros
  };
}
