-- ============================================================
-- Hotel Cache Layer - Cache-Backed Search Architecture
-- Purpose: Store hotel search results and normalize TBO data
-- ============================================================

BEGIN;

-- ============================================================
-- TABLE: hotel_search_cache
-- Purpose: Tracks search parameters and cache freshness
-- ============================================================
CREATE TABLE IF NOT EXISTS public.hotel_search_cache (
  id BIGSERIAL PRIMARY KEY,
  search_hash VARCHAR(64) NOT NULL UNIQUE,
  city_id VARCHAR(50) NOT NULL,
  country_code VARCHAR(10),
  check_in_date DATE NOT NULL,
  check_out_date DATE NOT NULL,
  guest_nationality VARCHAR(10),
  num_rooms INTEGER,
  room_config JSONB,
  hotel_count INTEGER,
  cache_source VARCHAR(50),
  is_fresh BOOLEAN DEFAULT true,
  cached_at TIMESTAMPTZ DEFAULT NOW(),
  ttl_expires_at TIMESTAMPTZ,
  last_price_refresh_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_search_cache_hash ON public.hotel_search_cache(search_hash);
CREATE INDEX IF NOT EXISTS idx_search_cache_city_date ON public.hotel_search_cache(city_id, check_in_date, check_out_date);
CREATE INDEX IF NOT EXISTS idx_search_cache_freshness ON public.hotel_search_cache(is_fresh, cached_at DESC);
CREATE INDEX IF NOT EXISTS idx_search_cache_nationality ON public.hotel_search_cache(guest_nationality);

COMMENT ON TABLE public.hotel_search_cache IS 'Caches hotel search queries by parameter hash to enable fast repeat searches';
COMMENT ON COLUMN public.hotel_search_cache.search_hash IS 'SHA256 hash of search parameters (cityId, dates, nationality, rooms)';
COMMENT ON COLUMN public.hotel_search_cache.ttl_expires_at IS 'Cache expires after 4 hours (TTL)';

-- ============================================================
-- TABLE: tbo_hotels_normalized
-- Purpose: Normalized hotel metadata from TBO API
-- ============================================================
CREATE TABLE IF NOT EXISTS public.tbo_hotels_normalized (
  id BIGSERIAL PRIMARY KEY,
  tbo_hotel_code VARCHAR(100) NOT NULL UNIQUE,
  city_id VARCHAR(50) NOT NULL,
  city_name VARCHAR(255),
  country_code VARCHAR(10),
  name VARCHAR(500) NOT NULL,
  description TEXT,
  address TEXT,
  latitude NUMERIC(10, 8),
  longitude NUMERIC(11, 8),
  star_rating NUMERIC(3, 1),
  check_in_time TIME,
  check_out_time TIME,
  amenities JSONB,
  facilities JSONB,
  images JSONB,
  main_image_url TEXT,
  phone VARCHAR(50),
  email VARCHAR(100),
  website VARCHAR(500),
  total_rooms INTEGER,
  popularity INTEGER DEFAULT 0,
  last_synced_at TIMESTAMPTZ,
  tbo_response_blob JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_hotels_normalized_city ON public.tbo_hotels_normalized(city_id);
CREATE INDEX IF NOT EXISTS idx_hotels_normalized_code ON public.tbo_hotels_normalized(tbo_hotel_code);
CREATE INDEX IF NOT EXISTS idx_hotels_normalized_name ON public.tbo_hotels_normalized(name);
CREATE INDEX IF NOT EXISTS idx_hotels_normalized_rating ON public.tbo_hotels_normalized(star_rating DESC);

COMMENT ON TABLE public.tbo_hotels_normalized IS 'Normalized hotel metadata extracted from TBO GetHotelResult responses';
COMMENT ON COLUMN public.tbo_hotels_normalized.tbo_hotel_code IS 'TBO HotelCode from API (unique identifier)';
COMMENT ON COLUMN public.tbo_hotels_normalized.tbo_response_blob IS 'Full TBO response stored for debugging/re-processing';

-- ============================================================
-- TABLE: tbo_rooms_normalized
-- Purpose: Normalized room type and rate plan details
-- ============================================================
CREATE TABLE IF NOT EXISTS public.tbo_rooms_normalized (
  id BIGSERIAL PRIMARY KEY,
  tbo_hotel_code VARCHAR(100) NOT NULL REFERENCES public.tbo_hotels_normalized(tbo_hotel_code) ON DELETE CASCADE,
  room_type_id VARCHAR(100),
  room_type_name VARCHAR(255),
  room_description TEXT,
  max_occupancy INTEGER,
  adults_max INTEGER,
  children_max INTEGER,
  room_size_sqm NUMERIC(6, 2),
  bed_types JSONB,
  room_features JSONB,
  amenities JSONB,
  images JSONB,
  base_price_per_night NUMERIC(12, 2),
  currency VARCHAR(3),
  cancellation_policy JSONB,
  meal_plan TEXT,
  breakfast_included BOOLEAN DEFAULT false,
  tbo_response_blob JSONB,
  last_synced_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_rooms_normalized_hotel ON public.tbo_rooms_normalized(tbo_hotel_code);
CREATE INDEX IF NOT EXISTS idx_rooms_normalized_room_type ON public.tbo_rooms_normalized(room_type_name);
CREATE INDEX IF NOT EXISTS idx_rooms_normalized_occupancy ON public.tbo_rooms_normalized(max_occupancy);

COMMENT ON TABLE public.tbo_rooms_normalized IS 'Normalized room types and rate plans from TBO GetHotelRoom responses';
COMMENT ON COLUMN public.tbo_rooms_normalized.room_type_id IS 'Category ID or room type code from TBO';

-- ============================================================
-- TABLE: hotel_search_cache_results
-- Purpose: Maps searches to hotels (join table with ranking)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.hotel_search_cache_results (
  id BIGSERIAL PRIMARY KEY,
  search_hash VARCHAR(64) NOT NULL REFERENCES public.hotel_search_cache(search_hash) ON DELETE CASCADE,
  tbo_hotel_code VARCHAR(100) NOT NULL REFERENCES public.tbo_hotels_normalized(tbo_hotel_code) ON DELETE CASCADE,
  result_rank INTEGER,
  price_offered_per_night NUMERIC(12, 2),
  price_published_per_night NUMERIC(12, 2),
  available_rooms INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_cache_results_hash ON public.hotel_search_cache_results(search_hash);
CREATE INDEX IF NOT EXISTS idx_cache_results_hotel ON public.hotel_search_cache_results(tbo_hotel_code);
CREATE INDEX IF NOT EXISTS idx_cache_results_rank ON public.hotel_search_cache_results(search_hash, result_rank);

COMMENT ON TABLE public.hotel_search_cache_results IS 'Maps search_hash to hotel_codes with result ranking and snapshot pricing';

COMMIT;
