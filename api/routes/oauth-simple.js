/**
 * Streamlined Google OAuth Implementation
 * Based on Zubin's exact specifications for reliable popup flow
 */

const express = require("express");
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
console.log("🔍 Google OAuth Environment Check:");
console.log("  GOOGLE_CLIENT_ID:", process.env.GOOGLE_CLIENT_ID ? `${process.env.GOOGLE_CLIENT_ID.substring(0, 20)}...` : "NOT SET");
console.log("  GOOGLE_CLIENT_SECRET:", process.env.GOOGLE_CLIENT_SECRET ? "SET" : "NOT SET");
console.log("  OAUTH_REDIRECT_BASE:", process.env.OAUTH_REDIRECT_BASE);
console.log("  VITE_API_BASE_URL:", process.env.VITE_API_BASE_URL);

// Validate required environment variables
if (!process.env.GOOGLE_CLIENT_ID) {
  console.error("🔴 GOOGLE_CLIENT_ID environment variable is required!");
  throw new Error("Missing GOOGLE_CLIENT_ID environment variable");
}

if (!process.env.GOOGLE_CLIENT_SECRET) {
  console.error("🔴 GOOGLE_CLIENT_SECRET environment variable is required!");
  throw new Error("Missing GOOGLE_CLIENT_SECRET environment variable");
}

// Use explicit redirect URI that matches Google Cloud Console setup
const redirectUri = process.env.GOOGLE_REDIRECT_URI || `${process.env.OAUTH_REDIRECT_BASE}/api/oauth/google/callback`;
console.log("🔍 OAuth Redirect URI:", redirectUri);

// Validate redirect URI
if (!redirectUri || redirectUri.includes('undefined')) {
  console.error("🔴 Invalid redirect URI:", redirectUri);
  throw new Error("Invalid OAuth redirect URI configuration");
}

// Google OAuth client
const client = new OAuth2Client(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  redirectUri
);

// Verify client configuration
console.log("✅ Google OAuth client initialized with:")
console.log("  Client ID:", process.env.GOOGLE_CLIENT_ID ? `${process.env.GOOGLE_CLIENT_ID.substring(0, 20)}...` : "MISSING");
console.log("  Redirect URI:", redirectUri);

// Tiny in-memory store for state (replace with Redis for production)
const stateStore = new Map(); // state -> expiresAt

function putState(state) {
  stateStore.set(state, Date.now() + 5 * 60 * 1000); // 5 min TTL
  console.log(`🔵 Stored state: ${state.substring(0, 8)}...`);
}

function consumeState(state) {
  const exp = stateStore.get(state);
  if (!exp || Date.now() > exp) {
    console.log(`🔴 State expired or not found: ${state?.substring(0, 8)}...`);
    return false;
  }
  stateStore.delete(state);
  console.log(`✅ State consumed: ${state.substring(0, 8)}...`);
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
  console.log(`✅ Session cookie set for user: ${user.email}`);
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
    console.log(`🔵 Created new user: ${email}`);
  } else {
    console.log(`🔵 Found existing user: ${email}`);
  }
  return users.get(email);
}

// ===== ROUTES =====

// Start OAuth (open this in the popup)
router.get("/google", async (req, res) => {
  try {
    console.log("🔵 Starting Google OAuth...");
    console.log("🔍 Request headers:", {
      host: req.get('host'),
      origin: req.get('origin'),
      referer: req.get('referer')
    });

    const state = crypto.randomUUID();
    putState(state);

    // Get the configured redirect URI
    const oauthRedirectUri = process.env.GOOGLE_REDIRECT_URI || `${process.env.OAUTH_REDIRECT_BASE}/api/oauth/google/callback`;

    const authUrl = client.generateAuthUrl({
      access_type: "offline",
      scope: ["openid", "email", "profile"],
      prompt: "select_account",
      state,
      redirect_uri: oauthRedirectUri,
    });

    console.log(`🔍 Generated OAuth URL: ${authUrl}`);
    console.log(`🔍 State parameter: ${state}`);
    console.log(`🔍 Client ID in URL: ${authUrl.includes(process.env.GOOGLE_CLIENT_ID) ? 'PRESENT' : 'MISSING'}`);
    console.log(`✅ Redirecting to Google with state: ${state.substring(0, 8)}...`);

    res.redirect(authUrl);
  } catch (error) {
    console.error("🔴 OAuth start error:", error);
    console.error("🔴 Error details:", error.message, error.stack);
    res.status(500).send("OAuth initialization failed");
  }
});

// Callback (Google will redirect here)
router.get("/google/callback", async (req, res) => {
  try {
    console.log("🔵 Google OAuth callback received");
    console.log("🔵 Query params:", {
      code: req.query.code?.substring(0, 20) + "...",
      state: req.query.state?.substring(0, 8) + "...",
    });

    const { code, state } = req.query;

    if (!code || !state) {
      console.error("🔴 Missing code or state");
      return res.status(400).send("Missing authorization code or state");
    }

    if (!consumeState(state)) {
      console.error("🔴 Invalid state parameter");
      return res.status(400).send("OAuth session expired. Please try again.");
    }

    console.log("🔵 Exchanging code for tokens...");
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

    console.log("🔵 User authenticated:", { email, name });

    const user = findOrCreateUser({ email, name, picture });

    // Issue cookie
    issueSessionCookie(res, user);

    console.log("✅ OAuth successful, serving bridge page");

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
      </style>
      <div class="container">
        <div class="success">✓ Authentication Successful</div>
        <div>Completing sign-in...</div>
      </div>
      <script>
        console.log('🔵 Bridge page loaded for user: ${user.email}');
        
        // Determine parent origin by our own origin
        const parentOrigin = location.origin.includes('fly.dev')
          ? 'https://55e69d5755db4519a9295a29a1a55930-aaf2790235d34f3ab48afa56a.fly.dev'
          : 'https://www.faredowntravels.com';
          
        if (window.opener) {
          const message = { type: 'oauth:success' };
          console.log('🔵 Posting success message to parent:', parentOrigin);
          window.opener.postMessage(message, parentOrigin);
          
          // Also try Builder.io origin
          window.opener.postMessage(message, 'https://builder.io');
        }
        
        setTimeout(() => {
          console.log('🔵 Closing popup');
          window.close();
        }, 200);
      </script>`;

    res.status(200).send(bridgeHtml);
  } catch (err) {
    console.error("🔴 OAuth callback error:", err?.message || err);

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
        <div class="error">✗ Authentication Failed</div>
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
    console.log("🔴 No session cookie found");
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
      console.log("🔴 User not found for token");
      return res.status(401).json({ ok: false });
    }

    console.log(`✅ Session validated for user: ${user.email}`);
    res.json({ ok: true, user });
  } catch (error) {
    console.log("🔴 Invalid session token");
    res.status(401).json({ ok: false });
  }
});

// Health check
router.get("/health", (_, res) => res.json({ ok: true }));

module.exports = router;
