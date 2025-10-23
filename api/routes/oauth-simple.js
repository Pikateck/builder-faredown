import express from "express";
/**
 * Streamlined Google OAuth Implementation
 * Based on Zubin's exact specifications for reliable popup flow
 */

const cors = require("cors");
const cookieParser = require("cookie-parser");
const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const { OAuth2Client } = require("google-auth-library");

const router = express.Router();

// CORS for Builder preview, fly.dev, and prod
const ALLOWED_ORIGINS = [
  "https://builder.io",
  "https://55e69d5755db4519a9295a29a1a55930-aaf2790235d34f3ab48afa56a.fly.dev",
  "https://www.faredowntravels.com",
];

// Debug Google OAuth environment variables
console.log("ðŸ” Google OAuth Environment Check:");
console.log(
  "  GOOGLE_CLIENT_ID:",
  process.env.GOOGLE_CLIENT_ID
    ? `${process.env.GOOGLE_CLIENT_ID.substring(0, 20)}...`
    : "NOT SET",
);
console.log(
  "  GOOGLE_CLIENT_SECRET:",
  process.env.GOOGLE_CLIENT_SECRET ? "SET" : "NOT SET",
);
console.log("  OAUTH_REDIRECT_BASE:", process.env.OAUTH_REDIRECT_BASE);
console.log("  VITE_API_BASE_URL:", process.env.VITE_API_BASE_URL);

// Validate required environment variables
if (!process.env.GOOGLE_CLIENT_ID) {
  console.error("ðŸ”´ GOOGLE_CLIENT_ID environment variable is required!");
  throw new Error("Missing GOOGLE_CLIENT_ID environment variable");
}

if (!process.env.GOOGLE_CLIENT_SECRET) {
  console.error("ðŸ”´ GOOGLE_CLIENT_SECRET environment variable is required!");
  throw new Error("Missing GOOGLE_CLIENT_SECRET environment variable");
}

// Use explicit redirect URI that matches Google Cloud Console setup
const redirectUri =
  process.env.GOOGLE_REDIRECT_URI ||
  `${process.env.OAUTH_REDIRECT_BASE}/api/oauth/google/callback`;
console.log("ðŸ” OAuth Redirect URI:", redirectUri);

// Validate redirect URI
if (!redirectUri || redirectUri.includes("undefined")) {
  console.error("ðŸ”´ Invalid redirect URI:", redirectUri);
  throw new Error("Invalid OAuth redirect URI configuration");
}

// Google OAuth client
const client = new OAuth2Client(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  redirectUri,
);

// Verify client configuration
console.log("âœ… Google OAuth client initialized with:");
console.log(
  "  Client ID:",
  process.env.GOOGLE_CLIENT_ID
    ? `${process.env.GOOGLE_CLIENT_ID.substring(0, 20)}...`
    : "MISSING",
);
console.log("  Redirect URI:", redirectUri);

// Tiny in-memory store for state (replace with Redis for production)
const stateStore = new Map(); // state -> expiresAt

function putState(state) {
  stateStore.set(state, Date.now() + 5 * 60 * 1000); // 5 min TTL
  console.log(`ðŸ”µ Stored state: ${state.substring(0, 8)}...`);
}

function consumeState(state) {
  const exp = stateStore.get(state);
  if (!exp || Date.now() > exp) {
    console.log(`ðŸ”´ State expired or not found: ${state?.substring(0, 8)}...`);
    return false;
  }
  stateStore.delete(state);
  console.log(`âœ… State consumed: ${state.substring(0, 8)}...`);
  return true;
}

// Issue a secure session cookie (JWT-based for simplicity)
function issueSessionCookie(res, user) {
  const token = jwt.sign(
    { sub: user.id, email: user.email, name: user.name },
    process.env.SESSION_JWT_SECRET ||
      process.env.JWT_SECRET ||
      "fallback-secret-key",
    { expiresIn: "7d" },
  );

  // Staging: no domain attribute (fly.dev exact host)
  // Prod: domain=.faredowntravels.com
  const host = process.env.OAUTH_REDIRECT_BASE
    ? new URL(process.env.OAUTH_REDIRECT_BASE).hostname
    : "55e69d5755db4519a9295a29a1a55930-aaf2790235d34f3ab48afa56a.fly.dev";

  const isProd = host.endsWith("faredowntravels.com");
  const cookieOpts = {
    httpOnly: true,
    secure: true,
    sameSite: "none",
    path: "/",
  };
  if (isProd) cookieOpts.domain = ".faredowntravels.com";

  res.cookie("session", token, cookieOpts);
  console.log(`âœ… Session cookie set for user: ${user.email}`);
}

