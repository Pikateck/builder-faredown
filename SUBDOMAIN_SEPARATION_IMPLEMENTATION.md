# 🚀 Subdomain Separation Implementation Guide

## 📋 Overview

This guide outlines the implementation strategy for separating Admin Panel and Live APIs onto different subdomains:

- **`api.faredown.com`** - Live/Public APIs for customer-facing application
- **`admin.faredown.com`** - Admin Panel UI + Admin APIs for backoffice team

## 🎯 Architecture Goals

1. **Security Isolation**: Admin APIs accessible only via admin subdomain
2. **Clean Separation**: Customer app never sees admin endpoints
3. **Flexible Deployment**: Can deploy admin and live independently
4. **Shared Database**: Single source of truth for all data
5. **Cross-Domain Auth**: Secure authentication across subdomains

---

## 🏗️ Architecture Options

### **Option A: Single Server with Subdomain Routing** (Recommended for Quick Start)

```
┌─────────────────────────────────────────────────┐
│           Load Balancer / Reverse Proxy         │
│              (Netlify / Nginx)                  │
└─────────────────────────────────────────────────┘
                        │
        ┌───────────────┴───────────────┐
        │                               │
        ▼                               ▼
┌───────────────┐              ┌────────────────┐
│ api.faredown  │              │ admin.faredown │
│     .com      │              │     .com       │
│               │              │                │
│ Routes to:    │              │ Routes to:     │
│ /api/flights  │              │ /api/admin/*   │
│ /api/hotels   │              │ + Admin UI     │
│ /api/bookings │              │                │
└───────────────┘              └────────────────┘
        │                               │
        └───────────────┬───────────────┘
                        ▼
              ┌──────────────────┐
              │  Single Backend  │
              │  Express Server  │
              │   (Port 3001)    │
              └──────────────────┘
                        │
                        ▼
              ┌──────────────────┐
              │    PostgreSQL    │
              │     Database     │
              └──────────────────┘
```

**Pros:**
- Simple to implement
- Single deployment
- Shared server resources
- Easy local development

**Cons:**
- Admin and Live share same server instance
- Less isolation between concerns

### **Option B: Separate Server Instances** (Recommended for Production)

```
┌─────────────────────────────────────────────────┐
│           Load Balancer / Reverse Proxy         │
│              (Netlify / Nginx)                  │
└─────────────────────────────────────────────────┘
                        │
        ┌───────────────┴───────────────┐
        │                               │
        ▼                               ▼
┌───────────────┐              ┌────────────────┐
│ api.faredown  │              │ admin.faredown │
│     .com      │              │     .com       │
└───────────────┘              └────────────────┘
        │                               │
        ▼                               ▼
┌───────────────┐              ┌────────────────┐
│  Live API     │              │  Admin Server  │
│  Server       │              │  (API + UI)    │
│  Port 3001    │              │  Port 3002     │
│               │              │                │
│ Public routes │              │ Admin routes   │
│ only          │              │ + Frontend     │
└───────────────┘              └────────────────┘
        │                               │
        └───────────────┬───────────────┘
                        ▼
              ┌──────────────────┐
              │    PostgreSQL    │
              │     Database     │
              └──────────────────┘
```

**Pros:**
- Complete isolation
- Independent scaling
- Better security
- Can deploy separately

**Cons:**
- More complex setup
- Multiple deployments to manage

---

## 🔧 Implementation Steps

### **Step 1: Environment Variables Configuration**

#### **For Live API (`api.faredown.com`)**

Create `.env.live`:

```bash
# Server Configuration
NODE_ENV=production
PORT=3001
SERVER_TYPE=live

# API Configuration
API_BASE_URL=https://api.faredown.com
VITE_API_BASE_URL=https://api.faredown.com

# Database
DATABASE_URL=postgresql://faredown_user:password@host/faredown_booking_db

# JWT Configuration
JWT_SECRET=your-live-jwt-secret-key
JWT_EXPIRES_IN=7d

# CORS Configuration
ALLOWED_ORIGINS=https://faredown.com,https://www.faredown.com

# External APIs
AMADEUS_API_KEY=your-amadeus-key
HOTELBEDS_API_KEY=your-hotelbeds-key

# Disable Admin Routes
ENABLE_ADMIN_ROUTES=false
```

