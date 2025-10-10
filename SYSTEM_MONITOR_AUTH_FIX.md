# System Monitor Authentication Fix

## Problem

The System Connectivity Monitor was showing a "Token is not valid" error (403 status) when trying to access `/api/admin/system-status` and `/api/admin/system-monitor/history` endpoints.

## Root Cause

The issue was caused by **conflicting middleware** in the Express.js routing:

1. **Specific routes** (lines 384, 386-389 in `api/server.js`):
   ```javascript
   app.use("/api/admin/system-status", adminKeyMiddleware, adminSystemStatusRoutes);
   app.use("/api/admin/system-monitor/history", adminKeyMiddleware, adminSystemMonitorHistoryRoutes);
   ```

2. **Global admin route** (lines 391-397 in `api/server.js`):
   ```javascript
   app.use(
     "/api/admin",
     authenticateToken,
     requireAdmin,
     auditLogger,
     adminRoutes,
   );
   ```

### The Issue

In Express.js, both middlewares run for requests to `/api/admin/system-status`:

1. First, `adminKeyMiddleware` validates the `X-Admin-Key` header ✅
2. Then, the global `/api/admin` route ALSO matches, running `authenticateToken` ❌
3. `authenticateToken` looks for a Bearer token and fails with "Token is not valid"

## The Fix

### 1. Updated `authenticateToken` middleware (`api/middleware/auth.js`)

Added a check to skip token validation if admin access was already granted via admin key:

```javascript
const authenticateToken = (req, res, next) => {
  // CRITICAL FIX: If admin access was already granted via admin key middleware,
  // skip token validation to prevent conflicts with /api/admin global middleware
  if (req.adminAccess && req.adminAccess.viaKey && req.user) {
    if (process.env.NODE_ENV !== "production") {
      console.log("✅ Token middleware: Admin already authenticated via key, skipping token check");
    }
    return next();
  }
  
  // ... rest of token validation logic
};
```

### 2. Updated `adminKeyMiddleware` (`api/middleware/adminKey.js`)

Ensured it sets `req.user` and `req.adminAccess.viaKey` so `authenticateToken` can detect it:

```javascript
req.user = {
  id: "admin-api-key",
  username: "admin-api",
  email: "admin-api@faredown.com",
  role: "super_admin",
  permissions: [],
};

req.adminAccess = {
  ...(req.adminAccess || {}),
  viaKey: true,
};
```

### 3. Added Debug Logging (Development Only)

Added conditional logging to help debug authentication issues in development:
- `api/middleware/adminKey.js` - logs key validation steps
- `api/middleware/auth.js` - logs when skipping token check
- `client/utils/adminEnv.ts` - logs admin headers being sent

All logging is conditional on `NODE_ENV !== "production"` or `import.meta.env.DEV`.

### 4. Removed Duplicate Middleware File

Removed `api/middleware/admin-key.js` to avoid confusion (kept `adminKey.js`).

## How It Works Now

1. Request to `/api/admin/system-status` with `X-Admin-Key` header
2. Matches specific route → `adminKeyMiddleware` runs:
   - Validates the admin key
   - Sets `req.user` with admin user object
   - Sets `req.adminAccess.viaKey = true`
   - Calls `next()`
3. Also matches general `/api/admin` route → `authenticateToken` runs:
   - Sees `req.adminAccess.viaKey = true` and `req.user` exists
   - Skips token validation
   - Calls `next()`
4. Request reaches the route handler successfully ✅

## Testing

### Local Testing

The fix has been applied locally. When you access the System Monitor page, you should see:

1. No "Token is not valid" errors
2. Component status rows populated with data
3. In dev mode, console logs showing successful authentication

### Production Deployment

To deploy this fix to Render:

1. Commit the changes:
   ```bash
   git add .
   git commit -m "Fix: System Monitor admin key authentication conflict"
   git push origin main
   ```

2. Render will automatically deploy the changes

3. Verify the System Monitor page shows live data without errors

## Files Changed

- `api/middleware/auth.js` - Added skip logic for admin key authentication
- `api/middleware/adminKey.js` - Ensured req.user is set, added debug logging
- `client/utils/adminEnv.ts` - Added debug logging
- `api/middleware/admin-key.js` - Removed (duplicate file)

## Environment Variables Required

- **Server**: `ADMIN_API_KEY` - Must be set in Render environment
- **Client**: `VITE_ADMIN_API_KEY` - Must match the server key

Both should be set to: `8f13a2c7b4d9e0f1a6c5d4b3e2f1908a7b6c5d4e3f2a1b0c9d8e7f6a5b4c3d2e1`
