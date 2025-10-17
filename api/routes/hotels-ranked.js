/**
 * Ranked Multi-Supplier Hotel Search
 * Uses MixedSupplierRankingService to return cheapest per property across suppliers
 */

const express = require("express");
const MixedSupplierRankingService = require("../services/ranking/mixedSupplierRankingService");

const router = express.Router();

function parseBool(val, def = false) {
  if (val === undefined || val === null) return def;
  const s = String(val).toLowerCase();
  return s === "1" || s === "true" || s === "yes";
}

router.get("/search", async (req, res) => {
  try {
    const {
      city,
      country,
      checkIn,
      checkOut,
      adults,
      children,
      priceMin,
      priceMax,
      freeCancellationOnly,
      minStarRating,
      currency,
      suppliers,
      limit,
      offset,
    } = req.query || {};

    let preferredSuppliers = Array.isArray(suppliers)
      ? suppliers.map((s) => String(s).toUpperCase())
      : typeof suppliers === "string" && suppliers.length > 0
        ? suppliers.split(",").map((s) => s.trim().toUpperCase())
        : undefined; // fallback to DB

    if (!preferredSuppliers) {
      try {
        const db = require("../database/connection");
        const result = await db.query(
          `SELECT COALESCE(code, supplier_code) AS code
           FROM supplier_master
           WHERE enabled = TRUE
             AND LOWER(COALESCE(code, supplier_code)) IN ('ratehawk','hotelbeds','tbo')
           ORDER BY weight DESC, COALESCE(code, supplier_code) ASC`
        );
        preferredSuppliers = result.rows.map((r) => String(r.code || "").toUpperCase());
        if (preferredSuppliers.length === 0) {
          preferredSuppliers = ["RATEHAWK", "HOTELBEDS", "TBO"];
        }
      } catch (e) {
        preferredSuppliers = ["RATEHAWK", "HOTELBEDS", "TBO"];
      }
    }

    const searchParams = {
      city: city || null,
      country: country || null,
      checkIn: checkIn || null,
      checkOut: checkOut || null,
      adults: adults ? Number(adults) : 2,
      children: children ? Number(children) : 0,
      priceMin: priceMin ? Number(priceMin) : 0,
      priceMax: priceMax ? Number(priceMax) : Infinity,
      freeCancellationOnly: parseBool(freeCancellationOnly, false),
      minStarRating: minStarRating ? Number(minStarRating) : 0,
      currency: currency || "USD",
      preferredSuppliers,
      limit: limit ? Number(limit) : 50,
      offset: offset ? Number(offset) : 0,
    };

    // Require at least a city or country
    if (!searchParams.city && !searchParams.country) {
      return res.status(400).json({ success: false, error: "city or country is required" });
    }

    const data = await MixedSupplierRankingService.searchMultiSupplier(searchParams);

    res.json({ success: true, data, meta: { count: data.length, params: searchParams } });
  } catch (error) {
    console.error("Ranked hotel search error", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