#### **For Admin Panel (`admin.faredown.com`)**

Create `.env.admin`:

```bash
# Server Configuration
NODE_ENV=production
PORT=3002
SERVER_TYPE=admin

# API Configuration
API_BASE_URL=https://admin.faredown.com
VITE_API_BASE_URL=https://admin.faredown.com/api
VITE_ADMIN_API_BASE_URL=https://admin.faredown.com/api/admin

# Database (same as live)
DATABASE_URL=postgresql://faredown_user:password@host/faredown_booking_db

# JWT Configuration (separate secret for admin)
JWT_SECRET=your-admin-jwt-secret-key
ADMIN_JWT_SECRET=your-super-secret-admin-jwt-key
JWT_EXPIRES_IN=8h
ADMIN_SESSION_DURATION=8h

# CORS Configuration (allow admin subdomain)
ALLOWED_ORIGINS=https://admin.faredown.com

# Security
ENABLE_ADMIN_ROUTES=true
ENABLE_LIVE_ROUTES=false
ADMIN_IP_WHITELIST=enabled # Optional
REQUIRE_2FA=true # Optional

# External APIs (same keys, but admin might need extended access)
AMADEUS_API_KEY=your-amadeus-key
HOTELBEDS_API_KEY=your-hotelbeds-key
```

---

### **Step 2: Backend Server Configuration**

#### **Option A: Single Server with Subdomain Routing**

Update `api/server.js`:

```javascript
// Add subdomain detection middleware
app.use((req, res, next) => {
  const host = req.get('host') || '';
  const subdomain = host.split('.')[0];
  
  req.subdomain = subdomain;
  req.isAdminSubdomain = subdomain === 'admin';
  req.isApiSubdomain = subdomain === 'api';
  
  console.log(`Request from subdomain: ${subdomain}`);
  next();
});

// Block admin routes on non-admin subdomains
app.use('/api/admin/*', (req, res, next) => {
  if (!req.isAdminSubdomain) {
    return res.status(403).json({
      error: 'Forbidden',
      message: 'Admin routes accessible only via admin.faredown.com'
    });
  }
  next();
});

// Update CORS based on subdomain
const corsOptions = {
  origin: (origin, callback) => {
    const allowedOrigins = {
      admin: ['https://admin.faredown.com'],
      api: ['https://faredown.com', 'https://www.faredown.com']
    };
    
    const subdomain = req?.subdomain || 'api';
    const allowed = allowedOrigins[subdomain] || [];
    
    if (allowed.includes(origin) || !origin) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
};

app.use(cors(corsOptions));

// Mount routes conditionally
if (process.env.ENABLE_ADMIN_ROUTES !== 'false') {
  app.use("/api/admin", authenticateToken, requireAdmin, auditLogger, adminRoutes);
  app.use("/api/admin/bookings", authenticateToken, requireAdmin, adminBookingsRoutes);
  // ... other admin routes
}

if (process.env.ENABLE_LIVE_ROUTES !== 'false') {
  app.use("/api/flights", flightRoutes);
  app.use("/api/hotels", hotelRoutes);
  app.use("/api/bookings", authenticateToken, bookingRoutes);
  // ... other live routes
}
```

#### **Option B: Separate Server Files**

Create `api/server-live.js` (for Live API):

```javascript
/**
 * Live API Server - Public customer-facing APIs
 * Runs on api.faredown.com
 */
const express = require('express');
const cors = require('cors');
require('dotenv').config({ path: '.env.live' });

const app = express();

// CORS for customer domains only
app.use(cors({
  origin: ['https://faredown.com', 'https://www.faredown.com'],
  credentials: true
}));

// Mount ONLY public/live routes
app.use("/api/flights", require('./routes/flights'));
app.use("/api/hotels", require('./routes/hotels'));
app.use("/api/bookings", require('./routes/bookings'));
app.use("/api/bargain", require('./routes/bargain'));
app.use("/api/auth", require('./routes/auth'));
app.use("/api/oauth", require('./routes/oauth-simple'));
// ... other public routes

// Block admin routes entirely
app.use('/api/admin/*', (req, res) => {
  res.status(404).json({ error: 'Not found' });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`✅ Live API Server running on port ${PORT}`);
  console.log(`🌐 Accessible via: https://api.faredown.com`);
});

