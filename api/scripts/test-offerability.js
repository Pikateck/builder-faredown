/**
 * Offerability Engine Test Script
 * Tests policy parsing and feasible action generation
 */

const offerabilityEngine = require("../services/offerabilityEngine");
const policyParser = require("../services/policyParser");
const redisService = require("../services/redisService");

async function testOfferabilityEngine() {
  console.log("ðŸš€ Testing Offerability Engine...\n");

  try {
    // Initialize Redis
    await redisService.init();
    console.log("âœ… Redis connected\n");

    // Test 1: Policy Parsing
    console.log("ðŸ“‹ Test 1: Policy Parsing");
    const startPolicyTime = Date.now();
    const policy = await policyParser.getParsedPolicy();
    const policyTime = Date.now() - startPolicyTime;

    console.log(`âœ“ Policy parsed in ${policyTime}ms`);
    console.log(`âœ“ Policy version: ${policy.version}`);
    console.log(`âœ“ Global max_rounds: ${policy.global.max_rounds}`);
    console.log(
      `âœ“ Flight min_margin: $${policy.price_rules.flight.min_margin_usd}`,
    );
    console.log(
      `âœ“ Hotel max_discount: ${policy.price_rules.hotel.max_discount_pct * 100}%\n`,
    );

    // Test 2: Flight Feasible Actions
    console.log("âœˆï¸  Test 2: Flight Feasible Actions");
    const flightContext = {
      canonical_key: "FL:AI-BOM-DXB-2025-10-01-Y",
      product_type: "flight",
      supplier_snapshots: [
        {
          supplier_id: 1,
          currency: "USD",
          net: 285.0,
          taxes: 45.5,
          fees: 12.0,
          inventory_state: "AVAILABLE",
          snapshot_at: new Date(),
        },
      ],
      user_profile: {
        tier: "GOLD",
        style: "persistent",
      },
      session_context: {
        round: 1,
        inventory_age_minutes: 2,
        elapsed_ms: 50,
      },
      promo_code: null,
    };

    const startFlightTime = Date.now();
    const flightActions =
      await offerabilityEngine.generateFeasibleActions(flightContext);
    const flightTime = Date.now() - startFlightTime;

    console.log(`âœ“ Flight actions generated in ${flightTime}ms`);
    console.log(`âœ“ Cost floor: $${flightActions.cost_floor}`);
    console.log(
      `âœ“ Price range: $${flightActions.min_price} - $${flightActions.max_price}`,
    );
    console.log(`âœ“ Actions available: ${flightActions.action_count}`);
    console.log(`âœ“ Allow perks: ${flightActions.allow_perks}\n`);

    // Test 3: Hotel Feasible Actions with Promo
    console.log("ðŸ¨ Test 3: Hotel Feasible Actions (with promo)");
    const hotelContext = {
      canonical_key: "HT:12345:DLX:BRD-BB:CXL-FLEX",
      product_type: "hotel",
      supplier_snapshots: [
        {
          supplier_id: 2,
          currency: "USD",
          net: 120.0,
          taxes: 18.0,
          fees: 5.0,
          inventory_state: "AVAILABLE",
          snapshot_at: new Date(),
        },
      ],
      user_profile: {
        tier: "PLATINUM",
        style: "generous",
      },
      session_context: {
        round: 1,
        inventory_age_minutes: 1,
        elapsed_ms: 30,
      },
      promo_code: "HOTEL15",
    };

    const startHotelTime = Date.now();
    const hotelActions =
      await offerabilityEngine.generateFeasibleActions(hotelContext);
    const hotelTime = Date.now() - startHotelTime;

    console.log(`âœ“ Hotel actions generated in ${hotelTime}ms`);
    console.log(`âœ“ Cost floor: $${hotelActions.cost_floor}`);
    console.log(
      `âœ“ Price range: $${hotelActions.min_price} - $${hotelActions.max_price}`,
    );
    console.log(`âœ“ Actions available: ${hotelActions.action_count}`);
    console.log(`âœ“ Allow perks: ${hotelActions.allow_perks}`);
    console.log(
      `âœ“ Tier boost applied: ${hotelActions.constraints.tier_boost_applied}\n`,
    );

    // Test 4: Performance Test (10 consecutive calls)
    console.log("âš¡ Test 4: Performance Test (10 calls)");
    const perfStartTime = Date.now();

    for (let i = 0; i < 10; i++) {
      await offerabilityEngine.generateFeasibleActions(flightContext);
    }

    const totalPerfTime = Date.now() - perfStartTime;
    const avgPerfTime = totalPerfTime / 10;

    console.log(`âœ“ 10 calls completed in ${totalPerfTime}ms`);
    console.log(`âœ“ Average time per call: ${avgPerfTime}ms`);
    console.log(
      `âœ“ Performance target (<50ms): ${avgPerfTime < 50 ? "âœ… PASS" : "âŒ FAIL"}\n`,
    );

    // Test 5: Guardrails Test
    console.log("ðŸ›¡ï¸  Test 5: Guardrails Test");
    const guardrailContext = {
      ...flightContext,
      session_context: {
        round: 4, // Exceeds max_rounds
        inventory_age_minutes: 10, // Stale inventory
        elapsed_ms: 300, // Near latency limit
      },
    };

    const startGuardTime = Date.now();
    const guardActions =
      await offerabilityEngine.generateFeasibleActions(guardrailContext);
    const guardTime = Date.now() - startGuardTime;

    console.log(`âœ“ Guardrail actions generated in ${guardTime}ms`);
    console.log(
      `âœ“ Actions after guardrails: ${guardActions.filtered_action_count}`,
    );
    console.log(`âœ“ Guardrails applied: ${guardActions.guardrails_applied}\n`);

    // Test 6: Health Check
    console.log("ðŸ¥ Test 6: Health Check");
    const healthCheck = await offerabilityEngine.healthCheck();
    console.log(`âœ“ Health status: ${healthCheck.status}`);
    console.log(`âœ“ Policy version: ${healthCheck.policy_version}`);
    console.log(`âœ“ Total calls: ${healthCheck.performance.calls}`);
    console.log(
      `âœ“ Average time: ${healthCheck.performance.avgTime.toFixed(2)}ms`,
    );
    console.log(
      `âœ“ Error rate: ${(healthCheck.performance.error_rate * 100).toFixed(2)}%\n`,
    );

    // Performance Summary
    console.log("ðŸ“Š Performance Summary:");
    console.log(`Policy parsing: ${policyTime}ms (target: <30ms)`);
    console.log(`Flight actions: ${flightTime}ms (target: <50ms)`);
    console.log(`Hotel actions: ${hotelTime}ms (target: <50ms)`);
    console.log(`Average across 10 calls: ${avgPerfTime}ms (target: <50ms)`);

    const allTargetsMet =
      policyTime < 30 && flightTime < 50 && hotelTime < 50 && avgPerfTime < 50;
    console.log(
      `\nðŸŽ¯ Performance targets: ${allTargetsMet ? "âœ… ALL PASS" : "âŒ SOME FAIL"}`,
    );

    console.log("\nâœ… Offerability Engine test completed successfully!");
  } catch (error) {
    console.error("âŒ Test failed:", error);
    process.exit(1);
  } finally {
    await redisService.close();
    process.exit(0);
  }
}

// Handle graceful shutdown
process.on("SIGINT", async () => {
  console.log("\nðŸ›‘ Test interrupted");
  await redisService.close();
  process.exit(0);
});

// Run test
if (require.main === module) {
  testOfferabilityEngine().catch((error) => {
    console.error("âŒ Fatal error:", error);
    process.exit(1);
  });
}

export default { testOfferabilityEngine };
