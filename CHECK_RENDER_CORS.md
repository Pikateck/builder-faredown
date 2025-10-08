# ✅ EXACT FIX - Render CORS Configuration

## Issue

Browser shows "Failed to fetch" because Render backend blocks requests from fly.dev.

## ✅ SOLUTION (Takes 2 minutes)

### Step 1: Check Current CORS_ORIGIN on Render

1. Go to: **https://dashboard.render.com/**
2. Click: **builder-faredown-pricing** service
3. Click: **Environment** tab (left sidebar)
4. Find: **CORS_ORIGIN** variable
5. Current value is probably:
   ```
   https://spontaneous-biscotti-da44bc.netlify.app,http://localhost:5173
   ```

### Step 2: Update CORS_ORIGIN (CRITICAL)

**Change it to include ALL three URLs:**

```
https://spontaneous-biscotti-da44bc.netlify.app,http://localhost:5173,https://55e69d5755db4519a9295a29a1a55930-aaf2790235d34f3ab48afa56a.fly.dev
```

**IMPORTANT**:

- No spaces after commas
- Exact fly.dev URL must be included
- Must be comma-separated

### Step 3: Save and Redeploy

1. Click **Save** on the environment variable
2. Render will auto-trigger a deploy
3. Wait 3-5 minutes for deploy to complete
4. Watch the deploy logs until it says "Live"

### Step 4: Verify (After Deploy)

Open browser console and run:

```javascript
fetch("https://builder-faredown-pricing.onrender.com/api/admin/users", {
  headers: {
    "X-Admin-Key":
      "8f13a2c7b4d9e0f1a6c5d4b3e2f1908a7b6c5d4e3f2a1b0c9d8e7f6a5b4c3d2e1",
  },
})
  .then((r) => r.json())
  .then(console.log)
  .catch(console.error);
```

Should return users JSON (not "Failed to fetch").

---

## Why Previous Deploy Didn't Fix It

You deployed Render, but the **environment variable change wasn't saved** or **wasn't included in the deploy**.

Environment variables must be:

1. ✅ Saved in Render dashboard
2. ✅ Applied to a new deployment
3. ✅ Service must restart with new values

If you only deployed without updating CORS_ORIGIN, the deploy won't fix the issue.

---

## Alternative: Use Regex Pattern (Already in Code)

The code has this CORS pattern:

```javascript
/^https:\/\/([a-z0-9-]+\.)*fly\.dev$/i;
```

This SHOULD match your fly.dev URL automatically, BUT only if Render has restarted with the latest code.

If the regex pattern is in the code but still not working, it means Render is running old code or the regex needs the explicit URL in CORS_ORIGIN.

---

## Quick Test: Is CORS the Issue?

Run this in browser console:

```javascript
// This should work (same origin)
fetch("/api/health")
  .then((r) => r.json())
  .then(console.log);

// This should fail with CORS (cross origin)
fetch("https://builder-faredown-pricing.onrender.com/api/health")
  .then((r) => r.json())
  .then(console.log)
  .catch((e) => console.error("CORS blocked:", e));
```

If the second one fails with "Failed to fetch" or CORS error, that confirms it's CORS.

---

## ⚡ FASTEST FIX

**Just add the fly.dev URL to CORS_ORIGIN on Render and redeploy.**

After that, the admin panel will work immediately (no browser cache clearing needed).
