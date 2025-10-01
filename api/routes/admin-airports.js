/**
 * Admin Airports API Routes
 * Provides airport master data for admin dropdowns and forms
 */

const express = require("express");
const router = express.Router();
const db = require("../database/connection");
const { authenticateToken, requireAdmin } = require("../middleware/auth");

// Environment configuration
const USE_MOCK_AIRPORTS = process.env.USE_MOCK_AIRPORTS === "true";
const AIRPORTS_MAX_LIMIT = parseInt(process.env.AIRPORTS_MAX_LIMIT) || 200;
const AIRPORTS_MIN_QUERY = parseInt(process.env.AIRPORTS_MIN_QUERY) || 2;

// Apply authentication middleware to all admin routes
router.use(authenticateToken);
router.use(requireAdmin);

// Rate limiting store (simple in-memory for now)
const rateLimitStore = new Map();
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const RATE_LIMIT_MAX_REQUESTS = 60;

// Rate limiting middleware
const rateLimitMiddleware = (req, res, next) => {
  const clientIP = req.ip || req.connection.remoteAddress || "unknown";
  const now = Date.now();
  
  // Clean old entries
  for (const [ip, data] of rateLimitStore.entries()) {
    if (now - data.firstRequest > RATE_LIMIT_WINDOW) {
      rateLimitStore.delete(ip);
    }
  }
  
  // Check current IP
  if (!rateLimitStore.has(clientIP)) {
    rateLimitStore.set(clientIP, { firstRequest: now, count: 1 });
    return next();
  }
  
  const ipData = rateLimitStore.get(clientIP);
  if (now - ipData.firstRequest > RATE_LIMIT_WINDOW) {
    // Reset window
    rateLimitStore.set(clientIP, { firstRequest: now, count: 1 });
    return next();
  }
  
  if (ipData.count >= RATE_LIMIT_MAX_REQUESTS) {
    const retryAfterSeconds = Math.ceil((RATE_LIMIT_WINDOW - (now - ipData.firstRequest)) / 1000);
    res.set('Retry-After', retryAfterSeconds.toString());
    return res.status(429).json({
      error: "Rate limit exceeded",
      message: `Maximum ${RATE_LIMIT_MAX_REQUESTS} requests per minute allowed`,
      retryAfter: retryAfterSeconds
    });
  }
  
  ipData.count++;
  next();
};

// Mock airport data for development fallback - standardized country names
const mockAirports = [
  { iata: 'BOM', name: 'Chhatrapati Shivaji Maharaj International', city: 'Mumbai', country: 'India', iso_country: 'IN' },
  { iata: 'DEL', name: 'Indira Gandhi International', city: 'Delhi', country: 'India', iso_country: 'IN' },
  { iata: 'DXB', name: 'Dubai International', city: 'Dubai', country: 'United Arab Emirates', iso_country: 'AE' },
  { iata: 'LHR', name: 'London Heathrow', city: 'London', country: 'United Kingdom', iso_country: 'GB' },
  { iata: 'JFK', name: 'John F. Kennedy International', city: 'New York', country: 'United States', iso_country: 'US' },
  { iata: 'SIN', name: 'Singapore Changi', city: 'Singapore', country: 'Singapore', iso_country: 'SG' },
  { iata: 'CDG', name: 'Charles de Gaulle', city: 'Paris', country: 'France', iso_country: 'FR' },
  { iata: 'SYD', name: 'Sydney Kingsford Smith', city: 'Sydney', country: 'Australia', iso_country: 'AU' },
  { iata: 'LAX', name: 'Los Angeles International', city: 'Los Angeles', country: 'United States', iso_country: 'US' },
  { iata: 'FRA', name: 'Frankfurt am Main', city: 'Frankfurt', country: 'Germany', iso_country: 'DE' },
  { iata: 'BLR', name: 'Kempegowda International', city: 'Bangalore', country: 'India', iso_country: 'IN' },
  { iata: 'MAA', name: 'Chennai International', city: 'Chennai', country: 'India', iso_country: 'IN' },
  { iata: 'CCU', name: 'Netaji Subhas Chandra Bose International', city: 'Kolkata', country: 'India', iso_country: 'IN' },
  { iata: 'HYD', name: 'Rajiv Gandhi International', city: 'Hyderabad', country: 'India', iso_country: 'IN' },
  { iata: 'AMD', name: 'Sardar Vallabhbhai Patel International', city: 'Ahmedabad', country: 'India', iso_country: 'IN' },
];

/**
 * Get airports with search functionality
 * GET /api/admin/airports?q=<query>&limit=<limit>&offset=<offset>
 */
