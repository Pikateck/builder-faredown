/**
 * Subdomain-Based Authentication Middleware
 * Enforces admin access only via admin subdomain
 */

/**
 * Detect subdomain from request
 */
const detectSubdomain = (req, res, next) => {
  const host = req.get('host') || '';
  const parts = host.split('.');
  
  // Extract subdomain (first part before first dot)
  const subdomain = parts.length >= 2 ? parts[0] : 'www';
  
  // Set subdomain info on request
  req.subdomain = subdomain;
  req.isAdminSubdomain = subdomain === 'admin';
  req.isApiSubdomain = subdomain === 'api';
  req.isLiveSubdomain = !req.isAdminSubdomain; // api, www, or root
  
  console.log(`🌐 Request from subdomain: ${subdomain} (admin: ${req.isAdminSubdomain})`);
  next();
};

/**
 * Block admin routes on non-admin subdomains
 */
const enforceAdminSubdomain = (req, res, next) => {
  // Only allow admin routes on admin subdomain
  if (!req.isAdminSubdomain) {
    console.warn(`⚠️ Admin route access denied from ${req.subdomain} subdomain`);
    return res.status(403).json({
      error: 'Forbidden',
      message: 'Admin routes are accessible only via admin.faredown.com',
      code: 'ADMIN_SUBDOMAIN_REQUIRED',
    });
  }
  
  console.log(`✅ Admin route access granted from admin subdomain`);
  next();
};

/**
 * Block live/public routes on admin subdomain (optional - for strict separation)
 */
const enforceLiveSubdomain = (req, res, next) => {
  // Only allow live routes on non-admin subdomains
  if (req.isAdminSubdomain) {
    console.warn(`⚠️ Live route access denied from admin subdomain`);
    return res.status(403).json({
      error: 'Forbidden',
      message: 'Public routes are not accessible via admin subdomain',
      code: 'LIVE_SUBDOMAIN_REQUIRED',
    });
  }
  
  next();
};

/**
 * Get CORS origin based on subdomain
 */
const getSubdomainCorsOrigin = (req) => {
  if (req.isAdminSubdomain) {
    // Admin subdomain only allows admin.faredown.com
    return ['https://admin.faredown.com', 'http://localhost:3002'];
  } else {
    // Live subdomain allows customer domains
    return [
      'https://faredown.com',
      'https://www.faredown.com',
      'https://api.faredown.com',
      'http://localhost:3000',
      'http://localhost:5173',
    ];
  }
};

/**
 * Dynamic CORS based on subdomain
 */
const subdomainCors = (req, res, next) => {
  const origin = req.get('origin');
  const allowedOrigins = getSubdomainCorsOrigin(req);
  
  if (allowedOrigins.includes(origin) || !origin) {
    res.setHeader('Access-Control-Allow-Origin', origin || '*');
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Request-ID, X-Admin-Key');
  } else {
    console.warn(`⚠️ CORS rejected for origin: ${origin} on subdomain: ${req.subdomain}`);
  }
  
  // Handle preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  next();
};

/**
 * Subdomain-specific rate limiting
 */
const getSubdomainRateLimit = (req) => {
  if (req.isAdminSubdomain) {
    // Admin: Lower limit, stricter
    return {
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 100, // 100 requests per window
      message: 'Too many admin requests from this IP',
    };
  } else {
    // Live: Higher limit for customers
    return {
      windowMs: 15 * 60 * 1000,
      max: 1000, // 1000 requests per window
      message: 'Too many requests from this IP',
    };
  }
};

/**
 * Log subdomain access for monitoring
 */
const logSubdomainAccess = (req, res, next) => {
  const logData = {
    timestamp: new Date().toISOString(),
    subdomain: req.subdomain,
    path: req.path,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('user-agent'),
  };
  
  // In production, send to monitoring service
  if (process.env.NODE_ENV === 'production') {
    // TODO: Send to monitoring service (Sentry, DataDog, etc.)
    console.log('[SUBDOMAIN_ACCESS]', JSON.stringify(logData));
  } else {
    console.log('📊 Subdomain Access:', logData);
  }
  
  next();
};

/**
 * Admin token verification with admin-specific secret
 */
const verifyAdminToken = (req, res, next) => {
  const jwt = require('jsonwebtoken');
  const ADMIN_JWT_SECRET = process.env.ADMIN_JWT_SECRET || 'your-super-secret-admin-jwt-key';
  
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN
  
  if (!token) {
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'Admin token required',
    });
  }
  
  try {
    // Verify with admin-specific secret
    const decoded = jwt.verify(token, ADMIN_JWT_SECRET);
    
    // Ensure it's an admin token
    if (decoded.type !== 'admin') {
      throw new Error('Not an admin token');
    }
    
    req.user = decoded;
    next();
  } catch (error) {
    console.error('Admin token verification failed:', error.message);
    return res.status(403).json({
      error: 'Forbidden',
      message: 'Invalid admin token',
    });
  }
};

module.exports = {
  detectSubdomain,
  enforceAdminSubdomain,
  enforceLiveSubdomain,
  subdomainCors,
  getSubdomainRateLimit,
  logSubdomainAccess,
  verifyAdminToken,
  getSubdomainCorsOrigin,
};
