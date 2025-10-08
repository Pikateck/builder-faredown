/**
 * Authentication Routes
 * Handles user login, registration, and token management
 */

const express = require("express");
const crypto = require("crypto");
const router = express.Router();
const {
  generateToken,
  comparePassword,
  getUserByEmail,
  getUserByEmailFromDb,
  getUserByUsername,
  createUser,
  authenticateToken,
  users,
} = require("../middleware/auth");
const { validate } = require("../middleware/validation");
const { audit } = require("../middleware/audit");
const db = require("../database/connection");
const emailService = require("../services/emailService");

/**
 * @api {post} /api/auth/login User Login
 * @apiName LoginUser
 * @apiGroup Authentication
 * @apiVersion 1.0.0
 *
 * @apiParam {String} email User's email address
 * @apiParam {String} password User's password
 * @apiParam {String} [department] User's department
 *
 * @apiSuccess {Boolean} success Login success status
 * @apiSuccess {String} message Success message
 * @apiSuccess {String} token JWT access token
 * @apiSuccess {Object} user User information
 * @apiSuccess {String} user.id User ID
 * @apiSuccess {String} user.firstName First name
 * @apiSuccess {String} user.lastName Last name
 * @apiSuccess {String} user.email Email address
 * @apiSuccess {String} user.role User role
 * @apiSuccess {String} user.department User department
 * @apiSuccess {Array} user.permissions User permissions
 *
 * @apiError {Boolean} success=false Login failed
 * @apiError {String} message Error message
 */
router.post("/login", validate.login, async (req, res) => {
  try {
    const { email, username, password, department } = req.body;

    // Support both email and username for backward compatibility
    const loginIdentifier = email || username;

    // Get user from database - try email first, then username
    let user = getUserByEmail(loginIdentifier);
    if (!user) {
      user = await getUserByEmailFromDb(loginIdentifier);
    }

    if (!user && username) {
      user = getUserByUsername(username);
      if (!user) {
        user = await getUserByEmailFromDb(username);
      }
    }

    if (!user) {
      await audit.login(req, { email: loginIdentifier }, false);
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    // Check if user is active
    if (!user.isActive) {
      await audit.login(req, user, false);
      return res.status(401).json({
        success: false,
        message: "Account is deactivated",
      });
    }

    // Verify password
    const isPasswordValid = await comparePassword(password, user.password);

    if (!isPasswordValid) {
      await audit.login(req, user, false);
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    // Department check for admin users
    if (department && user.department !== department) {
      await audit.login(req, user, false);
      return res.status(401).json({
        success: false,
        message: "Invalid department",
      });
    }

    // Update last login
    user.lastLogin = new Date();

    // Generate JWT token
    const token = generateToken(user);

    // Log successful login
    await audit.login(req, user, true);

    // Return success response
    res.json({
      success: true,
      message: "Login successful",
      token,
      user: {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
        department: user.department,
        permissions: user.permissions || [],
        lastLogin: user.lastLogin,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error during login",
    });
  }
});

/**
 * @api {post} /api/auth/register User Registration
 * @apiName RegisterUser
 * @apiGroup Authentication
 * @apiVersion 1.0.0
 *
 * @apiParam {String} email Email address (used as identifier)
 * @apiParam {String} password Password (min 8 characters)
 * @apiParam {String} firstName First name
 * @apiParam {String} lastName Last name
 * @apiParam {String} [role=user] User role
 *
 * @apiSuccess {Boolean} success Registration success status
 * @apiSuccess {String} message Success message
 * @apiSuccess {Object} user Created user information
 *
 * @apiError {Boolean} success=false Registration failed
 * @apiError {String} message Error message
 */
router.post("/register", validate.register, async (req, res) => {
  try {
    console.log("🔵 Registration request received");
    console.log("🔵 Request body:", {
      email: req.body.email,
      firstName: req.body.firstName,
      lastName: req.body.lastName,
      role: req.body.role,
      passwordLength: req.body.password?.length,
    });

    const { email, password, firstName, lastName, role } = req.body;

    console.log("🔵 Checking if user already exists...");
    // Check if user already exists
    let existingUser = getUserByEmail(email);
    if (!existingUser) {
      existingUser = await getUserByEmailFromDb(email);
    }

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

    const newUser = await createUser({
      email,
      password,
      firstName,
      lastName,
      role: role || "user",
      isActive: false,
      isVerified: false,
      verificationToken,
      verificationTokenExpiresAt: verificationExpiresAt,
      verificationSentAt,
    });

    console.log("🔵 User created successfully:", {
      id: newUser.id,
      email: newUser.email,
    });

    try {
      await emailService.sendEmailVerification(
        email,
        verificationToken,
        firstName || "there",
      );
    } catch (emailError) {
      console.error("⚠️ Verification email failed:", emailError.message);
    }

    // Log user creation
    try {
      await audit.userAction(req, "create", newUser);
    } catch (auditError) {
      console.log("⚠️ Audit logging failed:", auditError.message);
      // Don't fail the registration if audit fails
    }

    const {
      password: _,
      verificationToken: __,
      verificationTokenExpiresAt: ___,
      ...userResponse
    } = newUser;

    console.log("✅ Registration completed successfully");
    res.status(201).json({
      success: true,
      message:
        "Account created. Please verify your email to activate your account.",
      user: {
        ...userResponse,
        status: "pending_verification",
      },
    });
  } catch (error) {
    console.error("🔴 Registration error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error during registration",
      error: error.message,
    });
  }
});

router.get("/verify-email", async (req, res) => {
  const { token } = req.query;

  if (!token || typeof token !== "string") {
    return res.status(400).send({
      success: false,
      message: "Verification token is required",
    });
  }

  try {
    const result = await db.query(
      `UPDATE users
         SET is_verified = true,
             is_active = true,
             verified_at = NOW(),
             verification_token = NULL,
             verification_token_expires_at = NULL
       WHERE verification_token = $1
         AND (verification_token_expires_at IS NULL OR verification_token_expires_at > NOW())
       RETURNING id, email, first_name, last_name`,
      [token],
    );

    if (result.rows.length === 0) {
      const errorMessage = "Invalid or expired verification link";
      if (req.accepts("html")) {
        return res
          .status(400)
          .send(
            `<html><body><h2>${errorMessage}</h2><p>Please request a new verification email.</p></body></html>`,
          );
      }

      return res.status(400).json({
        success: false,
        message: errorMessage,
      });
    }

    const user = result.rows[0];
    const successMessage = "Email verified successfully. You can now log in.";

    if (users && typeof users.delete === "function") {
      users.delete((user.email || "").trim().toLowerCase());
    }

    if (req.accepts("html")) {
      const redirectUrl =
        process.env.APP_PUBLIC_URL ||
        process.env.OAUTH_REDIRECT_BASE ||
        "https://55e69d5755db4519a9295a29a1a55930-aaf2790235d34f3ab48afa56a.fly.dev";
      return res.send(`
        <html>
          <body style="font-family: Arial, sans-serif; max-width: 480px; margin: 40px auto; text-align: center;">
            <h2>🎉 Email Verified</h2>
            <p>${successMessage}</p>
            <a href="${redirectUrl}" style="display:inline-block;padding:10px 16px;background:#003580;color:#fff;border-radius:6px;text-decoration:none;margin-top:20px;">Go to Faredown</a>
          </body>
        </html>
      `);
    }

    return res.json({
      success: true,
      message: successMessage,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
      },
    });
  } catch (error) {
    console.error("🔴 Email verification error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to verify email",
    });
  }
});

