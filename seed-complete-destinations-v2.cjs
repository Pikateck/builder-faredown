/**
 * Seed Complete Destinations Dataset v2
 * Based on user specification and screenshot data
 */

const { Pool } = require("pg");

const pool = new Pool({
  connectionString: "postgresql://faredown_user:VFEkJ35EShYkok2OfgabKLRCKIluidqb@dpg-d2086mndiees739731t0-a.singapore-postgres.render.com/faredown_booking_db",
  ssl: { rejectUnauthorized: false },
});

// Complete dataset based on user specification
const regionsData = [
  // Top-level world regions
  { code: 'WORLD', name: 'World', level: 'global', sort_order: 1 },
  { code: 'EUROPE', name: 'Europe', level: 'country-group', sort_order: 10 },
  { code: 'ASIA', name: 'Asia', level: 'country-group', sort_order: 20 },
  { code: 'AFRICA', name: 'Africa', level: 'country-group', sort_order: 30 },
  { code: 'AMERICAS', name: 'Americas', level: 'country-group', sort_order: 40 },
  { code: 'ANZ', name: 'Australia & New Zealand', level: 'country-group', sort_order: 50 },
  { code: 'MIDDLE_EAST', name: 'Middle East', level: 'country-group', sort_order: 60 },
  { code: 'SEA', name: 'South East Asia', level: 'country-group', sort_order: 70 },
  { code: 'NORTHEAST_ASIA', name: 'Japan China Korea Taiwan', level: 'country-group', sort_order: 80 },
  { code: 'ANTARCTICA', name: 'Antarctica', level: 'country-group', sort_order: 90 },
  
  // India subregions
  { code: 'NORTH_INDIA', name: 'North India', level: 'india-subregion', sort_order: 110 },
  { code: 'SOUTH_INDIA', name: 'South India', level: 'india-subregion', sort_order: 120 },
  { code: 'EAST_NE_INDIA', name: 'East & North East India', level: 'india-subregion', sort_order: 130 },
  { code: 'RAJASTHAN_WEST_CENTRAL', name: 'Rajasthan West & Central India', level: 'india-subregion', sort_order: 140 },
  { code: 'KASHMIR', name: 'Kashmir', level: 'india-subregion', sort_order: 150 },
  { code: 'LEH_LADAKH', name: 'Leh–Ladakh', level: 'india-subregion', sort_order: 160 },
];

