const express = require("express");
const crypto = require("crypto");
const {
  generateToken,
  comparePassword,
  getUserByEmail,
  getUserByEmailFromDb,
  getUserByUsername,
  createUser,
  authenticateToken,
  PERMISSIONS,
} = require("../middleware/auth");

const { validate } = require("../middleware/validation");

/**
 * Authentication Routes
 * Handles user login, registration, and token management
 */

const router = express.Router();

// Database will be injected if available
let db = null;
const setDb = (database) => {
  db = database;
};

/**
 * POST /api/auth/register
 * Register a new user
 */
router.post("/register", validate.register, async (req, res) => {
  try {
    const { email, password, firstName, lastName, username } = req.body;

    const existingUser =
      getUserByEmail(email.toLowerCase()) ||
      getUserByUsername(username.toLowerCase());

    if (existingUser) {
      console.log("🔴 User already exists:", email);
      return res.status(409).json({
        success: false,
        message: "An account with this email already exists",
      });
    }

    console.log("🔵 Creating new user...");

    const verificationToken = crypto.randomBytes(32).toString("hex");
    const verificationExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
    const verificationSentAt = new Date();

    const user = await createUser({
      email,
      password,
      firstName,
      lastName,
      username,
      verificationToken,
      verificationExpiresAt,
      verificationSentAt,
    });

    const token = generateToken(user);

    res.status(201).json({
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          username: user.username,
          isVerified: user.isVerified,
        },
        token,
      },
    });
  } catch (error) {
    console.error("🔴 Registration error:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

/**
 * POST /api/auth/login
 * Login user
 */
router.post("/login", validate.login, async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = getUserByEmail(email.toLowerCase());

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    const isPasswordValid = await comparePassword(password, user.password);

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    const token = generateToken(user);

    res.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        username: user.username,
      },
      token,
    });
  } catch (error) {
    console.error("🔴 Login error:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

/**
 * GET /api/auth/verify-email
 * Verify email address
 */
router.get("/verify-email", async (req, res) => {
  try {
    const { token } = req.query;

    if (!token) {
      return res.status(400).json({
        success: false,
        message: "Verification token is required",
      });
    }

    // Find user with this token
    let user = null;
    const allUsers = require("../middleware/auth").users || new Map();

    for (const [, u] of allUsers) {
      if (u.verificationToken === token) {
        user = u;
        break;
      }
    }

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Invalid or expired token",
      });
    }

    if (new Date() > new Date(user.verificationTokenExpiresAt)) {
      return res.status(400).json({
        success: false,
        message: "Verification token has expired",
      });
    }

    user.isVerified = true;
    user.verificationToken = null;
    user.verificationTokenExpiresAt = null;
    user.verifiedAt = new Date();

    res.json({
      success: true,
      message: "Email verified successfully",
    });
  } catch (error) {
    console.error("🔴 Email verification error:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

/**
 * GET /api/auth/me
 * Get current user (protected route)
 */
router.get("/me", authenticateToken, (req, res) => {
  res.json({
    success: true,
    data: req.user,
  });
});

module.exports = router;
