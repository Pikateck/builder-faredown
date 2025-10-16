/*
 * Unified Master Hotel Schema - Phase 1
 * Introduces TBO-based master tables for multi-supplier hotel aggregation
 */

BEGIN;

-- Supplier Master Table
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

-- Hotel Master Table (TBO-based canonical property schema)
CREATE TABLE IF NOT EXISTS hotel_master (
  property_id UUID PRIMARY KEY,
  hotel_name TEXT NOT NULL,
  address TEXT,
  city TEXT,
  country TEXT,
  postal_code TEXT,
  lat DOUBLE PRECISION,
  lng DOUBLE PRECISION,
  star_rating NUMERIC(3, 1),
  review_score NUMERIC(3, 1),
  review_count INT,
  chain_code TEXT,
  brand_code TEXT,
  giata_id TEXT,
  thumbnail_url TEXT,
  district TEXT,
  zone TEXT,
  neighborhood TEXT,
  amenities_json JSONB,
  checkin_from TEXT,
  checkout_until TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_hotel_giata ON hotel_master(giata_id);
CREATE INDEX IF NOT EXISTS idx_hotel_chain_brand ON hotel_master(chain_code, brand_code);
CREATE INDEX IF NOT EXISTS idx_hotel_city_country ON hotel_master(city, country);
CREATE INDEX IF NOT EXISTS idx_hotel_coordinates ON hotel_master(lat, lng);

-- Supplier Mapping Table (bridge: our properties ↔ supplier IDs)
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

-- Room Offer Table (normalized rates/room inventory)
CREATE TABLE IF NOT EXISTS room_offer (
  offer_id UUID PRIMARY KEY,
  property_id UUID NOT NULL REFERENCES hotel_master(property_id) ON DELETE CASCADE,
  supplier_code TEXT NOT NULL REFERENCES supplier_master(supplier_code),
  room_name TEXT,
  board_basis TEXT,
  bed_type TEXT,
  refundable BOOLEAN,
  cancellable_until TIMESTAMPTZ,
  free_cancellation BOOLEAN,
  occupancy_adults INT,
  occupancy_children INT,
  inclusions_json JSONB,
  currency TEXT NOT NULL,
  price_base NUMERIC(12, 2),
  price_taxes NUMERIC(12, 2),
  price_total NUMERIC(12, 2),
  price_per_night NUMERIC(12, 2),
  rate_key_or_token TEXT,
  availability_count INT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  search_checkin DATE,
  search_checkout DATE
);

CREATE INDEX IF NOT EXISTS idx_offer_property ON room_offer(property_id);
CREATE INDEX IF NOT EXISTS idx_offer_price ON room_offer(price_total, currency);
CREATE INDEX IF NOT EXISTS idx_offer_supplier ON room_offer(supplier_code);
CREATE INDEX IF NOT EXISTS idx_offer_expires ON room_offer(expires_at);
CREATE INDEX IF NOT EXISTS idx_offer_search ON room_offer(search_checkin, search_checkout);

-- Field Mapping Registry (defines normalization rules per supplier)
CREATE TABLE IF NOT EXISTS supplier_field_mapping (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  supplier_code TEXT NOT NULL REFERENCES supplier_master(supplier_code),
  tbo_field TEXT NOT NULL,
  supplier_field TEXT NOT NULL,
  transform_rule JSONB,
  is_active BOOLEAN DEFAULT true,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(supplier_code, tbo_field)
);

-- Deduplication Audit Trail
CREATE TABLE IF NOT EXISTS hotel_dedup_audit (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  primary_property_id UUID REFERENCES hotel_master(property_id),
  duplicate_property_id UUID,
  supplier_code TEXT,
  match_method TEXT,
  confidence_score NUMERIC(3, 2),
  action TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seed supplier_master with initial suppliers
INSERT INTO supplier_master (supplier_code, name, enabled, priority)
VALUES
  ('RATEHAWK', 'RateHawk (WorldOTA)', true, 100),
  ('HOTELBEDS', 'Hotelbeds', true, 90),
  ('TBO', 'Travel Boutique Online', false, 80)
ON CONFLICT (supplier_code) DO NOTHING;

-- Update Hotelbeds if already exists
UPDATE supplier_master SET enabled = true WHERE supplier_code = 'HOTELBEDS';

-- Initialize field mapping for RateHawk
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

-- Initialize field mapping for Hotelbeds
INSERT INTO supplier_field_mapping (supplier_code, tbo_field, supplier_field, transform_rule)
VALUES
  ('HOTELBEDS', 'hotel_name', 'name', NULL),
  ('HOTELBEDS', 'address', 'address.street', NULL),
  ('HOTELBEDS', 'city', 'address.city', NULL),
  ('HOTELBEDS', 'country', 'address.country', NULL),
  ('HOTELBEDS', 'postal_code', 'address.postalCode', NULL),
  ('HOTELBEDS', 'lat', 'coordinates.latitude', NULL),
  ('HOTELBEDS', 'lng', 'coordinates.longitude', NULL),
  ('HOTELBEDS', 'star_rating', 'category.code', NULL),
  ('HOTELBEDS', 'review_score', 'review.score', NULL),
  ('HOTELBEDS', 'review_count', 'review.reviewCount', NULL),
  ('HOTELBEDS', 'giata_id', 'giataCode', NULL),
  ('HOTELBEDS', 'thumbnail_url', 'image.url', NULL),
  ('HOTELBEDS', 'room_name', 'roomName', NULL),
  ('HOTELBEDS', 'board_basis', 'boardName', NULL),
  ('HOTELBEDS', 'bed_type', 'room.type', NULL),
  ('HOTELBEDS', 'price_base', 'net', NULL),
  ('HOTELBEDS', 'price_taxes', 'taxes', NULL),
  ('HOTELBEDS', 'price_total', 'allotment.price', NULL),
  ('HOTELBEDS', 'price_per_night', 'pricePerNight', NULL),
  ('HOTELBEDS', 'free_cancellation', 'cancellationPolicies.refundable', NULL),
  ('HOTELBEDS', 'inclusions_json', 'inclusions', NULL)
ON CONFLICT (supplier_code, tbo_field) DO NOTHING;

COMMIT;