const countriesData = [
  // Europe
  { name: 'France', iso2: 'FR', iso3: 'FRA', region: 'EUROPE', sort_order: 10 },
  { name: 'Italy', iso2: 'IT', iso3: 'ITA', region: 'EUROPE', sort_order: 20 },
  { name: 'Spain', iso2: 'ES', iso3: 'ESP', region: 'EUROPE', sort_order: 30 },
  { name: 'Switzerland', iso2: 'CH', iso3: 'CHE', region: 'EUROPE', sort_order: 40 },
  { name: 'United Kingdom', iso2: 'GB', iso3: 'GBR', region: 'EUROPE', sort_order: 50 },
  { name: 'Germany', iso2: 'DE', iso3: 'DEU', region: 'EUROPE', sort_order: 60 },
  { name: 'Netherlands', iso2: 'NL', iso3: 'NLD', region: 'EUROPE', sort_order: 70 },
  { name: 'Czech Republic', iso2: 'CZ', iso3: 'CZE', region: 'EUROPE', sort_order: 80 },
  { name: 'Poland', iso2: 'PL', iso3: 'POL', region: 'EUROPE', sort_order: 90 },
  { name: 'Hungary', iso2: 'HU', iso3: 'HUN', region: 'EUROPE', sort_order: 100 },
  { name: 'Greece', iso2: 'GR', iso3: 'GRC', region: 'EUROPE', sort_order: 110 },
  { name: 'Ireland', iso2: 'IE', iso3: 'IRL', region: 'EUROPE', sort_order: 120 },
  { name: 'Austria', iso2: 'AT', iso3: 'AUT', region: 'EUROPE', sort_order: 130 },
  { name: 'Portugal', iso2: 'PT', iso3: 'PRT', region: 'EUROPE', sort_order: 140 },
  { name: 'Denmark', iso2: 'DK', iso3: 'DNK', region: 'EUROPE', sort_order: 150 },
  { name: 'Norway', iso2: 'NO', iso3: 'NOR', region: 'EUROPE', sort_order: 160 },
  { name: 'Sweden', iso2: 'SE', iso3: 'SWE', region: 'EUROPE', sort_order: 170 },
  { name: 'Finland', iso2: 'FI', iso3: 'FIN', region: 'EUROPE', sort_order: 180 },
  { name: 'Russia', iso2: 'RU', iso3: 'RUS', region: 'EUROPE', sort_order: 190 },
  { name: 'Vatican City', iso2: 'VA', iso3: 'VAT', region: 'EUROPE', sort_order: 200 },
  { name: 'Iceland', iso2: 'IS', iso3: 'ISL', region: 'EUROPE', sort_order: 210 },

  // Middle East
  { name: 'United Arab Emirates', iso2: 'AE', iso3: 'ARE', region: 'MIDDLE_EAST', sort_order: 10 },
  { name: 'Oman', iso2: 'OM', iso3: 'OMN', region: 'MIDDLE_EAST', sort_order: 20 },
  { name: 'Qatar', iso2: 'QA', iso3: 'QAT', region: 'MIDDLE_EAST', sort_order: 30 },
  { name: 'Saudi Arabia', iso2: 'SA', iso3: 'SAU', region: 'MIDDLE_EAST', sort_order: 40 },
  { name: 'Jordan', iso2: 'JO', iso3: 'JOR', region: 'MIDDLE_EAST', sort_order: 50 },
  { name: 'Israel', iso2: 'IL', iso3: 'ISR', region: 'MIDDLE_EAST', sort_order: 60 },

  // Asia
  { name: 'India', iso2: 'IN', iso3: 'IND', region: 'ASIA', sort_order: 10 },
  { name: 'Sri Lanka', iso2: 'LK', iso3: 'LKA', region: 'ASIA', sort_order: 20 },
  { name: 'Nepal', iso2: 'NP', iso3: 'NPL', region: 'ASIA', sort_order: 30 },
  { name: 'Bhutan', iso2: 'BT', iso3: 'BTN', region: 'ASIA', sort_order: 40 },
  { name: 'Maldives', iso2: 'MV', iso3: 'MDV', region: 'ASIA', sort_order: 50 },

  // South East Asia
  { name: 'Singapore', iso2: 'SG', iso3: 'SGP', region: 'SEA', sort_order: 10 },
  { name: 'Malaysia', iso2: 'MY', iso3: 'MYS', region: 'SEA', sort_order: 20 },
  { name: 'Thailand', iso2: 'TH', iso3: 'THA', region: 'SEA', sort_order: 30 },
  { name: 'Vietnam', iso2: 'VN', iso3: 'VNM', region: 'SEA', sort_order: 40 },
  { name: 'Indonesia', iso2: 'ID', iso3: 'IDN', region: 'SEA', sort_order: 50 },
  { name: 'Myanmar', iso2: 'MM', iso3: 'MMR', region: 'SEA', sort_order: 60 },
  { name: 'Laos', iso2: 'LA', iso3: 'LAO', region: 'SEA', sort_order: 70 },
  { name: 'Cambodia', iso2: 'KH', iso3: 'KHM', region: 'SEA', sort_order: 80 },

  // Northeast Asia
  { name: 'Japan', iso2: 'JP', iso3: 'JPN', region: 'NORTHEAST_ASIA', sort_order: 10 },
  { name: 'China', iso2: 'CN', iso3: 'CHN', region: 'NORTHEAST_ASIA', sort_order: 20 },
  { name: 'South Korea', iso2: 'KR', iso3: 'KOR', region: 'NORTHEAST_ASIA', sort_order: 30 },
  { name: 'Taiwan', iso2: 'TW', iso3: 'TWN', region: 'NORTHEAST_ASIA', sort_order: 40 },
  { name: 'Hong Kong', iso2: 'HK', iso3: 'HKG', region: 'NORTHEAST_ASIA', sort_order: 50 },
  { name: 'Macao', iso2: 'MO', iso3: 'MAC', region: 'NORTHEAST_ASIA', sort_order: 60 },

  // Africa
  { name: 'Egypt', iso2: 'EG', iso3: 'EGY', region: 'AFRICA', sort_order: 10 },
  { name: 'South Africa', iso2: 'ZA', iso3: 'ZAF', region: 'AFRICA', sort_order: 20 },
  { name: 'Kenya', iso2: 'KE', iso3: 'KEN', region: 'AFRICA', sort_order: 30 },
  { name: 'Tanzania', iso2: 'TZ', iso3: 'TZA', region: 'AFRICA', sort_order: 40 },
  { name: 'Mauritius', iso2: 'MU', iso3: 'MUS', region: 'AFRICA', sort_order: 50 },
  { name: 'Seychelles', iso2: 'SC', iso3: 'SYC', region: 'AFRICA', sort_order: 60 },
  { name: 'Zimbabwe', iso2: 'ZW', iso3: 'ZWE', region: 'AFRICA', sort_order: 70 },

  // Americas
  { name: 'United States', iso2: 'US', iso3: 'USA', region: 'AMERICAS', sort_order: 10 },
  { name: 'Canada', iso2: 'CA', iso3: 'CAN', region: 'AMERICAS', sort_order: 20 },
  { name: 'Brazil', iso2: 'BR', iso3: 'BRA', region: 'AMERICAS', sort_order: 30 },
  { name: 'Argentina', iso2: 'AR', iso3: 'ARG', region: 'AMERICAS', sort_order: 40 },

  // Australia & New Zealand
  { name: 'Australia', iso2: 'AU', iso3: 'AUS', region: 'ANZ', sort_order: 10 },
  { name: 'New Zealand', iso2: 'NZ', iso3: 'NZL', region: 'ANZ', sort_order: 20 },
  { name: 'Fiji', iso2: 'FJ', iso3: 'FJI', region: 'ANZ', sort_order: 30 },
];

