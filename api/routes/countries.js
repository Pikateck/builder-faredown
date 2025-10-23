import express from "express";

const { pool } = require("../database/connection");
const router = require("express").Router();

/**
 * GET /api/countries
 * Returns all countries with proper formatting for frontend dropdowns
 * Includes caching headers for performance
 */
router.get("/", async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT 
        iso2,
        name as display_name,
        iso3_code,
        continent,
        currency_code,
        phone_prefix,
        flag_emoji,
        popular
      FROM public.countries
      ORDER BY popular DESC, name ASC
    `);

    // Add caching headers for performance (24 hours)
    res.set({
      "Cache-Control": "public, max-age=86400",
      ETag: `"countries-${rows.length}"`,
      "Last-Modified": new Date().toUTCString(),
    });

    res.json({
      success: true,
      count: rows.length,
      countries: rows,
    });
  } catch (error) {
    console.error("GET /api/countries error:", error);
    res.status(500).json({
      success: false,
      error: "Unable to fetch countries",
      message: "Internal server error while retrieving countries data",
    });
  }
});

/**
 * GET /api/countries/popular
 * Returns only popular countries for quick access
 */
router.get("/popular", async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT 
        iso2,
        name as display_name,
        flag_emoji,
        popular
      FROM public.countries
      WHERE popular = true
      ORDER BY name ASC
    `);

    res.set("Cache-Control", "public, max-age=86400");

    res.json({
      success: true,
      count: rows.length,
      countries: rows,
    });
  } catch (error) {
    console.error("GET /api/countries/popular error:", error);
    res.status(500).json({
      success: false,
      error: "Unable to fetch popular countries",
    });
  }
});

/**
 * GET /api/countries/search?q=query
 * Search countries by name or code
 */
router.get("/search", async (req, res) => {
  try {
    const { q: query } = req.query;

    if (!query || query.trim().length < 1) {
      return res.status(400).json({
        success: false,
        error: "Search query is required",
      });
    }

    const searchTerm = `%${query.trim().toLowerCase()}%`;

    const { rows } = await pool.query(
      `
      SELECT 
        iso2,
        name as display_name,
        iso3_code,
        flag_emoji,
        popular,
        continent
      FROM public.countries
      WHERE 
        LOWER(name) LIKE $1 OR 
        LOWER(iso2) LIKE $1 OR 
        LOWER(iso3_code) LIKE $1
      ORDER BY 
        popular DESC,
        CASE 
          WHEN LOWER(name) LIKE $2 THEN 1
          WHEN LOWER(iso2) = $3 THEN 2
          ELSE 3
        END,
        name ASC
      LIMIT 20
    `,
      [
        searchTerm,
        `${query.trim().toLowerCase()}%`,
        query.trim().toLowerCase(),
      ],
    );

    res.json({
      success: true,
      query: query.trim(),
      count: rows.length,
      countries: rows,
    });
  } catch (error) {
    console.error("GET /api/countries/search error:", error);
    res.status(500).json({
      success: false,
      error: "Unable to search countries",
    });
  }
});

/**
 * GET /api/countries/:code
 * Get specific country by ISO2 code
 */
router.get("/:code", async (req, res) => {
  try {
    const { code } = req.params;

    if (!code || code.length !== 2) {
      return res.status(400).json({
        success: false,
        error: "Invalid country code. Must be 2-letter ISO code.",
      });
    }

    const { rows } = await pool.query(
      `
      SELECT 
        iso2,
        name as display_name,
        iso3_code,
        continent,
        currency_code,
        phone_prefix,
        flag_emoji,
        popular,
        created_at,
        updated_at
      FROM public.countries
      WHERE UPPER(iso2) = UPPER($1)
    `,
      [code],
    );

    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: "Country not found",
      });
    }

    res.set("Cache-Control", "public, max-age=86400");

    res.json({
      success: true,
      country: rows[0],
    });
  } catch (error) {
    console.error(`GET /api/countries/${req.params.code} error:`, error);
    res.status(500).json({
      success: false,
      error: "Unable to fetch country details",
    });
  }
});
export default router;