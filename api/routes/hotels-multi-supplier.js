/**
 * Multi-Supplier Hotel Search API
 * Aggregates results from Hotelbeds, RateHawk, and other hotel suppliers
 */

const express = require("express");
const db = require("../database/connection");
const supplierAdapterManager = require("../services/adapters/supplierAdapterManager");

const router = express.Router();

/**
 * Get supplier-scoped markup for a hotel
 */
async function getSupplierMarkup(
  supplierCode,
  productType,
  market = "ALL",
  currency = "ALL",
  hotelId = "ALL",
  destination = "ALL",
  channel = "ALL",
) {
  try {
    const result = await db.query(
      `SELECT * FROM get_effective_supplier_markup($1, $2, $3, $4, $5, $6, $7)`,
      [
        supplierCode,
        productType,
        market,
        currency,
        hotelId,
        destination,
        channel,
      ],
    );

    if (result.rows.length > 0) {
      return result.rows[0];
    }

    // Default markup if none found
    return {
      value_type: "PERCENT",
      value: supplierCode === "ratehawk" ? 18.0 : 20.0,
      priority: 999,
    };
  } catch (error) {
    console.error("Error getting supplier markup:", error);
    return {
      value_type: "PERCENT",
      value: 20.0,
      priority: 999,
    };
  }
}

/**
 * Apply markup to hotel price
 */
function applyMarkup(basePrice, markup) {
  if (markup.value_type === "PERCENT") {
    return basePrice * (1 + markup.value / 100);
  } else if (markup.value_type === "FLAT") {
    return basePrice + markup.value;
  }
  return basePrice;
}

/**
 * Apply promo code discount for hotels
 */
async function applyPromoCode(
  price,
  promoCode,
  userId = null,
  supplier = null,
) {
  if (!promoCode)
    return { finalPrice: price, discount: 0, promoApplied: false };

  try {
    const query = `
      SELECT * FROM promo_codes 
      WHERE code = $1 
      AND is_active = true 
      AND (applicable_to = 'hotels' OR applicable_to = 'all')
      AND (expiry_date IS NULL OR expiry_date > NOW())
      AND (usage_limit IS NULL OR usage_count < usage_limit)
      AND (supplier_scope = $2 OR supplier_scope = 'all')
    `;

    const result = await db.query(query, [
      promoCode,
      (supplier || "all").toLowerCase(),
    ]);

    if (result.rows && result.rows.length > 0) {
      const promo = result.rows[0];
      let discount = 0;

      if (promo.discount_type === "percentage") {
        discount = price * (promo.discount_value / 100);
        if (promo.max_discount && discount > promo.max_discount) {
          discount = promo.max_discount;
        }
      } else if (promo.discount_type === "fixed") {
        discount = promo.discount_value;
      }

      if (promo.min_order_value && price < promo.min_order_value) {
        return {
          finalPrice: price,
          discount: 0,
          promoApplied: false,
          error: "Minimum order value not met",
        };
      }

      const finalPrice = Math.max(0, price - discount);

      await db.query(
        "UPDATE promo_codes SET usage_count = usage_count + 1 WHERE id = $1",
        [promo.id],
      );

      return { finalPrice, discount, promoApplied: true, promoDetails: promo };
    }

    return {
      finalPrice: price,
      discount: 0,
      promoApplied: false,
      error: "Invalid promo code",
    };
  } catch (error) {
    console.error("Error applying promo code:", error);
    return {
      finalPrice: price,
      discount: 0,
      promoApplied: false,
      error: "Promo code application failed",
    };
  }
}

/**
 * Multi-Supplier Hotel Search
 */
