/**
 * Admin Users Verification Endpoint
 * For evidence collection - verifies users table population
 */

const express = require("express");
const router = express.Router();
const db = require("../database/connection");
const fs = require("fs").promises;
const path = require("path");

/**
 * GET /api/admin/users/verify
 * Returns users table data for evidence collection
 */
router.get("/verify", async (req, res) => {
  try {
    // Get total count
    const countResult = await db.query("SELECT COUNT(*) as total FROM users");
    const totalUsers = countResult.rows[0].total;

    // Get recent users
    const usersResult = await db.query(`
      SELECT id, email, first_name, last_name, is_active, created_at, updated_at
      FROM users 
      ORDER BY created_at DESC 
      LIMIT 20
    `);

    // Prepare CSV data for evidence
    const csvHeader = "id,email,first_name,last_name,is_active,created_at,updated_at\\n";
    const csvRows = usersResult.rows
      .map(
        (user) =>
          `${user.id},"${user.email}","${user.first_name}","${user.last_name}",${user.is_active},"${user.created_at}","${user.updated_at}"`,
      )
      .join("\\n");
    const csvContent = csvHeader + csvRows;

    // Save CSV to audits folder
    const auditDir = path.join(__dirname, "../..", "audits", "2025-10-08");
    try {
      await fs.mkdir(auditDir, { recursive: true });
      await fs.writeFile(
        path.join(auditDir, "01_users_last3.csv"),
        csvContent,
      );
      console.log("✅ Users CSV saved to audits/2025-10-08/01_users_last3.csv");
    } catch (writeError) {
      console.error("⚠️ Failed to save CSV:", writeError.message);
    }

    res.json({
      success: true,
      data: {
        totalUsers,
        recentUsers: usersResult.rows,
        csvExport: csvContent,
        evidencePath: "audits/2025-10-08/01_users_last3.csv",
      },
      message: `Found ${totalUsers} users in database`,
    });
  } catch (error) {
    console.error("❌ Error verifying users table:", error);
    res.status(500).json({
      success: false,
      error: error.message,
      message: "Failed to verify users table",
    });
  }
});

/**
 * GET /api/admin/users/schema
 * Returns users table schema for verification
 */
router.get("/schema", async (req, res) => {
  try {
    const schemaResult = await db.query(`
      SELECT 
        column_name, 
        data_type, 
        is_nullable, 
        column_default
      FROM information_schema.columns
      WHERE table_name = 'users'
      ORDER BY ordinal_position
    `);

    res.json({
      success: true,
      schema: schemaResult.rows,
    });
  } catch (error) {
    console.error("❌ Error fetching users schema:", error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

module.exports = router;
