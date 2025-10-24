/**
 * Authentication Middleware
 * Handles JWT token validation, user creation, and permission checks
 */

const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";

// In-memory user storage (will be replaced with DB later)
const users = new Map();

/**
 * Initialize demo user for testing
 */
async function initializeDemoUser() {
  const existingDemo = getUserByEmail("demo@faredown.com");
  if (!existingDemo) {
    const demoPassword = await hashPassword("password123");
    const demoUser = {
      id: "demo_user_001",
      email: "demo@faredown.com",
      password: demoPassword,
      firstName: "Demo",
      lastName: "User",
      username: "demo_user",
      role: "user",
      isVerified: true,
      createdAt: new Date(),
    };
    users.set(demoUser.id, demoUser);
    console.log("✅ Demo user initialized: demo@faredown.com / password123");
  }
}

// Initialize demo user on module load
initializeDemoUser().catch(err => console.error("Failed to initialize demo user:", err));

/**
 * Generate JWT token
 */
function generateToken(user) {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      role: user.role || "user",
    },
    JWT_SECRET,
    { expiresIn: "7d" },
  );
}

/**
 * Hash password
 */
async function hashPassword(password) {
  return bcrypt.hash(password, 10);
}

/**
 * Compare password
 */
async function comparePassword(password, hash) {
  return bcrypt.compare(password, hash);
}

/**
 * Get user by email
 */
function getUserByEmail(email) {
  for (const [, user] of users) {
    if (user.email === email.toLowerCase()) {
      return user;
    }
  }
  return null;
}

/**
 * Get user by email from database
 */
async function getUserByEmailFromDb(email, db) {
  if (!db) return null;
  try {
    const result = await db.query("SELECT * FROM users WHERE email = $1", [
      email.toLowerCase(),
    ]);
    return result.rows.length > 0 ? result.rows[0] : null;
  } catch (error) {
    console.error("Error getting user from database:", error);
    return null;
  }
}

/**
 * Get user by username
 */
function getUserByUsername(username) {
  for (const [, user] of users) {
    if (user.username === username.toLowerCase()) {
      return user;
    }
  }
  return null;
}

/**
 * Create user
 */
const createUser = async (userData) => {
  const {
    email,
    password,
    firstName,
    lastName,
    username,
    verificationToken,
    verificationExpiresAt,
    verificationSentAt,
  } = userData;

  // Input validation
  if (!email || !password || !firstName || !lastName || !username) {
    throw new Error("Missing required fields");
  }

  const normalizedEmail = email.toLowerCase();
  const hashedPassword = await hashPassword(password);

  const user = {
    id: `user_${Date.now()}`,
    email: normalizedEmail,
    password: hashedPassword,
    firstName,
    lastName,
    username: username.toLowerCase(),
    isActive: true,
    isVerified: false,
    role: "user",
    verificationToken,
    verificationTokenExpiresAt: verificationExpiresAt,
    verificationSentAt: verificationSentAt,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  // Persist to database if connected
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
          true,
          false,
          verificationToken,
          verificationExpiresAt,
          verificationSentAt,
          null,
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
        : verificationExpiresAt;
      user.verificationSentAt = row.verification_sent_at
        ? new Date(row.verification_sent_at)
        : verificationSentAt;
      user.verifiedAt = row.verified_at ? new Date(row.verified_at) : null;
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
};

/**
 * Authenticate token middleware
 */
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({
      error: "Access token required",
    });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({
        error: "Invalid or expired token",
      });
    }
    req.user = user;
    next();
  });
};

/**
 * Require admin permission
 */
const requireAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== "admin") {
    return res.status(403).json({
      error: "Admin access required",
    });
  }
  next();
};

/**
 * Require specific permission (higher-order middleware)
 */
const requirePermission = (permission) => (req, res, next) => {
  if (!req.user || req.user.role !== "admin") {
    return res.status(403).json({
      error: "Access required",
    });
  }
  next();
};

const PERMISSIONS = {
  MANAGE_USERS: "manage:users",
  MANAGE_CONTENT: "manage:content",
  VIEW_ANALYTICS: "view:analytics",
  ADMIN_DASHBOARD: "admin:dashboard",
  ANALYTICS_VIEW: "view:analytics",
  REPORTS_GENERATE: "generate:reports",
  AUDIT_VIEW: "view:audit",
  SYSTEM_CONFIG: "config:system",
  BACKUP_MANAGE: "manage:backup",
  PROMO_VIEW: "view:promo",
  PROMO_MANAGE: "manage:promo",
};

module.exports = {
  generateToken,
  hashPassword,
  comparePassword,
  getUserByEmail,
  getUserByEmailFromDb,
  getUserByUsername,
  createUser,
  authenticateToken,
  requireAdmin,
  requirePermission,
  PERMISSIONS,
  users,
};
