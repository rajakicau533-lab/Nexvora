/**
 * @fileOverview Data list of major cities in Indonesia for simulated traffic distribution.
 */

export const INDONESIA_CITIES = [
  "Jakarta", "Surabaya", "Bandung", "Medan", "Semarang", 
  "Makassar", "Palembang", "Tangerang", "Tangerang Selatan", "Depok",
  "Bekasi", "Bogor", "Malang", "Yogyakarta", "Denpasar",
  "Batam", "Pekanbaru", "Bandar Lampung", "Padang", "Balikpapan",
  "Pontianak", "Banjarmasin", "Samarinda", "Manado", "Mataram",
  "Jayapura", "Ambon", "Kupang", "Jambi", "Bengkulu",
  "Palu", "Kendari", "Ternate", "Gorontalo", "Banda Aceh",
  "Tarakan", "Cilegon", "Serang", "Purwokerto", "Surakarta",
  "Cirebon", "Sukabumi", "Tasikmalaya", "Garut", "Cianjur",
  "Kediri", "Madiun", "Probolinggo", "Pasuruan", "Bojonegoro"
];

/**
 * Gets a random selection of unique cities.
 * @param count - Number of cities to return.
 * @returns Array of randomized city names.
 */
export function getRandomCities(count: number): string[] {
  // Simple shuffle and slice
  const shuffled = [...INDONESIA_CITIES].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
}
