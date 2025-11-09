/**
 * Migration: Indexes for STEP 2 Canonical Hotel Endpoints
 * Purpose: Optimize queries for canonical API endpoints
 * 
 * Canonical endpoints:
 * - GET /api/hotels/autocomplete
 * - POST /api/hotels/search
 * - GET /api/hotels/:propertyId
 * - POST /api/hotels/:propertyId/rates
 */

-- Optimize room_offer_unified queries for the /rates endpoint
-- Pattern: Find valid rates by (property_id, supplier_code, checkin, checkout, not expired)
CREATE INDEX IF NOT EXISTS idx_room_offer_rates_query
  ON room_offer_unified (property_id, supplier_code, search_checkin, search_checkout)
  WHERE expires_at > NOW();

-- Optimize hotel_unified queries for city-based searches
CREATE INDEX IF NOT EXISTS idx_hotel_unified_city_supplier
  ON hotel_unified (city, supplier_code)
  WHERE supplier_code = 'TBO';

-- Optimize image lookup by property
CREATE INDEX IF NOT EXISTS idx_hotel_images_property_order
  ON hotel_images (property_id, "order" ASC);

-- Add hotel_images table if missing (fallback)
CREATE TABLE IF NOT EXISTS hotel_images (
  image_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID NOT NULL,
  image_url TEXT NOT NULL,
  "order" INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_hotel_images_property
  ON hotel_images (property_id);

-- Add field to track TTL configuration
ALTER TABLE room_offer_unified 
  ADD COLUMN IF NOT EXISTS ttl_minutes INT DEFAULT 15;

-- Add field for price refresh tracking
ALTER TABLE room_offer_unified 
  ADD COLUMN IF NOT EXISTS refreshed_at TIMESTAMPTZ;

COMMENT ON TABLE hotel_unified IS 
  'Canonical hotel master data - multi-supplier (TBO-first in STEP 2)';

COMMENT ON TABLE room_offer_unified IS 
  'Cached room offers with 15-minute TTL - enables quick response times for /rates endpoint';

COMMENT ON INDEX idx_room_offer_rates_query IS 
  'Optimizes POST /api/hotels/:propertyId/rates query pattern';
