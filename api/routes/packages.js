/**
 * Updated Fixed Packages API Routes
 * Now uses proper foreign key relationships for destination filtering
 * Supports filtering by destination and date range as requested
 */

import express from "express";
import { Pool } from "pg";
import crypto from "crypto";

const router = express.Router();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

/**
 * GET /api/packages
 * List all fixed packages with optional filters
 */
router.get("/", async (req, res) => {
  try {
    const {
      destination,
      startDate,
      endDate,
      limit = 10,
      offset = 0,
    } = req.query;

    let query = `
      SELECT p.id, p.name, p.slug, p.destination_id, p.price, p.currency,
             p.itinerary, p.benefits, p.included_services, p.terms_conditions,
             p.start_date, p.end_date, p.status, p.created_at,
             d.city_name, d.country_code
      FROM packages p
      LEFT JOIN destinations d ON p.destination_id = d.id
      WHERE 1=1
    `;

    const params = [];
    let paramIndex = 1;

    if (destination) {
      query += ` AND (d.city_name ILIKE $${paramIndex} OR d.country_code ILIKE $${paramIndex})`;
      params.push(`%${destination}%`);
      paramIndex++;
    }

    if (startDate) {
      query += ` AND p.start_date >= $${paramIndex}`;
      params.push(startDate);
      paramIndex++;
    }

    if (endDate) {
      query += ` AND p.end_date <= $${paramIndex}`;
      params.push(endDate);
      paramIndex++;
    }

    query += ` ORDER BY p.created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(parseInt(limit), parseInt(offset));

    const result = await pool.query(query, params);

    res.json({
      success: true,
      data: result.rows,
      count: result.rows.length,
      limit: parseInt(limit),
      offset: parseInt(offset),
    });
  } catch (error) {
    console.error("Error fetching packages:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch packages",
      message: error.message,
    });
  }
});

/**
 * POST /api/packages
 * Create a new package
 */
router.post("/", async (req, res) => {
  try {
    const {
      name,
      destination_id,
      price,
      currency,
      itinerary,
      benefits,
      included_services,
      terms_conditions,
      start_date,
      end_date,
    } = req.body;

    if (!name || !destination_id || !price) {
      return res.status(400).json({
        success: false,
        error: "Missing required fields: name, destination_id, price",
      });
    }

    const slug =
      name.toLowerCase().replace(/\s+/g, "-") +
      "-" +
      crypto.randomBytes(4).toString("hex");

    const query = `
      INSERT INTO packages (name, slug, destination_id, price, currency, itinerary, 
                          benefits, included_services, terms_conditions, start_date, end_date)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING *
    `;

    const params = [
      name,
      slug,
      destination_id,
      price,
      currency || "USD",
      itinerary || null,
      benefits || null,
      included_services || null,
      terms_conditions || null,
      start_date || null,
      end_date || null,
    ];

    const result = await pool.query(query, params);

    res.status(201).json({
      success: true,
      data: result.rows[0],
    });
  } catch (error) {
    console.error("Error creating package:", error);
    res.status(500).json({
      success: false,
      error: "Failed to create package",
      message: error.message,
    });
  }
});

/**
 * POST /api/packages/:slug/enquire
 * Create an inquiry for a package
 */
router.post("/:slug/enquire", async (req, res) => {
  try {
    const { slug } = req.params;
    const { email, name, phone, message, travel_dates } = req.body;

    if (!email || !name) {
      return res.status(400).json({
        success: false,
        error: "Missing required fields: email, name",
      });
    }

    const packageQuery = "SELECT id FROM packages WHERE slug = $1";
    const packageResult = await pool.query(packageQuery, [slug]);

    if (!packageResult.rows.length) {
      return res.status(404).json({
        success: false,
        error: "Package not found",
      });
    }

    const package_id = packageResult.rows[0].id;

    const inquiryQuery = `
      INSERT INTO package_enquiries (package_id, email, name, phone, message, travel_dates)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `;

    const params = [
      package_id,
      email,
      name,
      phone || null,
      message || null,
      travel_dates || null,
    ];

    const result = await pool.query(inquiryQuery, params);

    res.status(201).json({
      success: true,
      message: "Enquiry created successfully",
      data: result.rows[0],
    });
  } catch (error) {
    console.error("Error creating enquiry:", error);
    res.status(500).json({
      success: false,
      error: "Failed to create enquiry",
      message: error.message,
    });
  }
});

export default router;
