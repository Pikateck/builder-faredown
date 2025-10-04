# 🚀 Quick Start: Subdomain Separation

## Overview

This guide will help you quickly set up subdomain separation for Admin Panel and Live APIs.

**Target Architecture:**
- `api.faredown.com` → Live/Public APIs (customer-facing)
- `admin.faredown.com` → Admin Panel + Admin APIs (backoffice team)

---

## ⚡ Quick Implementation (Option A - Single Server)

This is the fastest way to implement subdomain separation using your existing server.

### Step 1: Copy Environment Files

```bash
# Copy example files
cp .env.live.example .env.live
cp .env.admin.example .env.admin

# Edit with your actual values
nano .env.live
nano .env.admin
```

### Step 2: Update Backend Server

Add subdomain detection to `api/server.js` (at the top, after imports):

```javascript
const { detectSubdomain, enforceAdminSubdomain, subdomainCors, logSubdomainAccess } = require('./middleware/subdomainAuth');

// Apply subdomain detection first
app.use(detectSubdomain);
app.use(logSubdomainAccess);

// Apply subdomain-specific CORS
app.use(subdomainCors);

// Protect admin routes - add BEFORE admin route mounts
app.use('/api/admin/*', enforceAdminSubdomain);
```

### Step 3: Update Frontend API Client

Replace `client/lib/api.ts` imports in your app:

```typescript
// OLD:
import { apiClient } from '@/lib/api';

// NEW (for admin pages):
import { adminApiClient } from '@/lib/api-subdomain';

// NEW (for public pages):
import { liveApiClient } from '@/lib/api-subdomain';

// Or use context-aware (automatic):
import { contextApiClient } from '@/lib/api-subdomain';
```

### Step 4: Update Admin Pages

Example for `client/pages/admin/AdminDashboard.tsx`:

```typescript
import { adminApiClient } from '@/lib/api-subdomain';

const AdminDashboard = () => {
  useEffect(() => {
    const fetchData = async () => {
      // This will automatically use admin.faredown.com
      const response = await adminApiClient.get('/admin/dashboard');
      setData(response.data);
    };
    fetchData();
  }, []);
  
  // ... rest of component
};
```

### Step 5: Configure DNS

Add these DNS records in your domain registrar (e.g., Cloudflare, Namecheap):

```
Type: CNAME
Name: api
Value: your-hosting-provider.com (e.g., your-app.fly.dev)

Type: CNAME  
Name: admin
Value: your-hosting-provider.com (e.g., your-app.fly.dev)
```

### Step 6: Deploy

```bash
# Build the app
npm run build

# Deploy to your hosting provider
# The same server will handle both subdomains
```

---

## 🧪 Local Testing

### Update `/etc/hosts` (macOS/Linux)

```bash
sudo nano /etc/hosts

# Add these lines:
127.0.0.1 api.faredown.local
127.0.0.1 admin.faredown.local
```

### Update `hosts` file (Windows)

```
C:\Windows\System32\drivers\etc\hosts

# Add:
127.0.0.1 api.faredown.local
127.0.0.1 admin.faredown.local
```

### Test Locally

```bash
# Start dev server
npm run dev

# Test API subdomain
curl http://api.faredown.local:3001/api/health

# Test Admin subdomain
curl http://admin.faredown.local:3001/api/admin/health
```

---

## ✅ Verification Checklist

### After Deployment

- [ ] Visit `https://api.faredown.com/api/health` - should return health status
- [ ] Visit `https://admin.faredown.com/api/admin/dashboard` - should require auth
- [ ] Try accessing `https://api.faredown.com/api/admin/dashboard` - should return 403 Forbidden
- [ ] Check browser console for CORS errors - should be none
- [ ] Test admin login at `https://admin.faredown.com`
- [ ] Test customer app at `https://faredown.com`

### Security Checks

- [ ] Admin routes blocked on api subdomain
- [ ] Admin token uses separate JWT secret
- [ ] CORS configured per subdomain
- [ ] Rate limiting active per subdomain
- [ ] Audit logging enabled for admin actions

