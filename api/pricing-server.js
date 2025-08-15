/**
 * Simple Pricing API Server
 * Focuses only on the new pricing and markup endpoints
 */

const express = require("express");
const cors = require("cors");
const { Pool } = require('pg');

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

// CORS configuration
const corsOptions = {
  origin: [
    "https://55e69d5755db4519a9295a29a1a55930-aaf2790235d34f3ab48afa56a.fly.dev",
    "http://localhost:3000",
    "http://localhost:5173",
    "http://localhost:8080",
  ],
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
};

app.use(cors(corsOptions));

// Database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://faredown_user:VFEkJ35EShYkok2OfgabKLRCKIluidqb@dpg-d2086mndiees739731t0-a.singapore-postgres.render.com/faredown_booking_db',
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

// Import pricing routes
const pricingRoutes = require("./routes/pricing");

// Health check endpoint
app.get("/health", async (req, res) => {
  try {
    // Check database health
    const result = await pool.query('SELECT 1');
    
    res.json({
      status: "healthy",
      timestamp: new Date().toISOString(),
      database: "connected",
      tables_check: "ok"
    });
  } catch (error) {
    res.status(500).json({
      status: "degraded",
      timestamp: new Date().toISOString(),
      database: "offline",
      error: error.message
    });
  }
});

// API information endpoint
app.get("/", (req, res) => {
  res.json({
    name: "Faredown Pricing API",
    version: "1.0.0",
    description: "Pricing Engine API for markup and bargain management",
    endpoints: {
      pricing: "/api/pricing",
      health: "/health"
    }
  });
});

// Pricing routes
app.use("/api/pricing", pricingRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error("Error:", err);
  
  res.status(err.status || 500).json({
    error: "Internal server error",
    message: process.env.NODE_ENV === "production" ? "Something went wrong" : err.message,
  });
});

// 404 handler
app.use("*", (req, res) => {
  res.status(404).json({
    error: "Not found",
    message: `Route ${req.originalUrl} not found`,
    availableRoutes: [
      "/api/pricing/quote",
      "/api/pricing/test-quote",
      "/api/pricing/markup-rules",
      "/api/pricing/promo-codes",
      "/health"
    ],
  });
});

// Initialize database and start server
async function startServer() {
  try {
    // Test database connection
    console.log("🔌 Testing database connection...");
    await pool.query('SELECT 1');
    console.log("✅ Database connected successfully");

    // Test if our new tables exist
    const tablesResult = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('markup_rules', 'promo_codes', 'bookings', 'bargain_events', 'pricing_quotes')
    `);
    
    console.log(`✅ Found ${tablesResult.rows.length}/5 pricing tables`);
    tablesResult.rows.forEach(row => {
      console.log(`   - ${row.table_name}`);
    });

    // Start server
    const server = app.listen(PORT, () => {
      console.log("\n🚀 Faredown Pricing API Server Started");
      console.log("================================");
      console.log(`📍 Server URL: http://localhost:${PORT}`);
      console.log(`🏥 Health Check: http://localhost:${PORT}/health`);
      console.log(`🧪 Test Endpoint: http://localhost:${PORT}/api/pricing/test-quote`);
      console.log(`🌍 Environment: ${process.env.NODE_ENV || "development"}`);
      console.log(`🗄️  Database: Connected to PostgreSQL`);
      console.log("================================\n");
    });

    return server;
  } catch (error) {
    console.error("❌ Failed to start server:", error);
    process.exit(1);
  }
}

// Start the server
startServer();

module.exports = app;
