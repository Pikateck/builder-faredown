-- Migration: Hotel Caching Infrastructure
-- Creates tables for hotel supplier API logging and master inventory
-- Enables request coalescing, caching, and audit trail for hotels module

BEGIN;

-- ============================================================
-- TABLE: hotel_supplier_api_logs
-- Purpose: Full audit trail for all hotel supplier API calls
-- ============================================================
CREATE TABLE IF NOT EXISTS public.hotel_supplier_api_logs (
  id BIGSERIAL PRIMARY KEY,
  
  -- Supplier identification
  supplier_code VARCHAR(50) NOT NULL,  -- 'TBO', 'HOTELBEDS', 'RATEHAWK', etc.
  endpoint VARCHAR(255) NOT NULL,      -- API endpoint URL
  
  -- Request details
  request_payload JSONB,                -- Full request payload
  request_timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Response details
  response_payload JSONB,               -- Full response payload
  response_timestamp TIMESTAMPTZ,
  response_time_ms INTEGER,             -- Duration in milliseconds
  
  -- Metadata
  trace_id UUID,                        -- For distributed tracing
  search_hash VARCHAR(64),              -- MD5 hash of search parameters (for dedup)
  
  -- Cache hit flag
  cache_hit BOOLEAN DEFAULT FALSE,
  
  -- Search parameters (denormalized for filtering)
  check_in_date DATE,
  check_out_date DATE,
  city_id VARCHAR(50),
  country_code VARCHAR(10),
  nationality VARCHAR(10),
  num_rooms INTEGER,
  total_guests INTEGER,
  
  -- Error tracking
  error_message TEXT,
  error_code VARCHAR(50),
  
  -- Status
  success BOOLEAN,
  http_status_code INTEGER,
  
  -- Admin metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- INDEXES for hotel_supplier_api_logs
-- ============================================================
CREATE INDEX idx_hotel_logs_supplier_timestamp 
  ON public.hotel_supplier_api_logs(supplier_code, request_timestamp DESC);

CREATE INDEX idx_hotel_logs_trace_id 
  ON public.hotel_supplier_api_logs(trace_id);

CREATE INDEX idx_hotel_logs_search_hash 
  ON public.hotel_supplier_api_logs(search_hash);

CREATE INDEX idx_hotel_logs_city_id 
  ON public.hotel_supplier_api_logs(city_id);

CREATE INDEX idx_hotel_logs_error 
  ON public.hotel_supplier_api_logs(error_code, request_timestamp DESC) 
  WHERE error_message IS NOT NULL;

CREATE INDEX idx_hotel_logs_cache_hit 
  ON public.hotel_supplier_api_logs(cache_hit, request_timestamp DESC);

-- ============================================================
-- TABLE: hotels_master_inventory
-- Purpose: Unified master table for all hotel suppliers
-- ============================================================
CREATE TABLE IF NOT EXISTS public.hotels_master_inventory (
  id BIGSERIAL PRIMARY KEY,
  
  -- Supplier mapping
  supplier_code VARCHAR(50) NOT NULL,   -- 'TBO', 'HOTELBEDS', 'RATEHAWK', etc.
  supplier_hotel_code VARCHAR(100) NOT NULL,  -- TBO HotelCode, Hotelbeds code, etc.
  unified_hotel_code VARCHAR(100),      -- Future: GDS mapping code
  
  -- Hotel basic info
  name VARCHAR(255) NOT NULL,
  description TEXT,
  
  -- Location
  city_id VARCHAR(50),
  city_name VARCHAR(100),
  country_code VARCHAR(10),
  country_name VARCHAR(100),
  region_code VARCHAR(50),
  region_name VARCHAR(100),
  
  -- Coordinates
  latitude NUMERIC(10, 8),
  longitude NUMERIC(11, 8),
  
  -- Hotel details
  star_rating NUMERIC(3, 1),
  phone VARCHAR(50),
  email VARCHAR(100),
  website VARCHAR(255),
  
  address_line_1 VARCHAR(255),
  address_line_2 VARCHAR(255),
  postal_code VARCHAR(20),
  
  -- Amenities (JSON array)
  amenities JSONB,
  
  -- Static data from supplier
  supplier_metadata JSONB,  -- Stores any supplier-specific attributes
  
  -- Sync tracking
  last_synced_at TIMESTAMPTZ,
  sync_status VARCHAR(20),  -- 'pending', 'success', 'failed'
  sync_error TEXT,
  
  -- Management
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- INDEXES for hotels_master_inventory
-- ============================================================
CREATE UNIQUE INDEX idx_hotels_supplier_code_unique 
  ON public.hotels_master_inventory(supplier_code, supplier_hotel_code);

CREATE INDEX idx_hotels_city_id 
  ON public.hotels_master_inventory(city_id, is_active);

CREATE INDEX idx_hotels_country_code 
  ON public.hotels_master_inventory(country_code, is_active);

CREATE INDEX idx_hotels_coordinates 
  ON public.hotels_master_inventory(latitude, longitude) 
  WHERE is_active = TRUE;

CREATE INDEX idx_hotels_sync_status 
  ON public.hotels_master_inventory(sync_status, last_synced_at DESC);

-- Commented out: GIN index creation safe fallback
-- CREATE INDEX idx_hotels_name_search
--   ON public.hotels_master_inventory USING GIN(to_tsvector('english', name));

-- ============================================================
-- FUNCTION: update_hotel_logs_updated_at
-- Automatically updates the updated_at timestamp
-- ============================================================
CREATE OR REPLACE FUNCTION update_hotel_logs_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- FUNCTION: update_hotels_master_updated_at
-- ============================================================
CREATE OR REPLACE FUNCTION update_hotels_master_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- TRIGGERS
-- ============================================================
DROP TRIGGER IF EXISTS trigger_update_hotel_logs_updated_at 
  ON public.hotel_supplier_api_logs;

CREATE TRIGGER trigger_update_hotel_logs_updated_at
BEFORE UPDATE ON public.hotel_supplier_api_logs
FOR EACH ROW
EXECUTE FUNCTION update_hotel_logs_updated_at();

DROP TRIGGER IF EXISTS trigger_update_hotels_master_updated_at 
  ON public.hotels_master_inventory;

CREATE TRIGGER trigger_update_hotels_master_updated_at
BEFORE UPDATE ON public.hotels_master_inventory
FOR EACH ROW
EXECUTE FUNCTION update_hotels_master_updated_at();

-- ============================================================
-- MATERIALIZED VIEWS FOR ANALYTICS
-- ============================================================

-- View: Hotel supplier performance metrics
CREATE MATERIALIZED VIEW IF NOT EXISTS hotel_supplier_performance_metrics AS
SELECT 
  supplier_code,
  DATE(request_timestamp) as date,
  COUNT(*) as total_requests,
  COUNT(*) FILTER (WHERE success = TRUE) as successful_requests,
  COUNT(*) FILTER (WHERE success = FALSE) as failed_requests,
  COUNT(*) FILTER (WHERE cache_hit = TRUE) as cache_hits,
  ROUND(100.0 * COUNT(*) FILTER (WHERE cache_hit = TRUE) / COUNT(*), 2) as cache_hit_rate,
  ROUND(AVG(response_time_ms)::NUMERIC, 2) as avg_response_time_ms,
  MAX(response_time_ms) as max_response_time_ms,
  MIN(response_time_ms) as min_response_time_ms,
  COUNT(DISTINCT city_id) as unique_cities,
  COUNT(DISTINCT error_code) as error_types
FROM public.hotel_supplier_api_logs
GROUP BY supplier_code, DATE(request_timestamp);

CREATE INDEX idx_hotel_perf_metrics_date 
  ON hotel_supplier_performance_metrics(date DESC, supplier_code);

-- View: City-level performance
CREATE MATERIALIZED VIEW IF NOT EXISTS hotel_city_performance AS
SELECT 
  supplier_code,
  city_id,
  COUNT(*) as search_count,
  COUNT(*) FILTER (WHERE cache_hit = TRUE) as cache_hits,
  ROUND(100.0 * COUNT(*) FILTER (WHERE cache_hit = TRUE) / COUNT(*), 2) as cache_hit_rate,
  ROUND(AVG(response_time_ms)::NUMERIC, 2) as avg_response_time_ms,
  MAX(response_time_ms) as max_response_time_ms
FROM public.hotel_supplier_api_logs
WHERE request_timestamp >= NOW() - INTERVAL '7 days'
GROUP BY supplier_code, city_id
ORDER BY search_count DESC;

CREATE INDEX idx_city_perf_search_count 
  ON hotel_city_performance(search_count DESC);

COMMIT;
