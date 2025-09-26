-- Fixed Packages Seed Data
-- Populate destinations master with Veena World style hierarchy
-- Includes India regions and international destinations

-- ====================
-- REGIONS SEED DATA
-- ====================

-- Root level regions (Level 1)
INSERT INTO regions (name, parent_id, level, sort_order, slug, description) VALUES
('India', NULL, 1, 1, 'india', 'Domestic travel destinations within India'),
('International', NULL, 1, 2, 'international', 'International travel destinations')
ON CONFLICT (name) DO NOTHING;

-- India sub-regions (Level 2)
INSERT INTO regions (name, parent_id, level, sort_order, slug, description) VALUES
('North India', (SELECT id FROM regions WHERE name = 'India'), 2, 1, 'north-india', 'Northern states of India including Delhi, Punjab, Himachal Pradesh'),
('South India', (SELECT id FROM regions WHERE name = 'India'), 2, 2, 'south-india', 'Southern states including Karnataka, Tamil Nadu, Kerala, Andhra Pradesh'),
('East & North East', (SELECT id FROM regions WHERE name = 'India'), 2, 3, 'east-northeast-india', 'Eastern and northeastern states including West Bengal, Assam, Meghalaya'),
('West & Central India', (SELECT id FROM regions WHERE name = 'India'), 2, 4, 'west-central-india', 'Western and central states including Maharashtra, Gujarat, Rajasthan, Madhya Pradesh')
ON CONFLICT (name) DO NOTHING;

-- International regions (Level 2)
INSERT INTO regions (name, parent_id, level, sort_order, slug, description) VALUES
('Europe', (SELECT id FROM regions WHERE name = 'International'), 2, 1, 'europe', 'European countries and destinations'),
('Asia', (SELECT id FROM regions WHERE name = 'International'), 2, 2, 'asia', 'Asian countries excluding India'),
('America', (SELECT id FROM regions WHERE name = 'International'), 2, 3, 'america', 'North and South American destinations'),
('Africa', (SELECT id FROM regions WHERE name = 'International'), 2, 4, 'africa', 'African continent destinations'),
('Middle East', (SELECT id FROM regions WHERE name = 'International'), 2, 5, 'middle-east', 'Middle Eastern countries'),
('Australia & New Zealand', (SELECT id FROM regions WHERE name = 'International'), 2, 6, 'australia-new-zealand', 'Australia and New Zealand')
ON CONFLICT (name) DO NOTHING;

-- India state-level regions (Level 3)
INSERT INTO regions (name, parent_id, level, sort_order, slug, description) VALUES
-- North India states
('Delhi', (SELECT id FROM regions WHERE name = 'North India'), 3, 1, 'delhi', 'National Capital Territory of Delhi'),
('Punjab', (SELECT id FROM regions WHERE name = 'North India'), 3, 2, 'punjab', 'Punjab state'),
('Himachal Pradesh', (SELECT id FROM regions WHERE name = 'North India'), 3, 3, 'himachal-pradesh', 'Himachal Pradesh state'),
('Uttarakhand', (SELECT id FROM regions WHERE name = 'North India'), 3, 4, 'uttarakhand', 'Uttarakhand state'),
('Uttar Pradesh', (SELECT id FROM regions WHERE name = 'North India'), 3, 5, 'uttar-pradesh', 'Uttar Pradesh state'),
('Haryana', (SELECT id FROM regions WHERE name = 'North India'), 3, 6, 'haryana', 'Haryana state'),
('Jammu & Kashmir', (SELECT id FROM regions WHERE name = 'North India'), 3, 7, 'jammu-kashmir', 'Jammu & Kashmir'),

-- South India states  
('Karnataka', (SELECT id FROM regions WHERE name = 'South India'), 3, 1, 'karnataka', 'Karnataka state'),
('Tamil Nadu', (SELECT id FROM regions WHERE name = 'South India'), 3, 2, 'tamil-nadu', 'Tamil Nadu state'),
('Kerala', (SELECT id FROM regions WHERE name = 'South India'), 3, 3, 'kerala', 'Kerala state'),
('Andhra Pradesh', (SELECT id FROM regions WHERE name = 'South India'), 3, 4, 'andhra-pradesh', 'Andhra Pradesh state'),
('Telangana', (SELECT id FROM regions WHERE name = 'South India'), 3, 5, 'telangana', 'Telangana state'),

-- East & Northeast states
('West Bengal', (SELECT id FROM regions WHERE name = 'East & North East'), 3, 1, 'west-bengal', 'West Bengal state'),
('Assam', (SELECT id FROM regions WHERE name = 'East & North East'), 3, 2, 'assam', 'Assam state'),
('Meghalaya', (SELECT id FROM regions WHERE name = 'East & North East'), 3, 3, 'meghalaya', 'Meghalaya state'),
('Sikkim', (SELECT id FROM regions WHERE name = 'East & North East'), 3, 4, 'sikkim', 'Sikkim state'),