// Comprehensive cities data from screenshots
const citiesData = [
  // Europe Cities
  { name: 'Paris', country: 'France', sort_order: 10 },
  { name: 'Rome', country: 'Italy', sort_order: 10 },
  { name: 'Venice', country: 'Italy', sort_order: 20 },
  { name: 'Florence', country: 'Italy', sort_order: 30 },
  { name: 'Milan', country: 'Italy', sort_order: 40 },
  { name: 'London', country: 'United Kingdom', sort_order: 10 },
  { name: 'Barcelona', country: 'Spain', sort_order: 10 },
  { name: 'Madrid', country: 'Spain', sort_order: 20 },
  { name: 'Geneva', country: 'Switzerland', sort_order: 10 },
  { name: 'Interlaken', country: 'Switzerland', sort_order: 20 },
  { name: 'Lucerne', country: 'Switzerland', sort_order: 30 },
  { name: 'Zurich', country: 'Switzerland', sort_order: 40 },
  { name: 'Amsterdam', country: 'Netherlands', sort_order: 10 },
  { name: 'Prague', country: 'Czech Republic', sort_order: 10 },
  { name: 'Budapest', country: 'Hungary', sort_order: 10 },
  { name: 'Athens', country: 'Greece', sort_order: 10 },
  { name: 'Santorini', country: 'Greece', sort_order: 20 },
  { name: 'Dublin', country: 'Ireland', sort_order: 10 },
  { name: 'Vienna', country: 'Austria', sort_order: 10 },
  { name: 'Lisbon', country: 'Portugal', sort_order: 10 },
  { name: 'Copenhagen', country: 'Denmark', sort_order: 10 },

  // Middle East Cities
  { name: 'Dubai', country: 'United Arab Emirates', sort_order: 10 },
  { name: 'Abu Dhabi', country: 'United Arab Emirates', sort_order: 20 },
  { name: 'Muscat', country: 'Oman', sort_order: 10 },
  { name: 'Doha', country: 'Qatar', sort_order: 10 },
  { name: 'Petra', country: 'Jordan', sort_order: 10 },

  // Northeast Asia Cities
  { name: 'Tokyo', country: 'Japan', sort_order: 10 },
  { name: 'Osaka', country: 'Japan', sort_order: 20 },
  { name: 'Kyoto', country: 'Japan', sort_order: 30 },
  { name: 'Hiroshima', country: 'Japan', sort_order: 40 },
  { name: 'Beijing', country: 'China', sort_order: 10 },
  { name: 'Shanghai', country: 'China', sort_order: 20 },
  { name: 'Shenzhen', country: 'China', sort_order: 30 },
  { name: 'Seoul', country: 'South Korea', sort_order: 10 },
  { name: 'Hong Kong', country: 'Hong Kong', sort_order: 10 },
  { name: 'Macao', country: 'Macao', sort_order: 10 },

  // South East Asia Cities
  { name: 'Singapore', country: 'Singapore', sort_order: 10 },
  { name: 'Kuala Lumpur', country: 'Malaysia', sort_order: 10 },
  { name: 'Genting Highlands', country: 'Malaysia', sort_order: 20 },
  { name: 'Langkawi', country: 'Malaysia', sort_order: 30 },
  { name: 'Bangkok', country: 'Thailand', sort_order: 10 },
  { name: 'Pattaya', country: 'Thailand', sort_order: 20 },
  { name: 'Phuket', country: 'Thailand', sort_order: 30 },
  { name: 'Krabi', country: 'Thailand', sort_order: 40 },
  { name: 'Hanoi', country: 'Vietnam', sort_order: 10 },
  { name: 'Ho Chi Minh City', country: 'Vietnam', sort_order: 20 },
  { name: 'Bali', country: 'Indonesia', sort_order: 10 },
  { name: 'Ubud', country: 'Indonesia', sort_order: 20 },
  { name: 'Kuta', country: 'Indonesia', sort_order: 30 },
  { name: 'Nusa Penida', country: 'Indonesia', sort_order: 40 },

  // Asia Cities
  { name: 'Colombo', country: 'Sri Lanka', sort_order: 10 },
  { name: 'Bentota', country: 'Sri Lanka', sort_order: 20 },
  { name: 'Galle', country: 'Sri Lanka', sort_order: 30 },
  { name: 'Kandy', country: 'Sri Lanka', sort_order: 40 },
  { name: 'Nuwara Eliya', country: 'Sri Lanka', sort_order: 50 },
  { name: 'Kathmandu', country: 'Nepal', sort_order: 10 },
  { name: 'Pokhara', country: 'Nepal', sort_order: 20 },
  { name: 'Chitwan', country: 'Nepal', sort_order: 30 },
  { name: 'Thimphu', country: 'Bhutan', sort_order: 10 },
  { name: 'Male', country: 'Maldives', sort_order: 10 },
  { name: 'Maafushi', country: 'Maldives', sort_order: 20 },

  // Africa Cities
  { name: 'Cairo', country: 'Egypt', sort_order: 10 },
  { name: 'Alexandria', country: 'Egypt', sort_order: 20 },
  { name: 'Aswan', country: 'Egypt', sort_order: 30 },
  { name: 'Luxor', country: 'Egypt', sort_order: 40 },
  { name: 'Hurghada', country: 'Egypt', sort_order: 50 },
  { name: 'Cape Town', country: 'South Africa', sort_order: 10 },
  { name: 'Johannesburg', country: 'South Africa', sort_order: 20 },
  { name: 'Port Elizabeth', country: 'South Africa', sort_order: 30 },
  { name: 'Zanzibar', country: 'Tanzania', sort_order: 10 },
  { name: 'Port Louis', country: 'Mauritius', sort_order: 10 },
  { name: 'Victoria Falls', country: 'Zimbabwe', sort_order: 10 },
  { name: 'Victoria', country: 'Seychelles', sort_order: 10 },

  // Americas Cities
  { name: 'New York', country: 'United States', sort_order: 10 },
  { name: 'Chicago', country: 'United States', sort_order: 20 },
  { name: 'Las Vegas', country: 'United States', sort_order: 30 },
  { name: 'Los Angeles', country: 'United States', sort_order: 40 },
  { name: 'Niagara Falls', country: 'United States', sort_order: 50 },
  { name: 'Orlando', country: 'United States', sort_order: 60 },
  { name: 'Philadelphia', country: 'United States', sort_order: 70 },
  { name: 'San Francisco', country: 'United States', sort_order: 80 },
  { name: 'Washington', country: 'United States', sort_order: 90 },
  { name: 'Toronto', country: 'Canada', sort_order: 10 },
  { name: 'Vancouver', country: 'Canada', sort_order: 20 },
  { name: 'Calgary', country: 'Canada', sort_order: 30 },
  { name: 'Banff', country: 'Canada', sort_order: 40 },
  { name: 'Jasper', country: 'Canada', sort_order: 50 },
  { name: 'Montreal', country: 'Canada', sort_order: 60 },
  { name: 'Ottawa', country: 'Canada', sort_order: 70 },

  // ANZ Cities
  { name: 'Sydney', country: 'Australia', sort_order: 10 },
  { name: 'Melbourne', country: 'Australia', sort_order: 20 },
  { name: 'Perth', country: 'Australia', sort_order: 30 },
  { name: 'Adelaide', country: 'Australia', sort_order: 40 },
  { name: 'Cairns', country: 'Australia', sort_order: 50 },
  { name: 'Canberra', country: 'Australia', sort_order: 60 },
  { name: 'Gold Coast', country: 'Australia', sort_order: 70 },
  { name: 'Great Barrier Reef', country: 'Australia', sort_order: 80 },
  { name: 'Auckland', country: 'New Zealand', sort_order: 10 },
  { name: 'Christchurch', country: 'New Zealand', sort_order: 20 },
  { name: 'Rotorua', country: 'New Zealand', sort_order: 30 },
  { name: 'Queenstown', country: 'New Zealand', sort_order: 40 },
  { name: 'Nadi', country: 'Fiji', sort_order: 10 },

  // India Cities (comprehensive from screenshots)
  // North India
  { name: 'Delhi', country: 'India', region: 'NORTH_INDIA', sort_order: 10 },
  { name: 'Shimla', country: 'India', region: 'NORTH_INDIA', sort_order: 20 },
  { name: 'Manali', country: 'India', region: 'NORTH_INDIA', sort_order: 30 },
  { name: 'Dharamshala', country: 'India', region: 'NORTH_INDIA', sort_order: 40 },
  { name: 'Mussoorie', country: 'India', region: 'NORTH_INDIA', sort_order: 50 },
  { name: 'Haridwar', country: 'India', region: 'NORTH_INDIA', sort_order: 60 },
  { name: 'Rishikesh', country: 'India', region: 'NORTH_INDIA', sort_order: 70 },
  { name: 'Jim Corbett Park', country: 'India', region: 'NORTH_INDIA', sort_order: 80 },
  { name: 'Agra', country: 'India', region: 'NORTH_INDIA', sort_order: 90 },
  { name: 'Ayodhya', country: 'India', region: 'NORTH_INDIA', sort_order: 100 },
  { name: 'Mathura', country: 'India', region: 'NORTH_INDIA', sort_order: 110 },
  { name: 'Varanasi', country: 'India', region: 'NORTH_INDIA', sort_order: 120 },
  { name: 'Lucknow', country: 'India', region: 'NORTH_INDIA', sort_order: 130 },
  { name: 'Jhansi', country: 'India', region: 'NORTH_INDIA', sort_order: 140 },
  { name: 'Fatehpur Sikri', country: 'India', region: 'NORTH_INDIA', sort_order: 150 },
  { name: 'Amritsar', country: 'India', region: 'NORTH_INDIA', sort_order: 160 },
  { name: 'Chandigarh', country: 'India', region: 'NORTH_INDIA', sort_order: 170 },

  // Kashmir
  { name: 'Gulmarg', country: 'India', region: 'KASHMIR', sort_order: 10 },
  { name: 'Pahalgam', country: 'India', region: 'KASHMIR', sort_order: 20 },
  { name: 'Sonmarg', country: 'India', region: 'KASHMIR', sort_order: 30 },
  { name: 'Srinagar', country: 'India', region: 'KASHMIR', sort_order: 40 },

  // Leh-Ladakh
  { name: 'Leh', country: 'India', region: 'LEH_LADAKH', sort_order: 10 },
  { name: 'Nubra Valley', country: 'India', region: 'LEH_LADAKH', sort_order: 20 },
  { name: 'Pangong Tso', country: 'India', region: 'LEH_LADAKH', sort_order: 30 },
  { name: 'Kargil', country: 'India', region: 'LEH_LADAKH', sort_order: 40 },
  { name: 'Turtuk', country: 'India', region: 'LEH_LADAKH', sort_order: 50 },

  // South India
  { name: 'Chennai', country: 'India', region: 'SOUTH_INDIA', sort_order: 10 },
  { name: 'Mahabalipuram', country: 'India', region: 'SOUTH_INDIA', sort_order: 20 },
  { name: 'Pondicherry', country: 'India', region: 'SOUTH_INDIA', sort_order: 30 },
  { name: 'Kanchipuram', country: 'India', region: 'SOUTH_INDIA', sort_order: 40 },
  { name: 'Madurai', country: 'India', region: 'SOUTH_INDIA', sort_order: 50 },
  { name: 'Rameswaram', country: 'India', region: 'SOUTH_INDIA', sort_order: 60 },
  { name: 'Thanjavur', country: 'India', region: 'SOUTH_INDIA', sort_order: 70 },
  { name: 'Ooty', country: 'India', region: 'SOUTH_INDIA', sort_order: 80 },
  { name: 'Coimbatore', country: 'India', region: 'SOUTH_INDIA', sort_order: 90 },
  { name: 'Bengaluru', country: 'India', region: 'SOUTH_INDIA', sort_order: 100 },
  { name: 'Mysore', country: 'India', region: 'SOUTH_INDIA', sort_order: 110 },
  { name: 'Coorg', country: 'India', region: 'SOUTH_INDIA', sort_order: 120 },
  { name: 'Hampi', country: 'India', region: 'SOUTH_INDIA', sort_order: 130 },
  { name: 'Udupi', country: 'India', region: 'SOUTH_INDIA', sort_order: 140 },
  { name: 'Alleppey', country: 'India', region: 'SOUTH_INDIA', sort_order: 150 },
  { name: 'Kochi', country: 'India', region: 'SOUTH_INDIA', sort_order: 160 },
  { name: 'Munnar', country: 'India', region: 'SOUTH_INDIA', sort_order: 170 },
  { name: 'Kumarakom', country: 'India', region: 'SOUTH_INDIA', sort_order: 180 },
  { name: 'Periyar', country: 'India', region: 'SOUTH_INDIA', sort_order: 190 },
  { name: 'Trivandrum', country: 'India', region: 'SOUTH_INDIA', sort_order: 200 },
  { name: 'Varkala', country: 'India', region: 'SOUTH_INDIA', sort_order: 210 },
  { name: 'Mumbai', country: 'India', region: 'SOUTH_INDIA', sort_order: 220 },
  { name: 'Goa', country: 'India', region: 'SOUTH_INDIA', sort_order: 230 },

  // East & Northeast India
  { name: 'Bhubaneswar', country: 'India', region: 'EAST_NE_INDIA', sort_order: 10 },
  { name: 'Puri', country: 'India', region: 'EAST_NE_INDIA', sort_order: 20 },
  { name: 'Konark', country: 'India', region: 'EAST_NE_INDIA', sort_order: 30 },
  { name: 'Chilka', country: 'India', region: 'EAST_NE_INDIA', sort_order: 40 },
  { name: 'Gangtok', country: 'India', region: 'EAST_NE_INDIA', sort_order: 50 },
  { name: 'Lachung', country: 'India', region: 'EAST_NE_INDIA', sort_order: 60 },
  { name: 'Pelling', country: 'India', region: 'EAST_NE_INDIA', sort_order: 70 },
  { name: 'Darjeeling', country: 'India', region: 'EAST_NE_INDIA', sort_order: 80 },
  { name: 'Kalimpong', country: 'India', region: 'EAST_NE_INDIA', sort_order: 90 },
  { name: 'Kolkata', country: 'India', region: 'EAST_NE_INDIA', sort_order: 100 },
  { name: 'Sundarbans', country: 'India', region: 'EAST_NE_INDIA', sort_order: 110 },
  { name: 'Guwahati', country: 'India', region: 'EAST_NE_INDIA', sort_order: 120 },
  { name: 'Shillong', country: 'India', region: 'EAST_NE_INDIA', sort_order: 130 },
  { name: 'Cherrapunjee', country: 'India', region: 'EAST_NE_INDIA', sort_order: 140 },
  { name: 'Kaziranga National Park', country: 'India', region: 'EAST_NE_INDIA', sort_order: 150 },

  // Rajasthan West & Central India
  { name: 'Jaipur', country: 'India', region: 'RAJASTHAN_WEST_CENTRAL', sort_order: 10 },
  { name: 'Jodhpur', country: 'India', region: 'RAJASTHAN_WEST_CENTRAL', sort_order: 20 },
  { name: 'Jaisalmer', country: 'India', region: 'RAJASTHAN_WEST_CENTRAL', sort_order: 30 },
  { name: 'Udaipur', country: 'India', region: 'RAJASTHAN_WEST_CENTRAL', sort_order: 40 },
  { name: 'Pushkar', country: 'India', region: 'RAJASTHAN_WEST_CENTRAL', sort_order: 50 },
  { name: 'Mount Abu', country: 'India', region: 'RAJASTHAN_WEST_CENTRAL', sort_order: 60 },
  { name: 'Ranthambore', country: 'India', region: 'RAJASTHAN_WEST_CENTRAL', sort_order: 70 },
  { name: 'Bikaner', country: 'India', region: 'RAJASTHAN_WEST_CENTRAL', sort_order: 80 },
  { name: 'Chittorgarh', country: 'India', region: 'RAJASTHAN_WEST_CENTRAL', sort_order: 90 },
  { name: 'Kumbhalgarh', country: 'India', region: 'RAJASTHAN_WEST_CENTRAL', sort_order: 100 },
  { name: 'Ahmedabad', country: 'India', region: 'RAJASTHAN_WEST_CENTRAL', sort_order: 110 },
  { name: 'Dwarka', country: 'India', region: 'RAJASTHAN_WEST_CENTRAL', sort_order: 120 },
  { name: 'Somnath', country: 'India', region: 'RAJASTHAN_WEST_CENTRAL', sort_order: 130 },
  { name: 'Indore', country: 'India', region: 'RAJASTHAN_WEST_CENTRAL', sort_order: 140 },
  { name: 'Bhopal', country: 'India', region: 'RAJASTHAN_WEST_CENTRAL', sort_order: 150 },
  { name: 'Ujjain', country: 'India', region: 'RAJASTHAN_WEST_CENTRAL', sort_order: 160 },
  { name: 'Gwalior', country: 'India', region: 'RAJASTHAN_WEST_CENTRAL', sort_order: 170 },
  { name: 'Orchha', country: 'India', region: 'RAJASTHAN_WEST_CENTRAL', sort_order: 180 },
  { name: 'Khajuraho', country: 'India', region: 'RAJASTHAN_WEST_CENTRAL', sort_order: 190 },
];

