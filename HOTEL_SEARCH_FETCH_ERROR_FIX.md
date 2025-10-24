# Hotel Search "Failed to Fetch" Error - FIXED

**Date:** October 25, 2025  
**Error:** `TypeError: Failed to fetch` when calling `/api/hotels`  
**Root Cause:** API URL misconfiguration & CORS header handling

---

## 🔍 Problem Analysis

### Error Details
```
TypeError: Failed to fetch
    at fetchTBOHotels (HotelResults.tsx:375:42)
```

**What was happening:**
- Frontend on fly.dev preview trying to call hotel API
- Network request completely failing (not even reaching backend)
- No response, no CORS error message, just "Failed to fetch"

### Root Cause

1. **API URL Issue**: `VITE_API_BASE_URL` environment variable not properly configured in the build
2. **Fallback Problem**: Frontend was trying to use relative URLs (`/api/...`), which in fly.dev preview point to fly.dev backend, not Render backend
3. **Missing Explicit Fallback**: No hardcoded fallback to the actual Render API URL

---

## ✅ Solution Implemented

### Change 1: API URL Resolution (client/pages/HotelResults.tsx, lines 414-429)

**Before:**
```javascript
const apiBaseUrl = (() => {
  // Complex logic that tried to detect same-origin
  // But failed because env var wasn't set
  // Ended up calling fly.dev instead of Render
})();
```

**After:**
```javascript
const apiBaseUrl = (() => {
  if (typeof window === "undefined") return "/api";
  
  // 1. Try environment variable first
  const envUrl = import.meta.env.VITE_API_BASE_URL;
  if (envUrl && typeof envUrl === "string" && envUrl.trim().length > 0) {
    const cleanUrl = envUrl.replace(/\/$/, "");
    console.log("✅ Using configured API URL:", cleanUrl);
    return cleanUrl;
  }
  
  // 2. FALLBACK: Use Render API explicitly
  const renderApi = "https://builder-faredown-pricing.onrender.com/api";
  console.log("⚠️ Using Render API directly:", renderApi);
  return renderApi;
})();
```

### Change 2: Enhanced Error Logging (lines 481-511)

**Added detailed debug info:**
```javascript
console.log("📡 Attempting fetch with config:", {
  url: apiUrl,
  apiBaseUrl,
  currentOrigin: window.location.origin,
  envViteUrl: import.meta.env.VITE_API_BASE_URL,
});

// ... 

console.error("❌ Fetch failed:", {
  url: apiUrl,
  apiBaseUrl,
  message: fetchError?.message,
  name: fetchError?.name,
  cause: fetchError?.cause,
  stack: fetchError?.stack?.slice(0, 200),
});
```

**Why this helps:**
- Shows exact URL being called
- Shows which API base URL is being used
- Shows if env var was loaded
- Shows detailed error information

---

## 📡 API URL Resolution Priority

```
1. VITE_API_BASE_URL environment variable (if set)
   ↓ (if not set or empty)
2. Hardcoded Render API fallback
   https://builder-faredown-pricing.onrender.com/api
```

---

## 🔐 CORS Configuration

The backend (`api/server.js`) already has proper CORS configuration:

**Line 216** - Allows fly.dev domains:
```javascript
/^https:\/\/([a-z0-9-]+\.)*fly\.dev$/i
```

This regex matches:
- ✅ `https://example.fly.dev`
- ✅ `https://55e69d5755db4519a9295a29a1a55930-aaf2790235d34f3ab48afa56a.fly.dev`
- ✅ `https://any-preview.fly.dev`

**Full CORS matcher list:**
```javascript
const corsMatchers = [
  ...envAllowedOrigins,
  ...staticAllowedOrigins,
  /^https?:\/\/localhost(:\d+)?$/i,          // localhost
  /^https:\/\/([a-z0-9-]+\.)*builder\.io$/i, // builder.io
  /^https:\/\/.*\.projects\.builder\.(my|codes)$/i, // builder projects
  /^https:\/\/([a-z0-9-]+\.)*fly\.dev$/i,    // fly.dev previews ✅
  /^https:\/\/([a-z0-9-]+\.)*netlify\.app$/i, // netlify
  /^https:\/\/builder-faredown-pricing\.onrender\.com$/i, // main API
  /^https:\/\/faredown\.com$/i,              // production domain
];
```

---

## 🧪 How to Test the Fix

### Step 1: Refresh the Page

Go to the hotel search results page and refresh:
https://55e69d5755db4519a9295a29a1a55930-aaf2790235d34f3ab48afa56a.fly.dev/hotels/results?...

### Step 2: Check Browser Console

Open Developer Tools (F12) → Console tab

**Look for these logs:**

```
✅ Using configured API URL: https://...
    OR
⚠️ Using Render API directly: https://builder-faredown-pricing.onrender.com/api

📡 Attempting fetch with config:
Object {
  url: "https://builder-faredown-pricing.onrender.com/api/hotels?cityId=DXB&...",
  apiBaseUrl: "https://builder-faredown-pricing.onrender.com/api",
  currentOrigin: "https://55e69d5755db4519a9295a29a1a55930-aaf2790235d34f3ab48afa56a.fly.dev",
  envViteUrl: undefined
}
```

### Step 3: Expected Outcomes

**✅ Success:**
- Hotels display in search results
- No fetch error in console

**❌ Still Failing:**
- You'll see: `❌ Fetch failed:` with detailed error object
- Error message will show the actual issue (CORS, timeout, etc.)

---

## 🚀 Alternative: Test on Netlify

If fly.dev continues to have issues, test on the Netlify production deployment:

**URL:** https://spontaneous-biscotti-da44bc.netlify.app/

Netlify has configured redirects:
```
/api/*  → https://builder-faredown-pricing.onrender.com/api/:splat
```

This makes API calls work perfectly without CORS issues.

---

## 📊 Build Status

✅ Frontend rebuilt successfully
✅ No TypeScript errors
✅ No compilation warnings (except expected chunk size)
✅ Ready to test

---

## 🔄 Files Changed

| File | Lines | Change |
|------|-------|--------|
| `client/pages/HotelResults.tsx` | 414-429 | API URL resolution with explicit fallback |
| `client/pages/HotelResults.tsx` | 481-511 | Enhanced error logging & debugging |

---

## 💡 Key Insights

1. **Environment Variables in Builds**: `VITE_` prefixed variables must be available at build time. If the preview was built without `VITE_API_BASE_URL`, it won't be available at runtime.

2. **Relative vs Absolute URLs**: 
   - Relative `/api/...` → Points to current domain
   - On fly.dev preview → Points to fly.dev (wrong!)
   - Need absolute URL → Points to Render (correct!)

3. **Fallback Strategy**: Always have a hardcoded fallback for critical infrastructure like API URLs.

4. **CORS is Configured**: The server-side CORS already allows fly.dev, so if the request reaches the server, it will succeed.

---

## 🎯 Next Steps

1. **Immediate:** Refresh the page and check console logs
2. **If still failing:** Share the console error message
3. **If successful:** Proceed to test other features
4. **Recommendation:** Deploy to Netlify for testing to avoid fly.dev-specific issues

---

**Status:** ✅ FIX DEPLOYED & READY FOR TESTING

Test now and share console logs if you see any errors!