module.exports = app;
```

Create `api/server-admin.js` (for Admin Panel + APIs):

```javascript
/**
 * Admin Server - Backoffice panel + Admin APIs
 * Runs on admin.faredown.com
 */
const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config({ path: '.env.admin' });

const app = express();

// CORS for admin domain only
app.use(cors({
  origin: ['https://admin.faredown.com'],
  credentials: true
}));

// Serve admin frontend static files
app.use(express.static(path.join(__dirname, '../dist-admin')));

// Mount ONLY admin routes
const { authenticateToken, requireAdmin } = require('./middleware/auth');
const { auditLogger } = require('./middleware/audit');

app.use("/api/admin", authenticateToken, requireAdmin, auditLogger, require('./routes/admin'));
app.use("/api/admin/bookings", authenticateToken, requireAdmin, require('./routes/admin-bookings'));
app.use("/api/admin/ai", authenticateToken, requireAdmin, require('./routes/admin-ai'));
// ... other admin routes

// Some shared routes that admin needs (read-only access to live data)
app.use("/api/bookings", authenticateToken, require('./routes/bookings'));
app.use("/api/users", authenticateToken, require('./routes/users'));

// Block public routes not needed for admin
app.use('/api/bargain', (req, res) => {
  res.status(403).json({ error: 'Use admin.faredown.com for admin access' });
});

// Serve admin frontend for all non-API routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../dist-admin/index.html'));
});

const PORT = process.env.PORT || 3002;
app.listen(PORT, () => {
  console.log(`✅ Admin Server running on port ${PORT}`);
  console.log(`🌐 Accessible via: https://admin.faredown.com`);
});

module.exports = app;
```

---

### **Step 3: Frontend Configuration**

#### **Create API Configuration Helper**

Update `client/lib/api.ts`:

```typescript
/**
 * Determine API base URL based on context
 */
const getApiBaseUrl = (): string => {
  // Server-side rendering
  if (typeof window === 'undefined') {
    return process.env.VITE_API_BASE_URL || 'http://localhost:3001/api';
  }

  // Check if we're in admin context
  const isAdmin = window.location.hostname.includes('admin.');
  
  if (isAdmin) {
    // Admin panel uses admin subdomain for APIs
    return import.meta.env.VITE_ADMIN_API_BASE_URL || 
           'https://admin.faredown.com/api';
  } else {
    // Customer app uses api subdomain
    return import.meta.env.VITE_API_BASE_URL || 
           'https://api.faredown.com';
  }
};

// Update API_CONFIG
export const API_CONFIG = {
  BASE_URL: getApiBaseUrl(),
  ADMIN_BASE_URL: import.meta.env.VITE_ADMIN_API_BASE_URL || 'https://admin.faredown.com/api',
  LIVE_BASE_URL: import.meta.env.VITE_API_BASE_URL || 'https://api.faredown.com',
  TIMEOUT: 10000,
  HEADERS: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
  IS_ADMIN_CONTEXT: typeof window !== 'undefined' && window.location.hostname.includes('admin.'),
};

// Create admin-specific API client
export class AdminApiClient extends ApiClient {
  constructor() {
    super({
      ...API_CONFIG,
      BASE_URL: API_CONFIG.ADMIN_BASE_URL,
    });
  }

  // Override to always use admin token
  private getHeaders(customHeaders: Record<string, string> = {}): Record<string, string> {
    const headers = super.getHeaders(customHeaders);
    
    // Use admin token from admin-specific storage
    const adminToken = localStorage.getItem('admin_token');
    if (adminToken) {
      headers.Authorization = `Bearer ${adminToken}`;
    }
    
    return headers;
  }
}

// Export appropriate client based on context
export const apiClient = API_CONFIG.IS_ADMIN_CONTEXT 
  ? new AdminApiClient() 
  : new ApiClient(API_CONFIG);
