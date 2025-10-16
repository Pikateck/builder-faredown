/*
 * Unified Master Hotel Schema - Phase 1
 * Introduces TBO-based master tables for multi-supplier hotel aggregation
 * Runs in parallel with existing hotel_searches/hotels_inventory_master
 */

BEGIN;

-- 1. Supplier Master Table (manages all suppliers)
CREATE TABLE IF NOT EXISTS supplier_master (
  supplier_code TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  enabled BOOLEAN DEFAULT true,
  priority INT DEFAULT 100,
  timeout_ms INT DEFAULT 8000,
  auth_ref TEXT,
  last_health TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_supplier_enabled ON supplier_master(enabled);

-- 2. Hotel Master Table (TBO-based canonical property schema)
CREATE TABLE IF NOT EXISTS hotel_master (
  property_id UUID PRIMARY KEY,
  
  -- TBO base fields
  hotel_name TEXT NOT NULL,
  address TEXT,
  city TEXT,
  country TEXT,
  postal_code TEXT,
  
  -- Geo
  lat DOUBLE PRECISION,
  lng DOUBLE PRECISION,
  
  -- Property attributes
  star_rating NUMERIC(3, 1),
  review_score NUMERIC(3, 1),
  review_count INT,
  chain_code TEXT,
  brand_code TEXT,
  giata_id TEXT,
  thumbnail_url TEXT,
  
  -- Additional supplier-specific fields (nullable)
  district TEXT,
  zone TEXT,
  neighborhood TEXT,
  amenities_json JSONB,
  checkin_from TEXT,
  checkout_until TEXT,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_hotel_giata ON hotel_master(giata_id);
CREATE INDEX IF NOT EXISTS idx_hotel_chain_brand ON hotel_master(chain_code, brand_code);
CREATE INDEX IF NOT EXISTS idx_hotel_city_country ON hotel_master(city, country);
CREATE INDEX IF NOT EXISTS idx_hotel_geo ON hotel_master USING GIST (ll_to_earth(lat, lng));

-- 3. Supplier Mapping Table (bridge: our properties ↔ supplier IDs)
CREATE TABLE IF NOT EXISTS hotel_supplier_map (
  property_id UUID NOT NULL REFERENCES hotel_master(property_id) ON DELETE CASCADE,
  supplier_code TEXT NOT NULL REFERENCES supplier_master(supplier_code),
  supplier_hotel_id TEXT NOT NULL,
  confidence_score NUMERIC(3, 2) DEFAULT 1.00,
  matched_on TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  PRIMARY KEY (supplier_code, supplier_hotel_id),
  UNIQUE(property_id, supplier_code)
);

CREATE INDEX IF NOT EXISTS idx_map_property_id ON hotel_supplier_map(property_id);
CREATE INDEX IF NOT EXISTS idx_map_supplier_code ON hotel_supplier_map(supplier_code);

-- 4. Room Offer Table (normalized rates/room inventory)
CREATE TABLE IF NOT EXISTS room_offer (
  offer_id UUID PRIMARY KEY,
  property_id UUID NOT NULL REFERENCES hotel_master(property_id) ON DELETE CASCADE,
  supplier_code TEXT NOT NULL REFERENCES supplier_master(supplier_code),
  
  -- Room details (TBO-based)
  room_name TEXT,
  board_basis TEXT, -- RO (room only), BB (bed+breakfast), HB (half-board), FB (full-board)
  bed_type TEXT,
  refundable BOOLEAN,
  cancellable_until TIMESTAMPTZ,
  free_cancellation BOOLEAN,
  
  -- Occupancy
  occupancy_adults INT,
  occupancy_children INT,
  
  -- Inclusions
  inclusions_json JSONB, -- ["Breakfast", "WiFi", "Parking"]
  
  -- Pricing (normalized to site currency = INR)
  currency TEXT NOT NULL, -- GBP, USD, etc. or INR
  price_base NUMERIC(12, 2),
  price_taxes NUMERIC(12, 2),
  price_total NUMERIC(12, 2), -- tax-inclusive
  price_per_night NUMERIC(12, 2),
  
  -- Supplier booking data
  rate_key_or_token TEXT,
  availability_count INT,
  
  -- Lifecycle
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  
  -- Metadata (for search context)
  search_checkin DATE,
  search_checkout DATE
);

CREATE INDEX IF NOT EXISTS idx_offer_property ON room_offer(property_id);
CREATE INDEX IF NOT EXISTS idx_offer_price ON room_offer(price_total, currency);
CREATE INDEX IF NOT EXISTS idx_offer_supplier ON room_offer(supplier_code);
CREATE INDEX IF NOT EXISTS idx_offer_expires ON room_offer(expires_at);
CREATE INDEX IF NOT EXISTS idx_offer_search ON room_offer(search_checkin, search_checkout);

-- 5. Field Mapping Registry (defines normalization rules per supplier)
CREATE TABLE IF NOT EXISTS supplier_field_mapping (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  supplier_code TEXT NOT NULL REFERENCES supplier_master(supplier_code),
  tbo_field TEXT NOT NULL, -- target TBO field name
  supplier_field TEXT NOT NULL, -- source field from supplier API
  transform_rule JSONB, -- optional transformation logic
  is_active BOOLEAN DEFAULT true,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(supplier_code, tbo_field)
);

-- 6. Deduplication Audit Trail
CREATE TABLE IF NOT EXISTS hotel_dedup_audit (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  primary_property_id UUID REFERENCES hotel_master(property_id),
  duplicate_property_id UUID,
  supplier_code TEXT,
  match_method TEXT, -- giata_exact, chain_mapping, fuzzy_geo
  confidence_score NUMERIC(3, 2),
  action TEXT, -- merged, rejected, manual_review
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seed supplier_master with initial suppliers
INSERT INTO supplier_master (supplier_code, name, enabled, priority) 
VALUES 
  ('RATEHAWK', 'RateHawk (WorldOTA)', true, 100),
  ('HOTELBEDS', 'Hotelbeds', false, 90),
  ('TBO', 'Travel Boutique Online', false, 80)
ON CONFLICT (supplier_code) DO NOTHING;

-- Initialize field mapping for RateHawk (TBO baseline = no transform needed)
INSERT INTO supplier_field_mapping (supplier_code, tbo_field, supplier_field, transform_rule)
VALUES
  ('RATEHAWK', 'hotel_name', 'name', NULL),
  ('RATEHAWK', 'address', 'address', NULL),
  ('RATEHAWK', 'city', 'city', NULL),
  ('RATEHAWK', 'country', 'country_code', NULL),
  ('RATEHAWK', 'postal_code', 'postal_code', NULL),
  ('RATEHAWK', 'lat', 'location.latitude', NULL),
  ('RATEHAWK', 'lng', 'location.longitude', NULL),
  ('RATEHAWK', 'star_rating', 'star_rating', NULL),
  ('RATEHAWK', 'review_score', 'review_score', NULL),
  ('RATEHAWK', 'review_count', 'review_count', NULL),
  ('RATEHAWK', 'giata_id', 'giata_id', NULL),
  ('RATEHAWK', 'thumbnail_url', 'image_url', NULL),
  ('RATEHAWK', 'room_name', 'room_name', NULL),
  ('RATEHAWK', 'board_basis', 'board', NULL),
  ('RATEHAWK', 'bed_type', 'bed_type', NULL),
  ('RATEHAWK', 'price_base', 'price.base', NULL),
  ('RATEHAWK', 'price_taxes', 'price.taxes', NULL),
  ('RATEHAWK', 'price_total', 'price.total', NULL),
  ('RATEHAWK', 'price_per_night', 'price.per_night', NULL),
  ('RATEHAWK', 'free_cancellation', 'free_cancellation', NULL),
  ('RATEHAWK', 'inclusions_json', 'inclusions', NULL)
ON CONFLICT (supplier_code, tbo_field) DO NOTHING;

COMMIT;
