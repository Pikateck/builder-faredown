/**
 * Authentication and Authorization Middleware
 * JWT-based authentication for Faredown API
 */

const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const db = require("../database/connection");

const JWT_SECRET = process.env.JWT_SECRET || "faredown-secret-key-2025";
const ADMIN_JWT_SECRET =
  process.env.ADMIN_JWT_SECRET || "your-super-secret-admin-jwt-key";
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "7d";

// Helpers
const normalizeEmail = (email) => (email || "").trim().toLowerCase();

// User roles and permissions
const ROLES = {
  SUPER_ADMIN: "super_admin",
  ADMIN: "admin",
  SALES_MANAGER: "sales_manager",
  SUPPORT: "support",
  ACCOUNTS: "accounts",
  MARKETING: "marketing",
  USER: "user",
};

const PERMISSIONS = {
  // User Management
  USER_VIEW: "user.view",
  USER_CREATE: "user.create",
  USER_UPDATE: "user.update",
  USER_DELETE: "user.delete",

  // Booking Management
  BOOKING_VIEW: "booking.view",
  BOOKING_CREATE: "booking.create",
  BOOKING_UPDATE: "booking.update",
  BOOKING_DELETE: "booking.delete",
  BOOKING_CANCEL: "booking.cancel",

  // Financial Management
  FINANCE_VIEW: "finance.view",
  FINANCE_MANAGE: "finance.manage",
  PAYMENT_PROCESS: "payment.process",
  REFUND_PROCESS: "refund.process",

  // Admin Dashboard
  ADMIN_DASHBOARD: "admin.dashboard",
  ANALYTICS_VIEW: "analytics.view",
  REPORTS_GENERATE: "reports.generate",

  // Content Management
  CMS_VIEW: "cms.view",
  CMS_EDIT: "cms.edit",
  CMS_PUBLISH: "cms.publish",

  // Promo Code Management
  PROMO_VIEW: "promo.view",
  PROMO_CREATE: "promo.create",
  PROMO_UPDATE: "promo.update",
  PROMO_DELETE: "promo.delete",
  PROMO_MANAGE: "promo.manage",

  // System Management
  SYSTEM_CONFIG: "system.config",
  AUDIT_VIEW: "audit.view",
  BACKUP_MANAGE: "backup.manage",
};

// Role-Permission mapping
const ROLE_PERMISSIONS = {
  [ROLES.SUPER_ADMIN]: Object.values(PERMISSIONS),
  [ROLES.ADMIN]: [
    PERMISSIONS.USER_VIEW,
    PERMISSIONS.USER_CREATE,
    PERMISSIONS.USER_UPDATE,
    PERMISSIONS.BOOKING_VIEW,
    PERMISSIONS.BOOKING_CREATE,
    PERMISSIONS.BOOKING_UPDATE,
    PERMISSIONS.BOOKING_CANCEL,
    PERMISSIONS.FINANCE_VIEW,
    PERMISSIONS.PAYMENT_PROCESS,
    PERMISSIONS.ADMIN_DASHBOARD,
    PERMISSIONS.ANALYTICS_VIEW,
    PERMISSIONS.REPORTS_GENERATE,
    PERMISSIONS.CMS_VIEW,
    PERMISSIONS.CMS_EDIT,
    PERMISSIONS.PROMO_VIEW,
    PERMISSIONS.PROMO_MANAGE,
    PERMISSIONS.AUDIT_VIEW,
  ],
  [ROLES.SALES_MANAGER]: [
    PERMISSIONS.USER_VIEW,
    PERMISSIONS.USER_CREATE,
    PERMISSIONS.BOOKING_VIEW,
    PERMISSIONS.BOOKING_CREATE,
    PERMISSIONS.BOOKING_UPDATE,
    PERMISSIONS.ANALYTICS_VIEW,
    PERMISSIONS.REPORTS_GENERATE,
    PERMISSIONS.CMS_VIEW,
  ],
  [ROLES.SUPPORT]: [
    PERMISSIONS.USER_VIEW,
    PERMISSIONS.USER_UPDATE,
    PERMISSIONS.BOOKING_VIEW,
    PERMISSIONS.BOOKING_UPDATE,
    PERMISSIONS.BOOKING_CANCEL,
    PERMISSIONS.CMS_VIEW,
  ],
  [ROLES.ACCOUNTS]: [
    PERMISSIONS.FINANCE_VIEW,
    PERMISSIONS.FINANCE_MANAGE,
    PERMISSIONS.PAYMENT_PROCESS,
    PERMISSIONS.REFUND_PROCESS,
    PERMISSIONS.BOOKING_VIEW,
    PERMISSIONS.ANALYTICS_VIEW,
    PERMISSIONS.REPORTS_GENERATE,
  ],
  [ROLES.MARKETING]: [
    PERMISSIONS.CMS_VIEW,
    PERMISSIONS.CMS_EDIT,
    PERMISSIONS.CMS_PUBLISH,
    PERMISSIONS.ANALYTICS_VIEW,
    PERMISSIONS.REPORTS_GENERATE,
    PERMISSIONS.PROMO_VIEW,
    PERMISSIONS.PROMO_CREATE,
    PERMISSIONS.PROMO_UPDATE,
    PERMISSIONS.USER_VIEW,
  ],
  [ROLES.USER]: [],
};