-- West & Central states
('Maharashtra', (SELECT id FROM regions WHERE name = 'West & Central India'), 3, 1, 'maharashtra', 'Maharashtra state'),
('Gujarat', (SELECT id FROM regions WHERE name = 'West & Central India'), 3, 2, 'gujarat', 'Gujarat state'),
('Rajasthan', (SELECT id FROM regions WHERE name = 'West & Central India'), 3, 3, 'rajasthan', 'Rajasthan state'),
('Madhya Pradesh', (SELECT id FROM regions WHERE name = 'West & Central India'), 3, 4, 'madhya-pradesh', 'Madhya Pradesh state'),
('Goa', (SELECT id FROM regions WHERE name = 'West & Central India'), 3, 5, 'goa', 'Goa state')
ON CONFLICT (name) DO NOTHING;

-- ====================
-- COUNTRIES SEED DATA
-- ====================

-- India
INSERT INTO countries (iso_code, name, region_id, currency) VALUES
('IN', 'India', (SELECT id FROM regions WHERE name = 'India'), 'INR')
ON CONFLICT (iso_code) DO NOTHING;

-- European countries
INSERT INTO countries (iso_code, name, region_id, currency) VALUES
('FR', 'France', (SELECT id FROM regions WHERE name = 'Europe'), 'EUR'),
('ES', 'Spain', (SELECT id FROM regions WHERE name = 'Europe'), 'EUR'),
('PT', 'Portugal', (SELECT id FROM regions WHERE name = 'Europe'), 'EUR'),
('IT', 'Italy', (SELECT id FROM regions WHERE name = 'Europe'), 'EUR'),
('DE', 'Germany', (SELECT id FROM regions WHERE name = 'Europe'), 'EUR'),
('AT', 'Austria', (SELECT id FROM regions WHERE name = 'Europe'), 'EUR'),
('CH', 'Switzerland', (SELECT id FROM regions WHERE name = 'Europe'), 'CHF'),
('GB', 'United Kingdom', (SELECT id FROM regions WHERE name = 'Europe'), 'GBP'),
('NL', 'Netherlands', (SELECT id FROM regions WHERE name = 'Europe'), 'EUR'),
('BE', 'Belgium', (SELECT id FROM regions WHERE name = 'Europe'), 'EUR'),
('GR', 'Greece', (SELECT id FROM regions WHERE name = 'Europe'), 'EUR'),
('CZ', 'Czech Republic', (SELECT id FROM regions WHERE name = 'Europe'), 'CZK'),
('HU', 'Hungary', (SELECT id FROM regions WHERE name = 'Europe'), 'HUF')
ON CONFLICT (iso_code) DO NOTHING;

-- Asian countries
INSERT INTO countries (iso_code, name, region_id, currency) VALUES
('TH', 'Thailand', (SELECT id FROM regions WHERE name = 'Asia'), 'THB'),
('SG', 'Singapore', (SELECT id FROM regions WHERE name = 'Asia'), 'SGD'),
('MY', 'Malaysia', (SELECT id FROM regions WHERE name = 'Asia'), 'MYR'),
('ID', 'Indonesia', (SELECT id FROM regions WHERE name = 'Asia'), 'IDR'),
('VN', 'Vietnam', (SELECT id FROM regions WHERE name = 'Asia'), 'VND'),
('JP', 'Japan', (SELECT id FROM regions WHERE name = 'Asia'), 'JPY'),
('KR', 'South Korea', (SELECT id FROM regions WHERE name = 'Asia'), 'KRW'),
('CN', 'China', (SELECT id FROM regions WHERE name = 'Asia'), 'CNY'),
('HK', 'Hong Kong', (SELECT id FROM regions WHERE name = 'Asia'), 'HKD'),
('TW', 'Taiwan', (SELECT id FROM regions WHERE name = 'Asia'), 'TWD'),
('LK', 'Sri Lanka', (SELECT id FROM regions WHERE name = 'Asia'), 'LKR'),
('NP', 'Nepal', (SELECT id FROM regions WHERE name = 'Asia'), 'NPR'),
('BT', 'Bhutan', (SELECT id FROM regions WHERE name = 'Asia'), 'BTN')
ON CONFLICT (iso_code) DO NOTHING;

-- American countries
INSERT INTO countries (iso_code, name, region_id, currency) VALUES
('US', 'United States', (SELECT id FROM regions WHERE name = 'America'), 'USD'),
('CA', 'Canada', (SELECT id FROM regions WHERE name = 'America'), 'CAD'),
('MX', 'Mexico', (SELECT id FROM regions WHERE name = 'America'), 'MXN'),
('BR', 'Brazil', (SELECT id FROM regions WHERE name = 'America'), 'BRL'),
('AR', 'Argentina', (SELECT id FROM regions WHERE name = 'America'), 'ARS'),
('CL', 'Chile', (SELECT id FROM regions WHERE name = 'America'), 'CLP'),
('PE', 'Peru', (SELECT id FROM regions WHERE name = 'America'), 'PEN')
ON CONFLICT (iso_code) DO NOTHING;

