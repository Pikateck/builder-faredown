-- =====================================================
-- Update schema to support custom CSV ID format
-- Changes UUID PKs to TEXT to accommodate CTRY-XX, CITY-XX format
-- =====================================================

-- Temporarily disable foreign key constraints
SET session_replication_role = replica;

-- Drop existing foreign key constraints
ALTER TABLE cities DROP CONSTRAINT IF EXISTS cities_country_id_fkey;
ALTER TABLE cities DROP CONSTRAINT IF EXISTS cities_region_id_fkey;
ALTER TABLE countries DROP CONSTRAINT IF EXISTS countries_region_id_fkey;

-- Update regions table
ALTER TABLE regions ALTER COLUMN id TYPE TEXT;
ALTER TABLE regions ALTER COLUMN parent_id TYPE TEXT;

-- Update countries table
ALTER TABLE countries ALTER COLUMN id TYPE TEXT;
ALTER TABLE countries ALTER COLUMN region_id TYPE TEXT;

-- Update cities table  
ALTER TABLE cities ALTER COLUMN id TYPE TEXT;
ALTER TABLE cities ALTER COLUMN country_id TYPE TEXT;
ALTER TABLE cities ALTER COLUMN region_id TYPE TEXT;

-- Re-enable foreign key constraints
SET session_replication_role = DEFAULT;

-- Recreate foreign key constraints
ALTER TABLE countries 
  ADD CONSTRAINT countries_region_id_fkey 
  FOREIGN KEY (region_id) REFERENCES regions(id) ON DELETE RESTRICT;

ALTER TABLE cities 
  ADD CONSTRAINT cities_country_id_fkey 
  FOREIGN KEY (country_id) REFERENCES countries(id) ON DELETE RESTRICT;

ALTER TABLE cities 
  ADD CONSTRAINT cities_region_id_fkey 
  FOREIGN KEY (region_id) REFERENCES regions(id) ON DELETE SET NULL;

-- Add level column to regions if it doesn't exist
ALTER TABLE regions ADD COLUMN IF NOT EXISTS level TEXT DEFAULT 'region';

-- Update indexes to work with TEXT IDs
DROP INDEX IF EXISTS idx_regions_name_trgm;
CREATE INDEX idx_regions_name_trgm ON regions USING GIN (name gin_trgm_ops);

DROP INDEX IF EXISTS idx_countries_name_trgm;
CREATE INDEX idx_countries_name_trgm ON countries USING GIN (name gin_trgm_ops);

DROP INDEX IF EXISTS idx_cities_name_trgm;
CREATE INDEX idx_cities_name_trgm ON cities USING GIN (name gin_trgm_ops);

-- Ensure search columns exist
ALTER TABLE regions ADD COLUMN IF NOT EXISTS search_tokens TEXT[];
ALTER TABLE regions ADD COLUMN IF NOT EXISTS search_text TEXT;

ALTER TABLE countries ADD COLUMN IF NOT EXISTS search_tokens TEXT[];
ALTER TABLE countries ADD COLUMN IF NOT EXISTS search_text TEXT;

ALTER TABLE cities ADD COLUMN IF NOT EXISTS search_tokens TEXT[];
ALTER TABLE cities ADD COLUMN IF NOT EXISTS search_text TEXT;

-- Update search indexes
DROP INDEX IF EXISTS idx_regions_search_tokens;
CREATE INDEX idx_regions_search_tokens ON regions USING GIN (search_tokens);

DROP INDEX IF EXISTS idx_countries_search_tokens;
CREATE INDEX idx_countries_search_tokens ON countries USING GIN (search_tokens);

DROP INDEX IF EXISTS idx_cities_search_tokens;
CREATE INDEX idx_cities_search_tokens ON cities USING GIN (search_tokens);

DROP INDEX IF EXISTS idx_regions_search_text;
CREATE INDEX idx_regions_search_text ON regions USING GIN (search_text gin_trgm_ops);

DROP INDEX IF EXISTS idx_countries_search_text;
CREATE INDEX idx_countries_search_text ON countries USING GIN (search_text gin_trgm_ops);

DROP INDEX IF EXISTS idx_cities_search_text;
CREATE INDEX idx_cities_search_text ON cities USING GIN (search_text gin_trgm_ops);

COMMIT;