// Mock user database (replace with real database) - using email as key
const users = new Map([
  [
    normalizeEmail("admin@faredown.com"),
    {
      id: "admin",
      firstName: "Admin",
      lastName: "User",
      email: "admin@faredown.com",
      username: "admin",
      password: "$2a$10$XAg3Py7PSaQT9dNQSnHsSeTUAFG8LSnUL7wwsynrEjb3RtHW/LNxy", // admin123
      role: ROLES.SUPER_ADMIN,
      department: "administration",
      isActive: true,
      createdAt: new Date(),
      lastLogin: null,
    },
  ],
  [
    normalizeEmail("sales@faredown.com"),
    {
      id: "sales",
      firstName: "Sales",
      lastName: "Manager",
      email: "sales@faredown.com",
      username: "sales",
      password: "$2a$10$PZO9iIFIvocJ.dy75dAOFOM5zCWMrOUxonwJIbl5OWx4tL63E4iQO", // sales123
      role: ROLES.SALES_MANAGER,
      department: "sales",
      isActive: true,
      createdAt: new Date(),
      lastLogin: null,
    },
  ],
  [
    normalizeEmail("support@faredown.com"),
    {
      id: "support",
      firstName: "Support",
      lastName: "Team",
      email: "support@faredown.com",
      username: "support",
      password: "$2a$10$pTmy3aIFrM9lSqVvKws5W.97O7gKaphG4DrwVxbgtAmMGtFSz.Vau", // support123
      role: ROLES.SUPPORT,
      department: "customer_support",
      isActive: true,
      createdAt: new Date(),
      lastLogin: null,
    },
  ],
  [
    normalizeEmail("demo@faredown.com"),
    {
      id: "demo",
      firstName: "Demo",
      lastName: "User",
      email: "demo@faredown.com",
      username: "demo",
      password: "$2a$10$ZP3Jid1zvRV405GeJTm9C.7g2MjJ2ikoaPMQBvy7mQ8S8yjWduo2G", // password123
      role: ROLES.USER,
      department: null,
      isActive: true,
      createdAt: new Date(),
      lastLogin: null,
    },
  ],
]);

/**
 * Generate JWT token
 */
const generateToken = (user) => {
  const payload = {
    id: user.id,
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
    role: user.role,
    department: user.department,
    permissions: ROLE_PERMISSIONS[user.role] || [],
  };

  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN,
    issuer: "faredown-api",
    audience: "faredown-frontend",
  });
};

/**
 * Verify JWT token
 */
const verifyToken = (token = "") => {
  // Allow mock tokens in development/demo mode
  const isMockEnvironment =
    process.env.NODE_ENV !== "production" ||
    process.env.ENABLE_MOCK_DATA === "true";

  if (isMockEnvironment) {
    if (
      token.startsWith("mock-token-") ||
      token.startsWith("mock-admin-token")
    ) {
      console.log(
        "⚠️ Admin mock token detected - bypassing JWT verification (dev mode)",
      );
      return {
        id: "mock-admin-1",
        username: "admin",
        email: "admin@faredown.com",
        firstName: "Demo",
        lastName: "Admin",
        role: "super_admin",
        department: "Management",
        permissions: Object.values(PERMISSIONS),
      };
    }

    if (token.startsWith("mock-user-token-")) {
      console.log(
        "⚠️ General mock token detected - granting elevated access for dev mode",
      );
      return {
        id: "mock-admin-2",
        username: "admin",
        email: "admin@faredown.com",
        firstName: "Demo",
        lastName: "Admin",
        role: "super_admin",
        department: "Management",
        permissions: Object.values(PERMISSIONS),
      };
    }
  }

  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (primaryError) {
    // Attempt verification with admin-specific secret (used by TypeScript admin server)
    if (ADMIN_JWT_SECRET && ADMIN_JWT_SECRET !== JWT_SECRET) {
      try {
        return jwt.verify(token, ADMIN_JWT_SECRET);
      } catch (adminError) {
        // fall through to throw below
      }
    }

    throw new Error("Invalid token");
  }
};

