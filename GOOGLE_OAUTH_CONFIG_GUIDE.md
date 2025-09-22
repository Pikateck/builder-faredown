# Google OAuth Configuration Guide

## Google Cloud Console Setup

### 1. OAuth 2.0 Client Configuration

In Google Cloud Console (https://console.cloud.google.com/):

1. Go to **APIs & Services** > **Credentials**
2. Select your OAuth 2.0 Client ID (or create a new one)
3. Set **Application type** to **Web application**

### 2. Authorized JavaScript Origins

Add these exact origins to allow OAuth popup from different environments:

```
https://builder.io
https://55e69d5755db4519a9295a29a1a55930-aaf2790235d34f3ab48afa56a.fly.dev
https://faredown-web.onrender.com
https://www.faredowntravels.com
http://localhost:3000
http://localhost:5173
```

### 3. Authorized Redirect URIs

Add these exact callback URLs for all environments:

```
https://55e69d5755db4519a9295a29a1a55930-aaf2790235d34f3ab48afa56a.fly.dev/api/oauth/google/callback
https://faredown-web.onrender.com/api/oauth/google/callback
https://www.faredowntravels.com/api/oauth/google/callback
http://localhost:3000/api/oauth/google/callback
http://localhost:5173/api/oauth/google/callback
```

## Environment Variables

Ensure these environment variables are set in your deployment:

```bash
# Google OAuth
GOOGLE_CLIENT_ID="832664905965-h8qjvsjm5bbb6g21iug8hmm4f46c2n5u.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="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"
GOOGLE_REDIRECT_URI="https://55e69d5755db4519a9295a29a1a55930-aaf2790235d34f3ab48afa56a.fly.dev/api/oauth/google/callback"

# Session Management
SESSION_SECRET="your-strong-session-secret-here"
JWT_SECRET="your-jwt-secret-here"

# API Base URLs
API_BASE_URL="https://55e69d5755db4519a9295a29a1a55930-aaf2790235d34f3ab48afa56a.fly.dev/api"
VITE_API_BASE_URL="https://55e69d5755db4519a9295a29a1a55930-aaf2790235d34f3ab48afa56a.fly.dev/api"
```

## Cookie Configuration for Iframe Compatibility

The OAuth implementation now includes proper cookie settings:

- **Production**: `SameSite=None; Secure; Domain=.faredowntravels.com`
- **Development**: `SameSite=lax`
- **HttpOnly**: `true` for security
- **Max Age**: 7 days for auth tokens, 10 minutes for OAuth state

## OAuth Flow Overview

1. **Frontend**: User clicks "Continue with Google"
2. **Popup**: Opens `/oauth/google/url` in a centered popup window
3. **Backend**: Generates secure auth URL with state parameter
4. **Google**: User authenticates and grants permissions
5. **Callback**: Google redirects to `/oauth/google/callback`
6. **State Validation**: Backend validates CSRF state parameter
7. **User Creation**: Create or retrieve user from database
8. **JWT Token**: Generate and set secure authentication cookie
9. **Popup Message**: Callback page posts success message to parent
10. **UI Update**: Parent window updates to logged-in state and closes modal

## Testing Checklist

Test in all environments:

- ✅ Builder.io preview (iframe)
- ✅ Render staging URL
- ✅ Production domain (when mapped)
- ✅ Local development

For each environment, verify:

1. **Popup Opens**: Google account picker appears
2. **Account Selection**: Can select/enter Google account
3. **Permissions**: Google consent screen works
4. **Callback Success**: No errors in callback
5. **Session Cookie**: Auth cookie is set correctly
6. **UI Update**: User appears logged in, modal closes
7. **My Account**: User data displays correctly

## Debugging

Check these if OAuth fails:

1. **Network Tab**: Look for failed requests to `/oauth/google/*`
2. **Console Errors**: Check for CORS or cookie blocking
3. **Backend Logs**: State validation and user creation logs
4. **Cookie Domain**: Ensure cookies are set for correct domain
5. **Redirect URI**: Must match exactly in Google Console

## Security Features

- **State Parameter**: CSRF protection with random 16-byte hex
- **Session Expiry**: OAuth state expires after 10 minutes
- **Secure Cookies**: HttpOnly, Secure, and SameSite protection
- **Token Validation**: Google ID token verification
- **Domain Restriction**: Cookies scoped to correct domain
