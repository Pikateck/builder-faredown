import express from "express";
/**
 * OAuth Authentication Routes
 * Handles Google, Facebook, and Apple social login
 * Updated for iframe compatibility and proper session management
 */

const session = require("express-session");
const { OAuth2Client } = require("google-auth-library");
const axios = require("axios");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const router = express.Router();

// In-memory state store for OAuth CSRF protection (more reliable than sessions)
const oauthStateStore = new Map(); // state -> { created: timestamp, data: any }

// Clean up expired states every 5 minutes
setInterval(
  () => {
    const now = Date.now();
    const expiredStates = [];

    for (const [state, data] of oauthStateStore.entries()) {
      if (now - data.created > 10 * 60 * 1000) {
        // 10 minutes
        expiredStates.push(state);
      }
    }

    expiredStates.forEach((state) => oauthStateStore.delete(state));
    if (expiredStates.length > 0) {
      console.log(`ðŸ§¹ Cleaned up ${expiredStates.length} expired OAuth states`);
    }
  },
  5 * 60 * 1000,
);

// Helper functions for state management
const storeState = (state) => {
  oauthStateStore.set(state, { created: Date.now() });
  console.log(`ðŸ”µ Stored OAuth state: ${state.substring(0, 8)}...`);
};

const validateAndConsumeState = (state) => {
  const data = oauthStateStore.get(state);
  if (!data) {
    console.log(`ðŸ”´ OAuth state not found: ${state?.substring(0, 8)}...`);
    return false;
  }

  const now = Date.now();
  if (now - data.created > 10 * 60 * 1000) {
    // 10 minutes
    console.log(`ðŸ”´ OAuth state expired: ${state.substring(0, 8)}...`);
    oauthStateStore.delete(state);
    return false;
  }

  oauthStateStore.delete(state);
  console.log(
    `âœ… OAuth state validated and consumed: ${state.substring(0, 8)}...`,
  );
  return true;
};

// OAuth environment validation
const isGoogleConfigured = !!(
  process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
);
const isFacebookConfigured = !!(
  process.env.FACEBOOK_APP_ID && process.env.FACEBOOK_APP_SECRET
);
const isAppleConfigured = !!(
  process.env.APPLE_TEAM_ID &&
  process.env.APPLE_KEY_ID &&
  process.env.APPLE_SERVICE_ID
);

console.log("OAuth Configuration Status:", {
  google: isGoogleConfigured,
  facebook: isFacebookConfigured,
  apple: isAppleConfigured,
});

// OAuth clients setup (only if configured)
let googleClient = null;
if (isGoogleConfigured) {
  const redirectUris = [
    // Builder.io preview environment
    `${process.env.VITE_API_BASE_URL || process.env.API_BASE_URL}/oauth/google/callback`,
    // Production domain
    "https://www.faredowntravels.com/oauth/google/callback",
    // Staging/render environment
    "https://faredown-web.onrender.com/oauth/google/callback",
    // Local development
    "http://localhost:3000/oauth/google/callback",
    "http://localhost:5173/oauth/google/callback",
  ];

  // Use the API redirect URI path
  const redirectUri =
    process.env.GOOGLE_REDIRECT_URI ||
    `${process.env.VITE_API_BASE_URL || process.env.API_BASE_URL}/oauth/google/callback`;

  googleClient = new OAuth2Client(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    redirectUri,
  );
  console.log(
    "âœ… Google OAuth client initialized with redirect URI:",
    redirectUri,
  );
  console.log("ðŸ“‹ Configured redirect URIs should include:", redirectUris);
} else {
  console.log(
    "âš ï¸ Google OAuth not configured - missing GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET",
  );
}

// Helper function to generate JWT token
const generateToken = (user) => {
  return jwt.sign(
    {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
      department: user.department,
    },
    process.env.JWT_SECRET || "fallback-secret-key",
    { expiresIn: process.env.JWT_EXPIRY || "24h" },
  );
};

