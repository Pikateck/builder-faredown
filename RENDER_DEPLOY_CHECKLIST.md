# 🚀 Render Deployment Checklist: `builder-faredown-pricing`

## ✅ **FILES UPDATED**

### **✅ 1. Fixed package.json**
- [x] Main entry: `pricing-server.js`
- [x] Node version: `20.x`
- [x] Start script: `npm start` → `node pricing-server.js`
- [x] Build script: Updated for production

### **✅ 2. Fixed pricing-server.js**
- [x] Added `/api/health` endpoint for Render
- [x] Host binding: `0.0.0.0` instead of `localhost`
- [x] Updated console logs for Render compatibility
- [x] Added Render status indicators

### **✅ 3. Added Configuration Files**
- [x] `.nvmrc`: Node 20
- [x] `render.yaml`: Service configuration
- [x] Health check path: `/api/health`

---

## 🎯 **RENDER SERVICE CONFIGURATION**

### **Service Settings:**
```
Service Name: builder-faredown-pricing
Environment: Node
Root Directory: api
Build Command: npm ci
Start Command: npm start
Node Version: 20.x
Health Check Path: /api/health
Auto-Deploy: Yes
```

### **Environment Variables:**
```
DATABASE_URL=postgresql://faredown_user:VFEkJ35EShYkok2OfgabKLRCKIluidqb@dpg-d2086mndiees739731t0-a.singapore-postgres.render.com/faredown_booking_db
NODE_ENV=production
PORT=10000
PRICE_ECHO_ENABLED=true
```

---

## 🧪 **TESTING ENDPOINTS**

After successful deployment, test these URLs:

### **1. Health Check**
```bash
curl https://YOUR-SERVICE.onrender.com/api/health
```
**Expected Response:**
```json
{
  "status": "healthy",
  "timestamp": "2024-01-XX...",
  "service": "faredown-pricing",
  "database": "connected",
  "version": "1.0.0"
}
```

### **2. API Info**
```bash
curl https://YOUR-SERVICE.onrender.com/
```
**Expected Response:**
```json
{
  "name": "Faredown Pricing API",
  "version": "1.0.0",
  "description": "Pricing Engine API for markup and bargain management",
  "endpoints": {
    "pricing": "/api/pricing",
    "health": "/api/health"
  }
}
```

### **3. Pricing Quote Test**
```bash
curl -X POST https://YOUR-SERVICE.onrender.com/api/pricing/quote \
  -H "Content-Type: application/json" \
  -d '{
    "module": "hotels",
    "baseFare": 5000,
    "currency": "INR"
  }'
```

---

## 🔥 **DEPLOYMENT STEPS**

### **Step 1: Push Changes**
```bash
git add .
git commit -m "Fix: Render deployment configuration for pricing API"
git push origin main
```

### **Step 2: Render Service Setup**
1. Go to Render Dashboard
2. Create New Web Service
3. Connect GitHub repository
4. Configure settings:
   - **Root Directory:** `api`
   - **Build Command:** `npm ci`
   - **Start Command:** `npm start`
   - **Node Version:** `20.x`
   - **Health Check:** `/api/health`

### **Step 3: Environment Variables**
Add these in Render Environment tab:
- `DATABASE_URL`: (from your existing database)
- `NODE_ENV`: `production`
- `PRICE_ECHO_ENABLED`: `true`

### **Step 4: Deploy & Monitor**
1. Click "Create Web Service"
2. Watch deploy logs for errors
3. Test health endpoint when ready
4. Verify pricing API functionality

---

## 🚨 **TROUBLESHOOTING COMMON ISSUES**

### **Issue: "Cannot use import statement"**
**Fix:** ✅ Already fixed - using CommonJS syntax

### **Issue: "EADDRINUSE: address already in use"**
**Fix:** ✅ Already fixed - explicit `0.0.0.0` binding

### **Issue: "Health check failed"**
**Fix:** ✅ Already fixed - `/api/health` endpoint added

### **Issue: "Database connection failed"**
**Solution:** Check `DATABASE_URL` environment variable

### **Issue: "Module not found"**
**Solution:** Ensure `npm ci` installs all dependencies

---

## 📋 **FINAL VERIFICATION**

After deployment, confirm:
- [ ] Service status shows "Live" 
- [ ] Health check returns 200 status
- [ ] `/api/health` endpoint responds correctly
- [ ] Pricing quote API works
- [ ] Database connection successful
- [ ] No console errors in logs

---

## 🎉 **SUCCESS CRITERIA**

**✅ Deployment successful when:**
1. Render service shows "Live" status
2. Health endpoint returns `{"status": "healthy"}`
3. Pricing API responds to test requests
4. Database connectivity confirmed
5. All console logs show successful startup

**The pricing API should now be fully functional on Render! 🚀**
