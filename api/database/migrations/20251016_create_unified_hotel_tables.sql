-- Unified hotel master tables for multi-supplier normalization (TBO-first)

CREATE TABLE IF NOT EXISTS hotel_unified (
  property_id UUID PRIMARY KEY,
  supplier_code TEXT NOT NULL,
  supplier_hotel_id TEXT NOT NULL,
  hotel_name TEXT,
  address TEXT,
  city TEXT,
  country TEXT,
  postal_code TEXT,
  lat DOUBLE PRECISION,
  lng DOUBLE PRECISION,
  star_rating NUMERIC(3,1),
  review_score NUMERIC(4,2),
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
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_hotel_unified_supplier_hotel 
  ON hotel_unified (supplier_code, supplier_hotel_id);
CREATE INDEX IF NOT EXISTS idx_hotel_unified_city_country 
  ON hotel_unified (city, country);
CREATE INDEX IF NOT EXISTS idx_hotel_unified_giata 
  ON hotel_unified (giata_id);

CREATE TABLE IF NOT EXISTS hotel_supplier_map_unified (
  property_id UUID NOT NULL,
  supplier_code TEXT NOT NULL,
  supplier_hotel_id TEXT NOT NULL,
  confidence_score NUMERIC(3,2) DEFAULT 1.0,
  matched_on TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (supplier_code, supplier_hotel_id)
);
CREATE INDEX IF NOT EXISTS idx_hotel_supplier_map_property 
  ON hotel_supplier_map_unified (property_id);

CREATE TABLE IF NOT EXISTS room_offer_unified (
  offer_id UUID PRIMARY KEY,
  property_id UUID NOT NULL,
  supplier_code TEXT NOT NULL,
  room_name TEXT,
  board_basis TEXT,
  bed_type TEXT,
  refundable BOOLEAN,
  cancellable_until TIMESTAMPTZ,
  free_cancellation BOOLEAN,
  occupancy_adults INT,
  occupancy_children INT,
  inclusions_json JSONB,
  currency TEXT,
  price_base NUMERIC(12,2),
  price_taxes NUMERIC(12,2),
  price_total NUMERIC(12,2),
  price_per_night NUMERIC(12,2),
  rate_key_or_token TEXT,
  availability_count INT,
  search_checkin DATE,
  search_checkout DATE,
  hotel_name TEXT,
  city TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_room_offer_property 
  ON room_offer_unified (property_id);
CREATE INDEX IF NOT EXISTS idx_room_offer_supplier 
  ON room_offer_unified (supplier_code);
CREATE INDEX IF NOT EXISTS idx_room_offer_city 
  ON room_offer_unified (city);
CREATE INDEX IF NOT EXISTS idx_room_offer_checkin 
  ON room_offer_unified (search_checkin, search_checkout);