router.get("/search", async (req, res) => {
  try {
    console.log("🏨 Multi-supplier hotel search request:", req.query);

    const {
      destination,
      checkIn,
      checkOut,
      rooms = "2",
      currency = "USD",
      promoCode,
      userId,
      market = "IN",
      channel = "web",
    } = req.query;

    // Validate required parameters
    if (!destination || !checkIn || !checkOut) {
      return res.status(400).json({
        success: false,
        error: "Missing required parameters: destination, checkIn, checkOut",
      });
    }

    // Parse rooms
    const roomsArray = [{ adults: parseInt(rooms) || 2, children: 0 }];

    // Build search params
    const searchParams = {
      destination,
      checkIn,
      checkOut,
      rooms: roomsArray,
      currency,
      maxResults: 50,
    };

    // Get enabled hotel suppliers from database
    const suppliersResult = await db.query(`
      SELECT code FROM suppliers 
      WHERE product_type = 'hotels' 
      AND is_enabled = TRUE
      ORDER BY code
    `);

    const enabledSuppliers = suppliersResult.rows.map((row) =>
      row.code.toUpperCase(),
    );

    // Fallback to env if no DB suppliers
    const suppliersToUse =
      enabledSuppliers.length > 0
        ? enabledSuppliers
        : (process.env.HOTELS_SUPPLIERS || "HOTELBEDS,RATEHAWK")
            .split(",")
            .map((s) => s.trim().toUpperCase());

    console.log(
      `📡 Searching across hotel suppliers: ${suppliersToUse.join(", ")}`,
    );

    // Execute parallel search across all enabled suppliers
    const aggregatedResults = await supplierAdapterManager.searchAllHotels(
      searchParams,
      suppliersToUse,
    );

    console.log(
      `✅ Aggregated ${aggregatedResults.totalResults} hotel results from ${Object.keys(aggregatedResults.supplierMetrics).length} suppliers`,
    );

    // Log supplier metrics
    console.log(
      "📊 Supplier Metrics:",
      JSON.stringify(aggregatedResults.supplierMetrics, null, 2),
    );

    // Check if all suppliers failed
    const allSuppliersFailed = Object.values(
      aggregatedResults.supplierMetrics,
    ).every((metric) => !metric.success);

    if (allSuppliersFailed) {
      console.error(
        "❌ All hotel suppliers failed:",
        aggregatedResults.supplierMetrics,
      );
      return res.json({
        success: true,
        data: [],
        meta: {
          totalResults: 0,
          searchParams: req.query,
          source: "multi_supplier",
          warning: "All suppliers unavailable",
          supplierErrors: aggregatedResults.supplierMetrics,
          timestamp: new Date().toISOString(),
        },
      });
    }

    // Apply supplier-scoped markup and promo to each result
    const transformedHotels = await Promise.all(
      aggregatedResults.products.map(async (hotel) => {
        const supplier = (
          hotel.supplier ||
          hotel.supplierCode ||
          "HOTELBEDS"
        ).toLowerCase();

        // Get supplier-specific markup
        const markup = await getSupplierMarkup(
          supplier,
          "hotels",
          market,
          currency,
          hotel.hotelId || hotel.id,
          hotel.destinationCode || destination,
          channel,
        );

        // Apply markup to each rate
        const ratesWithMarkup = (hotel.rates || []).map((rate) => {
          const basePrice = rate.price || rate.amount || 0;
          const markedUpPrice = applyMarkup(basePrice, markup);

          return {
            ...rate,
            originalPrice: basePrice,
            markedUpPrice,
            markup: markup,
          };
        });

        // Get best rate for main price
        const bestRate = ratesWithMarkup.reduce(
          (best, rate) =>
            rate.markedUpPrice < best.markedUpPrice ? rate : best,
          ratesWithMarkup[0] || { markedUpPrice: 0 },
        );

        // Apply promo if provided
        let finalPrice = bestRate.markedUpPrice;
        let promoResult = { promoApplied: false, discount: 0 };

        if (promoCode) {
          promoResult = await applyPromoCode(
            bestRate.markedUpPrice,
            promoCode,
            userId,
            supplier,
          );
          finalPrice = promoResult.finalPrice;
        }

        return {
          ...hotel,
          supplier,
          rates: ratesWithMarkup,
          price: {
            original: bestRate.originalPrice,
            markedUp: bestRate.markedUpPrice,
            final: finalPrice,
            currency: hotel.price?.currency || currency,
            breakdown: {
              base: bestRate.originalPrice * 0.8,
              taxes: bestRate.originalPrice * 0.15,
              fees: bestRate.originalPrice * 0.05,
              markup: bestRate.markedUpPrice - bestRate.originalPrice,
              discount: promoResult.discount,
              total: finalPrice,
            },
          },
          markupApplied: markup,
          promoApplied: promoResult.promoApplied,
          promoDetails: promoResult.promoDetails,
        };
      }),
    );

    // Sort by final price
    transformedHotels.sort((a, b) => a.price.final - b.price.final);

    // Update supplier metrics
    for (const [supplier, metrics] of Object.entries(
      aggregatedResults.supplierMetrics,
    )) {
      if (metrics.success) {
        await db.query(
          `UPDATE suppliers SET 
            last_success_at = NOW(),
            total_calls_24h = total_calls_24h + 1,
            updated_at = NOW()
          WHERE code = $1`,
          [supplier.toLowerCase()],
        );
      } else {
        await db.query(
          `UPDATE suppliers SET 
            last_error_at = NOW(),
            last_error_msg = $2,
            total_calls_24h = total_calls_24h + 1,
            updated_at = NOW()
          WHERE code = $1`,
          [supplier.toLowerCase(), metrics.error || "Unknown error"],
        );
      }
    }

    // Return results
    res.json({
      success: true,
      data: transformedHotels,
      meta: {
        totalResults: transformedHotels.length,
        searchParams: {
          destination,
          checkIn,
          checkOut,
          rooms: roomsArray,
          currency,
        },
        suppliers: aggregatedResults.supplierMetrics,
        source: "multi_supplier",
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error("❌ Multi-supplier hotel search error:", error);

    res.status(500).json({
      success: false,
      error: error.message,
      meta: {
        searchParams: req.query,
        source: "multi_supplier",
        timestamp: new Date().toISOString(),
      },
    });
  }
});

/**
 * Get hotel details (supplier-aware)
 */
router.get("/:hotelId", async (req, res) => {
  try {
    const { hotelId } = req.params;
    const { supplier = "hotelbeds" } = req.query;

    const adapter = supplierAdapterManager.getAdapter(supplier.toUpperCase());
    if (!adapter) {
      return res.status(404).json({
        success: false,
        error: `Supplier ${supplier} not found`,
      });
    }

    // Extract actual hotel ID (remove supplier prefix if present)
    const actualHotelId = hotelId.replace(/^(hb_|rh_)/, "");

    const hotelDetails = await adapter.getHotelDetails(actualHotelId);

    res.json({
      success: true,
      data: {
        ...hotelDetails,
        supplier: supplier.toLowerCase(),
      },
    });
  } catch (error) {
    console.error("Error fetching hotel details:", error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

module.exports = router;
