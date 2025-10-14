/**
 * RateHawk Integration Test Script
 * Tests the complete multi-supplier hotel integration
 * Run: node test-ratehawk-integration.cjs
 */

const axios = require("axios");

const API_BASE_URL = process.env.API_BASE_URL || "http://localhost:3000";
const ADMIN_API_KEY = process.env.ADMIN_API_KEY || process.env.VITE_ADMIN_API_KEY;

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
    "X-Admin-Key": ADMIN_API_KEY,
  },
});

async function testSuppliersList() {
  console.log("\n📋 Test 1: List All Suppliers");
  console.log("━".repeat(50));

  try {
    const response = await api.get("/api/admin/suppliers");
    
    if (response.data.success) {
      console.log("✅ Suppliers loaded successfully");
      response.data.data.forEach((supplier) => {
        console.log(`
  📦 ${supplier.name} (${supplier.code})
     Product: ${supplier.product_type}
     Enabled: ${supplier.is_enabled ? "✅" : "❌"}
     Environment: ${supplier.environment}
     Bookings (24h): ${supplier.bookings_24h || 0}
     Calls (24h): ${supplier.success_calls_24h || 0}
        `);
      });
      
      // Check if RateHawk is present
      const ratehawk = response.data.data.find(s => s.code === 'ratehawk');
      if (ratehawk) {
        console.log("✅ RateHawk supplier found and registered");
      } else {
        console.log("❌ RateHawk supplier not found in database");
      }
      
      return true;
    } else {
      console.log("❌ Failed to load suppliers");
      return false;
    }
  } catch (error) {
    console.error("❌ Error:", error.response?.data || error.message);
    return false;
  }
}

async function testSupplierHealth() {
  console.log("\n🏥 Test 2: Supplier Health Check");
  console.log("━".repeat(50));

  try {
    const response = await api.get("/api/admin/suppliers/health");
    
    if (response.data.success) {
      console.log("✅ Health check successful");
      response.data.data.forEach((health) => {
        console.log(`
  ${health.healthy ? "✅" : "❌"} ${health.supplier}
     Healthy: ${health.healthy ? "Yes" : "No"}
     ${health.regionsAvailable ? `Regions: ${health.regionsAvailable}` : ""}
     ${health.error ? `Error: ${health.error}` : ""}
        `);
      });
      return true;
    } else {
      console.log("❌ Health check failed");
      return false;
    }
  } catch (error) {
    console.error("❌ Error:", error.response?.data || error.message);
    return false;
  }
}

async function testMultiSupplierSearch() {
  console.log("\n🔍 Test 3: Multi-Supplier Hotel Search");
  console.log("━".repeat(50));

  try {
    const searchParams = {
      destination: "1", // Example region ID
      checkIn: "2025-04-15",
      checkOut: "2025-04-18",
      rooms: "2",
      currency: "USD",
    };

    console.log("Search params:", searchParams);

    const response = await api.get("/api/hotels/search", { params: searchParams });
    
    if (response.data.success) {
      console.log("✅ Search successful");
      console.log(`
  📊 Results Summary:
     Total Hotels: ${response.data.data.length}
     Suppliers: ${JSON.stringify(Object.keys(response.data.meta.suppliers))}
      `);

      // Show supplier breakdown
      Object.entries(response.data.meta.suppliers).forEach(([supplier, metrics]) => {
        console.log(`
  📡 ${supplier}:
     Success: ${metrics.success ? "✅" : "❌"}
     Results: ${metrics.resultCount || 0}
     Response Time: ${metrics.responseTime || "N/A"}ms
     ${metrics.error ? `Error: ${metrics.error}` : ""}
        `);
      });

      // Show sample hotels
      console.log("\n🏨 Sample Hotels:");
      response.data.data.slice(0, 3).forEach((hotel, index) => {
        console.log(`
  ${index + 1}. ${hotel.name}
     Supplier: ${hotel.supplier?.toUpperCase()}
     Price: ${hotel.price?.currency} ${hotel.price?.final?.toFixed(2)}
     Original: ${hotel.price?.original?.toFixed(2)}
     Markup: ${hotel.price?.markedUp ? (hotel.price.markedUp - hotel.price.original).toFixed(2) : "N/A"}
        `);
      });

      return response.data.data.length > 0;
    } else {
      console.log("❌ Search failed");
      return false;
    }
  } catch (error) {
    console.error("❌ Error:", error.response?.data || error.message);
    return false;
  }
}

async function testSupplierMarkups() {
  console.log("\n💰 Test 4: Supplier Markups");
  console.log("��".repeat(50));

  try {
    // Get RateHawk markups
    const response = await api.get("/api/admin/suppliers/ratehawk/markups");
    
    if (response.data.success) {
      console.log("✅ Markups loaded successfully");
      console.log(`   Found ${response.data.data.length} markup rules`);
      
      response.data.data.slice(0, 3).forEach((markup, index) => {
        console.log(`
  ${index + 1}. ${markup.value_type} ${markup.value}${markup.value_type === 'PERCENT' ? '%' : ''}
     Market: ${markup.market}
     Currency: ${markup.currency}
     Priority: ${markup.priority}
     Active: ${markup.is_active ? "✅" : "❌"}
        `);
      });
      
      return true;
    } else {
      console.log("❌ Failed to load markups");
      return false;
    }
  } catch (error) {
    console.error("❌ Error:", error.response?.data || error.message);
    return false;
  }
}