-- African countries
INSERT INTO countries (iso_code, name, region_id, currency) VALUES
('ZA', 'South Africa', (SELECT id FROM regions WHERE name = 'Africa'), 'ZAR'),
('KE', 'Kenya', (SELECT id FROM regions WHERE name = 'Africa'), 'KES'),
('TZ', 'Tanzania', (SELECT id FROM regions WHERE name = 'Africa'), 'TZS'),
('UG', 'Uganda', (SELECT id FROM regions WHERE name = 'Africa'), 'UGX'),
('EG', 'Egypt', (SELECT id FROM regions WHERE name = 'Africa'), 'EGP'),
('MA', 'Morocco', (SELECT id FROM regions WHERE name = 'Africa'), 'MAD')
ON CONFLICT (iso_code) DO NOTHING;

-- Middle East countries
INSERT INTO countries (iso_code, name, region_id, currency) VALUES
('AE', 'United Arab Emirates', (SELECT id FROM regions WHERE name = 'Middle East'), 'AED'),
('SA', 'Saudi Arabia', (SELECT id FROM regions WHERE name = 'Middle East'), 'SAR'),
('QA', 'Qatar', (SELECT id FROM regions WHERE name = 'Middle East'), 'QAR'),
('OM', 'Oman', (SELECT id FROM regions WHERE name = 'Middle East'), 'OMR'),
('IL', 'Israel', (SELECT id FROM regions WHERE name = 'Middle East'), 'ILS'),
('JO', 'Jordan', (SELECT id FROM regions WHERE name = 'Middle East'), 'JOD'),
('TR', 'Turkey', (SELECT id FROM regions WHERE name = 'Middle East'), 'TRY')
ON CONFLICT (iso_code) DO NOTHING;

-- Australia & New Zealand
INSERT INTO countries (iso_code, name, region_id, currency) VALUES
('AU', 'Australia', (SELECT id FROM regions WHERE name = 'Australia & New Zealand'), 'AUD'),
('NZ', 'New Zealand', (SELECT id FROM regions WHERE name = 'Australia & New Zealand'), 'NZD')
ON CONFLICT (iso_code) DO NOTHING;

-- ====================
-- CITIES SEED DATA
-- ====================

-- Major Indian cities
INSERT INTO cities (country_id, region_id, name, code, latitude, longitude) VALUES
-- Delhi
((SELECT id FROM countries WHERE iso_code = 'IN'), (SELECT id FROM regions WHERE name = 'Delhi'), 'New Delhi', 'DEL', 28.6139, 77.2090),

-- Punjab
((SELECT id FROM countries WHERE iso_code = 'IN'), (SELECT id FROM regions WHERE name = 'Punjab'), 'Amritsar', 'ATQ', 31.6340, 74.8723),
((SELECT id FROM countries WHERE iso_code = 'IN'), (SELECT id FROM regions WHERE name = 'Punjab'), 'Chandigarh', 'IXC', 30.7333, 76.7794),

-- Himachal Pradesh
((SELECT id FROM countries WHERE iso_code = 'IN'), (SELECT id FROM regions WHERE name = 'Himachal Pradesh'), 'Shimla', 'SLV', 31.1048, 77.1734),
((SELECT id FROM countries WHERE iso_code = 'IN'), (SELECT id FROM regions WHERE name = 'Himachal Pradesh'), 'Manali', NULL, 32.2396, 77.1887),
((SELECT id FROM countries WHERE iso_code = 'IN'), (SELECT id FROM regions WHERE name = 'Himachal Pradesh'), 'Dharamshala', 'DHM', 32.2190, 76.3234),

-- Maharashtra
((SELECT id FROM countries WHERE iso_code = 'IN'), (SELECT id FROM regions WHERE name = 'Maharashtra'), 'Mumbai', 'BOM', 19.0760, 72.8777),
((SELECT id FROM countries WHERE iso_code = 'IN'), (SELECT id FROM regions WHERE name = 'Maharashtra'), 'Pune', 'PNQ', 18.5204, 73.8567),
((SELECT id FROM countries WHERE iso_code = 'IN'), (SELECT id FROM regions WHERE name = 'Maharashtra'), 'Aurangabad', 'IXU', 19.8762, 75.3433),

-- Karnataka
((SELECT id FROM countries WHERE iso_code = 'IN'), (SELECT id FROM regions WHERE name = 'Karnataka'), 'Bangalore', 'BLR', 12.9716, 77.5946),
((SELECT id FROM countries WHERE iso_code = 'IN'), (SELECT id FROM regions WHERE name = 'Karnataka'), 'Mysore', 'MYQ', 12.2958, 76.6394),

