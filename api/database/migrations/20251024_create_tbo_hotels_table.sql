-- TBO Hotels Table
-- Stores hotel metadata for fast lookup
-- References tbo_cities by city_code

CREATE TABLE IF NOT EXISTS tbo_hotels (
  id SERIAL PRIMARY KEY,
  supplier_id VARCHAR(50) NOT NULL UNIQUE,
  city_code VARCHAR(50) NOT NULL REFERENCES tbo_cities(city_code) ON DELETE CASCADE,
  country_code VARCHAR(10),
  name VARCHAR(255) NOT NULL,
  normalized_name VARCHAR(255),
  address TEXT,
  lat NUMERIC(10, 8),
  lng NUMERIC(11, 8),
  stars INT,
  popularity INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for fast hotel lookup
CREATE INDEX IF NOT EXISTS idx_tbo_hotels_supplier_id ON tbo_hotels(supplier_id);
CREATE INDEX IF NOT EXISTS idx_tbo_hotels_city_code ON tbo_hotels(city_code);
CREATE INDEX IF NOT EXISTS idx_tbo_hotels_country_code ON tbo_hotels(country_code);
CREATE INDEX IF NOT EXISTS idx_tbo_hotels_name ON tbo_hotels(name);
CREATE INDEX IF NOT EXISTS idx_tbo_hotels_popularity ON tbo_hotels(popularity DESC);
