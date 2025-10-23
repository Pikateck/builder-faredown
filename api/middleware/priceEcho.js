/**
 * Price Echo Middleware
 * Tracks pricing consistency across user journey steps
 * Logs prices and detects mismatches automatically
 */

import { Pool } from "pg";

/**
 * Price Echo Middleware Factory
 * @param {Object} options - Configuration options
 * @param {Pool} options.pool - Database connection pool
 * @param {string} options.stepHeader - Header name for step tracking (default: x-fd-step)
 * @param {string} options.journeyHeader - Header name for journey tracking (default: x-fd-journey)
 * @param {string} options.currencyField - Field name for currency (default: currency)
 * @param {string} options.totalFareField - Field name for total fare (default: totalFare)
 * @param {string} options.webhookUrl - Optional webhook URL for mismatch alerts
 * @param {boolean} options.enabled - Enable/disable middleware (default: true)
 * @returns {Function} Express middleware function
 */
function priceEcho(options = {}) {
  const {
    pool,
    stepHeader = "x-fd-step",
    journeyHeader = "x-fd-journey",
    currencyField = "totalFare",
    baseFareField = "baseFare",
    markupField = "markup",
    discountField = "discount",
    taxField = "tax",
    webhookUrl = null,
    enabled = true,
  } = options;

  if (!pool) {
    throw new Error("Database pool is required for Price Echo middleware");
  }

  return async function priceEchoMiddleware(req, res, next) {
    // Skip if middleware is disabled
    if (!enabled) {
      return next();
    }

    const step = String(req.headers[stepHeader] || "")
      .toLowerCase()
      .trim();
    const journeyId = String(req.headers[journeyHeader] || "").trim();

    // Skip if required headers are missing
    if (!step || !journeyId) {
      return next();
    }

    // Valid steps
    const validSteps = [
      "search_results",
      "view_details",
      "bargain_pre",
      "bargain_post",
      "book",
      "payment",
      "invoice",
      "my_trips",
    ];

    if (!validSteps.includes(step)) {
      console.warn(`[PriceEcho] Invalid step: ${step}`);
      return next();
    }

    // Intercept the response to capture pricing data
    const originalJson = res.json.bind(res);

    res.json = async function (body) {
      try {
        await capturePriceData(body, step, journeyId);
      } catch (error) {
        // Don't block the response if price logging fails
        console.error("[PriceEcho] Error capturing price data:", error);
      }

      return originalJson(body);
    };

    async function capturePriceData(
      responseBody,
      currentStep,
      currentJourneyId,
    ) {
      try {
        // Extract pricing data from response or request body
        const priceData = extractPricingData(responseBody, req.body);

        if (!priceData.totalFare || isNaN(Number(priceData.totalFare))) {
          // No valid pricing data found, skip logging
          return;
        }

        // Log the price checkpoint
        await logPriceCheckpoint(
          currentJourneyId,
          currentStep,
          priceData,
          responseBody,
        );

        // Check for price mismatches
        await checkPriceMismatch(currentJourneyId, currentStep, priceData);
      } catch (error) {
        console.error("[PriceEcho] Error in capturePriceData:", error);
      }
    }

    function extractPricingData(responseBody, requestBody) {
      // Try to extract from response body first, then request body
      const data = responseBody?.data || responseBody || requestBody || {};

      return {
        totalFare: Number(data[currencyField] || data.totalFare || 0),
        baseFare: Number(data[baseFareField] || data.baseFare || 0),
        markup: Number(data[markupField] || data.markup || 0),
        discount: Number(data[discountField] || data.discount || 0),
        tax: Number(data[taxField] || data.tax || 0),
        currency: data.currency || "USD",
      };
    }

    async function logPriceCheckpoint(journeyId, step, priceData, payload) {
      const query = `
        INSERT INTO price_checkpoints 
        (journey_id, step, currency, total_fare, base_fare, markup, discount, tax, payload)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      `;

      const values = [
        journeyId,
        step,
        priceData.currency,
        priceData.totalFare.toFixed(2),
        priceData.baseFare.toFixed(2),
        priceData.markup.toFixed(2),
        priceData.discount.toFixed(2),
        priceData.tax.toFixed(2),
        JSON.stringify(payload),
      ];

      await pool.query(query, values);

      console.log(
        `[PriceEcho] Logged ${step} price: ${priceData.currency} ${priceData.totalFare} for journey ${journeyId}`,
      );
    }

    async function checkPriceMismatch(
      journeyId,
      currentStep,
      currentPriceData,
    ) {
      try {
        // Get the first recorded price for this journey
        const firstPriceQuery = `
          SELECT total_fare, step, currency
          FROM price_checkpoints
          WHERE journey_id = $1
          ORDER BY created_at ASC
          LIMIT 1
        `;

        const firstPriceResult = await pool.query(firstPriceQuery, [journeyId]);

        if (!firstPriceResult.rows.length) {
          // This is the first price, no comparison needed
          return;
        }

        const firstPrice = Number(firstPriceResult.rows[0].total_fare);
        const firstStep = firstPriceResult.rows[0].step;
        const currentPrice = currentPriceData.totalFare;

        const delta = Number((currentPrice - firstPrice).toFixed(2));
        const deltaAbs = Math.abs(delta);

        // Allow price changes only for bargain_post step
        const isBargainPost = currentStep === "bargain_post";
        const hasMismatch = !isBargainPost && deltaAbs > 0.01; // Allow 1 cent tolerance for rounding

        if (hasMismatch) {
          console.warn(`[PriceEcho] PRICE MISMATCH detected!`, {
            journeyId,
            firstStep,
            firstPrice,
            currentStep,
            currentPrice,
            delta,
            deltaPercent: ((delta / firstPrice) * 100).toFixed(2) + "%",
          });

          // Send webhook alert if configured
          if (webhookUrl) {
            await sendMismatchAlert({
              type: "PRICE_MISMATCH",
              journeyId,
              firstStep,
              firstPrice,
              currentStep,
              currentPrice,
              delta,
              deltaPercent: ((delta / firstPrice) * 100).toFixed(2),
              timestamp: new Date().toISOString(),
            });
          }
        } else if (isBargainPost && deltaAbs > 0) {
          console.log(
            `[PriceEcho] Expected price change in bargain_post: ${delta > 0 ? "+" : ""}${delta}`,
          );
        }
      } catch (error) {
        console.error("[PriceEcho] Error checking price mismatch:", error);
      }
    }

    async function sendMismatchAlert(alertData) {
      try {
        const fetch = (await import("node-fetch")).default;

        await fetch(webhookUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "User-Agent": "Faredown-PriceEcho/1.0",
          },
          body: JSON.stringify(alertData),
          timeout: 5000, // 5 second timeout
        });

        console.log("[PriceEcho] Mismatch alert sent to webhook");
      } catch (error) {
        console.error("[PriceEcho] Failed to send webhook alert:", error);
      }
    }

    next();
  };
}