-- Kerala
((SELECT id FROM countries WHERE iso_code = 'IN'), (SELECT id FROM regions WHERE name = 'Kerala'), 'Kochi', 'COK', 9.9312, 76.2673),
((SELECT id FROM countries WHERE iso_code = 'IN'), (SELECT id FROM regions WHERE name = 'Kerala'), 'Trivandrum', 'TRV', 8.5241, 76.9366),
((SELECT id FROM countries WHERE iso_code = 'IN'), (SELECT id FROM regions WHERE name = 'Kerala'), 'Calicut', 'CCJ', 11.2588, 75.7804),

-- Tamil Nadu
((SELECT id FROM countries WHERE iso_code = 'IN'), (SELECT id FROM regions WHERE name = 'Tamil Nadu'), 'Chennai', 'MAA', 13.0827, 80.2707),
((SELECT id FROM countries WHERE iso_code = 'IN'), (SELECT id FROM regions WHERE name = 'Tamil Nadu'), 'Madurai', 'IXM', 9.9252, 78.1198),

-- Rajasthan
((SELECT id FROM countries WHERE iso_code = 'IN'), (SELECT id FROM regions WHERE name = 'Rajasthan'), 'Jaipur', 'JAI', 26.9124, 75.7873),
((SELECT id FROM countries WHERE iso_code = 'IN'), (SELECT id FROM regions WHERE name = 'Rajasthan'), 'Udaipur', 'UDR', 24.5854, 73.7125),
((SELECT id FROM countries WHERE iso_code = 'IN'), (SELECT id FROM regions WHERE name = 'Rajasthan'), 'Jodhpur', 'JDH', 26.2389, 73.0243),

-- Goa
((SELECT id FROM countries WHERE iso_code = 'IN'), (SELECT id FROM regions WHERE name = 'Goa'), 'Goa', 'GOI', 15.2993, 74.1240),

-- West Bengal
((SELECT id FROM countries WHERE iso_code = 'IN'), (SELECT id FROM regions WHERE name = 'West Bengal'), 'Kolkata', 'CCU', 22.5726, 88.3639),
((SELECT id FROM countries WHERE iso_code = 'IN'), (SELECT id FROM regions WHERE name = 'West Bengal'), 'Darjeeling', 'DAI', 27.0360, 88.2627)
ON CONFLICT (country_id, name) DO NOTHING;

-- International cities
-- France
INSERT INTO cities (country_id, region_id, name, code, latitude, longitude) VALUES
((SELECT id FROM countries WHERE iso_code = 'FR'), (SELECT id FROM regions WHERE name = 'Europe'), 'Paris', 'CDG', 48.8566, 2.3522),
((SELECT id FROM countries WHERE iso_code = 'FR'), (SELECT id FROM regions WHERE name = 'Europe'), 'Lyon', 'LYS', 45.7640, 4.8357),
((SELECT id FROM countries WHERE iso_code = 'FR'), (SELECT id FROM regions WHERE name = 'Europe'), 'Nice', 'NCE', 43.7102, 7.2620),

-- Spain
((SELECT id FROM countries WHERE iso_code = 'ES'), (SELECT id FROM regions WHERE name = 'Europe'), 'Madrid', 'MAD', 40.4168, -3.7038),
((SELECT id FROM countries WHERE iso_code = 'ES'), (SELECT id FROM regions WHERE name = 'Europe'), 'Barcelona', 'BCN', 41.3851, 2.1734),
((SELECT id FROM countries WHERE iso_code = 'ES'), (SELECT id FROM regions WHERE name = 'Europe'), 'Seville', 'SVQ', 37.3891, -5.9845),

-- Portugal
((SELECT id FROM countries WHERE iso_code = 'PT'), (SELECT id FROM regions WHERE name = 'Europe'), 'Lisbon', 'LIS', 38.7223, -9.1393),
((SELECT id FROM countries WHERE iso_code = 'PT'), (SELECT id FROM regions WHERE name = 'Europe'), 'Porto', 'OPO', 41.1579, -8.6291),

-- Italy
((SELECT id FROM countries WHERE iso_code = 'IT'), (SELECT id FROM regions WHERE name = 'Europe'), 'Rome', 'FCO', 41.9028, 12.4964),
((SELECT id FROM countries WHERE iso_code = 'IT'), (SELECT id FROM regions WHERE name = 'Europe'), 'Milan', 'MXP', 45.4642, 9.1900),
((SELECT id FROM countries WHERE iso_code = 'IT'), (SELECT id FROM regions WHERE name = 'Europe'), 'Venice', 'VCE', 45.4408, 12.3155),
((SELECT id FROM countries WHERE iso_code = 'IT'), (SELECT id FROM regions WHERE name = 'Europe'), 'Florence', 'FLR', 43.7696, 11.2558),

