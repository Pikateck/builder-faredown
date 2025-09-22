/**
 * OAuth Authentication Routes
 * Handles Google, Facebook, and Apple social login
 */

const express = require("express");
const { OAuth2Client } = require("google-auth-library");
const axios = require("axios");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const router = express.Router();

// OAuth environment validation
const isGoogleConfigured = !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);
const isFacebookConfigured = !!(process.env.FACEBOOK_APP_ID && process.env.FACEBOOK_APP_SECRET);
const isAppleConfigured = !!(process.env.APPLE_TEAM_ID && process.env.APPLE_KEY_ID && process.env.APPLE_SERVICE_ID);

console.log("OAuth Configuration Status:", {
  google: isGoogleConfigured,
  facebook: isFacebookConfigured,
  apple: isAppleConfigured
});

// OAuth clients setup (only if configured)
let googleClient = null;
if (isGoogleConfigured) {
  googleClient = new OAuth2Client(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI || `${process.env.API_BASE_URL}/oauth/google/callback`
  );
  console.log("✅ Google OAuth client initialized");
} else {
  console.log("⚠️ Google OAuth not configured - missing GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET");
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
    { expiresIn: process.env.JWT_EXPIRY || "24h" }
  );
};

// Helper function to create or get user
const createOrGetSocialUser = async (profile, provider) => {
  // In a real implementation, this would interact with your database
  // For now, we'll create a mock user object
  const user = {
    id: `${provider}_${profile.id}`,
    username: profile.email || `${provider}_user_${profile.id}`,
    email: profile.email,
    firstName: profile.given_name || profile.name?.split(' ')[0] || '',
    lastName: profile.family_name || profile.name?.split(' ').slice(1).join(' ') || '',
    provider: provider,
    providerId: profile.id,
    role: 'user',
    department: null,
    isActive: true,
    lastLogin: new Date(),
    createdAt: new Date(),
  };

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
    // Check if Google OAuth is configured
    if (!isGoogleConfigured || !googleClient) {
      return res.status(503).json({
        success: false,
        message: "Google OAuth is not configured. Please set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET environment variables.",
        error: "SERVICE_UNAVAILABLE"
      });
    }

    const scopes = [
      'https://www.googleapis.com/auth/userinfo.email',
      'https://www.googleapis.com/auth/userinfo.profile'
    ];

    const state = crypto.randomBytes(16).toString('hex');

    const authUrl = googleClient.generateAuthUrl({
      access_type: 'offline',
      scope: scopes,
      state: state,
      include_granted_scopes: true
    });

    // Store state in session/cache for validation
    req.session = req.session || {};
    req.session.oauthState = state;

    res.json({
      success: true,
      url: authUrl,
      state: state
    });
  } catch (error) {
    console.error("Google OAuth URL generation error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to generate Google OAuth URL"
    });
  }
});

