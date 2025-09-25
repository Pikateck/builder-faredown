-- =====================================================
-- Simple Search Performance Migration
-- Adds basic performance improvements and aliases
-- =====================================================

-- Enable pg_trgm extension for fast text search
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Add search_tokens column to each table for aliases/alternative names
ALTER TABLE regions ADD COLUMN IF NOT EXISTS search_tokens TEXT[];
ALTER TABLE countries ADD COLUMN IF NOT EXISTS search_tokens TEXT[];
ALTER TABLE cities ADD COLUMN IF NOT EXISTS search_tokens TEXT[];

-- Add combined search text columns
ALTER TABLE regions ADD COLUMN IF NOT EXISTS search_text TEXT;
ALTER TABLE countries ADD COLUMN IF NOT EXISTS search_text TEXT;  
ALTER TABLE cities ADD COLUMN IF NOT EXISTS search_text TEXT;

-- Create GIN indexes for fast text search (without CONCURRENTLY to work in transaction)
DROP INDEX IF EXISTS idx_regions_name_trgm;
CREATE INDEX idx_regions_name_trgm ON regions USING GIN (name gin_trgm_ops);

DROP INDEX IF EXISTS idx_countries_name_trgm;
CREATE INDEX idx_countries_name_trgm ON countries USING GIN (name gin_trgm_ops);

DROP INDEX IF EXISTS idx_cities_name_trgm;
CREATE INDEX idx_cities_name_trgm ON cities USING GIN (name gin_trgm_ops);

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

-- Update search_text fields with combined searchable text
UPDATE regions SET search_text = lower(name || ' ' || COALESCE(array_to_string(search_tokens, ' '), ''));
UPDATE countries SET search_text = lower(name || ' ' || COALESCE(iso_code, '') || ' ' || COALESCE(array_to_string(search_tokens, ' '), ''));
UPDATE cities SET search_text = lower(name || ' ' || COALESCE(code, '') || ' ' || COALESCE(array_to_string(search_tokens, ' '), ''));

-- Create GIN indexes on search_text for full-text search
DROP INDEX IF EXISTS idx_regions_search_text;
CREATE INDEX idx_regions_search_text ON regions USING GIN (search_text gin_trgm_ops);

DROP INDEX IF EXISTS idx_countries_search_text;
CREATE INDEX idx_countries_search_text ON countries USING GIN (search_text gin_trgm_ops);

DROP INDEX IF EXISTS idx_cities_search_text;
CREATE INDEX idx_cities_search_text ON cities USING GIN (search_text gin_trgm_ops);

-- Create search_tokens indexes for array searches
DROP INDEX IF EXISTS idx_regions_search_tokens;
CREATE INDEX idx_regions_search_tokens ON regions USING GIN (search_tokens);

DROP INDEX IF EXISTS idx_countries_search_tokens;
CREATE INDEX idx_countries_search_tokens ON countries USING GIN (search_tokens);

DROP INDEX IF EXISTS idx_cities_search_tokens;
CREATE INDEX idx_cities_search_tokens ON cities USING GIN (search_tokens);