// Helper function to create or get user
const createOrGetSocialUser = async (profile, provider) => {
  console.log("ðŸ”µ Creating social user with profile:", profile);

  // Check if user already exists by email
  const { getUserByEmail } = require("../middleware/auth");
  let existingUser = getUserByEmail(profile.email);

  if (existingUser) {
    console.log("ðŸ”µ Found existing user:", existingUser.email);
    // Update last login
    existingUser.lastLogin = new Date();
    return existingUser;
  }

  console.log("ðŸ”µ Creating new social user");
  // Create new user with email-based structure
  const user = {
    id: `${provider}_${profile.id}`,
    firstName: profile.given_name || profile.name?.split(" ")[0] || "User",
    lastName:
      profile.family_name || profile.name?.split(" ").slice(1).join(" ") || "",
    email: profile.email,
    password: null, // Social login users don't have passwords
    provider: provider,
    providerId: profile.id,
    role: "user",
    department: null,
    isActive: true,
    lastLogin: new Date(),
    createdAt: new Date(),
  };

  // Store in our mock database using email as key
  const users = require("../middleware/auth").users || new Map();
  users.set(profile.email, user);

  console.log("âœ… Social user created:", { id: user.id, email: user.email });
  return user;
};

/**
 * @api {get} /api/oauth/google/url Get Google OAuth URL
 * @apiName GetGoogleOAuthURL
 * @apiGroup OAuth
 * @apiVersion 1.0.0
 *
 * @apiSuccess {String} url Google OAuth authorization URL
 */
router.get("/google/url", (req, res) => {
  try {
    console.log("ðŸ”µ Generating Google OAuth URL...");

    // Check if Google OAuth is configured
    if (!isGoogleConfigured || !googleClient) {
      console.log("ðŸ”´ Google OAuth not configured");
      return res.status(503).json({
        success: false,
        message:
          "Google OAuth is not configured. Please set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET environment variables.",
        error: "SERVICE_UNAVAILABLE",
      });
    }

    const scopes = [
      "https://www.googleapis.com/auth/userinfo.email",
      "https://www.googleapis.com/auth/userinfo.profile",
    ];

    const state = crypto.randomBytes(16).toString("hex");

    const authUrl = googleClient.generateAuthUrl({
      access_type: "offline",
      scope: scopes,
      state: state,
      include_granted_scopes: true,
    });

    // Store state in our reliable in-memory store
    storeState(state);

    console.log(
      `âœ… Generated Google OAuth URL with state: ${state.substring(0, 8)}...`,
    );

    res.json({
      success: true,
      url: authUrl,
      state: state,
    });
  } catch (error) {
    console.error("ðŸ”´ Google OAuth URL generation error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to generate Google OAuth URL",
    });
  }
});

/**
 * @api {get} /api/oauth/google/callback Handle Google OAuth Callback (GET)
 * @apiName HandleGoogleCallbackGet
 * @apiGroup OAuth
 * @apiVersion 1.0.0
 *
 * @apiParam {String} code Authorization code from Google (query parameter)
 * @apiParam {String} state State parameter for CSRF protection (query parameter)
 *
 * @apiSuccess {String} html HTML bridge page for popup communication
 */
