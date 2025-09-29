-- Fix Packages Destination Mapping
-- Updates existing packages to have proper region/country/city linkage
-- Ensures 3 package types per region as requested

-- =============================================
-- STEP 1: Update existing packages with proper destination linkage
-- =============================================

-- Update Dubai packages
UPDATE packages 
SET 
  city_id = (SELECT id FROM cities WHERE name = 'Dubai' LIMIT 1),
  country_id = (SELECT id FROM countries WHERE name = 'United Arab Emirates' LIMIT 1),
  region_id = (SELECT id FROM regions WHERE name = 'Middle East' LIMIT 1)
WHERE LOWER(title) LIKE '%dubai%';

-- Update India packages (map to specific regions based on title)
UPDATE packages 
SET 
  country_id = (SELECT id FROM countries WHERE name = 'India' LIMIT 1),
  region_id = (SELECT id FROM regions WHERE name = 'North India' LIMIT 1)
WHERE LOWER(title) LIKE '%north india%' OR LOWER(title) LIKE '%golden triangle%';

-- Update Europe packages
UPDATE packages 
SET 
  region_id = (SELECT id FROM regions WHERE name = 'Europe' LIMIT 1)
WHERE LOWER(title) LIKE '%europe%' OR LOWER(title) LIKE '%european%';

-- Update Egypt packages (Africa region)
UPDATE packages 
SET 
  country_id = (SELECT id FROM countries WHERE name = 'Egypt' LIMIT 1),
  region_id = (SELECT id FROM regions WHERE name = 'Africa' LIMIT 1)
WHERE LOWER(title) LIKE '%egypt%';

-- =============================================
-- STEP 2: Create region-specific package setup
-- Ensure 3 different package types per major region
-- =============================================

-- Add package categories if not exists
ALTER TABLE packages ADD COLUMN IF NOT EXISTS package_category VARCHAR(50);

-- Update existing packages with categories
UPDATE packages SET package_category = 'luxury' WHERE LOWER(title) LIKE '%luxury%';
UPDATE packages SET package_category = 'explorer' WHERE LOWER(title) LIKE '%explorer%' OR LOWER(title) LIKE '%city%';
UPDATE packages SET package_category = 'cultural' WHERE LOWER(title) LIKE '%highlights%' OR LOWER(title) LIKE '%triangle%' OR LOWER(title) LIKE '%essentials%';
UPDATE packages SET package_category = 'standard' WHERE package_category IS NULL;

-- =============================================
-- STEP 3: Create package templates for major regions
-- Insert sample packages for each region to ensure 3 types per region
-- =============================================

-- Function to ensure 3 package types per region
CREATE OR REPLACE FUNCTION ensure_regional_packages() RETURNS void AS $$
DECLARE
    region_record RECORD;
    package_types TEXT[] := ARRAY['luxury', 'standard', 'budget'];
    package_type TEXT;
    existing_count INT;
BEGIN
    -- Loop through major destination regions
    FOR region_record IN 
        SELECT id, name FROM regions 
        WHERE name IN ('Middle East', 'Europe', 'Asia', 'Africa', 'North India', 'South India')
    LOOP
        -- For each package type, ensure at least one exists
        FOREACH package_type IN ARRAY package_types
        LOOP
            SELECT COUNT(*) INTO existing_count
            FROM packages 
            WHERE region_id = region_record.id 
              AND package_category = package_type 
              AND status = 'active';
              
            -- If no package of this type exists for this region, create a template
            IF existing_count = 0 THEN
                INSERT INTO packages (
                    slug,
                    title,
                    region_id,
                    duration_days,
                    duration_nights,
                    overview,
                    description,
                    base_price_pp,
                    currency,
                    category,
                    package_category,
                    status,
                    is_featured,
                    inclusions,
                    exclusions,
                    created_at,
                    updated_at
                ) VALUES (
                    LOWER(REPLACE(region_record.name || '-' || package_type || '-package', ' ', '-')),
                    region_record.name || ' ' || INITCAP(package_type) || ' Package',
                    region_record.id,
                    CASE package_type 
                        WHEN 'luxury' THEN 7
                        WHEN 'standard' THEN 5
                        ELSE 4
                    END,
                    CASE package_type 
                        WHEN 'luxury' THEN 6
                        WHEN 'standard' THEN 4
                        ELSE 3
                    END,
                    'Experience the best of ' || region_record.name || ' with our ' || package_type || ' package.',
                    'A carefully curated ' || package_type || ' travel experience showcasing the highlights of ' || region_record.name || '.',
                    CASE package_type 
                        WHEN 'luxury' THEN 125000.00
                        WHEN 'standard' THEN 75000.00
                        ELSE 45000.00
                    END,
                    'INR',
                    package_type,
                    package_type,
                    'active',
                    CASE package_type WHEN 'luxury' THEN TRUE ELSE FALSE END,
                    CASE package_type 
                        WHEN 'luxury' THEN '["5-star accommodation", "Private transfers", "Personal guide", "Premium experiences"]'::jsonb
                        WHEN 'standard' THEN '["3-star accommodation", "Group transfers", "Guided tours", "Cultural experiences"]'::jsonb
                        ELSE '["Budget accommodation", "Local transport", "Basic sightseeing", "Authentic experiences"]'::jsonb
                    END,
                    '["International flights", "Personal expenses", "Travel insurance", "Optional activities"]'::jsonb,
                    NOW(),
                    NOW()
                );
                
                RAISE NOTICE 'Created % package for %', package_type, region_record.name;
            END IF;
        END LOOP;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Execute the function to create regional packages
