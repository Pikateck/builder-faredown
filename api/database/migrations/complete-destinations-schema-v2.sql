-- Complete Destinations Master Schema v2
-- Authoritative schema that ensures all destinations show up consistently

-- Drop existing tables if they exist (clean slate)
DROP MATERIALIZED VIEW IF EXISTS destinations_search_mv CASCADE;
DROP TABLE IF EXISTS destination_aliases CASCADE;
DROP TABLE IF EXISTS cities CASCADE;
DROP TABLE IF EXISTS countries CASCADE;
DROP TABLE IF EXISTS regions CASCADE;

-- Required extensions
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE EXTENSION IF NOT EXISTS unaccent;

-- 1. Regions (e.g., Europe, Asia, Middle East, North India)
CREATE TABLE regions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE,                 -- optional, e.g. "EUROPE", "NORTH_INDIA"
  name TEXT NOT NULL,               -- "Europe"
  level TEXT NOT NULL,              -- enum-ish: 'global' | 'country-group' | 'india-subregion'
  is_active BOOLEAN NOT NULL DEFAULT true,
  sort_order INT DEFAULT 500,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Countries
CREATE TABLE countries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  iso2 CHAR(2),                     -- "FR"
  iso3 CHAR(3),                     -- "FRA"
  name TEXT NOT NULL,               -- "France"
  region_id UUID REFERENCES regions(id) ON DELETE SET NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  sort_order INT DEFAULT 500,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Cities
CREATE TABLE cities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,               -- "Paris"
  country_id UUID NOT NULL REFERENCES countries(id) ON DELETE CASCADE,
  region_id UUID REFERENCES regions(id) ON DELETE SET NULL,  -- denormalized convenience
  lat DOUBLE PRECISION,             -- optional
  lon DOUBLE PRECISION,
  is_active BOOLEAN NOT NULL DEFAULT true,
  is_package_destination BOOLEAN NOT NULL DEFAULT true,   -- use to hide/show on packages only
  sort_order INT DEFAULT 500,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 4. Aliases (airport codes, old names, alt spellings)
CREATE TABLE destination_aliases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dest_type TEXT NOT NULL CHECK (dest_type IN ('city','country','region')),
  dest_id UUID NOT NULL,           -- FK-like, enforced in app layer
  alias TEXT NOT NULL,             -- "DXB", "BOM", "Bombay", "N.Y.C"
  weight INT NOT NULL DEFAULT 5,   -- impact on ranking
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 5. Search projection (materialized view for speed + unified search)
CREATE MATERIALIZED VIEW destinations_search_mv AS
SELECT
  'city'::TEXT AS type,
  c.id AS entity_id,
  c.name AS label,
  CONCAT(c.name, ', ', co.name) AS label_with_country,
  co.name AS country,
  r.name AS region,
  COALESCE(co.iso2::TEXT, '') AS code,
  c.is_active AND co.is_active AND COALESCE(r.is_active, true) AS is_active,
  c.is_package_destination,
  c.sort_order
FROM cities c
JOIN countries co ON co.id = c.country_id
LEFT JOIN regions r ON r.id = co.region_id

UNION ALL

SELECT
  'country'::TEXT,
  co.id,
  co.name,
  co.name,
  NULL AS country,
  r.name AS region,
  COALESCE(co.iso2::TEXT, '') AS code,
  co.is_active AND COALESCE(r.is_active, true),
  true AS is_package_destination,  -- countries are always package destinations
  co.sort_order
FROM countries co
LEFT JOIN regions r ON r.id = co.region_id

UNION ALL

SELECT
  'region'::TEXT,
  r.id,
  r.name,
  r.name,
  NULL,
  NULL,
  COALESCE(r.code,'') AS code,
  r.is_active,
  true AS is_package_destination,  -- regions are always package destinations
  r.sort_order
FROM regions r;

