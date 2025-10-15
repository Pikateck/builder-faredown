-- Aggregated search master tables for suppliers fan-out
-- Creates searches and inventory master tables for hotels, flights, activities, and transfers
-- Also adds helper indexes for efficient lookups

CREATE TABLE IF NOT EXISTS hotel_searches (
  id UUID PRIMARY KEY,
  destination JSONB NOT NULL,
  check_in DATE NOT NULL,
  check_out DATE NOT NULL,
  rooms JSONB NOT NULL,
  currency TEXT NOT NULL,
  channel TEXT NOT NULL DEFAULT 'web',
  locale TEXT DEFAULT 'en',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS hotels_inventory_master (
  id UUID PRIMARY KEY,
  search_id UUID NOT NULL REFERENCES hotel_searches(id) ON DELETE CASCADE,
  canonical_hotel_id TEXT NOT NULL,
  name TEXT NOT NULL,
  location JSONB NOT NULL,
  stars INT,
  supplier_code TEXT NOT NULL REFERENCES supplier_master(code),
  supplier_hotel_id TEXT NOT NULL,
  room JSONB NOT NULL,
  raw_price NUMERIC(18,2) NOT NULL,
  raw_currency TEXT NOT NULL,
  priced JSONB NOT NULL,
  pricing_hash TEXT NOT NULL,
  ttl_expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_hotels_inventory_search ON hotels_inventory_master(search_id);
CREATE INDEX IF NOT EXISTS idx_hotels_inventory_canonical ON hotels_inventory_master(canonical_hotel_id);
CREATE INDEX IF NOT EXISTS idx_hotels_inventory_supplier ON hotels_inventory_master(supplier_code, supplier_hotel_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_hotels_inventory_pricing_hash ON hotels_inventory_master(pricing_hash);

CREATE TABLE IF NOT EXISTS flight_searches (
  id UUID PRIMARY KEY,
  origin TEXT NOT NULL,
  destination TEXT NOT NULL,
  depart_date DATE NOT NULL,
  return_date DATE,
  pax JSONB NOT NULL,
  cabin TEXT DEFAULT 'ECONOMY',
  currency TEXT NOT NULL,
  channel TEXT NOT NULL DEFAULT 'web',
  locale TEXT DEFAULT 'en',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS flights_inventory_master (
  id UUID PRIMARY KEY,
  search_id UUID NOT NULL REFERENCES flight_searches(id) ON DELETE CASCADE,
  canonical_itinerary_id TEXT NOT NULL,
  supplier_code TEXT NOT NULL REFERENCES supplier_master(code),
  supplier_reference TEXT,
  segment JSONB NOT NULL,
  fare JSONB NOT NULL,
  priced JSONB NOT NULL,
  pricing_hash TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_flights_inventory_search ON flights_inventory_master(search_id);
CREATE INDEX IF NOT EXISTS idx_flights_inventory_canonical ON flights_inventory_master(canonical_itinerary_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_flights_inventory_pricing_hash ON flights_inventory_master(pricing_hash);

-- Optional activity searches/master tables (created if needed later)
CREATE TABLE IF NOT EXISTS activity_searches (
  id UUID PRIMARY KEY,
  destination TEXT NOT NULL,
  activity_date DATE NOT NULL,
  pax JSONB NOT NULL,
  currency TEXT NOT NULL,
  channel TEXT NOT NULL DEFAULT 'web',
  locale TEXT DEFAULT 'en',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS activities_inventory_master (
  id UUID PRIMARY KEY,
  search_id UUID NOT NULL REFERENCES activity_searches(id) ON DELETE CASCADE,
  canonical_activity_id TEXT NOT NULL,
  supplier_code TEXT NOT NULL REFERENCES supplier_master(code),
  supplier_activity_id TEXT NOT NULL,
  title TEXT NOT NULL,
  details JSONB,
  raw_price NUMERIC(18,2) NOT NULL,
  raw_currency TEXT NOT NULL,
  priced JSONB NOT NULL,
  pricing_hash TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_activities_inventory_search ON activities_inventory_master(search_id);
CREATE INDEX IF NOT EXISTS idx_activities_inventory_canonical ON activities_inventory_master(canonical_activity_id);

CREATE TABLE IF NOT EXISTS transfer_searches (
  id UUID PRIMARY KEY,
  origin TEXT NOT NULL,
  destination TEXT NOT NULL,
  transfer_date DATE NOT NULL,
  pax JSONB NOT NULL,
  currency TEXT NOT NULL,
  channel TEXT NOT NULL DEFAULT 'web',
  locale TEXT DEFAULT 'en',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS transfers_inventory_master (
  id UUID PRIMARY KEY,
  search_id UUID NOT NULL REFERENCES transfer_searches(id) ON DELETE CASCADE,
  canonical_transfer_id TEXT NOT NULL,
  supplier_code TEXT NOT NULL REFERENCES supplier_master(code),
  supplier_transfer_id TEXT NOT NULL,
  vehicle JSONB NOT NULL,
  raw_price NUMERIC(18,2) NOT NULL,
  raw_currency TEXT NOT NULL,
  priced JSONB NOT NULL,
  pricing_hash TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_transfers_inventory_search ON transfers_inventory_master(search_id);
CREATE INDEX IF NOT EXISTS idx_transfers_inventory_canonical ON transfers_inventory_master(canonical_transfer_id);
CREATE INDEX IF NOT EXISTS idx_transfers_inventory_pricing_hash ON transfers_inventory_master(pricing_hash);