SELECT ensure_regional_packages();

-- =============================================
-- STEP 4: Create default departures for packages without them
-- =============================================

-- Function to ensure all packages have departures
CREATE OR REPLACE FUNCTION ensure_package_departures() RETURNS void AS $$
DECLARE
    package_record RECORD;
    departure_count INT;
    departure_dates DATE[];
    departure_date DATE;
BEGIN
    -- Pre-defined departure dates for October 2025
    departure_dates := ARRAY[
        '2025-10-01'::DATE,
        '2025-10-08'::DATE,
        '2025-10-15'::DATE,
        '2025-10-22'::DATE,
        '2025-10-29'::DATE
    ];
    
    -- Loop through all active packages
    FOR package_record IN 
        SELECT id, title, region_id, duration_days FROM packages WHERE status = 'active'
    LOOP
        -- Check if package has departures
        SELECT COUNT(*) INTO departure_count
        FROM package_departures 
        WHERE package_id = package_record.id 
          AND departure_date >= CURRENT_DATE;
          
        -- If no departures, create them
        IF departure_count = 0 THEN
            FOREACH departure_date IN ARRAY departure_dates
            LOOP
                INSERT INTO package_departures (
                    package_id,
                    departure_city_code,
                    departure_city_name,
                    departure_date,
                    return_date,
                    total_seats,
                    booked_seats,
                    price_per_person,
                    single_supplement,
                    child_price,
                    infant_price,
                    currency,
                    early_bird_discount,
                    early_bird_deadline,
                    is_active,
                    is_guaranteed,
                    special_notes,
                    created_at,
                    updated_at
                ) VALUES (
                    package_record.id,
                    'BOM',
                    'Mumbai',
                    departure_date,
                    departure_date + package_record.duration_days,
                    20,
                    0,
                    (SELECT base_price_pp FROM packages WHERE id = package_record.id),
                    5000.00,
                    (SELECT base_price_pp * 0.8 FROM packages WHERE id = package_record.id),
                    0.00,
                    'INR',
                    10.00,
                    departure_date - INTERVAL '30 days',
                    TRUE,
                    TRUE,
                    'Guaranteed departure with minimum 2 passengers',
                    NOW(),
                    NOW()
                );
            END LOOP;
            
            RAISE NOTICE 'Created departures for package: %', package_record.title;
        END IF;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Execute the function to create departures
SELECT ensure_package_departures();

-- =============================================
-- STEP 5: Add constraints to ensure data quality
-- =============================================