router.get("/google/callback", async (req, res) => {
  try {
    console.log("ðŸ”µ Google OAuth GET callback received");
    console.log("ðŸ”µ Query params:", {
      code: req.query.code?.substring(0, 20) + "...",
      state: req.query.state,
    });

    // Check if Google OAuth is configured
    if (!isGoogleConfigured || !googleClient) {
      console.error("ðŸ”´ Google OAuth not configured");
      return res.status(503).json({
        success: false,
        message: "Google OAuth is not configured",
        error: "SERVICE_UNAVAILABLE",
      });
    }

    const { code, state } = req.query;

    if (!code) {
      console.error("ðŸ”´ Missing authorization code");
      return res.status(400).json({
        success: false,
        message: "Authorization code is required",
      });
    }

    console.log("ðŸ”µ Validating OAuth state:", state?.substring(0, 8) + "...");

    // Verify state for CSRF protection
    if (!state) {
      console.error("ðŸ”´ No state parameter provided");
      return res.status(400).json({
        success: false,
        message: "Missing state parameter. Please try again.",
      });
    }

    if (!validateAndConsumeState(state)) {
      console.error("ðŸ”´ Invalid or expired OAuth state");
      return res.status(400).json({
        success: false,
        message: "OAuth session expired or invalid. Please try again.",
      });
    }

    console.log("ðŸ”µ Exchanging code for tokens...");
    // Exchange code for tokens
    const { tokens } = await googleClient.getToken(code);
    console.log("ðŸ”µ Tokens received:", {
      id_token: !!tokens.id_token,
      access_token: !!tokens.access_token,
    });

    googleClient.setCredentials(tokens);

    console.log("ðŸ”µ Verifying ID token...");
    // Get user info
    const ticket = await googleClient.verifyIdToken({
      idToken: tokens.id_token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    console.log("ðŸ”µ User payload:", {
      sub: payload.sub,
      email: payload.email,
      name: payload.name,
      email_verified: payload.email_verified,
    });

    console.log("ðŸ”µ Creating/getting social user...");
    // Create or get user
    const user = await createOrGetSocialUser(
      {
        id: payload.sub,
        email: payload.email,
        name: payload.name,
        given_name: payload.given_name,
        family_name: payload.family_name,
        picture: payload.picture,
        email_verified: payload.email_verified,
      },
      "google",
    );

    console.log("ðŸ”µ User created/retrieved:", {
      id: user.id,
      email: user.email,
    });

    console.log("ðŸ”µ Generating JWT token...");
    // Generate JWT token
    const token = generateToken(user);

    // Set authentication cookie for session persistence
    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      domain:
        process.env.NODE_ENV === "production"
          ? ".faredowntravels.com"
          : undefined,
    };

    res.cookie("auth_token", token, cookieOptions);

    console.log("âœ… Google OAuth callback successful:", {
      userId: user.id,
      email: user.email,
    });

    // Determine parent origin based on environment
    const parentOrigin =
      process.env.NODE_ENV === "production"
        ? "https://www.faredowntravels.com"
        : "https://55e69d5755db4519a9295a29a1a55930-aaf2790235d34f3ab48afa56a.fly.dev";

    // Render HTML bridge page that communicates with popup opener
    const bridgeHTML = `
<!DOCTYPE html>
<html>
<head>
    <title>Authentication Successful</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            display: flex;
            justify-content: center;
            align-items: center;
            height: 100vh;
            margin: 0;
            background: #f8fafc;
        }
        .container {
            text-align: center;
            padding: 2rem;
            background: white;
            border-radius: 8px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }
        .success {
            color: #10b981;
            font-size: 1.25rem;
            margin-bottom: 1rem;
        }
        .loading {
            color: #6b7280;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="success">âœ“ Authentication Successful</div>
        <div class="loading">Completing sign-in...</div>
    </div>
    <script>
        console.log('ðŸ”µ OAuth bridge page loaded');
        console.log('ðŸ”µ Window opener exists:', !!window.opener);
        console.log('ðŸ”µ Parent origin:', '${parentOrigin}');

        // Send success message to parent window
        if (window.opener) {
            const message = {
                type: 'GOOGLE_AUTH_SUCCESS',
                user: {
                    id: '${user.id}',
                    firstName: '${user.firstName}',
                    lastName: '${user.lastName}',
                    email: '${user.email}',
                    role: '${user.role}',
                    provider: '${user.provider}'
                },
                token: '${token}'
            };

            console.log('ðŸ”µ Sending success message:', message);
            window.opener.postMessage(message, '${parentOrigin}');

            // Also try Builder.io origin if different
            if ('${parentOrigin}' !== 'https://builder.io') {
                window.opener.postMessage(message, 'https://builder.io');
            }

            // Close the popup after a short delay
            setTimeout(() => {
                console.log('ðŸ”µ Closing popup window');
                window.close();
            }, 1000);
        } else {
            console.log('ðŸ”´ No window.opener found');
            // Fallback: redirect to main app
            setTimeout(() => {
                window.location.href = '${parentOrigin}';
            }, 2000);
        }
    </script>
</body>
</html>`;

    res.setHeader("Content-Type", "text/html");
    res.send(bridgeHTML);
  } catch (error) {
    console.error("ðŸ”´ Google OAuth GET callback error:", error);

    // Determine parent origin based on environment
    const parentOrigin =
      process.env.NODE_ENV === "production"
        ? "https://www.faredowntravels.com"
        : "https://55e69d5755db4519a9295a29a1a55930-aaf2790235d34f3ab48afa56a.fly.dev";

    // Render HTML bridge page for error communication
    const errorHTML = `
<!DOCTYPE html>
<html>
<head>
    <title>Authentication Failed</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            display: flex;
            justify-content: center;
            align-items: center;
            height: 100vh;
            margin: 0;
            background: #f8fafc;
        }
        .container {
            text-align: center;
            padding: 2rem;
            background: white;
            border-radius: 8px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }
        .error {
            color: #ef4444;
            font-size: 1.25rem;
            margin-bottom: 1rem;
        }
        .message {
            color: #6b7280;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="error">âœ— Authentication Failed</div>
        <div class="message">Please try again</div>
    </div>
    <script>
        console.log('ðŸ”´ OAuth error bridge page loaded');
        console.log('ðŸ”´ Error:', '${error.message}');

        // Send error message to parent window
        if (window.opener) {
            const message = {
                type: 'GOOGLE_AUTH_ERROR',
                error: 'Google authentication failed. Please try again.'
            };

            console.log('ðŸ”´ Sending error message:', message);
            window.opener.postMessage(message, '${parentOrigin}');

            // Also try Builder.io origin if different
            if ('${parentOrigin}' !== 'https://builder.io') {
                window.opener.postMessage(message, 'https://builder.io');
            }

            // Close the popup after a short delay
            setTimeout(() => {
                window.close();
            }, 3000);
        } else {
            // Fallback: redirect to main app with error
            setTimeout(() => {
                window.location.href = '${parentOrigin}?error=oauth_failed';
            }, 3000);
        }
    </script>
</body>
</html>`;

    res.setHeader("Content-Type", "text/html");
    res.send(errorHTML);
  }
});

/**
 * @api {post} /api/oauth/google/callback Handle Google OAuth Callback (POST - Legacy)
 * @apiName HandleGoogleCallback
 * @apiGroup OAuth
 * @apiVersion 1.0.0
 *
 * @apiParam {String} code Authorization code from Google
 * @apiParam {String} state State parameter for CSRF protection
 *
 * @apiSuccess {Boolean} success Authentication success status
 * @apiSuccess {String} token JWT access token
 * @apiSuccess {Object} user User information
 */
router.post("/google/callback", async (req, res) => {
  try {
    console.log("ðŸ”µ Google OAuth callback received");
    console.log("ðŸ”µ Request body:", {
      code: req.body.code?.substring(0, 20) + "...",
      state: req.body.state,
    });

    // Check if Google OAuth is configured
    if (!isGoogleConfigured || !googleClient) {
      console.error("ðŸ”´ Google OAuth not configured");
      return res.status(503).json({
        success: false,
        message: "Google OAuth is not configured",
        error: "SERVICE_UNAVAILABLE",
      });
    }

    const { code, state } = req.body;

    if (!code) {
      console.error("ðŸ”´ Missing authorization code");
      return res.status(400).json({
        success: false,
        message: "Authorization code is required",
      });
    }

    console.log("ðŸ”µ Validating OAuth state:", state?.substring(0, 8) + "...");

    // Verify state for CSRF protection
    if (!state) {
      console.error("ðŸ”´ No state parameter provided");
      return res.status(400).json({
        success: false,
        message: "Missing state parameter. Please try again.",
      });
    }

    if (!validateAndConsumeState(state)) {
      console.error("ðŸ”´ Invalid or expired OAuth state");
      return res.status(400).json({
        success: false,
        message: "OAuth session expired or invalid. Please try again.",
      });
    }

    console.log("ðŸ”µ Exchanging code for tokens...");
    // Exchange code for tokens
    const { tokens } = await googleClient.getToken(code);
    console.log("ðŸ”µ Tokens received:", {
      id_token: !!tokens.id_token,
      access_token: !!tokens.access_token,
    });

    googleClient.setCredentials(tokens);

    console.log("ðŸ”µ Verifying ID token...");
    // Get user info
    const ticket = await googleClient.verifyIdToken({
      idToken: tokens.id_token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    console.log("ðŸ”µ User payload:", {
      sub: payload.sub,
      email: payload.email,
      name: payload.name,
      email_verified: payload.email_verified,
    });

    console.log("ðŸ”µ Creating/getting social user...");
    // Create or get user
    const user = await createOrGetSocialUser(
      {
        id: payload.sub,
        email: payload.email,
        name: payload.name,
        given_name: payload.given_name,
        family_name: payload.family_name,
        picture: payload.picture,
        email_verified: payload.email_verified,
      },
      "google",
    );

    console.log("ðŸ”µ User created/retrieved:", {
      id: user.id,
      email: user.email,
    });

    console.log("ðŸ”µ Generating JWT token...");
    // Generate JWT token
    const token = generateToken(user);

    // Set authentication cookie for session persistence
    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      domain:
        process.env.NODE_ENV === "production"
          ? ".faredowntravels.com"
          : undefined,
    };

    res.cookie("auth_token", token, cookieOptions);

    console.log("âœ… Google OAuth callback successful:", {
      userId: user.id,
      email: user.email,
    });

    // Determine parent origin based on environment
    const parentOrigin =
      process.env.NODE_ENV === "production"
        ? "https://www.faredowntravels.com"
        : "https://55e69d5755db4519a9295a29a1a55930-aaf2790235d34f3ab48afa56a.fly.dev";

    // Render HTML bridge page that communicates with popup opener
    const bridgeHTML = `
<!DOCTYPE html>
<html>
<head>
    <title>Authentication Successful</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            display: flex;
            justify-content: center;
            align-items: center;
            height: 100vh;
            margin: 0;
            background: #f8fafc;
        }
        .container {
            text-align: center;
            padding: 2rem;
            background: white;
            border-radius: 8px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }
        .success {
            color: #10b981;
            font-size: 1.25rem;
            margin-bottom: 1rem;
        }
        .loading {
            color: #6b7280;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="success">âœ“ Authentication Successful</div>
        <div class="loading">Completing sign-in...</div>
    </div>
    <script>
        console.log('ðŸ”µ OAuth bridge page loaded');
        console.log('ðŸ”µ Window opener exists:', !!window.opener);
        console.log('ðŸ”µ Parent origin:', '${parentOrigin}');

        // Send success message to parent window
        if (window.opener) {
            const message = {
                type: 'GOOGLE_AUTH_SUCCESS',
                user: {
                    id: '${user.id}',
                    firstName: '${user.firstName}',
                    lastName: '${user.lastName}',
                    email: '${user.email}',
                    role: '${user.role}',
                    provider: '${user.provider}'
                },
                token: '${token}'
            };

            console.log('ðŸ”µ Sending success message:', message);
            window.opener.postMessage(message, '${parentOrigin}');

            // Also try Builder.io origin if different
            if ('${parentOrigin}' !== 'https://builder.io') {
                window.opener.postMessage(message, 'https://builder.io');
            }

            // Close the popup after a short delay
            setTimeout(() => {
                console.log('ðŸ”µ Closing popup window');
                window.close();
            }, 1000);
        } else {
            console.log('ðŸ”´ No window.opener found');
            // Fallback: redirect to main app
            setTimeout(() => {
                window.location.href = '${parentOrigin}';
            }, 2000);
        }
    </script>
</body>
</html>`;

    res.setHeader("Content-Type", "text/html");
    res.send(bridgeHTML);
  } catch (error) {
    console.error("ðŸ”´ Google OAuth callback error:", error);

    // Determine parent origin based on environment
    const parentOrigin =
      process.env.NODE_ENV === "production"
        ? "https://www.faredowntravels.com"
        : "https://55e69d5755db4519a9295a29a1a55930-aaf2790235d34f3ab48afa56a.fly.dev";

    // Render HTML bridge page for error communication
    const errorHTML = `
<!DOCTYPE html>
<html>
<head>
    <title>Authentication Failed</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            display: flex;
            justify-content: center;
            align-items: center;
            height: 100vh;
            margin: 0;
            background: #f8fafc;
        }
        .container {
            text-align: center;
            padding: 2rem;
            background: white;
            border-radius: 8px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }
        .error {
            color: #ef4444;
            font-size: 1.25rem;
            margin-bottom: 1rem;
        }
        .message {
            color: #6b7280;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="error">âœ— Authentication Failed</div>
        <div class="message">Please try again</div>
    </div>
    <script>
        console.log('ðŸ”´ OAuth error bridge page loaded');
        console.log('ðŸ”´ Error:', '${error.message}');

        // Send error message to parent window
        if (window.opener) {
            const message = {
                type: 'GOOGLE_AUTH_ERROR',
                error: 'Google authentication failed. Please try again.'
            };

            console.log('ðŸ”´ Sending error message:', message);
            window.opener.postMessage(message, '${parentOrigin}');

            // Also try Builder.io origin if different
            if ('${parentOrigin}' !== 'https://builder.io') {
                window.opener.postMessage(message, 'https://builder.io');
            }

            // Close the popup after a short delay
            setTimeout(() => {
                window.close();
            }, 3000);
        } else {
            // Fallback: redirect to main app with error
            setTimeout(() => {
                window.location.href = '${parentOrigin}?error=oauth_failed';
            }, 3000);
        }
    </script>
</body>
</html>`;

    res.setHeader("Content-Type", "text/html");
    res.send(errorHTML);
  }
});

/**
 * @api {get} /api/oauth/facebook/url Get Facebook OAuth URL
 * @apiName GetFacebookOAuthURL
 * @apiGroup OAuth
 * @apiVersion 1.0.0
 *
 * @apiSuccess {String} url Facebook OAuth authorization URL
 */
router.get("/facebook/url", (req, res) => {
  try {
    // Check if Facebook OAuth is configured
    if (!isFacebookConfigured) {
      return res.status(503).json({
        success: false,
        message:
          "Facebook OAuth is not configured. Please set FACEBOOK_APP_ID and FACEBOOK_APP_SECRET environment variables.",
        error: "SERVICE_UNAVAILABLE",
      });
    }

    const baseUrl = "https://www.facebook.com/v18.0/dialog/oauth";
    const redirectUri =
      process.env.FACEBOOK_REDIRECT_URI ||
      `${process.env.API_BASE_URL}/oauth/facebook/callback`;
    const state = crypto.randomBytes(16).toString("hex");

    const params = new URLSearchParams({
      client_id: process.env.FACEBOOK_APP_ID,
      redirect_uri: redirectUri,
      state: state,
      scope: "email,public_profile",
      response_type: "code",
    });

    const authUrl = `${baseUrl}?${params.toString()}`;

    // Store state in session for validation
    req.session = req.session || {};
    req.session.oauthState = state;

    res.json({
      success: true,
      url: authUrl,
      state: state,
    });
  } catch (error) {
    console.error("Facebook OAuth URL generation error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to generate Facebook OAuth URL",
    });
  }
});

/**
 * @api {post} /api/oauth/facebook/callback Handle Facebook OAuth Callback
 * @apiName HandleFacebookCallback
 * @apiGroup OAuth
 * @apiVersion 1.0.0
 *
 * @apiParam {String} code Authorization code from Facebook
 * @apiParam {String} state State parameter for CSRF protection
 *
 * @apiSuccess {Boolean} success Authentication success status
 * @apiSuccess {String} token JWT access token
 * @apiSuccess {Object} user User information
 */
router.post("/facebook/callback", async (req, res) => {
  try {
    // Check if Facebook OAuth is configured
    if (!isFacebookConfigured) {
      return res.status(503).json({
        success: false,
        message: "Facebook OAuth is not configured",
        error: "SERVICE_UNAVAILABLE",
      });
    }

    const { code, state } = req.body;

    if (!code) {
      return res.status(400).json({
        success: false,
        message: "Authorization code is required",
      });
    }

    // Verify state for CSRF protection
    if (req.session?.oauthState && req.session.oauthState !== state) {
      return res.status(400).json({
        success: false,
        message: "Invalid state parameter",
      });
    }

    const redirectUri =
      process.env.FACEBOOK_REDIRECT_URI ||
      `${process.env.API_BASE_URL}/auth/facebook/callback`;

    // Exchange code for access token
    const tokenResponse = await axios.get(
      "https://graph.facebook.com/v18.0/oauth/access_token",
      {
        params: {
          client_id: process.env.FACEBOOK_APP_ID,
          client_secret: process.env.FACEBOOK_APP_SECRET,
          code: code,
          redirect_uri: redirectUri,
        },
      },
    );

    const accessToken = tokenResponse.data.access_token;

    // Get user profile
    const profileResponse = await axios.get(
      "https://graph.facebook.com/v18.0/me",
      {
        params: {
          access_token: accessToken,
          fields: "id,name,email,first_name,last_name,picture",
        },
      },
    );

    const profile = profileResponse.data;

    // Create or get user
    const user = await createOrGetSocialUser(
      {
        id: profile.id,
        email: profile.email,
        name: profile.name,
        given_name: profile.first_name,
        family_name: profile.last_name,
        picture: profile.picture?.data?.url,
      },
      "facebook",
    );

    // Generate JWT token
    const token = generateToken(user);

    res.json({
      success: true,
      message: "Facebook authentication successful",
      token: token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        provider: user.provider,
      },
    });
  } catch (error) {
    console.error("Facebook OAuth callback error:", error);
    res.status(500).json({
      success: false,
      message: "Facebook authentication failed",
    });
  }
});

