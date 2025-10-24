/**
 * Quick TBO Cities Seed
 * Populates tbo_cities table with top global destinations
 * No external API calls - uses hardcoded data
 */

const db = require("../database/connection.js");

const TOP_CITIES = [
  // Europe
  { code: "PAR", name: "Paris", country: "FR", countryName: "France", region: "Europe", lat: 48.8566, lng: 2.3522 },
  { code: "LON", name: "London", country: "GB", countryName: "United Kingdom", region: "Europe", lat: 51.5074, lng: -0.1278 },
  { code: "ROM", name: "Rome", country: "IT", countryName: "Italy", region: "Europe", lat: 41.9028, lng: 12.4964 },
  { code: "BCN", name: "Barcelona", country: "ES", countryName: "Spain", region: "Europe", lat: 41.3874, lng: 2.1686 },
  { code: "MAD", name: "Madrid", country: "ES", countryName: "Spain", region: "Europe", lat: 40.4168, lng: -3.7038 },
  { code: "BER", name: "Berlin", country: "DE", countryName: "Germany", region: "Europe", lat: 52.52, lng: 13.405 },
  { code: "AMS", name: "Amsterdam", country: "NL", countryName: "Netherlands", region: "Europe", lat: 52.3676, lng: 4.9041 },
  { code: "VIE", name: "Vienna", country: "AT", countryName: "Austria", region: "Europe", lat: 48.2082, lng: 16.3738 },
  { code: "PRG", name: "Prague", country: "CZ", countryName: "Czech Republic", region: "Europe", lat: 50.0755, lng: 14.4378 },
  { code: "IST", name: "Istanbul", country: "TR", countryName: "Turkey", region: "Europe", lat: 41.0082, lng: 28.9784 },

  // Asia
  { code: "DXB", name: "Dubai", country: "AE", countryName: "United Arab Emirates", region: "Asia", lat: 25.2048, lng: 55.2708 },
  { code: "BKK", name: "Bangkok", country: "TH", countryName: "Thailand", region: "Asia", lat: 13.7563, lng: 100.5018 },
  { code: "SIN", name: "Singapore", country: "SG", countryName: "Singapore", region: "Asia", lat: 1.3521, lng: 103.8198 },
  { code: "TYO", name: "Tokyo", country: "JP", countryName: "Japan", region: "Asia", lat: 35.6762, lng: 139.6503 },
  { code: "HKG", name: "Hong Kong", country: "HK", countryName: "Hong Kong", region: "Asia", lat: 22.3193, lng: 114.1694 },
  { code: "SEL", name: "Seoul", country: "KR", countryName: "South Korea", region: "Asia", lat: 37.5665, lng: 126.978 },
  { code: "DEL", name: "Delhi", country: "IN", countryName: "India", region: "Asia", lat: 28.7041, lng: 77.1025 },
  { code: "BOM", name: "Mumbai", country: "IN", countryName: "India", region: "Asia", lat: 19.0760, lng: 72.8777 },
  { code: "BLR", name: "Bangalore", country: "IN", countryName: "India", region: "Asia", lat: 12.9716, lng: 77.5946 },
  { code: "BLI", name: "Bali", country: "ID", countryName: "Indonesia", region: "Asia", lat: -8.6705, lng: 115.2126 },

  // Americas
  { code: "NYC", name: "New York", country: "US", countryName: "United States", region: "Americas", lat: 40.7128, lng: -74.0060 },
  { code: "LAX", name: "Los Angeles", country: "US", countryName: "United States", region: "Americas", lat: 34.0522, lng: -118.2437 },
  { code: "LAS", name: "Las Vegas", country: "US", countryName: "United States", region: "Americas", lat: 36.1699, lng: -115.1398 },
  { code: "MIA", name: "Miami", country: "US", countryName: "United States", region: "Americas", lat: 25.7617, lng: -80.1918 },
  { code: "ORD", name: "Chicago", country: "US", countryName: "United States", region: "Americas", lat: 41.8781, lng: -87.6298 },
  { code: "MEX", name: "Mexico City", country: "MX", countryName: "Mexico", region: "Americas", lat: 19.4326, lng: -99.1332 },
  { code: "CUN", name: "Cancun", country: "MX", countryName: "Mexico", region: "Americas", lat: 21.1619, lng: -87.0385 },
  { code: "CBR", name: "Cancun Beach Resort", country: "MX", countryName: "Mexico", region: "Americas", lat: 21.1619, lng: -87.0385 },

  // Middle East & Africa
  { code: "DOH", name: "Doha", country: "QA", countryName: "Qatar", region: "Middle East", lat: 25.2854, lng: 51.5310 },
  { code: "AUH", name: "Abu Dhabi", country: "AE", countryName: "United Arab Emirates", region: "Middle East", lat: 24.4539, lng: 54.3773 },
  { code: "CAI", name: "Cairo", country: "EG", countryName: "Egypt", region: "Africa", lat: 30.0444, lng: 31.2357 },
  { code: "JNB", name: "Johannesburg", country: "ZA", countryName: "South Africa", region: "Africa", lat: -26.2023, lng: 28.0436 },
];

async function seedTboCities() {
  try {
    console.log("\n🌍 Seeding TBO cities...\n");

    let seeded = 0;
    for (const city of TOP_CITIES) {
      try {
        await db.query(
          `INSERT INTO tbo_cities (
            city_code, city_name, country_code, country_name, 
            region_code, region_name, type, latitude, longitude, is_active,
            created_at, updated_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW(), NOW())
           ON CONFLICT (city_code) DO UPDATE SET 
             updated_at = NOW(),
             is_active = true`,
          [
            city.code,
            city.name,
            city.country,
            city.countryName,
            city.region.substring(0, 2).toUpperCase(),
            city.region,
            "CITY",
            city.lat,
            city.lng,
            true,
          ],
        );
        seeded++;
        console.log(`✅ ${city.name} (${city.code})`);
      } catch (error) {
        console.error(`❌ Failed to seed ${city.name}:`, error.message);
      }
    }

    console.log(`\n✨ Seeded ${seeded}/${TOP_CITIES.length} cities\n`);
    process.exit(0);
  } catch (error) {
    console.error("❌ Seed failed:", error.message);
    process.exit(1);
  }
}

seedTboCities();