-- Indexes for materialized view
CREATE INDEX ON destinations_search_mv (type);
CREATE INDEX ON destinations_search_mv USING gin (label gin_trgm_ops);
CREATE INDEX ON destinations_search_mv USING gin (label_with_country gin_trgm_ops);
CREATE INDEX ON destinations_search_mv (is_active);
CREATE INDEX ON destinations_search_mv (is_package_destination);
CREATE INDEX ON destinations_search_mv (sort_order);

-- Functional indexes for direct table searches
CREATE INDEX cities_name_trgm ON cities USING gin (name gin_trgm_ops);
CREATE INDEX countries_name_trgm ON countries USING gin (name gin_trgm_ops);
CREATE INDEX regions_name_trgm ON regions USING gin (name gin_trgm_ops);
CREATE INDEX destination_aliases_alias_trgm ON destination_aliases USING gin (alias gin_trgm_ops);

-- Standard indexes
CREATE INDEX cities_country_id_idx ON cities (country_id);
CREATE INDEX cities_region_id_idx ON cities (region_id);
CREATE INDEX cities_is_active_idx ON cities (is_active);
CREATE INDEX cities_is_package_destination_idx ON cities (is_package_destination);

CREATE INDEX countries_region_id_idx ON countries (region_id);
CREATE INDEX countries_is_active_idx ON countries (is_active);

CREATE INDEX regions_is_active_idx ON regions (is_active);
CREATE INDEX regions_level_idx ON regions (level);

CREATE INDEX destination_aliases_dest_type_idx ON destination_aliases (dest_type);
CREATE INDEX destination_aliases_dest_id_idx ON destination_aliases (dest_id);
CREATE INDEX destination_aliases_is_active_idx ON destination_aliases (is_active);

-- Unique constraints to prevent duplicates
CREATE UNIQUE INDEX cities_name_country_unique ON cities (LOWER(name), country_id) WHERE is_active = true;
CREATE UNIQUE INDEX countries_name_region_unique ON countries (LOWER(name), COALESCE(region_id, '00000000-0000-0000-0000-000000000000'::UUID)) WHERE is_active = true;
CREATE UNIQUE INDEX regions_name_unique ON regions (LOWER(name)) WHERE is_active = true;

-- Refresh function for materialized view
CREATE OR REPLACE FUNCTION refresh_destinations_mv() 
RETURNS TRIGGER 
LANGUAGE plpgsql AS $$
BEGIN
  -- Use CONCURRENTLY to avoid locking during refresh
  REFRESH MATERIALIZED VIEW CONCURRENTLY destinations_search_mv;
  RETURN NULL;
END $$;

-- Triggers to refresh materialized view on changes
CREATE TRIGGER refresh_mv_after_cities
AFTER INSERT OR UPDATE OR DELETE ON cities
FOR EACH STATEMENT EXECUTE PROCEDURE refresh_destinations_mv();

CREATE TRIGGER refresh_mv_after_countries
AFTER INSERT OR UPDATE OR DELETE ON countries
FOR EACH STATEMENT EXECUTE PROCEDURE refresh_destinations_mv();

CREATE TRIGGER refresh_mv_after_regions
AFTER INSERT OR UPDATE OR DELETE ON regions
FOR EACH STATEMENT EXECUTE PROCEDURE refresh_destinations_mv();

CREATE TRIGGER refresh_mv_after_aliases
AFTER INSERT OR UPDATE OR DELETE ON destination_aliases
FOR EACH STATEMENT EXECUTE PROCEDURE refresh_destinations_mv();

-- Function to search destinations with alias resolution
CREATE OR REPLACE FUNCTION search_destinations(
  query_text TEXT,
  result_limit INT DEFAULT 20,
  types_filter TEXT[] DEFAULT ARRAY['city', 'country', 'region'],
  only_active BOOLEAN DEFAULT true
)
RETURNS TABLE (
  type TEXT,
  entity_id UUID,
  label TEXT,
  label_with_country TEXT,
  country TEXT,
  region TEXT,
  code TEXT,
  score FLOAT,
  source TEXT
) 
LANGUAGE plpgsql AS $$
DECLARE
  normalized_query TEXT;
  exact_aliases UUID[];
  alias_entities TEXT[];
