const express = require("express");

const router = express.Router();

// Simple database validation endpoint
router.get("/ai-tables-check", async (req, res) => {
  try {
    // Use the existing database connection from your app
    const { Pool } = require("pg");
    const pool = new Pool({
      connectionString: process.env.DATABASE_URL,
    });

    // Check if AI schema exists
    const schemaCheck = await pool.query(`
      SELECT schema_name 
      FROM information_schema.schemata 
      WHERE schema_name = 'ai'
    `);

    // Count AI tables
    const tableCount = await pool.query(`
      SELECT COUNT(*) as table_count 
      FROM information_schema.tables 
      WHERE table_schema = 'ai'
    `);

    const result = {
      ai_schema_exists: schemaCheck.rows.length > 0,
      ai_table_count: parseInt(tableCount.rows[0]?.table_count || 0),
    };

    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