```

#### **Update Admin Pages to Use Admin Client**

Update `client/pages/admin/AdminDashboard.tsx`:

```typescript
import { AdminApiClient } from '@/lib/api';

const adminApi = new AdminApiClient();

// Use adminApi for all admin operations
const fetchAdminData = async () => {
  const response = await adminApi.get('/admin/dashboard');
  // ...
};
```

---

### **Step 4: Authentication Across Subdomains**

#### **Cookie Configuration for Cross-Subdomain Auth**

Update `api/middleware/auth.js`:

```javascript
// Set cookie options based on environment
const getCookieOptions = () => {
  const isProduction = process.env.NODE_ENV === 'production';
  
  return {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'none' : 'lax',
    domain: isProduction ? '.faredown.com' : undefined, // Share across subdomains
    maxAge: 8 * 60 * 60 * 1000, // 8 hours
  };
};

// Generate admin token with different secret
const generateAdminToken = (user) => {
  return jwt.sign(
    {
      userId: user.id,
      email: user.email,
      role: user.role,
      type: 'admin',
    },
    ADMIN_JWT_SECRET,
    { expiresIn: process.env.ADMIN_SESSION_DURATION || '8h' }
  );
};

// Admin login endpoint
router.post('/admin/auth/login', async (req, res) => {
  // ... authentication logic
  
  const adminToken = generateAdminToken(user);
  
  res.cookie('admin_token', adminToken, getCookieOptions());
  
  res.json({
    success: true,
    token: adminToken,
    user: {
      id: user.id,
      email: user.email,
      role: user.role,
    }
  });
});
```

#### **Update Admin Auth Context**

Create `client/contexts/AdminAuthContext.tsx`:

```typescript
import { createContext, useContext, useEffect, useState } from 'react';
import { AdminApiClient } from '@/lib/api';

interface AdminUser {
  id: number;
  email: string;
  role: string;
}

interface AdminAuthContextType {
  user: AdminUser | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
}

const AdminAuthContext = createContext<AdminAuthContextType | undefined>(undefined);

export const AdminAuthProvider = ({ children }) => {
  const [user, setUser] = useState<AdminUser | null>(null);
  const adminApi = new AdminApiClient();

  const login = async (email: string, password: string) => {
    const response = await adminApi.post('/admin/auth/login', { email, password });
    
    if (response.success) {
      localStorage.setItem('admin_token', response.token);
      setUser(response.user);
    }
  };

  const logout = () => {
    localStorage.removeItem('admin_token');
    setUser(null);
  };

  useEffect(() => {
    // Verify admin token on load
    const verifyAdminAuth = async () => {
      const token = localStorage.getItem('admin_token');
      if (token) {
        try {
          const response = await adminApi.get('/admin/auth/verify');
          if (response.success) {
            setUser(response.user);
          } else {
            logout();
          }
        } catch {
          logout();
        }
      }
    };

    verifyAdminAuth();
  }, []);

  return (
    <AdminAuthContext.Provider value={{ user, login, logout, isAuthenticated: !!user }}>
      {children}
    </AdminAuthContext.Provider>
  );
};

export const useAdminAuth = () => {
  const context = useContext(AdminAuthContext);
  if (!context) {
    throw new Error('useAdminAuth must be used within AdminAuthProvider');
  }
  return context;
};
```

---

### **Step 5: Build & Deployment Configuration**

#### **Update `package.json` with Build Scripts**

```json
{
  "scripts": {
    "dev": "vite",
    "dev:admin": "vite --mode admin",
    "build": "vite build",
    "build:admin": "vite build --mode admin --outDir dist-admin",
    "build:all": "npm run build && npm run build:admin",
    "start:live": "NODE_ENV=production node api/server-live.js",
    "start:admin": "NODE_ENV=production node api/server-admin.js",
    "start:all": "concurrently \"npm run start:live\" \"npm run start:admin\""
  }
}
```

#### **Create Vite Admin Mode Config**

Create `vite.config.admin.ts`:

```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  base: '/',
  build: {
    outDir: 'dist-admin',
    sourcemap: false,
  },
  define: {
    'import.meta.env.VITE_API_BASE_URL': JSON.stringify('https://admin.faredown.com/api'),
    'import.meta.env.VITE_ADMIN_API_BASE_URL': JSON.stringify('https://admin.faredown.com/api/admin'),
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './client'),
    },
  },
});
```

#### **Netlify Configuration** (if using Netlify)

Create `netlify.toml`:

```toml
# Live Customer App
[[redirects]]
  from = "/api/*"
  to = "https://api.faredown.com/:splat"
  status = 200
  force = true
  headers = {X-From = "Netlify"}