router.get("/", rateLimitMiddleware, async (req, res) => {
  try {
    console.log("✈️ Admin Airports API Request:", req.query);

    // Input validation
    const q = req.query.q ? req.query.q.toString().trim() : "";
    let limit = parseInt(req.query.limit) || 50;
    let offset = parseInt(req.query.offset) || 0;

    // Clamp limits
    limit = Math.min(Math.max(limit, 1), AIRPORTS_MAX_LIMIT);
    
    // Reject negative offset
    if (offset < 0) {
      return res.status(400).json({
        error: "Invalid offset",
        message: "Offset must be non-negative"
      });
    }

    // Minimum query length validation - return 400 for short queries
    if (q && q.length < AIRPORTS_MIN_QUERY) {
      return res.status(400).json({
        error: "Query too short",
        message: `Query must be at least ${AIRPORTS_MIN_QUERY} characters`,
        query: q,
        minLength: AIRPORTS_MIN_QUERY
      });
    }

    // Set cache headers for successful responses
    res.set('Cache-Control', 'private, max-age=60');

    // Try database first
    if (db && !USE_MOCK_AIRPORTS) {
      try {
        let searchResult, countResult;

        if (q) {
          // Check if search_airports function exists, fallback to direct query
          try {
            searchResult = await db.query(
              'SELECT iata, name, city, country, iso_country FROM search_airports($1, $2, $3)',
              [q, limit, offset]
            );
          } catch (funcError) {
            console.log("📝 search_airports function not found, using direct query");
            // Fallback to direct table query with standardized country names
            searchResult = await db.query(
              `SELECT iata, name, city, country,
                      COALESCE(iso_country, country_code) as iso_country
               FROM airport_master
               WHERE is_active = true
                 AND (name ILIKE $1 OR iata ILIKE $1 OR city ILIKE $1 OR country ILIKE $1)
               ORDER BY
                 CASE WHEN iata ILIKE $1 THEN 1 ELSE 2 END,
                 name
               LIMIT $2 OFFSET $3`,
              [`%${q}%`, limit, offset]
            );
          }

          countResult = await db.query(
            `SELECT COUNT(*)::int as total 
             FROM airport_master 
             WHERE is_active = true 
               AND (name ILIKE $1 OR iata ILIKE $1 OR city ILIKE $1 OR country ILIKE $1)`,
            [`%${q}%`]
          );
        } else {
          // Get all airports (common ones first) with ISO country codes
          searchResult = await db.query(
            `SELECT iata, name, city, country,
                    COALESCE(iso_country, country_code) as iso_country
             FROM airport_master
             WHERE is_active = true
             ORDER BY
               CASE
                 WHEN iata IN ('BOM', 'DEL', 'DXB', 'LHR', 'JFK', 'SIN', 'CDG', 'SYD', 'LAX', 'FRA') THEN 1
                 ELSE 2
               END,
               name
             LIMIT $1 OFFSET $2`,
            [limit, offset]
          );

          countResult = await db.query(
            'SELECT COUNT(*)::int as total FROM airport_master WHERE is_active = true'
          );
        }

        const items = searchResult.rows || [];
        const total = countResult.rows[0]?.total || 0;

        console.log(`✅ Found ${items.length} airports from database (total: ${total})`);

        return res.json({
          items,
          total,
          query: q,
          limit,
          offset
        });

      } catch (dbError) {
        console.error("❌ Database query failed:", dbError.message);
        
        // In production, fail fast - don't return mock data
        if (process.env.NODE_ENV === "production" || !USE_MOCK_AIRPORTS) {
          return res.status(503).json({
            error: "Service unavailable",
            message: "Airport database temporarily unavailable",
            code: "DB_CONNECTION_FAILED"
          });
        }
        
        console.warn("⚠️ Falling back to mock data (development only)");
        // Fall through to mock data in development
      }
    }

    // Mock data fallback (development only)
    if (USE_MOCK_AIRPORTS || process.env.NODE_ENV !== "production") {
      console.log("🔄 Using mock airport data");
      
      let filteredAirports = mockAirports;
      if (q) {
        const searchTerm = q.toLowerCase();
        filteredAirports = mockAirports.filter(airport => 
          airport.iata.toLowerCase().includes(searchTerm) ||
          airport.name.toLowerCase().includes(searchTerm) ||
          airport.city.toLowerCase().includes(searchTerm) ||
          airport.country.toLowerCase().includes(searchTerm)
        );
      }

      // Apply pagination
      const paginatedResults = filteredAirports.slice(offset, offset + limit);

      return res.json({
        items: paginatedResults,
        total: filteredAirports.length,
        query: q,
        limit,
        offset,
        _mock: true // Indicate mock data
      });
    } else {
      // Production mode with mock disabled and DB failed
      return res.status(503).json({
        error: "Service unavailable",
        message: "Airport service temporarily unavailable",
        code: "SERVICE_UNAVAILABLE"
      });
    }

  } catch (error) {
    console.error("❌ Admin Airports API error:", error);
    return res.status(500).json({
      error: "Internal server error",
      message: "Failed to fetch airports",
      code: "INTERNAL_ERROR"
    });
  }
});

/**
 * Health check endpoint for airport service
 * GET /api/admin/airports/health
 */
router.get("/health", async (req, res) => {
  try {
    const dbConnected = !!db;
    let dbStatus = "disconnected";
    
    if (dbConnected) {
      try {
        await db.query('SELECT 1');
        dbStatus = "connected";
      } catch (err) {
        dbStatus = "error";
      }
    }

    res.json({
      status: "ok",
      database: dbStatus,
      mockMode: USE_MOCK_AIRPORTS,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      status: "error",
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

module.exports = router;
