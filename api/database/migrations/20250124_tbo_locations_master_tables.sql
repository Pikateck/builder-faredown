-- TBO Locations Master Tables
-- Stores complete TBO country, city, and hotel data for autocomplete and search
-- Supports live sync from TBO Content API

-- Create tbo_countries table
CREATE TABLE IF NOT EXISTS tbo_countries (
  id SERIAL PRIMARY KEY,
  supplier_id VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  normalized_name VARCHAR(255),
  iso2 VARCHAR(2),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Indexes on tbo_countries
CREATE INDEX IF NOT EXISTS idx_tbo_countries_supplier_id ON tbo_countries(supplier_id);
CREATE INDEX IF NOT EXISTS idx_tbo_countries_name ON tbo_countries(name);
CREATE INDEX IF NOT EXISTS idx_tbo_countries_normalized_name ON tbo_countries(normalized_name);
CREATE INDEX IF NOT EXISTS idx_tbo_countries_iso2 ON tbo_countries(iso2);

-- Create tbo_cities table
CREATE TABLE IF NOT EXISTS tbo_cities (
  id SERIAL PRIMARY KEY,
  supplier_id VARCHAR(50) UNIQUE NOT NULL,
  country_supplier_id VARCHAR(50) NOT NULL REFERENCES tbo_countries(supplier_id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  normalized_name VARCHAR(255),
  lat FLOAT,
  lng FLOAT,
  popularity INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Indexes on tbo_cities
CREATE INDEX IF NOT EXISTS idx_tbo_cities_supplier_id ON tbo_cities(supplier_id);
CREATE INDEX IF NOT EXISTS idx_tbo_cities_country_supplier_id ON tbo_cities(country_supplier_id);
CREATE INDEX IF NOT EXISTS idx_tbo_cities_name ON tbo_cities(name);
CREATE INDEX IF NOT EXISTS idx_tbo_cities_normalized_name ON tbo_cities(normalized_name);
CREATE INDEX IF NOT EXISTS idx_tbo_cities_popularity ON tbo_cities(popularity DESC);
CREATE INDEX IF NOT EXISTS idx_tbo_cities_coords ON tbo_cities(lat, lng);

-- Create tbo_hotels table
CREATE TABLE IF NOT EXISTS tbo_hotels (
  id SERIAL PRIMARY KEY,
  supplier_id VARCHAR(50) UNIQUE NOT NULL,
  city_supplier_id VARCHAR(50) NOT NULL REFERENCES tbo_cities(supplier_id) ON DELETE CASCADE,
  country_supplier_id VARCHAR(50) NOT NULL REFERENCES tbo_countries(supplier_id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  normalized_name VARCHAR(255),
  address TEXT,
  lat FLOAT,
  lng FLOAT,
  stars INT,
  popularity INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Indexes on tbo_hotels
CREATE INDEX IF NOT EXISTS idx_tbo_hotels_supplier_id ON tbo_hotels(supplier_id);
CREATE INDEX IF NOT EXISTS idx_tbo_hotels_city_supplier_id ON tbo_hotels(city_supplier_id);
CREATE INDEX IF NOT EXISTS idx_tbo_hotels_country_supplier_id ON tbo_hotels(country_supplier_id);
CREATE INDEX IF NOT EXISTS idx_tbo_hotels_name ON tbo_hotels(name);
CREATE INDEX IF NOT EXISTS idx_tbo_hotels_normalized_name ON tbo_hotels(normalized_name);
CREATE INDEX IF NOT EXISTS idx_tbo_hotels_popularity ON tbo_hotels(popularity DESC);
CREATE INDEX IF NOT EXISTS idx_tbo_hotels_stars ON tbo_hotels(stars);
CREATE INDEX IF NOT EXISTS idx_tbo_hotels_coords ON tbo_hotels(lat, lng);

-- Optional: Create admin_sync_logs table for tracking sync operations
CREATE TABLE IF NOT EXISTS admin_sync_logs (
  id SERIAL PRIMARY KEY,
  sync_type VARCHAR(50) NOT NULL,
  status VARCHAR(50) NOT NULL,
  details JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_admin_sync_logs_type ON admin_sync_logs(sync_type);
CREATE INDEX IF NOT EXISTS idx_admin_sync_logs_status ON admin_sync_logs(status);
CREATE INDEX IF NOT EXISTS idx_admin_sync_logs_created_at ON admin_sync_logs(created_at DESC);

-- Grant permissions if needed (uncomment for production)
-- ALTER TABLE tbo_countries OWNER TO faredown_user;
-- ALTER TABLE tbo_cities OWNER TO faredown_user;
-- ALTER TABLE tbo_hotels OWNER TO faredown_user;
-- ALTER TABLE admin_sync_logs OWNER TO faredown_user;
