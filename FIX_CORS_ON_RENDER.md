# Fix CORS Issue for Builder.io Preview

## Problem

The Render backend is blocking API requests from the Builder.io preview (fly.dev) because the preview URL is not in the CORS allowed origins.

## Current CORS_ORIGIN on Render

```
https://spontaneous-biscotti-da44bc.netlify.app,http://localhost:5173
```

## Solution: Update CORS_ORIGIN on Render

### Step 1: Go to Render Dashboard

1. Open: https://dashboard.render.com
2. Click on service: **builder-faredown-pricing**
3. Click on: **Environment** tab

### Step 2: Update CORS_ORIGIN Variable

1. Find: `CORS_ORIGIN`
2. Click: **Edit** (pencil icon)
3. **Replace** the current value with:
   ```
   https://spontaneous-biscotti-da44bc.netlify.app,http://localhost:5173,https://55e69d5755db4519a9295a29a1a55930-aaf2790235d34f3ab48afa56a.fly.dev
   ```
4. Click: **Save Changes**

### Step 3: Redeploy

1. Click: **Manual Deploy**
2. ✅ Check: **Clear build cache**
3. Click: **Deploy**

### Step 4: Verify (After Deployment)

1. Wait for deployment to show "Live" (green status)
2. Refresh your Builder.io admin panel
3. Click "Refresh Data" in User Management
4. Users should now load successfully

---

## Alternative: Add Wildcard for All Future Previews

If you want to support all future Builder.io preview URLs without updating CORS each time:

**Replace CORS_ORIGIN value with:**

```
https://spontaneous-biscotti-da44bc.netlify.app,http://localhost:5173,https://55e69d5755db4519a9295a29a1a55930-aaf2790235d34f3ab48afa56a.fly.dev,https://*.fly.dev
```

**Note:** The `https://*.fly.dev` pattern will allow any fly.dev subdomain, which is safer for Builder.io previews but less restrictive.

---

## Why This Happens

Builder.io preview runs on fly.dev (https://...fly.dev), but your Render backend only allows:

- ✅ Netlify (production frontend)
- ✅ Localhost (local development)
- ❌ fly.dev (Builder.io preview) ← **Missing!**

Without the fly.dev URL in CORS_ORIGIN, the browser blocks all API requests from the preview.

---

## Expected Result After Fix

✅ Admin Panel loads users successfully
✅ You see: Zubin Aibara (Active)
✅ All admin API calls work
✅ No more "Failed to fetch" errors