/**
 * @api {get} /api/oauth/apple/url Get Apple OAuth URL
 * @apiName GetAppleOAuthURL
 * @apiGroup OAuth
 * @apiVersion 1.0.0
 *
 * @apiSuccess {String} url Apple OAuth authorization URL
 */
router.get("/apple/url", (req, res) => {
  try {
    // Check if Apple OAuth is configured
    if (!isAppleConfigured) {
      return res.status(503).json({
        success: false,
        message:
          "Apple OAuth is not configured. Please set APPLE_TEAM_ID, APPLE_KEY_ID, and APPLE_SERVICE_ID environment variables.",
        error: "SERVICE_UNAVAILABLE",
      });
    }

    const baseUrl = "https://appleid.apple.com/auth/authorize";
    const redirectUri =
      process.env.APPLE_REDIRECT_URI ||
      `${process.env.API_BASE_URL}/oauth/apple/callback`;
    const state = crypto.randomBytes(16).toString("hex");

    const params = new URLSearchParams({
      client_id: process.env.APPLE_SERVICE_ID,
      redirect_uri: redirectUri,
      state: state,
      scope: "name email",
      response_type: "code",
      response_mode: "form_post",
    });

    const authUrl = `${baseUrl}?${params.toString()}`;

    // Store state in session for validation
    req.session = req.session || {};
    req.session.oauthState = state;

    res.json({
      success: true,
      url: authUrl,
      state: state,
    });
  } catch (error) {
    console.error("Apple OAuth URL generation error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to generate Apple OAuth URL",
    });
  }
});

