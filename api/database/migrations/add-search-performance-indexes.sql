-- =====================================================
-- Search Performance Optimization Migration
-- Adds trigram indexes, aliases, and search optimization
-- =====================================================

-- Enable pg_trgm extension for fast text search
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Add search_tokens column to each table for aliases/alternative names
ALTER TABLE regions ADD COLUMN IF NOT EXISTS search_tokens TEXT[];
ALTER TABLE countries ADD COLUMN IF NOT EXISTS search_tokens TEXT[];
ALTER TABLE cities ADD COLUMN IF NOT EXISTS search_tokens TEXT[];

-- Create GIN indexes for fast text search using trigrams
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_regions_name_trgm ON regions USING GIN (name gin_trgm_ops);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_regions_search_tokens ON regions USING GIN (search_tokens);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_countries_name_trgm ON countries USING GIN (name gin_trgm_ops);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_countries_search_tokens ON countries USING GIN (search_tokens);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_cities_name_trgm ON cities USING GIN (name gin_trgm_ops);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_cities_search_tokens ON cities USING GIN (search_tokens);

-- Add combined search text columns for better searching
ALTER TABLE regions ADD COLUMN IF NOT EXISTS search_text TEXT;
ALTER TABLE countries ADD COLUMN IF NOT EXISTS search_text TEXT;
ALTER TABLE cities ADD COLUMN IF NOT EXISTS search_text TEXT;

-- Create GIN indexes on the combined search text
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_regions_search_text ON regions USING GIN (search_text gin_trgm_ops);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_countries_search_text ON countries USING GIN (search_text gin_trgm_ops);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_cities_search_text ON cities USING GIN (search_text gin_trgm_ops);

-- Function to update search_text and search_tokens
CREATE OR REPLACE FUNCTION update_destination_search_fields() RETURNS TRIGGER AS $$
BEGIN
  -- Update search_text with lowercase combined text
  CASE TG_TABLE_NAME
    WHEN 'regions' THEN
      NEW.search_text := lower(NEW.name || ' ' || COALESCE(array_to_string(NEW.search_tokens, ' '), ''));
    WHEN 'countries' THEN
      NEW.search_text := lower(NEW.name || ' ' || COALESCE(NEW.iso_code, '') || ' ' || COALESCE(array_to_string(NEW.search_tokens, ' '), ''));
    WHEN 'cities' THEN
      NEW.search_text := lower(NEW.name || ' ' || COALESCE(NEW.code, '') || ' ' || COALESCE(array_to_string(NEW.search_tokens, ' '), ''));
  END CASE;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers to auto-update search fields
DROP TRIGGER IF EXISTS trg_regions_search_update ON regions;
CREATE TRIGGER trg_regions_search_update 
  BEFORE INSERT OR UPDATE ON regions
  FOR EACH ROW EXECUTE FUNCTION update_destination_search_fields();

DROP TRIGGER IF EXISTS trg_countries_search_update ON countries;
CREATE TRIGGER trg_countries_search_update 
  BEFORE INSERT OR UPDATE ON countries
  FOR EACH ROW EXECUTE FUNCTION update_destination_search_fields();

DROP TRIGGER IF EXISTS trg_cities_search_update ON cities;
CREATE TRIGGER trg_cities_search_update 
  BEFORE INSERT OR UPDATE ON cities
  FOR EACH ROW EXECUTE FUNCTION update_destination_search_fields();

-- Populate search_tokens with aliases and alternative names
UPDATE regions SET search_tokens = CASE 
  WHEN name = 'Middle East' THEN ARRAY['middle east', 'middleeast', 'western asia', 'gulf']
  WHEN name = 'Europe' THEN ARRAY['europe', 'european union', 'eu', 'schengen']
  WHEN name = 'Asia' THEN ARRAY['asia', 'far east', 'orient']
  WHEN name = 'America' THEN ARRAY['america', 'americas', 'north america', 'south america', 'usa', 'us']
  WHEN name = 'Africa' THEN ARRAY['africa', 'african continent']
  WHEN name = 'Australia & New Zealand' THEN ARRAY['australia', 'new zealand', 'oceania', 'anzac', 'down under']
  WHEN name = 'India' THEN ARRAY['india', 'bharat', 'hindustan', 'indian subcontinent']
  ELSE ARRAY[lower(name)]
