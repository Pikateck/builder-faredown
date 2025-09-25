-- ===================================
-- COMPREHENSIVE DESTINATIONS SCHEMA
-- ===================================
-- This replaces the basic destinations schema with a comprehensive
-- hierarchical system supporting India + World destinations

-- ===== Enums
DO $$ BEGIN
  CREATE TYPE geo_level AS ENUM ('global','region','subregion','state','country','city');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ===== Drop existing tables if they exist (preserve data first if needed)
-- Note: In production, you'd want to migrate data first
DROP TABLE IF EXISTS cities CASCADE;
DROP TABLE IF EXISTS countries CASCADE;  
DROP TABLE IF EXISTS regions CASCADE;

-- ===== regions (hierarchical; use for World, Europe, North India, etc)
CREATE TABLE IF NOT EXISTS regions (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name         TEXT NOT NULL,
  level        geo_level NOT NULL,                -- 'global','region','subregion','state'
  parent_id    UUID NULL REFERENCES regions(id) ON DELETE SET NULL,
  slug         TEXT UNIQUE,
  sort_order   INT DEFAULT 0,
  is_active    BOOLEAN NOT NULL DEFAULT TRUE,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_regions_parent ON regions(parent_id);
CREATE INDEX IF NOT EXISTS idx_regions_active ON regions(is_active);
CREATE INDEX IF NOT EXISTS idx_regions_slug ON regions(slug);
CREATE INDEX IF NOT EXISTS idx_regions_level ON regions(level);

-- ===== countries (each belongs to a region)
CREATE TABLE IF NOT EXISTS countries (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name         TEXT NOT NULL,
  iso_code     VARCHAR(3),
  region_id    UUID NOT NULL REFERENCES regions(id) ON DELETE RESTRICT,
  currency     VARCHAR(5) DEFAULT 'INR',
  slug         TEXT UNIQUE,
  sort_order   INT DEFAULT 0,
  is_active    BOOLEAN NOT NULL DEFAULT TRUE,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (name, region_id)
);
CREATE INDEX IF NOT EXISTS idx_countries_region ON countries(region_id);
CREATE INDEX IF NOT EXISTS idx_countries_slug ON countries(slug);
CREATE INDEX IF NOT EXISTS idx_countries_active ON countries(is_active);

-- ===== cities (each belongs to a country; optional direct region for India subregions)
CREATE TABLE IF NOT EXISTS cities (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name         TEXT NOT NULL,
  code         VARCHAR(10),                       -- IATA or internal
  country_id   UUID NOT NULL REFERENCES countries(id) ON DELETE RESTRICT,
  region_id    UUID NULL REFERENCES regions(id) ON DELETE SET NULL,
  slug         TEXT UNIQUE,
  sort_order   INT DEFAULT 0,
  is_active    BOOLEAN NOT NULL DEFAULT TRUE,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (name, country_id)
);
CREATE INDEX IF NOT EXISTS idx_cities_country ON cities(country_id);
CREATE INDEX IF NOT EXISTS idx_cities_region  ON cities(region_id);
CREATE INDEX IF NOT EXISTS idx_cities_active  ON cities(is_active);
CREATE INDEX IF NOT EXISTS idx_cities_slug ON cities(slug);

-- ===== triggers (updated_at)
CREATE OR REPLACE FUNCTION touch_updated_at() RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END $$ LANGUAGE plpgsql;

DO $$ BEGIN
  CREATE TRIGGER trg_touch_regions  BEFORE UPDATE ON regions  FOR EACH ROW EXECUTE FUNCTION touch_updated_at();
  CREATE TRIGGER trg_touch_countries BEFORE UPDATE ON countries FOR EACH ROW EXECUTE FUNCTION touch_updated_at();
  CREATE TRIGGER trg_touch_cities   BEFORE UPDATE ON cities   FOR EACH ROW EXECUTE FUNCTION touch_updated_at();
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ===== helper views
CREATE OR REPLACE VIEW v_destination_tree AS
SELECT
  r.id   AS region_id, r.name AS region_name, r.level AS region_level, r.parent_id,
  co.id  AS country_id, co.name AS country_name, co.iso_code,
  ci.id  AS city_id, ci.name AS city_name, ci.code AS city_code
FROM regions r
LEFT JOIN countries co ON co.region_id = r.id AND co.is_active
LEFT JOIN cities    ci ON ci.country_id = co.id AND ci.is_active
WHERE r.is_active;

-- ===== Admin-friendly upsert functions for CSV import

-- Upsert Region
CREATE OR REPLACE FUNCTION upsert_region(_name TEXT, _level geo_level, _parent_slug TEXT, _slug TEXT, _sort INT DEFAULT 0, _active BOOL DEFAULT TRUE)
RETURNS UUID AS $$
DECLARE pid UUID; rid UUID;
BEGIN
  IF _parent_slug IS NOT NULL THEN
    SELECT id INTO pid FROM regions WHERE slug=_parent_slug LIMIT 1;
  END IF;
  INSERT INTO regions(name, level, parent_id, slug, sort_order, is_active)
  VALUES (_name, _level, pid, _slug, _sort, _active)
  ON CONFLICT (slug) DO UPDATE
    SET name=EXCLUDED.name, level=EXCLUDED.level, parent_id=EXCLUDED.parent_id,
        sort_order=EXCLUDED.sort_order, is_active=EXCLUDED.is_active
  RETURNING id INTO rid;
  RETURN rid;
END $$ LANGUAGE plpgsql;

-- Upsert Country
CREATE OR REPLACE FUNCTION upsert_country(_name TEXT, _iso TEXT, _region_slug TEXT, _slug TEXT, _currency TEXT DEFAULT 'INR', _sort INT DEFAULT 0, _active BOOL DEFAULT TRUE)
RETURNS UUID AS $$
DECLARE rid UUID; cid UUID;
BEGIN
  SELECT id INTO rid FROM regions WHERE slug=_region_slug LIMIT 1;
  IF rid IS NULL THEN RAISE EXCEPTION 'region % not found', _region_slug; END IF;

  INSERT INTO countries(name, iso_code, region_id, currency, slug, sort_order, is_active)
  VALUES (_name, _iso, rid, _currency, _slug, _sort, _active)
  ON CONFLICT (slug) DO UPDATE
    SET name=EXCLUDED.name, iso_code=EXCLUDED.iso_code, region_id=EXCLUDED.region_id,
        currency=EXCLUDED.currency, sort_order=EXCLUDED.sort_order, is_active=EXCLUDED.is_active
  RETURNING id INTO cid;
  RETURN cid;
END $$ LANGUAGE plpgsql;

-- Upsert City
CREATE OR REPLACE FUNCTION upsert_city(_name TEXT, _code TEXT, _country_slug TEXT, _slug TEXT, _region_slug TEXT DEFAULT NULL, _sort INT DEFAULT 0, _active BOOL DEFAULT TRUE)
RETURNS UUID AS $$
DECLARE coid UUID; rid UUID; cid UUID;
BEGIN
  SELECT id INTO coid FROM countries WHERE slug=_country_slug LIMIT 1;
  IF coid IS NULL THEN RAISE EXCEPTION 'country % not found', _country_slug; END IF;

  IF _region_slug IS NOT NULL THEN
    SELECT id INTO rid FROM regions WHERE slug=_region_slug LIMIT 1;
  END IF;

  INSERT INTO cities(name, code, country_id, region_id, slug, sort_order, is_active)
  VALUES (_name, _code, coid, rid, _slug, _sort, _active)
  ON CONFLICT (slug) DO UPDATE
    SET name=EXCLUDED.name, code=EXCLUDED.code, country_id=EXCLUDED.country_id,
        region_id=EXCLUDED.region_id, sort_order=EXCLUDED.sort_order, is_active=EXCLUDED.is_active
  RETURNING id INTO cid;
  RETURN cid;
END $$ LANGUAGE plpgsql;

-- ===== Helper function to get destination hierarchy
CREATE OR REPLACE FUNCTION get_destination_hierarchy(region_slug_param TEXT DEFAULT 'world')
RETURNS JSON AS $$
DECLARE
  result JSON;
BEGIN
  WITH RECURSIVE region_tree AS (
    -- Root region
    SELECT 
      id, name, level, parent_id, slug, sort_order,
      ARRAY[id] as path,
      0 as depth
    FROM regions 
    WHERE slug = region_slug_param AND is_active = TRUE
    
    UNION ALL
    
    -- Child regions
    SELECT 
      r.id, r.name, r.level, r.parent_id, r.slug, r.sort_order,
      rt.path || r.id,
      rt.depth + 1
    FROM regions r
    INNER JOIN region_tree rt ON r.parent_id = rt.id
    WHERE r.is_active = TRUE AND rt.depth < 10
  )
  SELECT json_build_object(
    'regions', json_agg(
      json_build_object(
        'id', rt.id,
        'name', rt.name,
        'level', rt.level,
        'parent_id', rt.parent_id,
        'slug', rt.slug,
        'sort_order', rt.sort_order,
        'depth', rt.depth
      ) ORDER BY rt.depth, rt.sort_order, rt.name
    )
  ) INTO result
  FROM region_tree rt;
  
  RETURN result;
END $$ LANGUAGE plpgsql;

-- ===== Stats function for health check
CREATE OR REPLACE FUNCTION get_destination_stats()
RETURNS JSON AS $$
BEGIN
  RETURN json_build_object(
    'regions', (SELECT COUNT(*) FROM regions WHERE is_active = TRUE),
    'countries', (SELECT COUNT(*) FROM countries WHERE is_active = TRUE),
    'cities', (SELECT COUNT(*) FROM cities WHERE is_active = TRUE),
    'total_destinations', (
      SELECT COUNT(*) FROM regions WHERE is_active = TRUE
    ) + (
      SELECT COUNT(*) FROM countries WHERE is_active = TRUE  
    ) + (
      SELECT COUNT(*) FROM cities WHERE is_active = TRUE
    )
  );
END $$ LANGUAGE plpgsql;

COMMENT ON TABLE regions IS 'Hierarchical regions: World -> Europe -> Western Europe, etc.';
COMMENT ON TABLE countries IS 'Countries belonging to regions';
COMMENT ON TABLE cities IS 'Cities belonging to countries, optionally to regions for India subregions';
COMMENT ON FUNCTION upsert_region IS 'Admin-friendly region upsert for CSV imports';
COMMENT ON FUNCTION upsert_country IS 'Admin-friendly country upsert for CSV imports';
COMMENT ON FUNCTION upsert_city IS 'Admin-friendly city upsert for CSV imports';
