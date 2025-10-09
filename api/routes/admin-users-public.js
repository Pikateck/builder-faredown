"use strict";

const express = require("express");
const router = express.Router();
const dbConn = require("../database/connection");

function mapStatus(row) {
  if (row.is_verified !== true) {
    return "pending";
  }
  return row.is_active === false ? "inactive" : "active";
}

function mapUser(row) {
  return {
    id: String(row.id),
    title: row.title || "",
    firstName: row.first_name || "",
    lastName: row.last_name || "",
    email: row.email,
    phone: row.phone || "",
    address: row.address || "",
    dateOfBirth: row.date_of_birth || "",
    countryCode: row.country_code || "",
    role: row.role || "user",
    status: row.status || mapStatus(row),
    lastLogin: row.last_login || null,
    createdAt: row.created_at,
    permissions: [],
    isVerified: row.is_verified === true,
    isActive: row.is_active !== false,
    verifiedAt: row.verified_at || null,
  };
}

router.get("/", async (req, res) => {
  const search =
    typeof req.query.search === "string" ? req.query.search.trim() : "";
  const status =
    typeof req.query.status === "string" ? req.query.status.trim() : "";
  const role = typeof req.query.role === "string" ? req.query.role.trim() : "";
  const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
  const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 10, 1), 100);
  const offset = (page - 1) * limit;

  const conditions = [];
  const params = [];
  let paramIndex = 1;

  if (search) {
    params.push(`%${search.toLowerCase()}%`);
    conditions.push(
      `(LOWER(u.email) LIKE $${paramIndex} OR LOWER(u.first_name) LIKE $${paramIndex} OR LOWER(u.last_name) LIKE $${paramIndex})`,
    );
    paramIndex += 1;
  }

  if (role && role !== "all") {
    params.push(role.toLowerCase());
    conditions.push(`LOWER(u.role) = $${paramIndex}`);
    paramIndex += 1;
  }

  if (status && status !== "all") {
    if (status === "pending") {
      conditions.push(`(v.status = 'pending')`);
    } else if (status === "active") {
      conditions.push(`(v.status = 'active')`);
    } else if (status === "inactive") {
      conditions.push(`(v.status = 'inactive')`);
    }
  }

  const whereClause = conditions.length
    ? `WHERE ${conditions.join(" AND ")}`
    : "";

  try {
    const countResult = await dbConn.query(
      `SELECT COUNT(*) AS total
         FROM public.admin_users_v v
         JOIN users u ON u.id = v.id
         ${whereClause}`,
      params,
    );
    const total = parseInt(countResult.rows[0].total, 10) || 0;

    const dataParams = [...params, limit, offset];
    const dataResult = await dbConn.query(
      `SELECT
          u.id,
          u.email,
          u.first_name,
          u.last_name,
          u.phone,
          NULL::text AS address,
          NULL::text AS date_of_birth,
          u.nationality_iso2 AS country_code,
          'user'::text AS role,
          v.is_active,
          v.is_verified,
          v.status,
          v.created_at,
          u.updated_at,
          NULL::timestamp AS last_login,
          u.verification_token,
          u.verification_token_expires_at,
          u.verification_sent_at,
          v.verified_at
       FROM public.admin_users_v v
       JOIN users u ON u.id = v.id
       ${whereClause}
       ORDER BY v.created_at DESC
       LIMIT $${paramIndex}
       OFFSET $${paramIndex + 1}`,
      dataParams,
    );

    const users = dataResult.rows.map(mapUser);
    const totalPages = Math.max(Math.ceil(total / limit), 1);

    res.json({
      success: true,
      users,
      total,
      page,
      totalPages,
      limit,
    });
  } catch (error) {
    console.error("Failed to load admin users", error);
    res.status(500).json({
      success: false,
      message: "Failed to load users",
    });
  }
});

module.exports = router;