# Admin Panel (different site)
[[redirects]]
  from = "/api/*"
  to = "https://admin.faredown.com/:splat"
  status = 200
  force = true
  conditions = {Host = ["admin.faredown.com"]}
```

---

### **Step 6: DNS Configuration**

#### **DNS Records Required**

```
# Live API Subdomain
Type: A or CNAME
Name: api.faredown.com
Value: <your-server-ip> or <your-hosting-provider>

# Admin Subdomain  
Type: A or CNAME
Name: admin.faredown.com
Value: <your-admin-server-ip> or <your-hosting-provider>

# SSL Certificates
- Generate SSL for api.faredown.com
- Generate SSL for admin.faredown.com
```

---

## 🔒 Security Considerations

### **1. IP Whitelisting for Admin (Optional)**

```javascript
// api/middleware/adminSecurity.js
const adminIpWhitelist = process.env.ADMIN_IP_WHITELIST?.split(',') || [];

const checkAdminIp = (req, res, next) => {
  if (process.env.ADMIN_IP_WHITELIST === 'enabled') {
    const clientIp = req.ip || req.connection.remoteAddress;
    
    if (!adminIpWhitelist.includes(clientIp)) {
      return res.status(403).json({
        error: 'Access denied',
        message: 'Your IP is not whitelisted for admin access'
      });
    }
  }
  
  next();
};

// Apply to admin routes
app.use('/api/admin/*', checkAdminIp);
```

### **2. Rate Limiting Per Subdomain**

```javascript
const adminRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: 'Too many admin requests from this IP',
  standardHeaders: true,
  legacyHeaders: false,
});

const liveRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1000, // Higher limit for customer app
  message: 'Too many requests from this IP',
});

// Apply based on subdomain
app.use((req, res, next) => {
  if (req.isAdminSubdomain) {
    adminRateLimit(req, res, next);
  } else {
    liveRateLimit(req, res, next);
  }
});
```

### **3. 2FA for Admin (Optional)**

```javascript
// api/routes/admin-auth.js
const speakeasy = require('speakeasy');
const QRCode = require('qrcode');

router.post('/admin/auth/setup-2fa', authenticateToken, requireAdmin, async (req, res) => {
  const secret = speakeasy.generateSecret({
    name: `Faredown Admin (${req.user.email})`
  });
  
  // Save secret to user record
  await db.query(
    'UPDATE users SET two_factor_secret = $1 WHERE id = $2',
    [secret.base32, req.user.userId]
  );
  
  const qrCodeUrl = await QRCode.toDataURL(secret.otpauth_url);
  
  res.json({
    success: true,
    qrCode: qrCodeUrl,
    secret: secret.base32
  });
});

