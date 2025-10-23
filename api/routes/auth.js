import express from "express";
/**
 * Authentication Routes
 * Handles user login, registration, and token management
 */

const router = express.Router();
const {
  generateToken,
  comparePassword,
  getUserByEmail,
  getUserByUsername,
  createUser,
  authenticateToken,
} = require("../middleware/auth");
const { validate } = require("../middleware/validation");
const { audit } = require("../middleware/audit");

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
    if (!user && username) {
      user = getUserByUsername(username);
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
    console.log("ðŸ”µ Registration request received");
    console.log("ðŸ”µ Request body:", {
      email: req.body.email,
      firstName: req.body.firstName,
      lastName: req.body.lastName,
      role: req.body.role,
      passwordLength: req.body.password?.length,
    });

    const { email, password, firstName, lastName, role } = req.body;

    console.log("ðŸ”µ Checking if user already exists...");
    // Check if user already exists
    const existingUser = getUserByEmail(email);

    if (existingUser) {
      console.log("ðŸ”´ User already exists:", email);
      return res.status(409).json({
        success: false,
        message: "An account with this email already exists",
      });
    }

    console.log("ðŸ”µ Creating new user...");
    // Create new user
    const newUser = await createUser({
      email,
      password,
      firstName,
      lastName,
      role: role || "user",
    });

    console.log("ðŸ”µ User created successfully:", {
      id: newUser.id,
      email: newUser.email,
    });

    // Log user creation
    try {
      await audit.userAction(req, "create", newUser);
    } catch (auditError) {
      console.log("âš ï¸ Audit logging failed:", auditError.message);
      // Don't fail the registration if audit fails
    }

    // Return success response (without password)
    const { password: _, ...userResponse } = newUser;

    console.log("âœ… Registration completed successfully");
    res.status(201).json({
      success: true,
      message: "User registered successfully",
      user: userResponse,
    });
  } catch (error) {
    console.error("ðŸ”´ Registration error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error during registration",
      error: error.message,
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
export default router;