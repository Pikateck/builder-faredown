/**
 * Test Enhanced Bargain System
 */

const { Client } = require("pg");

// Database configuration
const dbConfig = {
  host: process.env.DB_HOST || "localhost",
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || "faredown_booking_db",
  user: process.env.DB_USER || "postgres",
  password: process.env.DB_PASSWORD,
  ssl: process.env.DB_HOST && process.env.DB_HOST.includes('render.com') ? { rejectUnauthorized: false } : false,
};

async function testEnhancedBargainSystem() {
  const client = new Client(dbConfig);
  
  try {
    console.log("🔄 Connecting to database...");
    await client.connect();
    console.log("✅ Connected to database");

    // Test modules
    console.log("\n📋 Testing modules...");
    const modulesResult = await client.query("SELECT * FROM modules ORDER BY name");
    console.log("Modules:", modulesResult.rows);

    // Test markup rules
    console.log("\n💰 Testing markup rules...");
    const markupResult = await client.query("SELECT * FROM markup_rules_enhanced WHERE rule_type = 'general' ORDER BY module_id");
    console.log("General markup rules:", markupResult.rows);

    // Test promo codes
    console.log("\n🎟️ Testing promo codes...");
    const promoResult = await client.query("SELECT code, name, applicable_modules, discount_type, discount_value FROM promo_codes_enhanced ORDER BY code");
    console.log("Promo codes:", promoResult.rows);

    // Test bargain calculation function
    console.log("\n🧮 Testing bargain calculation function...");
    const calcResult = await client.query(`
      SELECT * FROM calculate_enhanced_bargain_price(
        10000,  -- ₹10,000 supplier net rate
        'hotels',  -- Hotels module
        'FAREDOWN25'  -- Test promo code
      )
    `);
    
    if (calcResult.rows.length > 0) {
      console.log("Calculation result:", calcResult.rows[0]);
    }

    // Test without promo code
    console.log("\n🧮 Testing without promo code...");
    const calcResult2 = await client.query(`
      SELECT * FROM calculate_enhanced_bargain_price(
        8000,  -- ₹8,000 supplier net rate
        'flights',  -- Flights module
        NULL  -- No promo code
      )
    `);
    
    if (calcResult2.rows.length > 0) {
      console.log("Calculation result (no promo):", calcResult2.rows[0]);
    }

    // Test price matching function
    console.log("\n🎯 Testing price matching function...");
    const matchResult = await client.query(`
      SELECT check_enhanced_price_match(9500, 1200, 10000, 0.01) as is_match
    `);
    console.log("Price match test:", matchResult.rows[0]);

    console.log("\n✅ All tests completed successfully!");
    
  } catch (error) {
    console.error("❌ Test failed:", error.message);
    console.error("Stack trace:", error.stack);
  } finally {
    await client.end();
    console.log("🔒 Database connection closed");
  }
}

// Run the test
if (require.main === module) {
  console.log("🚀 Starting Enhanced Bargain System Test");
  testEnhancedBargainSystem()
    .then(() => {
      console.log("✅ Test process completed");
      process.exit(0);
    })
    .catch((error) => {
      console.error("❌ Test process failed:", error);
      process.exit(1);
    });
}

module.exports = { testEnhancedBargainSystem };