-- Germany
((SELECT id FROM countries WHERE iso_code = 'DE'), (SELECT id FROM regions WHERE name = 'Europe'), 'Berlin', 'BER', 52.5200, 13.4050),
((SELECT id FROM countries WHERE iso_code = 'DE'), (SELECT id FROM regions WHERE name = 'Europe'), 'Munich', 'MUC', 48.1351, 11.5820),
((SELECT id FROM countries WHERE iso_code = 'DE'), (SELECT id FROM regions WHERE name = 'Europe'), 'Frankfurt', 'FRA', 50.1109, 8.6821),

-- United Kingdom
((SELECT id FROM countries WHERE iso_code = 'GB'), (SELECT id FROM regions WHERE name = 'Europe'), 'London', 'LHR', 51.5074, -0.1278),
((SELECT id FROM countries WHERE iso_code = 'GB'), (SELECT id FROM regions WHERE name = 'Europe'), 'Edinburgh', 'EDI', 55.9533, -3.1883),

-- Thailand
((SELECT id FROM countries WHERE iso_code = 'TH'), (SELECT id FROM regions WHERE name = 'Asia'), 'Bangkok', 'BKK', 13.7563, 100.5018),
((SELECT id FROM countries WHERE iso_code = 'TH'), (SELECT id FROM regions WHERE name = 'Asia'), 'Phuket', 'HKT', 7.8804, 98.3923),
((SELECT id FROM countries WHERE iso_code = 'TH'), (SELECT id FROM regions WHERE name = 'Asia'), 'Chiang Mai', 'CNX', 18.7883, 98.9853),

-- Singapore
((SELECT id FROM countries WHERE iso_code = 'SG'), (SELECT id FROM regions WHERE name = 'Asia'), 'Singapore', 'SIN', 1.3521, 103.8198),

-- Japan
((SELECT id FROM countries WHERE iso_code = 'JP'), (SELECT id FROM regions WHERE name = 'Asia'), 'Tokyo', 'NRT', 35.6762, 139.6503),
((SELECT id FROM countries WHERE iso_code = 'JP'), (SELECT id FROM regions WHERE name = 'Asia'), 'Osaka', 'KIX', 34.6937, 135.5023),
((SELECT id FROM countries WHERE iso_code = 'JP'), (SELECT id FROM regions WHERE name = 'Asia'), 'Kyoto', NULL, 35.0116, 135.7681),

-- UAE
((SELECT id FROM countries WHERE iso_code = 'AE'), (SELECT id FROM regions WHERE name = 'Middle East'), 'Dubai', 'DXB', 25.2048, 55.2708),
((SELECT id FROM countries WHERE iso_code = 'AE'), (SELECT id FROM regions WHERE name = 'Middle East'), 'Abu Dhabi', 'AUH', 24.4539, 54.3773),

-- United States
((SELECT id FROM countries WHERE iso_code = 'US'), (SELECT id FROM regions WHERE name = 'America'), 'New York', 'JFK', 40.7128, -74.0060),
((SELECT id FROM countries WHERE iso_code = 'US'), (SELECT id FROM regions WHERE name = 'America'), 'Los Angeles', 'LAX', 34.0522, -118.2437),
((SELECT id FROM countries WHERE iso_code = 'US'), (SELECT id FROM regions WHERE name = 'America'), 'San Francisco', 'SFO', 37.7749, -122.4194),
((SELECT id FROM countries WHERE iso_code = 'US'), (SELECT id FROM regions WHERE name = 'America'), 'Las Vegas', 'LAS', 36.1699, -115.1398),

-- Australia
((SELECT id FROM countries WHERE iso_code = 'AU'), (SELECT id FROM regions WHERE name = 'Australia & New Zealand'), 'Sydney', 'SYD', -33.8688, 151.2093),
((SELECT id FROM countries WHERE iso_code = 'AU'), (SELECT id FROM regions WHERE name = 'Australia & New Zealand'), 'Melbourne', 'MEL', -37.8136, 144.9631)
ON CONFLICT (country_id, name) DO NOTHING;

-- ====================
-- SAMPLE PACKAGES
-- ====================