/**
 * Hash password
 */
const hashPassword = async (password) => {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
};

/**
 * Compare password
 */
const comparePassword = async (password, hashedPassword) => {
  return bcrypt.compare(password, hashedPassword);
};

/**
 * Authentication middleware
 */
const getAdminApiKey = () => (process.env.ADMIN_API_KEY || "").trim();

const authenticateToken = (req, res, next) => {
  const adminKey = (req.get("x-admin-key") || req.query.admin_key || "").trim();
  const configuredKey = getAdminApiKey();

  if (configuredKey && adminKey && adminKey === configuredKey) {
    req.user = {
      id: "admin-api-key",
      username: "admin-api",
      email: "admin-api@faredown.com",
      role: ROLES.SUPER_ADMIN,
      permissions: Object.values(PERMISSIONS),
    };
    req.adminAccess = {
      ...(req.adminAccess || {}),
      viaKey: true,
    };
    return next();
  }

  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({
      error: "Access denied",
      message: "No token provided",
    });
  }

  try {
    const decoded = verifyToken(token);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(403).json({
      error: "Invalid token",
      message: "Token is not valid",
    });
  }
};

/**
 * Admin role requirement middleware
 */
const requireAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      error: "Authentication required",
      message: "Please login first",
    });
  }

  const adminRoles = [
    ROLES.SUPER_ADMIN,
    ROLES.ADMIN,
    ROLES.SALES_MANAGER,
    ROLES.SUPPORT,
    ROLES.ACCOUNTS,
    ROLES.MARKETING,
    "super_admin", // Support string format from mock tokens
    "admin",
    "sales_manager",
  ];

  if (!adminRoles.includes(req.user.role)) {
    console.warn("⚠️ User role not in admin roles:", req.user.role);
    return res.status(403).json({
      error: "Access denied",
      message: "Admin privileges required",
    });
  }

  next();
};

/**
 * Permission-based authorization middleware
 */
const requirePermission = (permission) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        error: "Authentication required",
        message: "Please login first",
      });
    }

    const userPermissions = req.user.permissions || [];

    if (!userPermissions.includes(permission)) {
      return res.status(403).json({
        error: "Insufficient permissions",
        message: `Permission '${permission}' required`,
      });
    }

    next();
  };
};

/**
 * Role-based authorization middleware
 */
const requireRole = (roles) => {
  const allowedRoles = Array.isArray(roles) ? roles : [roles];

  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        error: "Authentication required",
        message: "Please login first",
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        error: "Access denied",
        message: `Role '${allowedRoles.join(" or ")}' required`,
      });
    }

    next();
  };
};

/**
 * Get user by email (cache)
 */
const getUserByEmail = (email) => {
  if (!email) return null;
  return users.get(normalizeEmail(email));
};

/**
 * Load user from database and cache it
 */
const getUserByEmailFromDb = async (email) => {
  if (!email) return null;

  const normalizedEmail = normalizeEmail(email);
  const cached = users.get(normalizedEmail);
  if (cached) return cached;

  if (!db || !db.isConnected) {
    return null;
  }

  try {
    const result = await db.query(
      `SELECT id, email, first_name, last_name, password_hash, is_active, is_verified,
              verification_token, verification_token_expires_at, verification_sent_at, verified_at,
              created_at, updated_at
       FROM users
       WHERE lower(email) = $1
       LIMIT 1`,
      [normalizedEmail],
    );

    if (result.rows.length === 0) {
      return null;
    }

    const row = result.rows[0];
    const hydratedUser = {
      id: row.id ? String(row.id) : `${normalizedEmail}_${Date.now()}`,
      firstName: row.first_name || "",
      lastName: row.last_name || "",
      email: row.email || normalizedEmail,
      password: row.password_hash,
      role: ROLES.USER,
      department: null,
      isActive: row.is_active !== false,
      isVerified: row.is_verified === true,
      verificationToken: row.verification_token || null,
      verificationTokenExpiresAt: row.verification_token_expires_at
        ? new Date(row.verification_token_expires_at)
        : null,
      verificationSentAt: row.verification_sent_at
        ? new Date(row.verification_sent_at)
        : null,
      verifiedAt: row.verified_at ? new Date(row.verified_at) : null,
      createdAt: row.created_at ? new Date(row.created_at) : new Date(),
      updatedAt: row.updated_at ? new Date(row.updated_at) : null,
      lastLogin: null,
    };

    users.set(normalizedEmail, hydratedUser);
    return hydratedUser;
  } catch (error) {
    console.error("🔴 Failed to load user from database:", error);
    return null;
  }
};

/**
 * Get user by username (legacy support)
 */
