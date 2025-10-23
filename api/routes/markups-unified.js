const express = require("express");
const { Pool } = require("pg");

const router = express.Router();
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

const EXPORT_COLUMNS = [
  "id",
  "name",
  "supplier",
  "route_code",
  "origin_airport",
  "destination_airport",
  "market",
  "passenger_type",
  "cabin_class",
  "airline_code",
  "base_markup_percent",
  "base_markup_amount",
  "min_markup",
  "max_markup",
  "created_at",
];

router.get("/list", async (req, res) => {
  try {
    const query = `
      SELECT id, name, supplier, route_code, origin_airport, destination_airport, 
             market, passenger_type, cabin_class, airline_code, 
             base_markup_percent, base_markup_amount, min_markup, max_markup, created_at
      FROM unified_markups
      ORDER BY created_at DESC
      LIMIT 100
    `;

    const result = await pool.query(query);

    res.json({
      success: true,
      data: result.rows,
      count: result.rows.length,
    });
  } catch (error) {
    console.error("Error fetching markups:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch markups",
      message: error.message,
    });
  }
});

router.get("/export", async (req, res) => {
  try {
    const query = `
      SELECT ${EXPORT_COLUMNS.join(", ")}
      FROM unified_markups
      ORDER BY created_at DESC
    `;

    const result = await pool.query(query);

    // Set CSV headers
    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader("Content-Disposition", "attachment; filename=markups.csv");

    // Create CSV content
    const headers = EXPORT_COLUMNS.join(",");
    const rows = result.rows.map((row) =>
      EXPORT_COLUMNS.map((col) => {
        const value = row[col];
        // Escape quotes and wrap in quotes if contains comma
        if (value === null || value === undefined) return "";
        return String(value).includes(",")
          ? `"${String(value).replace(/"/g, '""')}"`
          : value;
      }).join(","),
    );

    res.send([headers, ...rows].join("\n"));
  } catch (error) {
    console.error("Error exporting markups:", error);
    res.status(500).json({
      success: false,
      error: "Failed to export markups",
      message: error.message,
    });
  }
});

module.exports = router;
