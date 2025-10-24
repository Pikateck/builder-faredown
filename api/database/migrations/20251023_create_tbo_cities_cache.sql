-- TBO Cities Cache Table
-- Stores city, airport, and region data for fast typeahead search
-- Syncs from TBO's CountryList + CityList static data endpoints

CREATE TABLE IF NOT EXISTS tbo_cities (
  id SERIAL PRIMARY KEY,
  city_code VARCHAR(50) NOT NULL UNIQUE,
  city_name VARCHAR(255) NOT NULL,
  country_code VARCHAR(10),
  country_name VARCHAR(255),
  region_code VARCHAR(50),
  region_name VARCHAR(255),
  type VARCHAR(50) DEFAULT 'CITY', -- CITY, AIRPORT, REGION
  latitude NUMERIC(10, 8),
  longitude NUMERIC(11, 8),
  is_active BOOLEAN DEFAULT true,
  last_seen_at TIMESTAMPTZ DEFAULT NOW(),
  synced_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for fast typeahead search
CREATE INDEX IF NOT EXISTS idx_tbo_cities_code ON tbo_cities(city_code);
CREATE INDEX IF NOT EXISTS idx_tbo_cities_name ON tbo_cities(city_name);
CREATE INDEX IF NOT EXISTS idx_tbo_cities_country ON tbo_cities(country_code);
CREATE INDEX IF NOT EXISTS idx_tbo_cities_type ON tbo_cities(type);
CREATE INDEX IF NOT EXISTS idx_tbo_cities_active ON tbo_cities(is_active);

-- Full-text search index for typeahead (supports prefix matching)
CREATE INDEX IF NOT EXISTS idx_tbo_cities_fts ON tbo_cities USING GIN (
  to_tsvector('english', city_name || ' ' || COALESCE(country_name, ''))
);

-- Composite index for city + country lookups
CREATE INDEX IF NOT EXISTS idx_tbo_cities_code_country 
  ON tbo_cities(city_code, country_code);