/**
 * @api {post} /api/auth/logout User Logout
 * @apiName LogoutUser
 * @apiGroup Authentication
 * @apiVersion 1.0.0
 *
 * @apiHeader {String} Authorization Bearer token
 *
 * @apiSuccess {Boolean} success Logout success status
 * @apiSuccess {String} message Success message
 */
router.post("/logout", authenticateToken, async (req, res) => {
  try {
    // Log logout
    await audit.logout(req);

    // In a real implementation, you might want to blacklist the token
    // For now, we just return success
    res.json({
      success: true,
      message: "Logout successful",
    });
  } catch (error) {
    console.error("Logout error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error during logout",
    });
  }
});

/**
 * @api {get} /api/auth/me Get Current User
 * @apiName GetCurrentUser
 * @apiGroup Authentication
 * @apiVersion 1.0.0
 *
 * @apiHeader {String} Authorization Bearer token
 *
 * @apiSuccess {Boolean} success Request success status
 * @apiSuccess {Object} user Current user information
 */
router.get("/me", authenticateToken, async (req, res) => {
  try {
    const user = req.user;

    res.json({
      success: true,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        department: user.department,
        permissions: user.permissions || [],
      },
    });
  } catch (error) {
    console.error("Get user error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
});

/**
 * @api {post} /api/auth/refresh Refresh Token
 * @apiName RefreshToken
 * @apiGroup Authentication
 * @apiVersion 1.0.0
 *
 * @apiHeader {String} Authorization Bearer token
 *
 * @apiSuccess {Boolean} success Request success status
 * @apiSuccess {String} token New JWT token
 */
router.post("/refresh", authenticateToken, async (req, res) => {
  try {
    const user = req.user;

    // Get full user data
    const fullUser = getUserByUsername(user.username);

    if (!fullUser || !fullUser.isActive) {
      return res.status(401).json({
        success: false,
        message: "User not found or inactive",
      });
    }

    // Generate new token
    const token = generateToken(fullUser);

    res.json({
      success: true,
      token,
      message: "Token refreshed successfully",
    });
  } catch (error) {
    console.error("Token refresh error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error during token refresh",
    });
  }
});

