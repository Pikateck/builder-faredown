﻿import express from "express";

const crypto = require("crypto");
const { Pool } = require("pg");
const { v4: uuidv4 } = require("uuid");

const router = express.Router();

// Use existing database connection
const pool = require("../database/connection");

// Middleware to identify user/device
function identifyUser(req, res, next) {
  // Check if user is authenticated (assuming auth middleware sets req.user)
  if (req.user && req.user.id) {
    req.identity = { type: "user", id: req.user.id };
    return next();
  }

  // Handle guest users with device_id cookie
  // Parse cookies manually if req.cookies is not available
  let deviceId = null;

  if (req.cookies && req.cookies.fd_device_id) {
    deviceId = req.cookies.fd_device_id;
  } else if (req.headers.cookie) {
    // Manual cookie parsing as fallback
    const cookies = req.headers.cookie.split(";");
    for (let cookie of cookies) {
      const [name, value] = cookie.trim().split("=");
      if (name === "fd_device_id") {
        deviceId = value;
        break;
      }
    }
  }

  if (!deviceId) {
    deviceId = uuidv4();
    res.cookie("fd_device_id", deviceId, {
      httpOnly: true,
      sameSite: "lax",
      maxAge: 365 * 24 * 60 * 60 * 1000, // 1 year
      secure: process.env.NODE_ENV === "production",
    });
  }

  req.identity = { type: "device", id: deviceId };
  next();
}

// Helper function to create query hash for deduplication
function createQueryHash(module, query) {
  // Sort keys for consistent hashing
  const sortedKeys = Object.keys(query).sort();
  const canonical = {};
  sortedKeys.forEach((key) => {
    canonical[key] = query[key];
  });

  const canonicalString = `${module}:${JSON.stringify(canonical)}`;
  return crypto.createHash("sha256").update(canonicalString).digest("hex");
}

// POST /api/recent-searches - Create a new recent search entry
router.post("/", identifyUser, async (req, res) => {
  try {
    const { module, query } = req.body;

    // Validation
    if (!module || !query) {
      return res.status(400).json({
        error: "module and query are required",
      });
    }

    const validModules = [
      "flights",
      "hotels",
      "flight_hotel",
      "cars",
      "activities",
      "taxis",
      "sightseeing",
      "transfers",
    ];
    if (!validModules.includes(module)) {
      return res.status(400).json({
        error: `module must be one of: ${validModules.join(", ")}`,
      });
    }

    const queryHash = createQueryHash(module, query);

    const insertQuery = `
      INSERT INTO recent_searches (user_id, device_id, module, query_hash, query)
      VALUES ($1, $2, $3, $4, $5)
      ON CONFLICT (COALESCE(user_id::text, device_id), query_hash) 
      DO UPDATE SET 
        updated_at = NOW(),
        query = EXCLUDED.query
      RETURNING id, created_at, updated_at;
    `;

    const values = [
      req.identity.type === "user" ? req.identity.id : null,
      req.identity.type === "device" ? req.identity.id : null,
      module,
      queryHash,
      query,
    ];

    const result = await pool.query(insertQuery, values);

    if (result.rows.length === 0) {
      // Fetch existing record if insert was ignored
      const existingQuery = `
        SELECT id, created_at, updated_at 
        FROM recent_searches 
        WHERE COALESCE(user_id::text, device_id) = $1 AND query_hash = $2
      `;
      const existingValues = [req.identity.id, queryHash];
      const existing = await pool.query(existingQuery, existingValues);

      return res.status(200).json(existing.rows[0]);
    }

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error("Error creating recent search:", error);
    res.status(500).json({
      error: "Internal server error",
      details:
        process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
});

// GET /api/recent-searches - Get recent searches for user/device
router.get("/", identifyUser, async (req, res) => {
  try {
    const { module, limit = 6 } = req.query;

    if (!module) {
      return res.status(400).json({ error: "module parameter is required" });
    }

    const validModules = [
      "flights",
      "hotels",
      "flight_hotel",
      "cars",
      "activities",
      "taxis",
      "sightseeing",
      "transfers",
    ];
    if (!validModules.includes(module)) {
      return res.status(400).json({
        error: `module must be one of: ${validModules.join(", ")}`,
      });
    }

    const maxLimit = Math.min(parseInt(limit), 20); // Cap at 20

    const selectQuery = `
      SELECT id, module, query, created_at, updated_at
      FROM recent_searches
      WHERE COALESCE(user_id::text, device_id) = $1 AND module = $2
      ORDER BY updated_at DESC, created_at DESC
      LIMIT $3;
    `;

    const values = [req.identity.id, module, maxLimit];
    const result = await pool.query(selectQuery, values);

    res.json(result.rows);
  } catch (error) {
    console.error("Error fetching recent searches:", error);
    res.status(500).json({
      error: "Internal server error",
      details:
        process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
});

// DELETE /api/recent-searches/:id - Delete a specific recent search
router.delete("/:id", identifyUser, async (req, res) => {
  try {
    const { id } = req.params;

    if (!id || isNaN(parseInt(id))) {
      return res.status(400).json({ error: "Valid ID is required" });
    }

    // Ensure user can only delete their own searches
    const deleteQuery = `
      DELETE FROM recent_searches 
      WHERE id = $1 AND COALESCE(user_id::text, device_id) = $2
      RETURNING id;
    `;

    const values = [parseInt(id), req.identity.id];
    const result = await pool.query(deleteQuery, values);

    if (result.rows.length === 0) {
      return res
        .status(404)
        .json({ error: "Recent search not found or unauthorized" });
    }

    res.status(204).send();
  } catch (error) {
    console.error("Error deleting recent search:", error);
    res.status(500).json({
      error: "Internal server error",
      details:
        process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
});

// GET /api/recent-searches/all - Get all recent searches (for admin/debugging)
router.get("/all", identifyUser, async (req, res) => {
  try {
    // Only allow in development or for admin users
    if (
      process.env.NODE_ENV !== "development" &&
      (!req.user || !req.user.isAdmin)
    ) {
      return res.status(403).json({ error: "Forbidden" });
    }

    const { limit = 50 } = req.query;
    const maxLimit = Math.min(parseInt(limit), 100);

    const selectQuery = `
      SELECT id, user_id, device_id, module, query, created_at, updated_at
      FROM recent_searches
      ORDER BY created_at DESC
      LIMIT $1;
    `;

    const result = await pool.query(selectQuery, [maxLimit]);
    res.json(result.rows);
  } catch (error) {
    console.error("Error fetching all recent searches:", error);
    res.status(500).json({
      error: "Internal server error",
      details:
        process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
});
export default router;