BEGIN
  -- Normalize query
  normalized_query := LOWER(TRIM(unaccent(query_text)));
  
  -- Step 1: Look for exact alias matches first
  SELECT ARRAY_AGG(DISTINCT dest_id), ARRAY_AGG(DISTINCT dest_type::TEXT)
  INTO exact_aliases, alias_entities
  FROM destination_aliases da
  WHERE LOWER(unaccent(da.alias)) = normalized_query
    AND da.is_active = true;
  
  -- Step 2: Return results from materialized view
  RETURN QUERY
  SELECT 
    mv.type,
    mv.entity_id,
    mv.label,
    mv.label_with_country,
    mv.country,
    mv.region,
    mv.code,
    CASE
      -- Boost exact alias matches
      WHEN mv.entity_id = ANY(exact_aliases) THEN 1.0
      -- Exact name match
      WHEN LOWER(unaccent(mv.label)) = normalized_query THEN 0.9
      -- Prefix match
      WHEN LOWER(unaccent(mv.label)) LIKE normalized_query || '%' THEN 0.8
      -- Contains match with trigram similarity
      ELSE GREATEST(
        similarity(LOWER(unaccent(mv.label)), normalized_query) * 0.6,
        similarity(LOWER(unaccent(COALESCE(mv.label_with_country, mv.label))), normalized_query) * 0.3,
        similarity(LOWER(unaccent(mv.code)), normalized_query) * 0.1
      )
    END AS score,
    CASE
      WHEN mv.entity_id = ANY(exact_aliases) THEN 'alias'
      ELSE 'direct'
    END AS source
  FROM destinations_search_mv mv
  WHERE 
    (NOT only_active OR mv.is_active = true)
    AND mv.type = ANY(types_filter)
    AND (
      -- Alias match
      mv.entity_id = ANY(exact_aliases)
      -- Direct text match
      OR LOWER(unaccent(mv.label)) LIKE '%' || normalized_query || '%'
      OR LOWER(unaccent(COALESCE(mv.label_with_country, mv.label))) LIKE '%' || normalized_query || '%'
      OR LOWER(unaccent(mv.code)) LIKE '%' || normalized_query || '%'
      -- Fuzzy match
      OR similarity(LOWER(unaccent(mv.label)), normalized_query) > 0.25
      OR similarity(LOWER(unaccent(COALESCE(mv.label_with_country, mv.label))), normalized_query) > 0.25
    )
  ORDER BY 
    score DESC,
    CASE mv.type 
      WHEN 'city' THEN 1 
      WHEN 'country' THEN 2 
      WHEN 'region' THEN 3 
    END,
    mv.sort_order ASC,
    mv.label ASC
  LIMIT result_limit;
END $$;

-- Create initial data refresh
REFRESH MATERIALIZED VIEW destinations_search_mv;

-- Grant permissions
GRANT SELECT ON destinations_search_mv TO PUBLIC;
GRANT EXECUTE ON FUNCTION search_destinations(TEXT, INT, TEXT[], BOOLEAN) TO PUBLIC;

-- Add helpful comments
COMMENT ON TABLE regions IS 'Geographical regions (continents, country groups, India subregions)';
COMMENT ON TABLE countries IS 'Countries with regional assignments';
COMMENT ON TABLE cities IS 'Cities with country and optional regional assignments';
COMMENT ON TABLE destination_aliases IS 'Alternative names, airport codes, and historical names';
COMMENT ON MATERIALIZED VIEW destinations_search_mv IS 'Fast search index for all destinations';
COMMENT ON FUNCTION search_destinations IS 'Smart search with alias resolution and scoring';

-- Success message
DO $$
BEGIN
  RAISE NOTICE '✅ Complete Destinations Master Schema v2 created successfully!';
  RAISE NOTICE '📊 Tables: regions, countries, cities, destination_aliases';
  RAISE NOTICE '🚀 Materialized view: destinations_search_mv with auto-refresh triggers';
  RAISE NOTICE '🔍 Search function: search_destinations() with alias resolution';
END $$;