-- Sample Europe package (Spain Portugal)
INSERT INTO packages (
    slug, title, region_id, country_id, duration_days, duration_nights,
    overview, base_price_pp, currency, category, status, is_featured,
    inclusions, exclusions, highlights
) VALUES (
    'spain-portugal-13-days',
    'Spain Portugal - 13 Days',
    (SELECT id FROM regions WHERE name = 'Europe'),
    (SELECT id FROM countries WHERE iso_code = 'ES'),
    13, 12,
    'Discover the charm of Iberian Peninsula with this comprehensive Spain Portugal tour covering major cities and cultural highlights.',
    315000, 'INR',
    'cultural',
    'active',
    TRUE,
    '["Flights ex-Mumbai/Delhi", "12 nights accommodation in 4-star hotels", "Daily breakfast and 10 dinners", "Professional tour manager", "All transfers and sightseeing by air-conditioned coach", "Entrance fees to major attractions"]',
    '["5% GST on tour cost", "Porterage at hotels and airports", "Any meals not mentioned in inclusions", "Personal expenses like laundry, telephone calls", "Tips to guides and drivers", "Travel insurance"]',
    '["Visit 3 countries - Spain, Portugal and Gibraltar", "Explore historic cities of Madrid, Barcelona, Lisbon and Porto", "See iconic landmarks like Sagrada Familia and Park Güell", "Experience flamenco culture in Seville", "Visit the famous Rock of Gibraltar", "Enjoy scenic coastal drives along Portuguese Riviera"]'
)
ON CONFLICT (slug) DO NOTHING;

-- Sample India package (Golden Triangle)
INSERT INTO packages (
    slug, title, region_id, country_id, duration_days, duration_nights,
    overview, base_price_pp, currency, category, status, is_featured,
    inclusions, exclusions, highlights
) VALUES (
    'golden-triangle-6-days',
    'Golden Triangle - Delhi Agra Jaipur 6 Days',
    (SELECT id FROM regions WHERE name = 'North India'),
    (SELECT id FROM countries WHERE iso_code = 'IN'),
    6, 5,
    'Experience India''s most famous triangle of destinations covering the rich heritage and culture of Delhi, Agra, and Jaipur.',
    25000, 'INR',
    'heritage',
    'active',
    TRUE,
    '["5 nights accommodation in premium hotels", "Daily breakfast and dinner", "Air-conditioned transportation", "Professional English-speaking guide", "All monument entry fees", "Airport transfers"]',
    '["Flights to/from Delhi", "Lunch meals", "Personal expenses", "Camera fees at monuments", "Tips and gratuities", "Travel insurance"]',
    '["Visit the magnificent Taj Mahal at sunrise", "Explore Red Fort and Jama Masjid in Delhi", "Discover the Pink City of Jaipur", "Experience local culture and cuisine", "Shop for handicrafts and textiles", "Professional photography assistance"]'
)
ON CONFLICT (slug) DO NOTHING;

-- Sample Asia package (Thailand)
INSERT INTO packages (
    slug, title, region_id, country_id, duration_days, duration_nights,
    overview, base_price_pp, currency, category, status, is_featured,
    inclusions, exclusions, highlights
) VALUES (
    'thailand-bangkok-phuket-7-days',
    'Thailand - Bangkok Phuket 7 Days',
    (SELECT id FROM regions WHERE name = 'Asia'),
    (SELECT id FROM countries WHERE iso_code = 'TH'),
    7, 6,
    'Perfect combination of cultural exploration in Bangkok and beach relaxation in Phuket.',
    85000, 'INR',
    'beach',
    'active',
    FALSE,
    '["Return airfare from Mumbai/Delhi", "6 nights accommodation", "Daily breakfast", "Airport transfers", "Bangkok city tour", "Phi Phi Island day trip", "Local English-speaking guide"]',
    '["Lunch and dinner meals", "Visa fees", "Personal expenses", "Optional tours", "Tips and gratuities", "Travel insurance"]',
    '["Explore bustling markets of Bangkok", "Visit magnificent temples and palaces", "Relax on pristine beaches of Phuket", "Island hopping to Phi Phi Islands", "Experience vibrant nightlife", "Indulge in authentic Thai cuisine"]'
)
ON CONFLICT (slug) DO NOTHING;

-- Sample Dubai package (UAE)
INSERT INTO packages (
    slug, title, region_id, country_id, city_id, duration_days, duration_nights,
    overview, base_price_pp, currency, category, status, is_featured,
    inclusions, exclusions, highlights
) VALUES (
    'dubai-luxury-experience-5-days',
    'Dubai Luxury Experience',
    (SELECT id FROM regions WHERE name = 'Middle East'),
    (SELECT id FROM countries WHERE iso_code = 'AE'),
    (SELECT id FROM cities WHERE name = 'Dubai'),
    5, 4,
    'Experience the ultimate luxury in Dubai with 5-star accommodations, desert safari, and city tours.',
    125000, 'INR',
    'luxury',
    'active',
    TRUE,
    '["Return airfare from Mumbai/Delhi", "4 nights 5-star hotel accommodation", "Daily breakfast", "Airport transfers", "Desert safari with BBQ dinner", "Dubai city tour", "Burj Khalifa visit", "Local English-speaking guide"]',
    '["Lunch and dinner (except BBQ)", "Visa fees", "Personal expenses", "Optional tours", "Tips and gratuities", "Travel insurance"]',
    '["Visit iconic Burj Khalifa", "Explore Dubai Mall and Gold Souk", "Desert safari with camel riding", "Luxury shopping experience", "Traditional dhow cruise", "Modern architectural marvels"]'
)
ON CONFLICT (slug) DO NOTHING;