// Comprehensive aliases for common searches
const aliasesData = [
  // Airport codes
  { dest_type: 'city', dest_name: 'Dubai', alias: 'DXB', weight: 10 },
  { dest_type: 'city', dest_name: 'Paris', alias: 'PAR', weight: 10 },
  { dest_type: 'city', dest_name: 'Paris', alias: 'CDG', weight: 8 },
  { dest_type: 'city', dest_name: 'London', alias: 'LON', weight: 10 },
  { dest_type: 'city', dest_name: 'London', alias: 'LHR', weight: 8 },
  { dest_type: 'city', dest_name: 'New York', alias: 'NYC', weight: 10 },
  { dest_type: 'city', dest_name: 'New York', alias: 'JFK', weight: 8 },
  { dest_type: 'city', dest_name: 'Mumbai', alias: 'BOM', weight: 10 },
  { dest_type: 'city', dest_name: 'Delhi', alias: 'DEL', weight: 10 },
  { dest_type: 'city', dest_name: 'Bangkok', alias: 'BKK', weight: 10 },
  { dest_type: 'city', dest_name: 'Singapore', alias: 'SIN', weight: 10 },
  { dest_type: 'city', dest_name: 'Hong Kong', alias: 'HKG', weight: 10 },
  { dest_type: 'city', dest_name: 'Tokyo', alias: 'NRT', weight: 8 },
  { dest_type: 'city', dest_name: 'Tokyo', alias: 'HND', weight: 8 },
  { dest_type: 'city', dest_name: 'Rome', alias: 'FCO', weight: 8 },
  { dest_type: 'city', dest_name: 'Sydney', alias: 'SYD', weight: 10 },
  { dest_type: 'city', dest_name: 'Los Angeles', alias: 'LAX', weight: 10 },

  // Historical/Alternative names
  { dest_type: 'city', dest_name: 'Mumbai', alias: 'Bombay', weight: 10 },
  { dest_type: 'city', dest_name: 'Varanasi', alias: 'Benares', weight: 8 },
  { dest_type: 'city', dest_name: 'Varanasi', alias: 'Kashi', weight: 6 },
  { dest_type: 'city', dest_name: 'Beijing', alias: 'Peking', weight: 6 },
  { dest_type: 'city', dest_name: 'Chennai', alias: 'Madras', weight: 8 },
  { dest_type: 'city', dest_name: 'Kolkata', alias: 'Calcutta', weight: 8 },
  { dest_type: 'city', dest_name: 'Bengaluru', alias: 'Bangalore', weight: 8 },
  { dest_type: 'city', dest_name: 'Trivandrum', alias: 'Thiruvananthapuram', weight: 6 },

  // Country codes
  { dest_type: 'country', dest_name: 'United Arab Emirates', alias: 'UAE', weight: 10 },
  { dest_type: 'country', dest_name: 'United States', alias: 'USA', weight: 10 },
  { dest_type: 'country', dest_name: 'United States', alias: 'US', weight: 8 },
  { dest_type: 'country', dest_name: 'United Kingdom', alias: 'UK', weight: 10 },
  { dest_type: 'country', dest_name: 'Saudi Arabia', alias: 'KSA', weight: 8 },

  // Common alternative spellings
  { dest_type: 'city', dest_name: 'Ho Chi Minh City', alias: 'Saigon', weight: 8 },
  { dest_type: 'city', dest_name: 'Istanbul', alias: 'Constantinople', weight: 4 },
];