-- Add constraint to ensure packages have at least one departure
-- (We'll implement this as a trigger instead of a constraint for flexibility)

CREATE OR REPLACE FUNCTION check_package_has_departures() RETURNS TRIGGER AS $$
BEGIN
    -- When a package is set to active, ensure it has at least one future departure
    IF NEW.status = 'active' AND OLD.status != 'active' THEN
        IF NOT EXISTS (
            SELECT 1 FROM package_departures 
            WHERE package_id = NEW.id 
              AND departure_date >= CURRENT_DATE 
              AND is_active = TRUE
        ) THEN
            RAISE WARNING 'Package % activated without future departures', NEW.title;
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
DROP TRIGGER IF EXISTS trigger_check_package_departures ON packages;
CREATE TRIGGER trigger_check_package_departures
    AFTER UPDATE ON packages
    FOR EACH ROW
    EXECUTE FUNCTION check_package_has_departures();

-- =============================================
-- STEP 6: Create indexes for efficient filtering
-- =============================================

-- Create composite indexes for efficient destination + date filtering
CREATE INDEX IF NOT EXISTS idx_packages_destination_status 
ON packages(region_id, country_id, city_id, status);

CREATE INDEX IF NOT EXISTS idx_packages_category_region 
ON packages(package_category, region_id, status);

CREATE INDEX IF NOT EXISTS idx_departures_date_city_available 
ON package_departures(departure_date, departure_city_code, is_active) 
WHERE available_seats > 0;

-- =============================================
-- STEP 7: Create views for efficient API queries
-- =============================================

-- View for package search with proper destination filtering
CREATE OR REPLACE VIEW v_packages_with_destinations AS
SELECT 
    p.*,
    r.name as region_name,
    c.name as country_name,
    ci.name as city_name,
    r.id as region_id_resolved,
    c.id as country_id_resolved,
    ci.id as city_id_resolved,
    (
        SELECT MIN(pd.departure_date)
        FROM package_departures pd 
        WHERE pd.package_id = p.id 
          AND pd.is_active = TRUE 
          AND pd.departure_date >= CURRENT_DATE
          AND pd.available_seats > 0
    ) as next_departure_date,
    (
        SELECT MIN(pd.price_per_person)
        FROM package_departures pd 
        WHERE pd.package_id = p.id 
          AND pd.is_active = TRUE 
          AND pd.departure_date >= CURRENT_DATE
          AND pd.available_seats > 0
    ) as from_price,
    (
        SELECT COUNT(*)
        FROM package_departures pd 
        WHERE pd.package_id = p.id 
          AND pd.is_active = TRUE 
          AND pd.departure_date >= CURRENT_DATE
          AND pd.available_seats > 0
    ) as available_departures_count
FROM packages p
LEFT JOIN regions r ON p.region_id = r.id
LEFT JOIN countries c ON p.country_id = c.id
LEFT JOIN cities ci ON p.city_id = ci.id
WHERE p.status = 'active';

-- View for regional package distribution
CREATE OR REPLACE VIEW v_regional_package_distribution AS
SELECT 
    r.name as region_name,
    r.id as region_id,
    COUNT(p.id) as total_packages,
    COUNT(CASE WHEN p.package_category = 'luxury' THEN 1 END) as luxury_packages,
    COUNT(CASE WHEN p.package_category = 'standard' THEN 1 END) as standard_packages,
    COUNT(CASE WHEN p.package_category = 'budget' THEN 1 END) as budget_packages,
    MIN(p.base_price_pp) as min_price,
    MAX(p.base_price_pp) as max_price,
    AVG(p.base_price_pp) as avg_price
FROM regions r
LEFT JOIN packages p ON r.id = p.region_id AND p.status = 'active'
GROUP BY r.id, r.name
HAVING COUNT(p.id) > 0
ORDER BY total_packages DESC;

-- Verification queries
SELECT 'Packages with proper destination mapping:' as status;
SELECT 
    title,
    region_name,
    country_name,
    city_name,
    package_category,
    base_price_pp
FROM v_packages_with_destinations 
WHERE region_id IS NOT NULL
ORDER BY region_name, package_category;

SELECT 'Regional package distribution:' as status;
SELECT * FROM v_regional_package_distribution;

SELECT 'Packages ready for Dubai filtering:' as status;
SELECT 
    p.title,
    p.package_category,
    ci.name as city_name,
    COUNT(pd.id) as departure_count
FROM packages p
JOIN cities ci ON p.city_id = ci.id
LEFT JOIN package_departures pd ON p.id = pd.package_id 
    AND pd.departure_date BETWEEN '2025-10-01' AND '2025-10-05'
    AND pd.is_active = TRUE
WHERE ci.name = 'Dubai'
GROUP BY p.id, p.title, p.package_category, ci.name;