-- Sample Dubai premium package
INSERT INTO packages (
    slug, title, region_id, country_id, city_id, duration_days, duration_nights,
    overview, base_price_pp, currency, category, status, is_featured,
    inclusions, exclusions, highlights
) VALUES (
    'dubai-city-explorer-4-days',
    'Dubai City Explorer',
    (SELECT id FROM regions WHERE name = 'Middle East'),
    (SELECT id FROM countries WHERE iso_code = 'AE'),
    (SELECT id FROM cities WHERE name = 'Dubai'),
    4, 3,
    'Discover the best of Dubai in 4 days with modern attractions and traditional culture.',
    85000, 'INR',
    'cultural',
    'active',
    FALSE,
    '["Return airfare from Mumbai/Delhi", "3 nights 4-star hotel accommodation", "Daily breakfast", "Airport transfers", "Half-day city tour", "Dubai Marina walk", "Local guide"]',
    '["Lunch and dinner meals", "Visa fees", "Personal expenses", "Optional tours", "Tips and gratuities", "Travel insurance"]',
    '["Explore Old Dubai heritage sites", "Visit Dubai Museum", "Walk through spice and gold souks", "Modern Dubai Marina area", "Traditional Arabic culture", "Stunning skyline views"]'
)
ON CONFLICT (slug) DO NOTHING;

-- Add sample departures for Spain Portugal package
INSERT INTO package_departures (
    package_id, departure_city_code, departure_city_name, departure_date, return_date,
    total_seats, price_per_person, currency, is_guaranteed
) VALUES 
(
    (SELECT id FROM packages WHERE slug = 'spain-portugal-13-days'),
    'BOM', 'Mumbai', '2025-03-15', '2025-03-27',
    40, 315000, 'INR', TRUE
),
(
    (SELECT id FROM packages WHERE slug = 'spain-portugal-13-days'),
    'DEL', 'Delhi', '2025-03-20', '2025-04-01',
    45, 320000, 'INR', TRUE
),
(
    (SELECT id FROM packages WHERE slug = 'spain-portugal-13-days'),
    'BOM', 'Mumbai', '2025-04-10', '2025-04-22',
    40, 325000, 'INR', FALSE
),
(
    (SELECT id FROM packages WHERE slug = 'spain-portugal-13-days'),
    'BLR', 'Bangalore', '2025-04-25', '2025-05-07',
    35, 330000, 'INR', FALSE
)
ON CONFLICT (package_id, departure_city_code, departure_date) DO NOTHING;

-- Add sample departures for Golden Triangle package
INSERT INTO package_departures (
    package_id, departure_city_code, departure_city_name, departure_date, return_date,
    total_seats, price_per_person, currency, is_guaranteed
) VALUES 
(
    (SELECT id FROM packages WHERE slug = 'golden-triangle-6-days'),
    'BOM', 'Mumbai', '2025-03-01', '2025-03-06',
    25, 25000, 'INR', TRUE
),
(
    (SELECT id FROM packages WHERE slug = 'golden-triangle-6-days'),
    'BLR', 'Bangalore', '2025-03-08', '2025-03-13',
    30, 27000, 'INR', TRUE
),
(
    (SELECT id FROM packages WHERE slug = 'golden-triangle-6-days'),
    'COK', 'Kochi', '2025-03-15', '2025-03-20',
    20, 28000, 'INR', FALSE
)
ON CONFLICT (package_id, departure_city_code, departure_date) DO NOTHING;

-- Add sample departures for Thailand package
INSERT INTO package_departures (
    package_id, departure_city_code, departure_city_name, departure_date, return_date,
    total_seats, price_per_person, currency, is_guaranteed
) VALUES
(
    (SELECT id FROM packages WHERE slug = 'thailand-bangkok-phuket-7-days'),
    'BOM', 'Mumbai', '2025-02-20', '2025-02-26',
    30, 85000, 'INR', TRUE
),
(
    (SELECT id FROM packages WHERE slug = 'thailand-bangkok-phuket-7-days'),
    'DEL', 'Delhi', '2025-03-05', '2025-03-11',
    35, 87000, 'INR', TRUE
)
ON CONFLICT (package_id, departure_city_code, departure_date) DO NOTHING;

-- Add sample departures for Dubai Luxury Experience package
INSERT INTO package_departures (
    package_id, departure_city_code, departure_city_name, departure_date, return_date,
    total_seats, price_per_person, currency, is_guaranteed
) VALUES
(
    (SELECT id FROM packages WHERE slug = 'dubai-luxury-experience-5-days'),
    'BOM', 'Mumbai', '2025-10-01', '2025-10-05',
    25, 179998, 'INR', TRUE
),
(
    (SELECT id FROM packages WHERE slug = 'dubai-luxury-experience-5-days'),
    'DEL', 'Delhi', '2025-10-01', '2025-10-05',
    30, 185000, 'INR', TRUE
),
(
    (SELECT id FROM packages WHERE slug = 'dubai-luxury-experience-5-days'),
    'BLR', 'Bangalore', '2025-10-02', '2025-10-06',
    20, 175000, 'INR', FALSE
)
ON CONFLICT (package_id, departure_city_code, departure_date) DO NOTHING;