async function seedCompleteDestinations() {
  console.log("🌱 Seeding Complete Destinations Dataset v2...");
  
  try {
    // Step 1: Seed Regions
    console.log("\n📍 1. Seeding Regions...");
    for (const region of regionsData) {
      try {
        const result = await pool.query(`
          INSERT INTO regions (code, name, level, sort_order)
          VALUES ($1, $2, $3, $4)
          ON CONFLICT (code) DO UPDATE SET
            name = EXCLUDED.name,
            level = EXCLUDED.level,
            sort_order = EXCLUDED.sort_order,
            updated_at = NOW()
          RETURNING id, name
        `, [region.code, region.name, region.level, region.sort_order]);
        
        console.log(`   ✓ ${region.name} (${region.level})`);
      } catch (error) {
        console.log(`   ❌ Failed to seed region ${region.name}: ${error.message}`);
      }
    }

    // Step 2: Seed Countries
    console.log("\n🌍 2. Seeding Countries...");
    for (const country of countriesData) {
      try {
        // Get region ID
        const regionResult = await pool.query(`SELECT id FROM regions WHERE code = $1`, [country.region]);
        if (regionResult.rows.length === 0) {
          console.log(`   ⚠️  Region ${country.region} not found for ${country.name}`);
          continue;
        }
        
        const regionId = regionResult.rows[0].id;
        
        const result = await pool.query(`
          INSERT INTO countries (name, iso2, iso3, region_id, sort_order)
          VALUES ($1, $2, $3, $4, $5)
          ON CONFLICT ON CONSTRAINT countries_name_region_unique DO UPDATE SET
            iso2 = EXCLUDED.iso2,
            iso3 = EXCLUDED.iso3,
            sort_order = EXCLUDED.sort_order,
            updated_at = NOW()
          RETURNING id, name
        `, [country.name, country.iso2, country.iso3, regionId, country.sort_order]);
        
        console.log(`   ✓ ${country.name} (${country.iso2})`);
      } catch (error) {
        console.log(`   ❌ Failed to seed country ${country.name}: ${error.message}`);
      }
    }

    // Step 3: Seed Cities
    console.log("\n🏙️  3. Seeding Cities...");
    for (const city of citiesData) {
      try {
        // Get country ID
        const countryResult = await pool.query(`SELECT id, region_id FROM countries WHERE name = $1`, [city.country]);
        if (countryResult.rows.length === 0) {
          console.log(`   ⚠️  Country ${city.country} not found for ${city.name}`);
          continue;
        }
        
        const countryId = countryResult.rows[0].id;
        let regionId = countryResult.rows[0].region_id;
        
        // For India cities with specific regions, get the subregion ID
        if (city.region) {
          const subregionResult = await pool.query(`SELECT id FROM regions WHERE code = $1`, [city.region]);
          if (subregionResult.rows.length > 0) {
            regionId = subregionResult.rows[0].id;
          }
        }
        
        const result = await pool.query(`
          INSERT INTO cities (name, country_id, region_id, sort_order, is_package_destination)
          VALUES ($1, $2, $3, $4, $5)
          ON CONFLICT ON CONSTRAINT cities_name_country_unique DO UPDATE SET
            region_id = EXCLUDED.region_id,
            sort_order = EXCLUDED.sort_order,
            updated_at = NOW()
          RETURNING id, name
        `, [city.name, countryId, regionId, city.sort_order, true]);
        
        console.log(`   ✓ ${city.name}, ${city.country}`);
      } catch (error) {
        console.log(`   ❌ Failed to seed city ${city.name}: ${error.message}`);
      }
    }

    // Step 4: Seed Aliases
    console.log("\n🔤 4. Seeding Aliases...");
    for (const alias of aliasesData) {
      try {
        // Find destination ID based on type and name
        let destQuery, destParams;
        
        if (alias.dest_type === 'city') {
          destQuery = `SELECT id FROM cities WHERE name = $1 LIMIT 1`;
          destParams = [alias.dest_name];
        } else if (alias.dest_type === 'country') {
          destQuery = `SELECT id FROM countries WHERE name = $1 LIMIT 1`;
          destParams = [alias.dest_name];
        } else if (alias.dest_type === 'region') {
          destQuery = `SELECT id FROM regions WHERE name = $1 LIMIT 1`;
          destParams = [alias.dest_name];
        }
        
        const destResult = await pool.query(destQuery, destParams);
        if (destResult.rows.length === 0) {
          console.log(`   ⚠️  ${alias.dest_type} ${alias.dest_name} not found for alias ${alias.alias}`);
          continue;
        }
        
        const destId = destResult.rows[0].id;
        
        await pool.query(`
          INSERT INTO destination_aliases (dest_type, dest_id, alias, weight)
          VALUES ($1, $2, $3, $4)
          ON CONFLICT DO NOTHING
        `, [alias.dest_type, destId, alias.alias, alias.weight]);
        
        console.log(`   ✓ ${alias.alias} → ${alias.dest_name}`);
      } catch (error) {
        console.log(`   ❌ Failed to seed alias ${alias.alias}: ${error.message}`);
      }
    }

    // Step 5: Refresh materialized view
    console.log("\n🔄 5. Refreshing search index...");
    await pool.query(`REFRESH MATERIALIZED VIEW destinations_search_mv`);

    // Step 6: Final statistics
    console.log("\n📊 6. Final Statistics:");
    const stats = await pool.query(`
      SELECT 
        (SELECT COUNT(*) FROM regions WHERE is_active) as regions,
        (SELECT COUNT(*) FROM countries WHERE is_active) as countries,
        (SELECT COUNT(*) FROM cities WHERE is_active) as cities,
        (SELECT COUNT(*) FROM destination_aliases WHERE is_active) as aliases,
        (SELECT COUNT(*) FROM destinations_search_mv WHERE is_active) as searchable_items
    `);
    
    const stat = stats.rows[0];
    console.log(`   📍 Regions: ${stat.regions}`);
    console.log(`   🌍 Countries: ${stat.countries}`);
    console.log(`   🏙️  Cities: ${stat.cities}`);
    console.log(`   🔤 Aliases: ${stat.aliases}`);
    console.log(`   🔍 Searchable items: ${stat.searchable_items}`);

    console.log("\n🎉 Complete destinations dataset seeded successfully!");
    console.log("✅ Ready for comprehensive search testing");

  } catch (error) {
    console.error("❌ Seeding failed:", error.message);
    console.error("Full error:", error);
  } finally {
    await pool.end();
  }
}

seedCompleteDestinations().catch(console.error);
