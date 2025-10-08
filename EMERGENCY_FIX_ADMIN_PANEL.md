# 🚨 EMERGENCY FIX: Admin Panel "Failed to Fetch" Error

## The Problem

Your browser has cached old JavaScript that's calling the wrong API URL. The service worker is also interfering.

## The Solution (Takes 30 seconds)

### Step 1: Open Browser Console

1. Press `F12` to open DevTools
2. Click the **Console** tab

### Step 2: Copy and Paste This Code

```javascript
// Clear service workers
navigator.serviceWorker.getRegistrations().then((registrations) => {
  registrations.forEach((r) => r.unregister());
  console.log("✓ Service workers cleared");
});

// Clear all caches
caches.keys().then((names) => {
  names.forEach((name) => caches.delete(name));
  console.log("✓ Caches cleared:", names);
});

// Clear storage
localStorage.clear();
sessionStorage.clear();
console.log("✓ Storage cleared");

// Hard reload
setTimeout(() => location.reload(true), 1000);
```

### Step 3: Press Enter

The page will automatically reload after 1 second with a clean slate.

### Step 4: Test Admin Panel

1. Go to `/admin/dashboard`
2. Click "User Management"
3. Users should now load successfully

---

## Alternative Method (If Console Doesn't Work)

### Using DevTools Application Tab:

1. Press `F12`
2. Click **Application** tab
3. In left sidebar, click **Clear storage**
4. Click **Clear site data** button
5. Hard refresh: `Ctrl+Shift+R` (Windows) or `Cmd+Shift+R` (Mac)

---

## What We Fixed

✅ **API URL**: Changed from fly.dev preview to Render backend  
✅ **Service Worker**: Updated to bypass admin caching  
✅ **Admin Key**: Configured on both frontend and backend  
✅ **Endpoint Path**: Corrected from `/api/admin/users` to `/admin/users`

The code is correct. You just need to clear the old cached version from your browser.

---

## Verify It's Working

After clearing cache, check the browser console. You should see:

```
🔍 API GET Request: {
  baseURL: "https://builder-faredown-pricing.onrender.com/api",
  endpoint: "/admin/users",
  fullURL: "https://builder-faredown-pricing.onrender.com/api/admin/users"
}
```

If you see this, the fix is working! ✅