-- Add sample departures for Dubai City Explorer package
INSERT INTO package_departures (
    package_id, departure_city_code, departure_city_name, departure_date, return_date,
    total_seats, price_per_person, currency, is_guaranteed
) VALUES
(
    (SELECT id FROM packages WHERE slug = 'dubai-city-explorer-4-days'),
    'BOM', 'Mumbai', '2025-10-01', '2025-10-04',
    30, 109998, 'INR', TRUE
),
(
    (SELECT id FROM packages WHERE slug = 'dubai-city-explorer-4-days'),
    'DEL', 'Delhi', '2025-10-02', '2025-10-05',
    25, 115000, 'INR', TRUE
),
(
    (SELECT id FROM packages WHERE slug = 'dubai-city-explorer-4-days'),
    'COK', 'Kochi', '2025-10-03', '2025-10-06',
    15, 120000, 'INR', FALSE
)
ON CONFLICT (package_id, departure_city_code, departure_date) DO NOTHING;

-- Add sample itinerary for Spain Portugal package
INSERT INTO package_itinerary_days (package_id, day_number, title, description, cities, meals_included, accommodation) VALUES
(
    (SELECT id FROM packages WHERE slug = 'spain-portugal-13-days'),
    1, 'Departure from India to Madrid',
    'Depart from Mumbai/Delhi in the evening. Arrive in Madrid the next morning.',
    'Madrid', 'In-flight meals', 'In-flight'
),
(
    (SELECT id FROM packages WHERE slug = 'spain-portugal-13-days'),
    2, 'Madrid Arrival & City Tour',
    'Arrive in Madrid. Check into hotel. Evening city orientation tour covering Puerta del Sol, Plaza Mayor, and Royal Palace.',
    'Madrid', 'Breakfast, Dinner', '4-star hotel in Madrid'
),
(
    (SELECT id FROM packages WHERE slug = 'spain-portugal-13-days'),
    3, 'Madrid to Barcelona via Zaragoza',
    'Morning departure to Barcelona via Zaragoza. En route visit to Basilica of Our Lady of the Pillar. Evening arrival in Barcelona.',
    'Madrid, Zaragoza, Barcelona', 'Breakfast, Dinner', '4-star hotel in Barcelona'
),
(
    (SELECT id FROM packages WHERE slug = 'spain-portugal-13-days'),
    4, 'Barcelona Full Day Sightseeing',
    'Full day Barcelona tour including Sagrada Familia, Park Güell, Las Ramblas, and Gothic Quarter. Optional flamenco show in the evening.',
    'Barcelona', 'Breakfast, Dinner', '4-star hotel in Barcelona'
)
ON CONFLICT (package_id, day_number) DO NOTHING;

-- Add sample tags
INSERT INTO package_tags (package_id, tag) VALUES
((SELECT id FROM packages WHERE slug = 'spain-portugal-13-days'), 'Europe'),
((SELECT id FROM packages WHERE slug = 'spain-portugal-13-days'), 'Cultural'),
((SELECT id FROM packages WHERE slug = 'spain-portugal-13-days'), 'Heritage'),
((SELECT id FROM packages WHERE slug = 'spain-portugal-13-days'), 'Group Tour'),
((SELECT id FROM packages WHERE slug = 'spain-portugal-13-days'), 'Guided'),
((SELECT id FROM packages WHERE slug = 'golden-triangle-6-days'), 'India'),
((SELECT id FROM packages WHERE slug = 'golden-triangle-6-days'), 'Heritage'),
((SELECT id FROM packages WHERE slug = 'golden-triangle-6-days'), 'Cultural'),
((SELECT id FROM packages WHERE slug = 'golden-triangle-6-days'), 'Taj Mahal'),
((SELECT id FROM packages WHERE slug = 'thailand-bangkok-phuket-7-days'), 'Asia'),
((SELECT id FROM packages WHERE slug = 'thailand-bangkok-phuket-7-days'), 'Beach'),
((SELECT id FROM packages WHERE slug = 'thailand-bangkok-phuket-7-days'), 'Island'),
((SELECT id FROM packages WHERE slug = 'thailand-bangkok-phuket-7-days'), 'Adventure')
ON CONFLICT (package_id, tag) DO NOTHING;

-- Update package slugs to be URL-friendly
UPDATE packages SET slug = slugify(title) WHERE slug IS NULL OR slug = '';

-- End of seed data