async function testMarkupPreview() {
  console.log("\n📈 Test 5: Markup Preview");
  console.log("━".repeat(50));

  try {
    const previewData = {
      product_type: "hotels",
      market: "IN",
      currency: "INR",
      hotel_id: "ALL",
      destination: "ALL",
      channel: "web",
      base_price: 10000,
    };

    const response = await api.post("/api/admin/suppliers/ratehawk/markups/preview", previewData);
    
    if (response.data.success) {
      const { basePrice, finalPrice, markup, increase, increasePercent } = response.data.data;
      
      console.log("✅ Markup preview calculated");
      console.log(`
  💵 Price Breakdown:
     Base Price: ₹${basePrice}
     Final Price: ₹${finalPrice.toFixed(2)}
     Increase: ₹${increase.toFixed(2)} (+${increasePercent.toFixed(1)}%)
     
  📋 Applied Markup:
     Type: ${markup?.value_type || "None"}
     Value: ${markup?.value || 0}${markup?.value_type === 'PERCENT' ? '%' : ''}
     Priority: ${markup?.priority || "N/A"}
      `);
      
      return true;
    } else {
      console.log("❌ Preview failed");
      return false;
    }
  } catch (error) {
    console.error("❌ Error:", error.response?.data || error.message);
    return false;
  }
}

async function testCreateMarkup() {
  console.log("\n➕ Test 6: Create Supplier Markup");
  console.log("━".repeat(50));

  try {
    const markupData = {
      product_type: "hotels",
      market: "US",
      currency: "USD",
      value_type: "PERCENT",
      value: 12.0,
      priority: 85,
    };

    const response = await api.post("/api/admin/suppliers/ratehawk/markups", markupData);
    
    if (response.data.success) {
      console.log("✅ Markup created successfully");
      console.log(`   ID: ${response.data.data.id}`);
      console.log(`   Market: ${response.data.data.market}`);
      console.log(`   Value: ${response.data.data.value}%`);
      
      // Clean up - delete the test markup
      await api.delete(`/api/admin/suppliers/ratehawk/markups/${response.data.data.id}`);
      console.log("   ✅ Test markup cleaned up");
      
      return true;
    } else {
      console.log("❌ Failed to create markup");
      return false;
    }
  } catch (error) {
    console.error("❌ Error:", error.response?.data || error.message);
    return false;
  }
}

async function testToggleSupplier() {
  console.log("\n🔄 Test 7: Toggle Supplier Status");
  console.log("━".repeat(50));

  try {
    // Get current status
    const getResponse = await api.get("/api/admin/suppliers/ratehawk");
    const currentStatus = getResponse.data.data.is_enabled;
    
    console.log(`   Current status: ${currentStatus ? "Enabled ✅" : "Disabled ❌"}`);

    // Toggle off
    const toggleOffResponse = await api.put("/api/admin/suppliers/ratehawk", {
      is_enabled: false,
    });

    if (toggleOffResponse.data.success) {
      console.log("   ✅ Disabled successfully");
    }

    // Wait a moment
    await new Promise(resolve => setTimeout(resolve, 500));

    // Toggle back on
    const toggleOnResponse = await api.put("/api/admin/suppliers/ratehawk", {
      is_enabled: true,
    });

    if (toggleOnResponse.data.success) {
      console.log("   ✅ Re-enabled successfully");
      return true;
    }

    return false;
  } catch (error) {
    console.error("❌ Error:", error.response?.data || error.message);
    return false;
  }
}

async function runAllTests() {
  console.log("\n");
  console.log("🧪 RateHawk Integration Test Suite");
  console.log("=".repeat(50));
  console.log(`API Base URL: ${API_BASE_URL}`);
  console.log(`Admin Key: ${ADMIN_API_KEY ? "Set ✅" : "Not Set ❌"}`);

  const results = {
    suppliersList: await testSuppliersList(),
    supplierHealth: await testSupplierHealth(),
    multiSupplierSearch: await testMultiSupplierSearch(),
    supplierMarkups: await testSupplierMarkups(),
    markupPreview: await testMarkupPreview(),
    createMarkup: await testCreateMarkup(),
    toggleSupplier: await testToggleSupplier(),
  };

  console.log("\n");
  console.log("📊 Test Results Summary");
  console.log("=".repeat(50));

  const passedTests = Object.values(results).filter(r => r === true).length;
  const totalTests = Object.keys(results).length;

  Object.entries(results).forEach(([test, passed]) => {
    console.log(`${passed ? "✅" : "❌"} ${test}`);
  });

  console.log("\n");
  console.log(`Final Score: ${passedTests}/${totalTests} tests passed`);

  if (passedTests === totalTests) {
    console.log("\n🎉 All tests passed! RateHawk integration is working correctly.");
  } else {
    console.log("\n⚠️  Some tests failed. Please review the errors above.");
  }

  console.log("\n");
  process.exit(passedTests === totalTests ? 0 : 1);
}

// Run tests
runAllTests().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