/**
 * @api {post} /api/oauth/google/callback Handle Google OAuth Callback
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
    // Check if Google OAuth is configured
    if (!isGoogleConfigured || !googleClient) {
      return res.status(503).json({
        success: false,
        message: "Google OAuth is not configured",
        error: "SERVICE_UNAVAILABLE"
      });
    }

    const { code, state } = req.body;

    if (!code) {
      return res.status(400).json({
        success: false,
        message: "Authorization code is required"
      });
    }

    // Verify state for CSRF protection
    if (req.session?.oauthState && req.session.oauthState !== state) {
      return res.status(400).json({
        success: false,
        message: "Invalid state parameter"
      });
    }

    // Exchange code for tokens
    const { tokens } = await googleClient.getToken(code);
    googleClient.setCredentials(tokens);

    // Get user info
    const ticket = await googleClient.verifyIdToken({
      idToken: tokens.id_token,
      audience: process.env.GOOGLE_CLIENT_ID
    });

    const payload = ticket.getPayload();
    
    // Create or get user
    const user = await createOrGetSocialUser({
      id: payload.sub,
      email: payload.email,
      name: payload.name,
      given_name: payload.given_name,
      family_name: payload.family_name,
      picture: payload.picture,
      email_verified: payload.email_verified
    }, 'google');

    // Generate JWT token
    const token = generateToken(user);

    res.json({
      success: true,
      message: "Google authentication successful",
      token: token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        provider: user.provider
      }
    });

  } catch (error) {
    console.error("Google OAuth callback error:", error);
    res.status(500).json({
      success: false,
      message: "Google authentication failed"
    });
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
        message: "Facebook OAuth is not configured. Please set FACEBOOK_APP_ID and FACEBOOK_APP_SECRET environment variables.",
        error: "SERVICE_UNAVAILABLE"
      });
    }

    const baseUrl = 'https://www.facebook.com/v18.0/dialog/oauth';
    const redirectUri = process.env.FACEBOOK_REDIRECT_URI || `${process.env.API_BASE_URL}/oauth/facebook/callback`;
    const state = crypto.randomBytes(16).toString('hex');
    
    const params = new URLSearchParams({
      client_id: process.env.FACEBOOK_APP_ID,
      redirect_uri: redirectUri,
      state: state,
      scope: 'email,public_profile',
      response_type: 'code'
    });

    const authUrl = `${baseUrl}?${params.toString()}`;

    // Store state in session for validation
    req.session = req.session || {};
    req.session.oauthState = state;

    res.json({
      success: true,
      url: authUrl,
      state: state
    });
  } catch (error) {
    console.error("Facebook OAuth URL generation error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to generate Facebook OAuth URL"
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
        error: "SERVICE_UNAVAILABLE"
      });
    }

    const { code, state } = req.body;

    if (!code) {
      return res.status(400).json({
        success: false,
        message: "Authorization code is required"
      });
    }

    // Verify state for CSRF protection
    if (req.session?.oauthState && req.session.oauthState !== state) {
      return res.status(400).json({
        success: false,
        message: "Invalid state parameter"
      });
    }

    const redirectUri = process.env.FACEBOOK_REDIRECT_URI || `${process.env.API_BASE_URL}/auth/facebook/callback`;

    // Exchange code for access token
    const tokenResponse = await axios.get('https://graph.facebook.com/v18.0/oauth/access_token', {
      params: {
        client_id: process.env.FACEBOOK_APP_ID,
        client_secret: process.env.FACEBOOK_APP_SECRET,
        code: code,
        redirect_uri: redirectUri
      }
    });

    const accessToken = tokenResponse.data.access_token;

    // Get user profile
    const profileResponse = await axios.get('https://graph.facebook.com/v18.0/me', {
      params: {
        access_token: accessToken,
        fields: 'id,name,email,first_name,last_name,picture'
      }
    });

    const profile = profileResponse.data;

    // Create or get user
    const user = await createOrGetSocialUser({
      id: profile.id,
      email: profile.email,
      name: profile.name,
      given_name: profile.first_name,
      family_name: profile.last_name,
      picture: profile.picture?.data?.url
    }, 'facebook');

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
        provider: user.provider
      }
    });

  } catch (error) {
    console.error("Facebook OAuth callback error:", error);
    res.status(500).json({
      success: false,
      message: "Facebook authentication failed"
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
        message: "Apple OAuth is not configured. Please set APPLE_TEAM_ID, APPLE_KEY_ID, and APPLE_SERVICE_ID environment variables.",
        error: "SERVICE_UNAVAILABLE"
      });
    }

    const baseUrl = 'https://appleid.apple.com/auth/authorize';
    const redirectUri = process.env.APPLE_REDIRECT_URI || `${process.env.API_BASE_URL}/oauth/apple/callback`;
    const state = crypto.randomBytes(16).toString('hex');
    
    const params = new URLSearchParams({
      client_id: process.env.APPLE_SERVICE_ID,
      redirect_uri: redirectUri,
      state: state,
      scope: 'name email',
      response_type: 'code',
      response_mode: 'form_post'
    });

    const authUrl = `${baseUrl}?${params.toString()}`;

    // Store state in session for validation
    req.session = req.session || {};
    req.session.oauthState = state;

    res.json({
      success: true,
      url: authUrl,
      state: state
    });
  } catch (error) {
    console.error("Apple OAuth URL generation error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to generate Apple OAuth URL"
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
    const { code, state, user: userData } = req.body;

    if (!code) {
      return res.status(400).json({
        success: false,
        message: "Authorization code is required"
      });
    }

    // Verify state for CSRF protection
    if (req.session?.oauthState && req.session.oauthState !== state) {
      return res.status(400).json({
        success: false,
        message: "Invalid state parameter"
      });
    }

    // Generate client secret for Apple (JWT)
    const clientSecret = generateAppleClientSecret();

    // Exchange code for tokens
    const tokenResponse = await axios.post('https://appleid.apple.com/auth/token', 
      new URLSearchParams({
        client_id: process.env.APPLE_SERVICE_ID,
        client_secret: clientSecret,
        code: code,
        grant_type: 'authorization_code',
        redirect_uri: process.env.APPLE_REDIRECT_URI || `${process.env.API_BASE_URL}/auth/apple/callback`
      }), {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      }
    );

    const { id_token } = tokenResponse.data;

    // Decode the ID token to get user info
    const payload = jwt.decode(id_token);
    
    // Parse user data if provided (first-time authorization)
    let userInfo = {};
    if (userData) {
      const parsedUserData = typeof userData === 'string' ? JSON.parse(userData) : userData;
      userInfo = {
        name: parsedUserData.name ? `${parsedUserData.name.firstName} ${parsedUserData.name.lastName}` : '',
        given_name: parsedUserData.name?.firstName || '',
        family_name: parsedUserData.name?.lastName || ''
      };
    }

    // Create or get user
    const user = await createOrGetSocialUser({
      id: payload.sub,
      email: payload.email,
      name: userInfo.name || payload.email?.split('@')[0] || 'Apple User',
      given_name: userInfo.given_name,
      family_name: userInfo.family_name,
      email_verified: payload.email_verified
    }, 'apple');

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
        provider: user.provider
      }
    });

  } catch (error) {
    console.error("Apple OAuth callback error:", error);
    res.status(500).json({
      success: false,
      message: "Apple authentication failed"
    });
  }
});

// Helper function to generate Apple client secret
function generateAppleClientSecret() {
  const header = {
    alg: 'ES256',
    kid: process.env.APPLE_KEY_ID
  };

  const payload = {
    iss: process.env.APPLE_TEAM_ID,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + (6 * 30 * 24 * 60 * 60), // 6 months
    aud: 'https://appleid.apple.com',
    sub: process.env.APPLE_SERVICE_ID
  };

  // In a real implementation, you would use the Apple private key to sign this JWT
  // For now, we'll return a placeholder
  return jwt.sign(payload, process.env.APPLE_PRIVATE_KEY || 'placeholder', { 
    algorithm: 'ES256',
    header: header
  });
}

module.exports = router;