END;

UPDATE countries SET search_tokens = CASE 
  WHEN name = 'United Arab Emirates' THEN ARRAY['uae', 'emirates', 'united arab emirates']
  WHEN name = 'United States' THEN ARRAY['usa', 'us', 'america', 'united states']
  WHEN name = 'United Kingdom' THEN ARRAY['uk', 'britain', 'great britain', 'england', 'united kingdom']
  WHEN name = 'France' THEN ARRAY['france', 'french republic']
  WHEN name = 'Germany' THEN ARRAY['germany', 'deutschland']
  WHEN name = 'Spain' THEN ARRAY['spain', 'espana']
  WHEN name = 'Italy' THEN ARRAY['italy', 'italia']
  WHEN name = 'Japan' THEN ARRAY['japan', 'nihon', 'nippon']
  WHEN name = 'South Korea' THEN ARRAY['korea', 'south korea', 'republic of korea']
  WHEN name = 'China' THEN ARRAY['china', 'prc', 'peoples republic of china']
  WHEN name = 'India' THEN ARRAY['india', 'bharat']
  WHEN name = 'Thailand' THEN ARRAY['thailand', 'siam']
  WHEN name = 'Malaysia' THEN ARRAY['malaysia', 'malaya']
  WHEN name = 'Singapore' THEN ARRAY['singapore', 'sg']
  WHEN name = 'Australia' THEN ARRAY['australia', 'oz', 'down under']
  WHEN name = 'New Zealand' THEN ARRAY['new zealand', 'nz', 'kiwi']
  WHEN name = 'Canada' THEN ARRAY['canada', 'ca']
  WHEN name = 'Mexico' THEN ARRAY['mexico', 'mx']
  WHEN name = 'Brazil' THEN ARRAY['brazil', 'brasil']
  WHEN name = 'Argentina' THEN ARRAY['argentina']
  WHEN name = 'South Africa' THEN ARRAY['south africa', 'rsa']
  WHEN name = 'Egypt' THEN ARRAY['egypt', 'misr']
  WHEN name = 'Morocco' THEN ARRAY['morocco', 'maroc']
  ELSE ARRAY[lower(name)]
END;

UPDATE cities SET search_tokens = CASE 
  -- UAE Cities
  WHEN name = 'Dubai' THEN ARRAY['dubai', 'dxb']
  WHEN name = 'Abu Dhabi' THEN ARRAY['abu dhabi', 'auh']
  
  -- USA Cities  
  WHEN name = 'New York' THEN ARRAY['new york', 'nyc', 'big apple']
  WHEN name = 'Los Angeles' THEN ARRAY['los angeles', 'la', 'city of angels']
  WHEN name = 'Las Vegas' THEN ARRAY['las vegas', 'vegas', 'sin city']
  WHEN name = 'San Francisco' THEN ARRAY['san francisco', 'sf', 'frisco']
  WHEN name = 'Chicago' THEN ARRAY['chicago', 'windy city']
  
  -- Europe Cities
  WHEN name = 'London' THEN ARRAY['london', 'ldn']
  WHEN name = 'Paris' THEN ARRAY['paris', 'city of light']
  WHEN name = 'Rome' THEN ARRAY['rome', 'eternal city']
  WHEN name = 'Barcelona' THEN ARRAY['barcelona', 'bcn']
  WHEN name = 'Amsterdam' THEN ARRAY['amsterdam', 'ams']
  WHEN name = 'Berlin' THEN ARRAY['berlin']
  WHEN name = 'Vienna' THEN ARRAY['vienna', 'wien']
  WHEN name = 'Prague' THEN ARRAY['prague', 'praha']
  WHEN name = 'Budapest' THEN ARRAY['budapest']
  WHEN name = 'Athens' THEN ARRAY['athens']
  
  -- Asia Cities
  WHEN name = 'Tokyo' THEN ARRAY['tokyo', 'edo']
  WHEN name = 'Kyoto' THEN ARRAY['kyoto']
  WHEN name = 'Seoul' THEN ARRAY['seoul', 'soul']
  WHEN name = 'Beijing' THEN ARRAY['beijing', 'peking']
  WHEN name = 'Shanghai' THEN ARRAY['shanghai']
  WHEN name = 'Bangkok' THEN ARRAY['bangkok', 'krung thep']
  WHEN name = 'Singapore' THEN ARRAY['singapore', 'sg', 'lion city']
  WHEN name = 'Kuala Lumpur' THEN ARRAY['kuala lumpur', 'kl']
  WHEN name = 'Phuket' THEN ARRAY['phuket']
  
  -- India Cities
  WHEN name = 'Delhi' THEN ARRAY['delhi', 'new delhi', 'del']
  WHEN name = 'Mumbai' THEN ARRAY['mumbai', 'bombay', 'bom']
  WHEN name = 'Chennai' THEN ARRAY['chennai', 'madras', 'maa']
  WHEN name = 'Bangalore' THEN ARRAY['bangalore', 'bengaluru', 'blr']
  WHEN name = 'Hyderabad' THEN ARRAY['hyderabad', 'hyd']
  WHEN name = 'Kochi' THEN ARRAY['kochi', 'cochin', 'cok']
  WHEN name = 'Thiruvananthapuram' THEN ARRAY['thiruvananthapuram', 'trivandrum', 'trv']
  
  -- Australia & New Zealand
  WHEN name = 'Sydney' THEN ARRAY['sydney', 'syd']
  WHEN name = 'Melbourne' THEN ARRAY['melbourne', 'mel']
  WHEN name = 'Auckland' THEN ARRAY['auckland', 'akl']
  WHEN name = 'Christchurch' THEN ARRAY['christchurch', 'chc']
  
  -- Africa & Middle East
  WHEN name = 'Cape Town' THEN ARRAY['cape town', 'cpt']
  WHEN name = 'Johannesburg' THEN ARRAY['johannesburg', 'joburg', 'jnb']
  WHEN name = 'Cairo' THEN ARRAY['cairo', 'cai']
  WHEN name = 'Casablanca' THEN ARRAY['casablanca', 'casa']
  WHEN name = 'Marrakech' THEN ARRAY['marrakech', 'marrakesh']
  
  ELSE ARRAY[lower(name)]
