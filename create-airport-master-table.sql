-- Create airport_master table
CREATE TABLE IF NOT EXISTS airport_master (
  id SERIAL PRIMARY KEY,
  iata VARCHAR(3) UNIQUE NOT NULL,
  icao VARCHAR(4),
  name VARCHAR(255) NOT NULL,
  city VARCHAR(100) NOT NULL,
  country VARCHAR(100) NOT NULL,
  iso_country VARCHAR(2),
  country_code VARCHAR(2),
  latitude DECIMAL(10, 6),
  longitude DECIMAL(10, 6),
  altitude INTEGER,
  timezone VARCHAR(50),
  dst VARCHAR(1),
  tz_database VARCHAR(50),
  type VARCHAR(50),
  source VARCHAR(50),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better search performance
CREATE INDEX IF NOT EXISTS idx_airport_iata ON airport_master(iata);
CREATE INDEX IF NOT EXISTS idx_airport_name ON airport_master(name);
CREATE INDEX IF NOT EXISTS idx_airport_city ON airport_master(city);
CREATE INDEX IF NOT EXISTS idx_airport_country ON airport_master(country);
CREATE INDEX IF NOT EXISTS idx_airport_active ON airport_master(is_active);
CREATE INDEX IF NOT EXISTS idx_airport_search ON airport_master USING gin(to_tsvector('english', name || ' ' || city || ' ' || country));

-- Insert sample airport data (major international airports)
INSERT INTO airport_master (iata, icao, name, city, country, iso_country, country_code, latitude, longitude, is_active) VALUES
-- India
('BOM', 'VABB', 'Chhatrapati Shivaji Maharaj International Airport', 'Mumbai', 'India', 'IN', 'IN', 19.0887, 72.8679, true),
('DEL', 'VIDP', 'Indira Gandhi International Airport', 'Delhi', 'India', 'IN', 'IN', 28.5562, 77.1000, true),
('BLR', 'VOBL', 'Kempegowda International Airport', 'Bangalore', 'India', 'IN', 'IN', 13.1979, 77.7063, true),
('MAA', 'VOMM', 'Chennai International Airport', 'Chennai', 'India', 'IN', 'IN', 12.9941, 80.1709, true),
('CCU', 'VECC', 'Netaji Subhas Chandra Bose International Airport', 'Kolkata', 'India', 'IN', 'IN', 22.6547, 88.4467, true),
('HYD', 'VOHS', 'Rajiv Gandhi International Airport', 'Hyderabad', 'India', 'IN', 'IN', 17.2403, 78.4294, true),
('AMD', 'VAAH', 'Sardar Vallabhbhai Patel International Airport', 'Ahmedabad', 'India', 'IN', 'IN', 23.0772, 72.6347, true),
('GOI', 'VAGO', 'Goa International Airport', 'Goa', 'India', 'IN', 'IN', 15.3808, 73.8314, true),
('COK', 'VOCI', 'Cochin International Airport', 'Kochi', 'India', 'IN', 'IN', 10.1520, 76.4019, true),
('PNQ', 'VAPO', 'Pune Airport', 'Pune', 'India', 'IN', 'IN', 18.5821, 73.9197, true),

-- UAE
('DXB', 'OMDB', 'Dubai International Airport', 'Dubai', 'United Arab Emirates', 'AE', 'AE', 25.2528, 55.3644, true),
('AUH', 'OMAA', 'Abu Dhabi International Airport', 'Abu Dhabi', 'United Arab Emirates', 'AE', 'AE', 24.4330, 54.6511, true),
('SHJ', 'OMSJ', 'Sharjah International Airport', 'Sharjah', 'United Arab Emirates', 'AE', 'AE', 25.3286, 55.5172, true),

-- UK
('LHR', 'EGLL', 'London Heathrow Airport', 'London', 'United Kingdom', 'GB', 'GB', 51.4700, -0.4543, true),
('LGW', 'EGKK', 'London Gatwick Airport', 'London', 'United Kingdom', 'GB', 'GB', 51.1537, -0.1821, true),
('MAN', 'EGCC', 'Manchester Airport', 'Manchester', 'United Kingdom', 'GB', 'GB', 53.3537, -2.2750, true),

-- USA
('JFK', 'KJFK', 'John F. Kennedy International Airport', 'New York', 'United States', 'US', 'US', 40.6413, -73.7781, true),
('LAX', 'KLAX', 'Los Angeles International Airport', 'Los Angeles', 'United States', 'US', 'US', 33.9416, -118.4085, true),
('ORD', 'KORD', 'O''Hare International Airport', 'Chicago', 'United States', 'US', 'US', 41.9742, -87.9073, true),
('MIA', 'KMIA', 'Miami International Airport', 'Miami', 'United States', 'US', 'US', 25.7959, -80.2870, true),

-- Singapore
('SIN', 'WSSS', 'Singapore Changi Airport', 'Singapore', 'Singapore', 'SG', 'SG', 1.3644, 103.9915, true),

-- Australia
('SYD', 'YSSY', 'Sydney Kingsford Smith International Airport', 'Sydney', 'Australia', 'AU', 'AU', -33.9399, 151.1753, true),
('MEL', 'YMML', 'Melbourne Airport', 'Melbourne', 'Australia', 'AU', 'AU', -37.6690, 144.8410, true),

-- France
('CDG', 'LFPG', 'Charles de Gaulle Airport', 'Paris', 'France', 'FR', 'FR', 49.0097, 2.5479, true),

-- Germany
('FRA', 'EDDF', 'Frankfurt am Main Airport', 'Frankfurt', 'Germany', 'DE', 'DE', 50.0379, 8.5622, true),

-- Qatar
('DOH', 'OTHH', 'Hamad International Airport', 'Doha', 'Qatar', 'QA', 'QA', 25.2731, 51.6080, true),

-- Ireland
('DUB', 'EIDW', 'Dublin Airport', 'Dublin', 'Ireland', 'IE', 'IE', 53.4213, -6.2701, true),

-- Thailand
('BKK', 'VTBS', 'Suvarnabhumi Airport', 'Bangkok', 'Thailand', 'TH', 'TH', 13.6900, 100.7501, true),

-- Malaysia
('KUL', 'WMKK', 'Kuala Lumpur International Airport', 'Kuala Lumpur', 'Malaysia', 'MY', 'MY', 2.7456, 101.7099, true),

-- Hong Kong
('HKG', 'VHHH', 'Hong Kong International Airport', 'Hong Kong', 'Hong Kong', 'HK', 'HK', 22.3080, 113.9185, true),

-- Japan
('NRT', 'RJAA', 'Narita International Airport', 'Tokyo', 'Japan', 'JP', 'JP', 35.7720, 140.3929, true),
('HND', 'RJTT', 'Tokyo Haneda Airport', 'Tokyo', 'Japan', 'JP', 'JP', 35.5494, 139.7798, true)

ON CONFLICT (iata) DO NOTHING;

-- Create search function for better performance
CREATE OR REPLACE FUNCTION search_airports(
  search_query TEXT,
  result_limit INTEGER DEFAULT 50,
  result_offset INTEGER DEFAULT 0
)
RETURNS TABLE (
  iata VARCHAR(3),
  name VARCHAR(255),
  city VARCHAR(100),
  country VARCHAR(100),
  iso_country VARCHAR(2)
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    a.iata,
    a.name,
    a.city,
    a.country,
    COALESCE(a.iso_country, a.country_code) as iso_country
  FROM airport_master a
  WHERE a.is_active = true
    AND (
      a.name ILIKE '%' || search_query || '%'
      OR a.iata ILIKE '%' || search_query || '%'
      OR a.city ILIKE '%' || search_query || '%'
      OR a.country ILIKE '%' || search_query || '%'
    )
  ORDER BY 
    CASE 
      WHEN a.iata ILIKE search_query THEN 1
      WHEN a.iata ILIKE search_query || '%' THEN 2
      WHEN a.city ILIKE search_query || '%' THEN 3
      ELSE 4
    END,
    a.name
  LIMIT result_limit
  OFFSET result_offset;
END;
$$ LANGUAGE plpgsql;