---

## 🔧 Configuration Summary

### Environment Variables

| Variable | Live API | Admin Panel |
|----------|----------|-------------|
| `PORT` | 3001 | 3002 (if separate) |
| `SERVER_TYPE` | live | admin |
| `ENABLE_ADMIN_ROUTES` | false | true |
| `ENABLE_LIVE_ROUTES` | true | false (optional) |
| `JWT_SECRET` | customer-secret | admin-secret |
| `ADMIN_JWT_SECRET` | - | admin-2fa-secret |
| `ALLOWED_ORIGINS` | faredown.com | admin.faredown.com |

### API Endpoints

| Endpoint | Live Subdomain | Admin Subdomain |
|----------|----------------|-----------------|
| `/api/flights` | ✅ Allowed | ❌ Blocked |
| `/api/hotels` | ✅ Allowed | ❌ Blocked |
| `/api/bookings` | ✅ Allowed | ✅ Allowed (read) |
| `/api/admin/*` | ❌ Blocked | ✅ Allowed |
| `/api/admin/dashboard` | ❌ 403 | ✅ Allowed |

---

## 🐛 Troubleshooting

### Issue: "Admin routes accessible on api subdomain"

**Solution:** Ensure middleware order in `api/server.js`:

```javascript
// MUST be in this order:
app.use(detectSubdomain);          // 1. Detect subdomain first
app.use('/api/admin/*', enforceAdminSubdomain); // 2. Protect admin routes
app.use('/api/admin', authenticateToken, requireAdmin, adminRoutes); // 3. Mount routes
```

### Issue: "CORS errors in browser console"

**Solution:** Check subdomain CORS configuration:

```javascript
// In api/server.js
app.use(subdomainCors); // Uses dynamic CORS based on subdomain
```

### Issue: "Admin login not working"

**Solution:** Verify admin token is using correct secret:

```javascript
// Check .env.admin
ADMIN_JWT_SECRET=your-super-secret-admin-jwt-key

// Verify in api/middleware/subdomainAuth.js
const ADMIN_JWT_SECRET = process.env.ADMIN_JWT_SECRET;
```

### Issue: "DNS not resolving subdomains"

**Solution:** Check DNS propagation:

```bash
# Check if DNS is working
nslookup api.faredown.com
nslookup admin.faredown.com

# Can take up to 48 hours for DNS propagation
```

---

## 📊 Next Steps

Once basic subdomain separation is working:

1. **Enable IP Whitelisting** (optional)
   ```bash
   # In .env.admin
   ADMIN_IP_WHITELIST=enabled
   ADMIN_ALLOWED_IPS=203.0.113.0,203.0.113.1
   ```

2. **Enable 2FA for Admin** (optional)
   ```bash
   # In .env.admin
   REQUIRE_2FA=true
   ```

3. **Set Up Monitoring**
   - Configure Sentry for error tracking
   - Set up log aggregation (DataDog, LogRocket)
   - Monitor subdomain traffic separately

4. **Optimize for Production**
   - Consider Option B (separate servers) for better isolation
   - Implement rate limiting per subdomain
   - Add admin access audit logging

---

## 📚 Additional Resources

- Full Implementation Guide: [SUBDOMAIN_SEPARATION_IMPLEMENTATION.md](./SUBDOMAIN_SEPARATION_IMPLEMENTATION.md)
- Architecture Options: See "Option A vs Option B" in main guide
- Security Best Practices: See "Security Considerations" section
- Deployment Guide: See "Deployment Steps" section

---

## 🎉 Expected Result

After implementation:

- ✅ `api.faredown.com` serves only public customer APIs
- ✅ `admin.faredown.com` serves admin panel + admin APIs
- ✅ Admin routes return 403 when accessed via api subdomain
- ✅ Clean separation with shared database
- ✅ Independent CORS and security policies per subdomain

**Time to Implement:** 2-4 hours (including testing)
