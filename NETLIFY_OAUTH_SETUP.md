# Netlify Google OAuth Configuration Guide

## Current Issue
Google Sign-In is not working on the Netlify deployment (`spontaneous-biscotti-da44bc.netlify.app`) because:
1. ❌ Google Cloud Console redirect URI doesn't include the Netlify URL
2. ❌ Netlify environment variables are configured for Fly.dev instead of Netlify

## Required Steps

### Step 1: Update Google Cloud Console (CRITICAL)

From your screenshots, you're on the correct page. You need to add the Netlify redirect URI:

1. **In Google Cloud Console** → APIs & Services → Credentials → Your OAuth 2.0 Client ID
2. **Under "Authorized redirect URIs"**, click **"+ ADD URI"**
3. **Add this exact URL**:
   ```
   https://spontaneous-biscotti-da44bc.netlify.app/api/oauth/google/callback
   ```
4. **Click "SAVE"** at the bottom of the page
5. **Wait 5 minutes** for Google to propagate the changes

### Step 2: Configure Netlify Environment Variables (CRITICAL)

You need to set these environment variables in your Netlify dashboard:

1. Go to: https://app.netlify.com/sites/spontaneous-biscotti-da44bc/settings/deploys
2. Click on **"Environment"** in the left sidebar
3. Click **"Add a variable"** and add each of these:

```bash
# Google OAuth (REQUIRED)
GOOGLE_CLIENT_ID=832664905965-h8qjvsjm5bbb6g21iug8hmm4f46c2n5u.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=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
GOOGLE_REDIRECT_URI=https://spontaneous-biscotti-da44bc.netlify.app/api/oauth/google/callback
OAUTH_REDIRECT_BASE=https://spontaneous-biscotti-da44bc.netlify.app

# API Configuration
VITE_API_BASE_URL=https://spontaneous-biscotti-da44bc.netlify.app/api
API_BASE_URL=https://spontaneous-biscotti-da44bc.netlify.app/api

# Session Security
SESSION_JWT_SECRET=super-long-random-jwt-secret-for-oauth-sessions-2025
JWT_SECRET=your-super-secure-jwt-secret-key-here

# Node Environment
NODE_ENV=production

# Database (from current config)
DATABASE_URL=postgresql://faredown_user:VFEkJ35EShYkok2OfgabKLRCKIluidqb@dpg-d2086mndiees739731t0-a.singapore-postgres.render.com/faredown_booking_db
DB_HOST=dpg-d2086mndiees739731t0-a.singapore-postgres.render.com
DB_USER=faredown_user
DB_PASSWORD=VFEkJ35EShYkok2OfgabKLRCKIluidqb
DB_NAME=faredown_booking_db
DB_PORT=5432

# External APIs (from current config)
AMADEUS_API_KEY=6H8SAsHAPdGAlWFYWNKgxQetHgeGCeNv
AMADEUS_API_SECRET=2eVYfPeZVxmvbjRm
HOTELBEDS_API_KEY=YOUR_HOTELBEDS_API_KEY
HOTELBEDS_API_SECRET=a9ffaaecce
HOTELBEDS_BASE_URL=https://api.test.hotelbeds.com

# Feature Flags
ENABLE_MOCK_DATA=true
VITE_ENABLE_OFFLINE_FALLBACK=false
AIRPORTS_DIAGNOSTICS_ENABLED=true
USE_MOCK_AIRPORTS=false
```

### Step 3: Trigger a New Deployment

After setting the environment variables in Netlify:

1. Go to **Deploys** tab in Netlify dashboard
2. Click **"Trigger deploy"** → **"Clear cache and deploy site"**
3. Wait for the deployment to complete (~2-3 minutes)

### Step 4: Test Google Sign-In

1. Visit: https://spontaneous-biscotti-da44bc.netlify.app
2. Click **"Sign in with Google"**
3. Complete the Google authentication flow
4. You should be redirected back and logged in successfully

## Verification Checklist

- [ ] Added Netlify redirect URI in Google Cloud Console
- [ ] Saved changes in Google Cloud Console
- [ ] Waited 5 minutes for Google propagation
- [ ] Set all environment variables in Netlify
- [ ] Triggered a new deployment
- [ ] Tested Google Sign-In on Netlify URL
- [ ] Successfully logged in via Google

## Current OAuth Configuration

### Google Cloud Console
- **Client ID**: `832664905965-h8qjvsjm5bbb6g21iug8hmm4f46c2n5u.apps.googleusercontent.com`
- **Required Redirect URIs**:
  - ✅ `https://55e69d5755db4519a9295a29a1a55930-aaf2790235d34f3ab48afa56a.fly.dev/api/oauth/google/callback` (Fly.dev - already configured)
  - ❓ `https://spontaneous-biscotti-da44bc.netlify.app/api/oauth/google/callback` (Netlify - **needs to be added**)

### Netlify Deployment
- **Site URL**: `https://spontaneous-biscotti-da44bc.netlify.app`
- **OAuth Callback**: `/api/oauth/google/callback`
- **Full Redirect URI**: `https://spontaneous-biscotti-da44bc.netlify.app/api/oauth/google/callback`

## Quick Access Links

- **Google Cloud Console**: https://console.cloud.google.com/apis/credentials
- **Netlify Site Settings**: https://app.netlify.com/sites/spontaneous-biscotti-da44bc/settings
- **Netlify Environment Variables**: https://app.netlify.com/sites/spontaneous-biscotti-da44bc/settings/deploys#environment
- **Netlify Deploys**: https://app.netlify.com/sites/spontaneous-biscotti-da44bc/deploys

## Troubleshooting

### If Google Sign-In still doesn't work:

1. **Check Browser Console** for error messages
2. **Verify Redirect URI** in Google Cloud Console exactly matches:
   ```
   https://spontaneous-biscotti-da44bc.netlify.app/api/oauth/google/callback
   ```
3. **Check Netlify Function Logs**:
   - Go to Netlify Dashboard → Functions → View logs
   - Look for OAuth-related errors

4. **Verify Environment Variables** in Netlify:
   - Settings → Environment → Make sure all variables are set
   - Check for typos in variable names and values

5. **Clear Browser Cache** and try again

## Notes

- The netlify.toml file is already configured correctly with SPA routing
- The OAuth implementation supports both GET and POST callback methods
- Cookies are set with `sameSite: 'none'` and `secure: true` for cross-origin support
- The OAuth flow uses a popup window with postMessage for communication
