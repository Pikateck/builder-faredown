# 🚨 DEPLOY TO RENDER (Not Netlify!)

## The Problem

- ✅ Code is pushed to GitHub
- ✅ Netlify deployed (frontend only)
- ❌ **RENDER NOT DEPLOYED** (backend API)

The fix is in `api/server.js` which is the **backend** running on Render, NOT Netlify.

---

## IMMEDIATE ACTION: Deploy to Render

### Option 1: Auto-Deploy (if connected to GitHub)

1. Go to: **https://dashboard.render.com/**
2. Open: **builder-faredown-pricing** service
3. Check if it's connected to GitHub repo `Pikateck/builder-faredown`
4. If yes, it should auto-deploy when you push to `main` branch
5. If not auto-deploying, click **Manual Deploy** → **Deploy latest commit**

### Option 2: Manual Deploy

1. Go to: **https://dashboard.render.com/**
2. Open: **builder-faredown-pricing** service  
3. Click: **Manual Deploy** dropdown (top right)
4. Select: **Deploy latest commit** or **Clear build cache & deploy**
5. Wait 3-5 minutes for deployment

---

## How to Verify Render Deployed

After deploy completes, check:

```bash
curl -I https://builder-faredown-pricing.onrender.com/api/health
```

Should **NOT** show `cross-origin-resource-policy: same-origin` header anymore.

---

## Why This Happened

- **Netlify** hosts the React frontend (static files)
- **Render** hosts the Node.js backend (API endpoints)
- The CORS fix is in the backend (`api/server.js`)
- Pushing to GitHub → Netlify auto-deploys frontend ✅
- Pushing to GitHub → Render may NOT auto-deploy backend ❌

You need to **manually trigger Render deployment** or set up auto-deploy on Render.

---

## After Render Deploys

The admin panel will work immediately (no browser refresh needed). The "Failed to fetch" errors will stop because the CORP header will be removed.