/**
 * @api {post} /api/auth/forgot-password Forgot Password
 * @apiName ForgotPassword
 * @apiGroup Authentication
 * @apiVersion 1.0.0
 *
 * @apiParam {String} email User's email address
 *
 * @apiSuccess {Boolean} success Request success status
 * @apiSuccess {String} message Success message
 *
 * @apiError {Boolean} success=false Request failed
 * @apiError {String} message Error message
 */
router.post("/forgot-password", async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email address is required",
      });
    }

    // Check if user exists
    const user = getUserByEmail(email);

    if (!user) {
      // For security, don't reveal if email exists or not
      return res.json({
        success: true,
        message:
          "If an account with this email exists, a password reset link has been sent.",
      });
    }

    // Generate password reset token (in real implementation, save this to database)
    const resetToken = require("crypto").randomBytes(32).toString("hex");
    const resetTokenExpiry = new Date(Date.now() + 3600000); // 1 hour from now

    // In a real implementation, you would:
    // 1. Save the reset token and expiry to the database
    // 2. Send email with reset link

    // For now, we'll simulate sending an email
    console.log(`Password reset requested for: ${email}`);
    console.log(`Reset token: ${resetToken}`);
    console.log(
      `Reset link: ${process.env.API_BASE_URL || "http://localhost:3001"}/reset-password?token=${resetToken}`,
    );

    // Simulate email service
    const { sendPasswordResetEmail } = require("../services/emailService");
    try {
      await sendPasswordResetEmail(email, resetToken, user.firstName);
    } catch (emailError) {
      console.error("Failed to send password reset email:", emailError);
      // Don't reveal email sending failure to user for security
    }

    res.json({
      success: true,
      message:
        "If an account with this email exists, a password reset link has been sent.",
    });
  } catch (error) {
    console.error("Forgot password error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
});

/**
 * @api {post} /api/auth/change-password Change Password
 * @apiName ChangePassword
 * @apiGroup Authentication
 * @apiVersion 1.0.0
 *
 * @apiHeader {String} Authorization Bearer token
 * @apiParam {String} currentPassword Current password
 * @apiParam {String} newPassword New password
 *
 * @apiSuccess {Boolean} success Password change success status
 * @apiSuccess {String} message Success message
 */
router.post("/change-password", authenticateToken, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = req.user;

    // Validation
    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: "Current password and new password are required",
      });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({
        success: false,
        message: "New password must be at least 8 characters long",
      });
    }

    // Get full user data
    const fullUser = getUserByUsername(user.username);

    if (!fullUser) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Verify current password
    const isCurrentPasswordValid = await comparePassword(
      currentPassword,
      fullUser.password,
    );

    if (!isCurrentPasswordValid) {
      return res.status(401).json({
        success: false,
        message: "Current password is incorrect",
      });
    }

    // Hash new password
    const { hashPassword } = require("../middleware/auth");
    const hashedNewPassword = await hashPassword(newPassword);

    // Update password
    fullUser.password = hashedNewPassword;
    fullUser.passwordChangedAt = new Date();

    // Log password change
    await audit.userAction(req, "update", fullUser, { passwordChanged: true });

    res.json({
      success: true,
      message: "Password changed successfully",
    });
  } catch (error) {
    console.error("Change password error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error during password change",
    });
  }
});

/**
 * @api {get} /api/auth/permissions Get User Permissions
 * @apiName GetUserPermissions
 * @apiGroup Authentication
 * @apiVersion 1.0.0
 *
 * @apiHeader {String} Authorization Bearer token
 *
 * @apiSuccess {Boolean} success Request success status
 * @apiSuccess {Array} permissions User permissions list
 * @apiSuccess {String} role User role
 */
router.get("/permissions", authenticateToken, async (req, res) => {
  try {
    const user = req.user;

    res.json({
      success: true,
      permissions: user.permissions || [],
      role: user.role,
    });
  } catch (error) {
    console.error("Get permissions error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
});

module.exports = router;