END;

-- Update all search_text fields
UPDATE regions SET updated_at = now(); -- Trigger will update search_text
UPDATE countries SET updated_at = now(); -- Trigger will update search_text  
UPDATE cities SET updated_at = now(); -- Trigger will update search_text

-- Create materialized view for frequently searched destinations
CREATE MATERIALIZED VIEW IF NOT EXISTS popular_destinations AS
SELECT 
  'city' as type,
  c.id,
  c.name || ', ' || co.name as label,
  r.name as region_name,
  co.name as country_name,
  c.search_text,
  c.search_tokens
FROM cities c
JOIN countries co ON co.id = c.country_id  
JOIN regions r ON r.id = co.region_id
WHERE c.is_active = TRUE AND co.is_active = TRUE AND r.is_active = TRUE

UNION ALL

SELECT 
  'country' as type,
  co.id,
  co.name as label,
  r.name as region_name, 
  co.name as country_name,
  co.search_text,
  co.search_tokens
FROM countries co
JOIN regions r ON r.id = co.region_id  
WHERE co.is_active = TRUE AND r.is_active = TRUE

UNION ALL

SELECT 
  'region' as type,
  r.id,
  r.name as label,
  r.name as region_name,
  NULL as country_name,
  r.search_text,
  r.search_tokens  
FROM regions r
WHERE r.is_active = TRUE;

-- Create index on materialized view for fast searching
CREATE INDEX IF NOT EXISTS idx_popular_destinations_search_text ON popular_destinations USING GIN (search_text gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_popular_destinations_search_tokens ON popular_destinations USING GIN (search_tokens);

-- Refresh the materialized view
REFRESH MATERIALIZED VIEW popular_destinations;

-- Create function to refresh the materialized view
CREATE OR REPLACE FUNCTION refresh_popular_destinations() RETURNS void AS $$
BEGIN
  REFRESH MATERIALIZED VIEW popular_destinations;
END;
$$ LANGUAGE plpgsql;

-- Analytics and performance monitoring
CREATE TABLE IF NOT EXISTS search_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  query TEXT NOT NULL,
  results_count INTEGER NOT NULL,
  response_time_ms INTEGER,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_search_analytics_query ON search_analytics (query);
CREATE INDEX IF NOT EXISTS idx_search_analytics_created_at ON search_analytics (created_at);

COMMIT;