// Fake user store (replace with DB)
const users = new Map(); // email -> user
function findOrCreateUser({ email, name, picture }) {
  if (!users.has(email)) {
    users.set(email, {
      id: crypto.randomUUID(),
      email,
      name,
      picture,
      createdAt: new Date().toISOString(),
    });
    console.log(`ðŸ”µ Created new user: ${email}`);
  } else {
    console.log(`ðŸ”µ Found existing user: ${email}`);
  }
  return users.get(email);
}

// ===== ROUTES =====

// OAuth status check (for frontend service compatibility)
router.get("/status", (req, res) => {
  console.log("ðŸ”µ OAuth status check requested");

  const googleConfigured = !!(
    process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
  );

  res.json({
    success: true,
    oauth: {
      google: googleConfigured,
      facebook: false, // Not implemented in oauth-simple
      apple: false, // Not implemented in oauth-simple
    },
    message: "OAuth status retrieved successfully",
  });
});

// Get Google OAuth URL (for frontend service compatibility)
router.get("/google/url", async (req, res) => {
  try {
    console.log("ðŸ”µ Frontend requesting Google OAuth URL...");

    const state = crypto.randomUUID();
    putState(state);

    const oauthRedirectUri =
      process.env.GOOGLE_REDIRECT_URI ||
      `${process.env.OAUTH_REDIRECT_BASE}/api/oauth/google/callback`;

    const authUrl = client.generateAuthUrl({
      access_type: "offline",
      scope: ["openid", "email", "profile"],
      prompt: "consent",
      state,
      redirect_uri: oauthRedirectUri,
      include_granted_scopes: true,
    });

    console.log(
      `âœ… Returning OAuth URL for frontend: ${authUrl.substring(0, 100)}...`,
    );

    res.json({
      success: true,
      url: authUrl,
      state: state,
    });
  } catch (error) {
    console.error("ðŸ”´ OAuth URL generation error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to generate OAuth URL",
    });
  }
});

// Start OAuth (open this in the popup)
router.get("/google", async (req, res) => {
  try {
    console.log("ðŸ”µ Starting Google OAuth...");
    console.log("ðŸ” Request headers:", {
      host: req.get("host"),
      origin: req.get("origin"),
      referer: req.get("referer"),
      userAgent: req.get("user-agent")?.substring(0, 100) + "...",
    });

    const state = crypto.randomUUID();
    putState(state);

    // Get the configured redirect URI
    const oauthRedirectUri =
      process.env.GOOGLE_REDIRECT_URI ||
      `${process.env.OAUTH_REDIRECT_BASE}/api/oauth/google/callback`;

    const authUrl = client.generateAuthUrl({
      access_type: "offline",
      scope: ["openid", "email", "profile"],
      prompt: "consent",
      state,
      redirect_uri: oauthRedirectUri,
      include_granted_scopes: true,
    });

    console.log(`ðŸ” Generated OAuth URL (length: ${authUrl.length}):`, authUrl);
    console.log(`ðŸ” State parameter: ${state}`);
    console.log(`ðŸ” Redirect URI: ${oauthRedirectUri}`);
    console.log(
      `ðŸ” Client ID in URL: ${authUrl.includes(process.env.GOOGLE_CLIENT_ID) ? "PRESENT" : "MISSING"}`,
    );
    console.log(`ðŸ” OAuth URL components:`, {
      client_id: authUrl.includes("client_id=") ? "PRESENT" : "MISSING",
      redirect_uri: authUrl.includes("redirect_uri=") ? "PRESENT" : "MISSING",
      scope: authUrl.includes("scope=") ? "PRESENT" : "MISSING",
      state: authUrl.includes("state=") ? "PRESENT" : "MISSING",
      prompt: authUrl.includes("prompt=") ? "PRESENT" : "MISSING",
    });
    console.log(
      `âœ… Redirecting to Google with state: ${state.substring(0, 8)}...`,
    );

    res.redirect(authUrl);
  } catch (error) {
    console.error("ðŸ”´ OAuth start error:", error);
    console.error("ðŸ”´ Error details:", error.message, error.stack);
    res.status(500).send(`OAuth initialization failed: ${error.message}`);
  }
});