/**
 * Price diff endpoint for debugging
 * GET /api/pricing/diff?journeyId=<journey_id>
 */
async function createDiffEndpoint(pool) {
  return async function diffEndpoint(req, res) {
    try {
      const journeyId = String(req.query.journeyId || "").trim();

      if (!journeyId) {
        return res.status(400).json({
          success: false,
          error: "journeyId parameter is required",
        });
      }

      const query = `
        SELECT step, currency, total_fare, base_fare, markup, discount, tax, created_at
        FROM price_checkpoints
        WHERE journey_id = $1
        ORDER BY created_at ASC
      `;

      const result = await pool.query(query, [journeyId]);

      if (!result.rows.length) {
        return res.json({
          success: true,
          journeyId,
          steps: [],
          message: "No price checkpoints found for this journey",
        });
      }

      const firstPrice = Number(result.rows[0].total_fare);

      const steps = result.rows.map((row) => ({
        step: row.step,
        totalFare: Number(row.total_fare),
        baseFare: Number(row.base_fare),
        markup: Number(row.markup),
        discount: Number(row.discount),
        tax: Number(row.tax),
        currency: row.currency,
        deltaFromFirst: Number(
          (Number(row.total_fare) - firstPrice).toFixed(2),
        ),
        timestamp: row.created_at,
      }));

      res.json({
        success: true,
        journeyId,
        baseline: firstPrice,
        steps,
        totalSteps: steps.length,
        priceChanges: steps.filter((s) => Math.abs(s.deltaFromFirst) > 0.01)
          .length,
      });
    } catch (error) {
      console.error("Price diff endpoint error:", error);
      res.status(500).json({
        success: false,
        error: "Failed to get price diff",
        message: error.message,
      });
    }
  };
}

export {
  priceEcho,
  createDiffEndpoint,
};