/**
 * @api {post} /api/oauth/apple/callback Handle Apple OAuth Callback
 * @apiName HandleAppleCallback
 * @apiGroup OAuth
 * @apiVersion 1.0.0
 *
 * @apiParam {String} code Authorization code from Apple
 * @apiParam {String} state State parameter for CSRF protection
 * @apiParam {String} [user] User data (only sent on first authorization)
 *
 * @apiSuccess {Boolean} success Authentication success status
 * @apiSuccess {String} token JWT access token
 * @apiSuccess {Object} user User information
 */
router.post("/apple/callback", async (req, res) => {
  try {
    // Check if Apple OAuth is configured
    if (!isAppleConfigured) {
      return res.status(503).json({
        success: false,
        message: "Apple OAuth is not configured",
        error: "SERVICE_UNAVAILABLE",
      });
    }

    const { code, state, user: userData } = req.body;

    if (!code) {
      return res.status(400).json({
        success: false,
        message: "Authorization code is required",
      });
    }

    // Verify state for CSRF protection
    if (req.session?.oauthState && req.session.oauthState !== state) {
      return res.status(400).json({
        success: false,
        message: "Invalid state parameter",
      });
    }

    // Generate client secret for Apple (JWT)
    const clientSecret = generateAppleClientSecret();

    // Exchange code for tokens
    const tokenResponse = await axios.post(
      "https://appleid.apple.com/auth/token",
      new URLSearchParams({
        client_id: process.env.APPLE_SERVICE_ID,
        client_secret: clientSecret,
        code: code,
        grant_type: "authorization_code",
        redirect_uri:
          process.env.APPLE_REDIRECT_URI ||
          `${process.env.API_BASE_URL}/auth/apple/callback`,
      }),
      {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
      },
    );

    const { id_token } = tokenResponse.data;

    // Decode the ID token to get user info
    const payload = jwt.decode(id_token);

    // Parse user data if provided (first-time authorization)
    let userInfo = {};
    if (userData) {
      const parsedUserData =
        typeof userData === "string" ? JSON.parse(userData) : userData;
      userInfo = {
        name: parsedUserData.name
          ? `${parsedUserData.name.firstName} ${parsedUserData.name.lastName}`
          : "",
        given_name: parsedUserData.name?.firstName || "",
        family_name: parsedUserData.name?.lastName || "",
      };
    }

    // Create or get user
    const user = await createOrGetSocialUser(
      {
        id: payload.sub,
        email: payload.email,
        name: userInfo.name || payload.email?.split("@")[0] || "Apple User",
        given_name: userInfo.given_name,
        family_name: userInfo.family_name,
        email_verified: payload.email_verified,
      },
      "apple",
    );

    // Generate JWT token
    const token = generateToken(user);

    res.json({
      success: true,
      message: "Apple authentication successful",
      token: token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        provider: user.provider,
      },
    });
  } catch (error) {
    console.error("Apple OAuth callback error:", error);
    res.status(500).json({
      success: false,
      message: "Apple authentication failed",
    });
  }
});

// Helper function to generate Apple client secret
function generateAppleClientSecret() {
  const header = {
    alg: "ES256",
    kid: process.env.APPLE_KEY_ID,
  };

  const payload = {
    iss: process.env.APPLE_TEAM_ID,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 6 * 30 * 24 * 60 * 60, // 6 months
    aud: "https://appleid.apple.com",
    sub: process.env.APPLE_SERVICE_ID,
  };

  // In a real implementation, you would use the Apple private key to sign this JWT
  // For now, we'll return a placeholder
  return jwt.sign(payload, process.env.APPLE_PRIVATE_KEY || "placeholder", {
    algorithm: "ES256",
    header: header,
  });
}
export default router;