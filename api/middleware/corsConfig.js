/**
 * CORS Configuration with Explicit Allowlist
 * Production-safe CORS handling for Faredown API
 */

const corsAllowedOrigins = [
  // Production domains
  'https://faredown.com',
  'https://www.faredown.com',
  
  // Builder.codes preview environments
  'https://preview.builder.codes',
  'https://test.builder.codes',
  
  // Development environments
  'http://localhost:3000',
  'http://localhost:8080',
  'http://localhost:5173',
  
  // Render deployments
  'https://faredown-booking.onrender.com'
];

// Builder.codes dynamic subdomain pattern
const builderCodesPattern = /^https:\/\/[a-zA-Z0-9-]+\.builder\.codes$/;

/**
 * Check if origin is allowed
 * @param {string} origin - Request origin
 * @returns {boolean} - Whether origin is allowed
 */
function isOriginAllowed(origin) {
  if (!origin) return false;
  
  // Check explicit allowlist
  if (corsAllowedOrigins.includes(origin)) {
    return true;
  }
  
  // Check builder.codes pattern
  if (builderCodesPattern.test(origin)) {
    return true;
  }
  
  return false;
}

/**
 * CORS middleware configuration
 */
const corsConfig = {
  origin: function (origin, callback) {
    // Allow requests with no origin (mobile apps, postman, etc.)
    if (!origin) return callback(null, true);
    
    if (isOriginAllowed(origin)) {
      callback(null, true);
    } else {
      console.warn(`CORS: Blocked request from origin: ${origin}`);
      callback(new Error(`CORS: Origin ${origin} not allowed`), false);
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'X-Request-ID',
    'X-Requested-With',
    'Accept',
    'Origin'
  ],
  exposedHeaders: ['X-Request-ID', 'X-RateLimit-Remaining'],
  maxAge: 86400 // 24 hours
};

export default {
  corsConfig,
  corsAllowedOrigins,
  isOriginAllowed
};