router.post('/admin/auth/verify-2fa', async (req, res) => {
  const { email, password, token } = req.body;
  
  // Verify password first
  const user = await authenticateUser(email, password);
  
  // Then verify 2FA token
  const verified = speakeasy.totp.verify({
    secret: user.two_factor_secret,
    encoding: 'base32',
    token: token
  });
  
  if (verified) {
    const adminToken = generateAdminToken(user);
    res.json({ success: true, token: adminToken });
  } else {
    res.status(401).json({ error: 'Invalid 2FA token' });
  }
});
```

---

## ✅ Testing Checklist

### **Development Testing**

- [ ] Local dev server works with subdomain emulation
- [ ] Admin routes blocked on api.faredown.local
- [ ] Public routes work on api.faredown.local
- [ ] Admin panel loads on admin.faredown.local
- [ ] CORS configured correctly for each subdomain

### **Staging Testing**

- [ ] DNS records pointing correctly
- [ ] SSL certificates active for both subdomains
- [ ] api.staging.faredown.com serves public APIs
- [ ] admin.staging.faredown.com serves admin panel
- [ ] Authentication works across subdomains
- [ ] Admin token validates correctly
- [ ] Public token validates correctly

### **Production Testing**

- [ ] api.faredown.com accessible from customer app
- [ ] admin.faredown.com accessible from office network
- [ ] Admin routes return 403/404 on api.faredown.com
- [ ] Public routes work normally
- [ ] No CORS errors in browser console
- [ ] Admin login flow complete
- [ ] Session persistence works
- [ ] IP whitelisting active (if enabled)
- [ ] 2FA required for admin (if enabled)
- [ ] Rate limiting working per subdomain

---

## 🚀 Deployment Steps

### **Step-by-Step Rollout**

1. **Prepare Environment Files**
   ```bash
   cp .env .env.live
   cp .env .env.admin
   # Edit both files with appropriate values
   ```

2. **Update Backend Code**
   ```bash
   # If using Option A (single server)
   git checkout -b feature/subdomain-separation
   # Update api/server.js with subdomain logic
   
   # If using Option B (separate servers)
   # Create api/server-live.js and api/server-admin.js
   ```

3. **Update Frontend Code**
   ```bash
   # Update client/lib/api.ts
   # Create AdminApiClient
   # Update admin pages to use AdminApiClient
   ```

4. **Build Applications**
   ```bash
   npm run build # Customer app
   npm run build:admin # Admin panel
   ```

5. **Deploy to Hosting**
   ```bash
   # Deploy to your hosting provider
   # Configure DNS records
   # Set up SSL certificates
   ```

6. **Verify Deployment**
   ```bash
   curl https://api.faredown.com/health
   curl https://admin.faredown.com/api/admin/health
   ```

---

## 📊 Monitoring & Logging

### **Subdomain-Specific Logging**

```javascript
// api/middleware/logging.js
const morgan = require('morgan');

// Custom morgan token for subdomain
morgan.token('subdomain', (req) => req.subdomain || 'unknown');

// Different log formats per subdomain
app.use((req, res, next) => {
  if (req.isAdminSubdomain) {
    morgan(':subdomain :method :url :status :response-time ms - :res[content-length] - Admin: :remote-user', {
      stream: adminLogStream
    })(req, res, next);
  } else {
    morgan('combined', {
      stream: liveLogStream
    })(req, res, next);
  }
});
```

---

## 🎉 Expected Results

### **For Customers (faredown.com → api.faredown.com)**
- Clean, fast API responses
- No admin routes exposed
- Secure authentication
- No admin clutter

### **For Admin Team (admin.faredown.com)**
- Secure, separate admin panel
- Full admin dashboard
- Real-time data sync
- Professional interface
- Enhanced security (2FA, IP whitelist)

### **For Infrastructure**
- Clear separation of concerns
- Independent scaling
- Better monitoring
- Enhanced security
- Flexible deployment

---

## 🆘 Troubleshooting

### **Issue: CORS Errors**
```javascript
// Check CORS configuration
// Ensure origin includes subdomain
origin: ['https://admin.faredown.com', 'https://api.faredown.com']
```

### **Issue: Admin Routes Not Accessible**
```javascript
// Verify subdomain detection
console.log('Subdomain:', req.subdomain);
console.log('Is Admin:', req.isAdminSubdomain);
```

### **Issue: Authentication Fails Across Subdomains**
```javascript
// Check cookie domain setting
domain: '.faredown.com' // Note the leading dot
sameSite: 'none',
secure: true
```

---

## 📝 Summary

This implementation provides:

1. ✅ **Clean Separation**: Admin and Live APIs on different subdomains
2. ✅ **Enhanced Security**: Separate tokens, IP whitelisting, 2FA
3. ✅ **Flexible Deployment**: Can deploy independently or together
4. ✅ **Shared Database**: Single source of truth
5. ✅ **Production Ready**: Complete with monitoring, logging, security

Choose **Option A** for quick implementation or **Option B** for production-grade isolation.