const getUserByUsername = (username) => {
  // For backward compatibility, try to find by email if username looks like email
  if (!username) return null;
  if (username.includes("@")) {
    return users.get(normalizeEmail(username));
  }

  // Otherwise search by username in user data
  for (const user of users.values()) {
    if (user.username === username) return user;
  }
  return null;
};

/**
 * Get user by ID
 */
const getUserById = (id) => {
  for (const user of users.values()) {
    if (user.id === id) return user;
  }
  return null;
};

/**
 * Create new user
 */
const createUser = async (userData) => {
  console.log("🔵 Creating user with data:", userData);

  const normalizedEmail = normalizeEmail(userData.email);

  try {
    const hashedPassword = await hashPassword(userData.password);
    console.log("🔵 Password hashed successfully");

    const isActive =
      typeof userData.isActive === "boolean" ? userData.isActive : false;
    const isVerified =
      typeof userData.isVerified === "boolean" ? userData.isVerified : false;
    const verificationToken = userData.verificationToken || null;
    const verificationTokenExpiresAt =
      userData.verificationTokenExpiresAt || null;
    const verificationSentAt =
      userData.verificationSentAt || (verificationToken ? new Date() : null);
    const verifiedAt = userData.verifiedAt || (isVerified ? new Date() : null);

    const user = {
      id: `${normalizedEmail.split("@")[0]}_${Date.now()}`,
      firstName: userData.firstName,
      lastName: userData.lastName,
      email: normalizedEmail,
      password: hashedPassword,
      role: userData.role || ROLES.USER,
      department: userData.department || null,
      isActive,
      isVerified,
      verificationToken,
      verificationTokenExpiresAt,
      verificationSentAt,
      verifiedAt,
      createdAt: new Date(),
      updatedAt: new Date(),
      lastLogin: null,
    };

    console.log("🔵 User object created:", {
      id: user.id,
      email: user.email,
      role: user.role,
      isActive: user.isActive,
      isVerified: user.isVerified,
    });

    if (db && db.isConnected) {
      try {
        const result = await db.query(
          `INSERT INTO users (
             email,
             first_name,
             last_name,
             password_hash,
             is_active,
             is_verified,
             verification_token,
             verification_token_expires_at,
             verification_sent_at,
             verified_at
           )
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
           ON CONFLICT (email) DO NOTHING
           RETURNING id, email, first_name, last_name, password_hash, is_active, is_verified,
                     verification_token, verification_token_expires_at, verification_sent_at, verified_at,
                     created_at, updated_at`,
          [
            normalizedEmail,
            user.firstName,
            user.lastName,
            hashedPassword,
            isActive,
            isVerified,
            verificationToken,
            verificationTokenExpiresAt,
            verificationSentAt,
            verifiedAt,
          ],
        );

        if (result.rows.length === 0) {
          throw new Error("User already exists");
        }

        const row = result.rows[0];
        user.id = row.id ? String(row.id) : user.id;
        user.email = row.email || normalizedEmail;
        user.firstName = row.first_name || user.firstName;
        user.lastName = row.last_name || user.lastName;
        user.isActive = row.is_active !== false;
        user.isVerified = row.is_verified === true;
        user.verificationToken = row.verification_token || verificationToken;
        user.verificationTokenExpiresAt = row.verification_token_expires_at
          ? new Date(row.verification_token_expires_at)
          : verificationTokenExpiresAt;
        user.verificationSentAt = row.verification_sent_at
          ? new Date(row.verification_sent_at)
          : verificationSentAt;
        user.verifiedAt = row.verified_at
          ? new Date(row.verified_at)
          : verifiedAt;
        user.createdAt = row.created_at
          ? new Date(row.created_at)
          : user.createdAt;
        user.updatedAt = row.updated_at
          ? new Date(row.updated_at)
          : user.updatedAt;
      } catch (dbError) {
        console.error("🔴 Error persisting user to database:", dbError);
        if (dbError.message && dbError.message.includes("already exists")) {
          throw dbError;
        }
      }
    }

    users.set(normalizedEmail, user);
    console.log("🔵 User stored in auth cache, total users:", users.size);

    return user;
  } catch (error) {
    console.error("🔴 Error creating user:", error);
    throw error;
  }
};

module.exports = {
  ROLES,
  PERMISSIONS,
  ROLE_PERMISSIONS,
  generateToken,
  verifyToken,
  hashPassword,
  comparePassword,
  authenticateToken,
  requireAdmin,
  requirePermission,
  requireRole,
  getUserByEmail,
  getUserByEmailFromDb,
  getUserByUsername, // Legacy support
  getUserById,
  createUser,
  users, // Export for debugging
};