// Callback (Google will redirect here)
router.get("/google/callback", async (req, res) => {
  try {
    console.log("ðŸ”µ Google OAuth callback received");
    console.log("ðŸ”µ Full query params:", req.query);
    console.log("ðŸ”µ Request headers:", {
      host: req.get("host"),
      origin: req.get("origin"),
      referer: req.get("referer"),
      userAgent: req.get("user-agent")?.substring(0, 50) + "...",
    });

    const { code, state } = req.query;

    if (!code || !state) {
      console.error("ðŸ”´ Missing code or state");
      return res.status(400).send("Missing authorization code or state");
    }

    if (!consumeState(state)) {
      console.error("ðŸ”´ Invalid state parameter");
      return res.status(400).send("OAuth session expired. Please try again.");
    }

    console.log("ðŸ”µ Exchanging code for tokens...");
    const { tokens } = await client.getToken(String(code));
    client.setCredentials(tokens);

    // Get user profile
    const ticket = await client.verifyIdToken({
      idToken: tokens.id_token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();
    const email = payload.email;
    const name = payload.name || email.split("@")[0];
    const picture = payload.picture;

    console.log("ðŸ”µ User authenticated:", { email, name });

    const user = findOrCreateUser({ email, name, picture });

    // Issue cookie
    issueSessionCookie(res, user);

    console.log("âœ… OAuth successful, serving bridge page");

    // Determine parent origin by our own origin
    const parentOrigin = req.get("host")?.includes("fly.dev")
      ? "https://55e69d5755db4519a9295a29a1a55930-aaf2790235d34f3ab48afa56a.fly.dev"
      : "https://www.faredowntravels.com";

    // Serve bridge page that posts success to parent and closes
    const bridgeHtml = `
      <!doctype html><meta charset="utf-8">
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
        .debug {
          font-size: 0.8rem;
          color: #666;
          margin-top: 1rem;
          max-width: 400px;
        }
      </style>
      <div class="container">
        <div class="success">âœ“ Authentication Successful</div>
        <div>Welcome, ${user.name}!</div>
        <div class="debug">
          <div>Email: ${user.email}</div>
          <div>User ID: ${user.id}</div>
          <div>Closing popup in 3 seconds...</div>
        </div>
      </div>
      <script>
        console.log('ðŸ”µ Bridge page loaded for user: ${user.email}');
        console.log('ðŸ”µ User data:', ${JSON.stringify(user)});

        // Determine parent origin by our own origin
        const parentOrigin = location.origin.includes('fly.dev')
          ? 'https://55e69d5755db4519a9295a29a1a55930-aaf2790235d34f3ab48afa56a.fly.dev'
          : 'https://www.faredowntravels.com';

        console.log('ðŸ”µ Detected parent origin:', parentOrigin);

        if (window.opener) {
          console.log('ðŸ”µ Window opener found, posting message...');
          const message = {
            type: 'oauth:success',
            success: true,
            message: 'Google authentication successful',
            timestamp: new Date().toISOString(),
            user: {
              id: '${user.id}',
              username: '${user.name}',
              email: '${user.email}',
              role: 'user',
              provider: 'google'
            }
          };
          console.log('ðŸ”µ Posting message:', message);

          // Post to detected origin
          window.opener.postMessage(message, parentOrigin);

          // Also try Builder.io origin
          window.opener.postMessage(message, 'https://builder.io');

          // Try wildcard as fallback
          window.opener.postMessage(message, '*');

          console.log('ðŸ”µ Messages posted to parent');
        } else {
          console.log('ðŸ”´ No window opener found!');
        }

        setTimeout(() => {
          console.log('ðŸ”µ Closing popup in 3...2...1...');
          window.close();
        }, 3000);
      </script>`;

    res.status(200).send(bridgeHtml);
  } catch (err) {
    console.error("ðŸ”´ OAuth callback error:", err?.message || err);

    const parentOrigin = req.get("host")?.includes("fly.dev")
      ? "https://55e69d5755db4519a9295a29a1a55930-aaf2790235d34f3ab48afa56a.fly.dev"
      : "https://www.faredowntravels.com";

    const errorHtml = `
      <!doctype html><meta charset="utf-8">
      <style>
        body { font-family: system-ui; display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; background: #f8fafc; }
        .container { text-align: center; padding: 2rem; background: white; border-radius: 8px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); }
        .error { color: #ef4444; font-size: 1.25rem; margin-bottom: 1rem; }
      </style>
      <div class="container">
        <div class="error">âœ— Authentication Failed</div>
        <div>Please try again</div>
      </div>
      <script>
        if (window.opener) {
          window.opener.postMessage({ type: 'oauth:error', error: 'callback-failed' }, '${parentOrigin}');
          window.opener.postMessage({ type: 'oauth:error', error: 'callback-failed' }, 'https://builder.io');
        }
        setTimeout(() => window.close(), 3000);
      </script>`;
    res.status(200).send(errorHtml);
  }
});

// Get the logged-in user (front-end calls this to confirm session)
router.get("/me", (req, res) => {
  const token = req.cookies?.session;
  if (!token) {
    console.log("ðŸ”´ No session cookie found");
    return res.status(401).json({ ok: false });
  }

  try {
    const payload = jwt.verify(
      token,
      process.env.SESSION_JWT_SECRET ||
        process.env.JWT_SECRET ||
        "fallback-secret-key",
    );
    const user = [...users.values()].find((u) => u.id === payload.sub);
    if (!user) {
      console.log("ðŸ”´ User not found for token");
      return res.status(401).json({ ok: false });
    }

    console.log(`âœ… Session validated for user: ${user.email}`);
    res.json({ ok: true, user });
  } catch (error) {
    console.log("ðŸ”´ Invalid session token");
    res.status(401).json({ ok: false });
  }
});

// Handle OAuth callback via POST (for frontend service compatibility)
router.post("/google/callback", async (req, res) => {
  try {
    console.log("ðŸ”µ POST Google OAuth callback received");
    console.log("ðŸ”µ Request body:", req.body);

    const { code, state } = req.body;

    if (!code || !state) {
      console.error("ðŸ”´ Missing code or state in POST body");
      return res.status(400).json({
        success: false,
        message: "Missing authorization code or state",
      });
    }

    if (!consumeState(state)) {
      console.error("ðŸ”´ Invalid state parameter");
      return res.status(400).json({
        success: false,
        message: "OAuth session expired. Please try again.",
      });
    }

    console.log("ðŸ”µ Exchanging code for tokens...");
    const { tokens } = await client.getToken(String(code));
    client.setCredentials(tokens);

    // Get user profile
    const ticket = await client.verifyIdToken({
      idToken: tokens.id_token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();
    const email = payload.email;
    const name = payload.name || email.split("@")[0];
    const picture = payload.picture;

    console.log("ðŸ”µ User authenticated:", { email, name });

    const user = findOrCreateUser({ email, name, picture });

    // Issue cookie
    issueSessionCookie(res, user);

    console.log("âœ… POST OAuth callback successful, returning user data");

    // Return response expected by frontend service
    res.json({
      success: true,
      message: "Google authentication successful",
      token: "session-cookie-auth", // We use cookies, but frontend expects a token field
      user: {
        id: user.id,
        username: user.name,
        email: user.email,
        role: "user",
        provider: "google",
        firstName: user.name.split(" ")[0],
        lastName: user.name.split(" ").slice(1).join(" ") || "",
      },
    });
  } catch (err) {
    console.error("ðŸ”´ POST OAuth callback error:", err?.message || err);
    res.status(500).json({
      success: false,
      message: "Authentication failed. Please try again.",
    });
  }
});

// Health check
router.get("/health", (_, res) => res.json({ ok: true }));
export default router;