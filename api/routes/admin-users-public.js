const db = require("../database/connection");

function getAdminKey() {
  return process.env.ADMIN_API_KEY || "admin123";
}

function validateAdminKey(req, res) {
  const adminKey = req.headers["x-admin-key"] || req.query.admin_key;
  if (!adminKey || adminKey !== getAdminKey()) {
    res.status(401).json({
      success: false,
      message: "Invalid or missing admin key",
    });
    return false;
  }
  return true;
}

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
    status: mapStatus(row),
    lastLogin: row.last_login || null,
    createdAt: row.created_at,
    permissions: [],
    isVerified: row.is_verified === true,
    isActive: row.is_active !== false,
    verifiedAt: row.verified_at || null,
  };
}

async function listUsers(req, res) {
  if (!validateAdminKey(req, res)) {
    return;
  }

  const search = typeof req.query.search === "string" ? req.query.search.trim() : "";
  const status = typeof req.query.status === "string" ? req.query.status.trim() : "";
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
      `(LOWER(email) LIKE $${paramIndex} OR LOWER(first_name) LIKE $${paramIndex} OR LOWER(last_name) LIKE $${paramIndex})`,
    );
    paramIndex += 1;
  }

  if (role && role !== "all") {
    params.push(role.toLowerCase());
    conditions.push(`LOWER(role) = $${paramIndex}`);
    paramIndex += 1;
  }

  if (status && status !== "all") {
    if (status === "pending") {
      conditions.push(`(is_verified IS DISTINCT FROM TRUE)`);
    } else if (status === "active") {
      conditions.push(`(is_verified = TRUE AND (is_active IS DISTINCT FROM FALSE))`);
    } else if (status === "inactive") {
      conditions.push(`(is_active = FALSE)`);
    }
  }

  const whereClause = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";

  try {
    const countResult = await db.query(
      `SELECT COUNT(*) AS total FROM users ${whereClause}`,
      params,
    );
    const total = parseInt(countResult.rows[0].total, 10) || 0;

    const dataParams = [...params, limit, offset];
    const dataResult = await db.query(
      `SELECT
          id,
          email,
          first_name,
          last_name,
          phone,
          NULL::text AS address,
          NULL::text AS date_of_birth,
          nationality_iso2 AS country_code,
          COALESCE(role, 'user') AS role,
          is_active,
          is_verified,
          created_at,
          updated_at,
          NULL::timestamp AS last_login,
          verification_token,
          verification_token_expires_at,
          verification_sent_at,
          verified_at
       FROM users
       ${whereClause}
       ORDER BY created_at DESC
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
    console.error("🔴 Failed to load admin users:", error);
    res.status(500).json({
      success: false,
      message: "Failed to load users",
    });
  }
}

module.exports = {
  listUsers,
};
