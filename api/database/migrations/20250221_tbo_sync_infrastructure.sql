-- ============================================================
-- TBO Sync Infrastructure
-- Purpose: Ensure all tables for TBO city/mapping sync exist
-- Migration: 20250221
-- ============================================================

BEGIN;

-- ============================================================
-- TABLE: tbo_countries
-- Purpose: TBO-canonical countries from TBO's StaticData API
-- ============================================================
CREATE TABLE IF NOT EXISTS public.tbo_countries (
  id BIGSERIAL PRIMARY KEY,
  country_code VARCHAR(5) NOT NULL UNIQUE,
  country_name VARCHAR(255) NOT NULL,
  country_name_normalized VARCHAR(255),
  is_active BOOLEAN DEFAULT true,
  tbo_response JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tbo_countries_code ON public.tbo_countries(country_code);
CREATE INDEX IF NOT EXISTS idx_tbo_countries_name_norm ON public.tbo_countries(country_name_normalized);
CREATE INDEX IF NOT EXISTS idx_tbo_countries_active ON public.tbo_countries(is_active);

COMMENT ON TABLE public.tbo_countries IS 'TBO canonical countries from StaticData API';
COMMENT ON COLUMN public.tbo_countries.country_code IS 'ISO 2-letter country code (e.g., IN, AE, US)';
COMMENT ON COLUMN public.tbo_countries.country_name_normalized IS 'Lowercase/trimmed version for matching';

-- ============================================================
-- TABLE: tbo_cities
-- Purpose: TBO-canonical cities from TBO's StaticData API (per country)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.tbo_cities (
  id BIGSERIAL PRIMARY KEY,
  tbo_city_id VARCHAR(50) NOT NULL UNIQUE,
  city_name VARCHAR(255) NOT NULL,
  city_name_normalized VARCHAR(255),
  country_code VARCHAR(5) NOT NULL REFERENCES public.tbo_countries(country_code) ON DELETE RESTRICT,
  region_name VARCHAR(255),
  latitude NUMERIC(10, 8),
  longitude NUMERIC(11, 8),
  hotel_count INTEGER DEFAULT 0,
  popularity_score INTEGER DEFAULT 0,
  is_domestic BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  last_synced_at TIMESTAMPTZ,
  tbo_response JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tbo_cities_id ON public.tbo_cities(tbo_city_id);
CREATE INDEX IF NOT EXISTS idx_tbo_cities_country ON public.tbo_cities(country_code);
CREATE INDEX IF NOT EXISTS idx_tbo_cities_name_norm ON public.tbo_cities(city_name_normalized);
CREATE INDEX IF NOT EXISTS idx_tbo_cities_active ON public.tbo_cities(is_active, country_code);
CREATE INDEX IF NOT EXISTS idx_tbo_cities_country_active ON public.tbo_cities(country_code, is_active);

COMMENT ON TABLE public.tbo_cities IS 'TBO canonical cities from StaticData API (by country)';
COMMENT ON COLUMN public.tbo_cities.tbo_city_id IS 'TBO CityId/DestinationId (e.g., 10448 for Delhi)';
COMMENT ON COLUMN public.tbo_cities.city_name_normalized IS 'Lowercase/trimmed for matching Hotelbeds cities';
COMMENT ON COLUMN public.tbo_cities.hotel_count IS 'Count of hotels returned from last search (cached estimate)';
COMMENT ON COLUMN public.tbo_cities.popularity_score IS 'Internal score for prioritizing which cities to pre-seed';

-- ============================================================
-- TABLE: city_mapping
-- Purpose: Bridge between Hotelbeds cities and TBO cities
-- ============================================================
CREATE TABLE IF NOT EXISTS public.city_mapping (
  id BIGSERIAL PRIMARY KEY,
  hotelbeds_city_code VARCHAR(100) NOT NULL UNIQUE,
  hotelbeds_city_name VARCHAR(255),
  hotelbeds_country_code VARCHAR(10),
  tbo_city_id VARCHAR(50) NOT NULL REFERENCES public.tbo_cities(tbo_city_id) ON DELETE RESTRICT,
  tbo_city_name VARCHAR(255),
  tbo_country_code VARCHAR(5),
  match_confidence NUMERIC(5, 2) DEFAULT 100.00,
  match_method VARCHAR(50),
  match_notes TEXT,
  is_verified BOOLEAN DEFAULT false,
  verified_by VARCHAR(255),
  verified_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_city_mapping_hb_code ON public.city_mapping(hotelbeds_city_code);
CREATE INDEX IF NOT EXISTS idx_city_mapping_tbo_id ON public.city_mapping(tbo_city_id);
CREATE INDEX IF NOT EXISTS idx_city_mapping_active ON public.city_mapping(is_active);
CREATE INDEX IF NOT EXISTS idx_city_mapping_verified ON public.city_mapping(is_verified);
CREATE INDEX IF NOT EXISTS idx_city_mapping_country ON public.city_mapping(hotelbeds_country_code, tbo_country_code);

COMMENT ON TABLE public.city_mapping IS 'Maps Hotelbeds city codes to TBO CityIds for data driver/bridging';
COMMENT ON COLUMN public.city_mapping.match_confidence IS 'Confidence score (0-100) of the match. 100 = exact. <80 may need manual review';
COMMENT ON COLUMN public.city_mapping.match_method IS 'How match was found: exact_name, normalized_name, manual, fuzzy_match, etc.';
COMMENT ON COLUMN public.city_mapping.is_verified IS 'Manual verification flag (set by admin/operator)';

-- ============================================================
-- TABLE: tbo_sync_log
-- Purpose: Track progress of TBO city sync operations
-- ============================================================
CREATE TABLE IF NOT EXISTS public.tbo_sync_log (
  id BIGSERIAL PRIMARY KEY,
  sync_type VARCHAR(50) NOT NULL,
  country_code VARCHAR(5),
  status VARCHAR(50) NOT NULL,
  records_processed INTEGER DEFAULT 0,
  records_inserted INTEGER DEFAULT 0,
  records_updated INTEGER DEFAULT 0,
  error_message TEXT,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  duration_ms INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tbo_sync_log_type ON public.tbo_sync_log(sync_type);
CREATE INDEX IF NOT EXISTS idx_tbo_sync_log_status ON public.tbo_sync_log(status);
CREATE INDEX IF NOT EXISTS idx_tbo_sync_log_country ON public.tbo_sync_log(country_code);
CREATE INDEX IF NOT EXISTS idx_tbo_sync_log_created_at ON public.tbo_sync_log(created_at DESC);

COMMENT ON TABLE public.tbo_sync_log IS 'Audit log for TBO data sync operations';

COMMIT;
