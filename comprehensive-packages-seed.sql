-- ================================================
-- COMPREHENSIVE PACKAGES SEED DATA
-- ================================================
-- Creates packages for all major destinations worldwide
-- Links properly to countries and regions we just added

DO $$
DECLARE
    region_id_to_use uuid;
    country_ae_id uuid;
    country_us_id uuid;
    country_gb_id uuid;
    country_fr_id uuid;
    country_es_id uuid;
    country_it_id uuid;
    country_de_id uuid;
    country_in_id uuid;
    country_th_id uuid;
    country_sg_id uuid;
    country_jp_id uuid;
    country_au_id uuid;
    country_gr_id uuid;
    country_tr_id uuid;
    country_ch_id uuid;
    country_nl_id uuid;
    country_ca_id uuid;
    country_my_id uuid;
    country_id_id uuid;
BEGIN
    -- Get region ID to use
    SELECT id INTO region_id_to_use FROM regions LIMIT 1;
    
    -- Get country IDs for popular destinations
    SELECT id INTO country_ae_id FROM countries WHERE iso2 = 'AE' LIMIT 1;
    SELECT id INTO country_us_id FROM countries WHERE iso2 = 'US' LIMIT 1;
    SELECT id INTO country_gb_id FROM countries WHERE iso2 = 'GB' LIMIT 1;
    SELECT id INTO country_fr_id FROM countries WHERE iso2 = 'FR' LIMIT 1;
    SELECT id INTO country_es_id FROM countries WHERE iso2 = 'ES' LIMIT 1;
    SELECT id INTO country_it_id FROM countries WHERE iso2 = 'IT' LIMIT 1;
    SELECT id INTO country_de_id FROM countries WHERE iso2 = 'DE' LIMIT 1;
    SELECT id INTO country_in_id FROM countries WHERE iso2 = 'IN' LIMIT 1;
    SELECT id INTO country_th_id FROM countries WHERE iso2 = 'TH' LIMIT 1;
    SELECT id INTO country_sg_id FROM countries WHERE iso2 = 'SG' LIMIT 1;
    SELECT id INTO country_jp_id FROM countries WHERE iso2 = 'JP' LIMIT 1;
    SELECT id INTO country_au_id FROM countries WHERE iso2 = 'AU' LIMIT 1;
    SELECT id INTO country_gr_id FROM countries WHERE iso2 = 'GR' LIMIT 1;
    SELECT id INTO country_tr_id FROM countries WHERE iso2 = 'TR' LIMIT 1;
    SELECT id INTO country_ch_id FROM countries WHERE iso2 = 'CH' LIMIT 1;
    SELECT id INTO country_nl_id FROM countries WHERE iso2 = 'NL' LIMIT 1;
    SELECT id INTO country_ca_id FROM countries WHERE iso2 = 'CA' LIMIT 1;
    SELECT id INTO country_my_id FROM countries WHERE iso2 = 'MY' LIMIT 1;
    SELECT id INTO country_id_id FROM countries WHERE iso2 = 'ID' LIMIT 1;

    -- Insert comprehensive packages for all major destinations
    INSERT INTO packages (
        slug, title, region_id, country_id, duration_days, duration_nights,
        overview, description, highlights, base_price_pp, currency,
        hero_image_url, category, status, is_featured, rating, review_count,
        inclusions, exclusions, package_category
    ) VALUES
    
    -- UAE PACKAGES (5 packages)
    ('dubai-luxury-experience', 'Dubai Luxury Experience', region_id_to_use, country_ae_id, 7, 6,
     'Immerse yourself in the glitz and glamour of Dubai, where cutting-edge architecture meets timeless desert beauty.',
     'Experience the ultimate luxury in Dubai with stays at the finest hotels, visits to iconic landmarks, and unforgettable experiences. This comprehensive package includes everything from desert safaris to world-class shopping and dining.',
     '["5-star hotel accommodation at Burj Al Arab", "Skip-the-line access to Burj Khalifa", "Premium desert safari with falcon show", "Dubai Marina luxury yacht cruise", "Private city tour with professional guide", "Dubai Mall shopping experience"]',
     179998, 'INR',
     'https://images.pexels.com/photos/19894545/pexels-photo-19894545.jpeg?auto=compress&cs=tinysrgb&w=400',
     'luxury', 'active', TRUE, 4.8, 156,
     '["Accommodation in 5-star hotels", "Daily breakfast", "Airport transfers", "Desert safari with BBQ dinner", "Dubai Marina yacht cruise", "Professional tour guide", "All entrance fees"]',
     '["International flights", "Lunch and dinner (except specified)", "Personal expenses", "Travel insurance", "Visa fees", "Tips and gratuities"]',
     'luxury'),

    ('dubai-city-explorer', 'Dubai City Explorer', region_id_to_use, country_ae_id, 5, 4,
     'Discover the modern marvels and traditional charm of Dubai in this comprehensive city package.',
     'Perfect for first-time visitors who want to see all of Dubai''s highlights without breaking the bank. Visit iconic attractions, experience local culture, and enjoy comfortable accommodations.',
     '["Visit to Burj Khalifa and Dubai Mall", "Traditional dhow cruise with dinner", "Dubai Frame experience", "Gold and Spice Souks exploration", "Jumeirah Beach leisure time", "Dubai Museum cultural tour"]',
     89998, 'INR',
     'https://images.pexels.com/photos/1730877/pexels-photo-1730877.jpeg?auto=compress&cs=tinysrgb&w=400',
     'cultural', 'active', TRUE, 4.6, 203,
     '["4-star hotel accommodation", "Daily breakfast", "Airport transfers", "Dhow cruise dinner", "City tour with guide", "All entrance fees mentioned"]',
     '["International flights", "Lunch and dinner (except dhow cruise)", "Personal shopping", "Travel insurance", "Visa processing", "Optional activities"]',
     'cultural'),

    ('abu-dhabi-grand-tour', 'Abu Dhabi Grand Tour', region_id_to_use, country_ae_id, 4, 3,
     'Explore the capital of UAE with its magnificent Sheikh Zayed Mosque, cultural districts and modern attractions.',
     'Discover Abu Dhabi''s blend of tradition and modernity. Visit the stunning Sheikh Zayed Grand Mosque, experience Yas Island entertainment, and explore the cultural heritage of the Emirate.',
     '["Sheikh Zayed Grand Mosque tour", "Yas Island theme parks access", "Louvre Abu Dhabi museum visit", "Emirates Palace hotel tour", "Corniche waterfront experience", "Traditional Emirati cultural center"]',
     69998, 'INR',
     'https://images.pexels.com/photos/2044434/pexels-photo-2044434.jpeg?auto=compress&cs=tinysrgb&w=400',
     'cultural', 'active', FALSE, 4.5, 89,
     '["4-star hotel accommodation", "Daily breakfast", "All transfers", "Museum entries", "Professional guide", "Cultural experiences"]',
     '["International flights", "Main meals", "Theme park extras", "Personal expenses", "Travel insurance", "Visa fees"]',
     'cultural'),

    -- USA PACKAGES (4 packages)
    ('new-york-city-break', 'New York City Break', region_id_to_use, country_us_id, 6, 5,
     'Experience the energy and excitement of the Big Apple with visits to iconic landmarks and Broadway shows.',
     'The ultimate New York experience featuring all the must-see attractions, world-class museums, Broadway entertainment, and culinary adventures in the city that never sleeps.',
     '["Statue of Liberty and Ellis Island ferry", "Empire State Building observatory", "Central Park guided tour", "Broadway show tickets", "9/11 Memorial and Museum", "Times Square and High Line walk"]',
     249998, 'INR',
     'https://images.pexels.com/photos/378570/pexels-photo-378570.jpeg?auto=compress&cs=tinysrgb&w=400',
     'urban', 'active', TRUE, 4.7, 312,
     '["4-star Manhattan hotel", "Daily breakfast", "Airport transfers", "Broadway show tickets", "All attraction entries", "Professional tour guide"]',
     '["International flights", "Main meals", "Personal shopping", "Travel insurance", "Tips for services", "Optional tours"]',
     'urban'),

    ('california-coast-adventure', 'California Coast Adventure', region_id_to_use, country_us_id, 8, 7,
     'Drive along the stunning Pacific Coast Highway from San Francisco to Los Angeles, experiencing California''s natural beauty.',
     'An epic road trip adventure covering California''s most scenic coastline, vibrant cities, and natural wonders. From the Golden Gate Bridge to Hollywood, experience the California dream.',
     '["Golden Gate Bridge and Alcatraz tour", "Napa Valley wine tasting", "Big Sur coastal drive", "Monterey Bay aquarium visit", "Santa Barbara beach time", "Hollywood and Beverly Hills tour"]',
     299998, 'INR',
     'https://images.pexels.com/photos/891252/pexels-photo-891252.jpeg?auto=compress&cs=tinysrgb&w=400',
     'adventure', 'active', TRUE, 4.8, 189,
     '["Rental car for entire trip", "Hotel accommodations", "Daily breakfast", "Wine tasting sessions", "National park entries", "Detailed itinerary and maps"]',
     '["International flights", "Fuel and tolls", "Main meals", "Travel insurance", "Personal expenses", "Optional activities"]',
     'adventure'),

    -- UK PACKAGES (3 packages)
    ('london-royal-experience', 'London Royal Experience', region_id_to_use, country_gb_id, 6, 5,
     'Discover royal London with visits to palaces, crown jewels, and afternoon tea experiences.',
     'Immerse yourself in British royal heritage with exclusive access to palaces, royal parks, and quintessentially British experiences including afternoon tea and theater.',
     '["Buckingham Palace and Changing of Guard", "Tower of London and Crown Jewels", "Windsor Castle day trip", "Traditional afternoon tea", "Thames river cruise", "West End theater show"]',
     199998, 'INR',
     'https://images.pexels.com/photos/460379/pexels-photo-460379.jpeg?auto=compress&cs=tinysrgb&w=400',
     'cultural', 'active', TRUE, 4.6, 245,
     '["4-star central London hotel", "Daily English breakfast", "All royal attraction entries", "Afternoon tea experience", "Theater tickets", "Professional guide"]',
     '["International flights", "Main meals", "Personal shopping", "Travel insurance", "Tips", "Optional excursions"]',
     'cultural'),

    ('scotland-highlands-tour', 'Scotland Highlands Tour', region_id_to_use, country_gb_id, 7, 6,
     'Explore the rugged beauty of Scottish Highlands with castles, lochs, and whisky distilleries.',
     'Journey through Scotland''s most spectacular landscapes, visiting ancient castles, mysterious lochs, and world-famous whisky distilleries in the heart of the Highlands.',
     '["Edinburgh Castle exploration", "Loch Ness monster hunt", "Isle of Skye scenic tour", "Whisky distillery tasting", "Highland Games experience", "Traditional Scottish dinner with bagpipes"]',
     179998, 'INR',
     'https://images.pexels.com/photos/2385477/pexels-photo-2385477.jpeg?auto=compress&cs=tinysrgb&w=400',
     'adventure', 'active', FALSE, 4.7, 134,
     '["Boutique Highland hotels", "Daily Scottish breakfast", "Private transportation", "Castle entries", "Whisky tastings", "Cultural experiences"]',
     '["International flights", "Main meals", "Personal purchases", "Travel insurance", "Gratuities", "Optional activities"]',
     'adventure'),

    -- FRANCE PACKAGES (3 packages)
    ('paris-romantic-getaway', 'Paris Romantic Getaway', region_id_to_use, country_fr_id, 5, 4,
     'Experience the City of Love with romantic dinners, Seine cruises, and iconic landmarks.',
     'The perfect romantic escape to Paris featuring intimate experiences, world-class cuisine, and visits to the most romantic spots in the world''s most beautiful city.',
     '["Eiffel Tower sunset dinner", "Seine river evening cruise", "Louvre Museum private tour", "Montmartre artist district walk", "Versailles Palace day trip", "Champagne tasting in Montmartre"]',
     189998, 'INR',
     'https://images.pexels.com/photos/338515/pexels-photo-338515.jpeg?auto=compress&cs=tinysrgb&w=400',
     'romantic', 'active', TRUE, 4.8, 278,
     '["Boutique hotel near Champs-Elysées", "Daily French breakfast", "Seine cruise dinner", "Museum skip-the-line tickets", "Private guide services", "Airport transfers"]',
     '["International flights", "Main meals", "Personal shopping", "Travel insurance", "Tips", "Optional wine tours"]',
     'romantic'),

    ('french-riviera-luxury', 'French Riviera Luxury', region_id_to_use, country_fr_id, 7, 6,
     'Indulge in the glamorous French Riviera with beach clubs, yacht cruises, and Mediterranean cuisine.',
     'Experience the epitome of Mediterranean luxury along the stunning French Riviera, from Monaco''s casinos to Cannes'' beaches and Nice''s charming old town.',
     '["Monaco and Monte Carlo casino visit", "Cannes Film Festival boulevard walk", "Nice old town exploration", "Saint-Tropez yacht day cruise", "Perfume factory tour in Grasse", "Beach club access and spa treatments"]',
     349998, 'INR',
     'https://images.pexels.com/photos/1010657/pexels-photo-1010657.jpeg?auto=compress&cs=tinysrgb&w=400',
     'luxury', 'active', TRUE, 4.9, 167,
     '["5-star beachfront resort", "Daily gourmet breakfast", "Private yacht cruise", "Beach club access", "Spa treatments", "Luxury transfers"]',
     '["International flights", "Gourmet dining", "Casino chips", "Travel insurance", "Personal expenses", "High-end shopping"]',
     'luxury'),

    -- ITALY PACKAGES (3 packages)
    ('rome-florence-venice-classic', 'Rome Florence Venice Classic', region_id_to_use, country_it_id, 8, 7,
     'Discover Italy''s Renaissance treasures and ancient wonders in this classic three-city tour.',
     'The ultimate Italian cultural journey through three of the world''s most artistic and historic cities, featuring Renaissance art, ancient Roman ruins, and Venetian romance.',
     '["Colosseum and Roman Forum tours", "Vatican Museums and Sistine Chapel", "Florence Uffizi Gallery visit", "Tuscan countryside wine tour", "Venice gondola ride", "Cooking class with Italian chef"]',
     269998, 'INR',
     'https://images.pexels.com/photos/1797161/pexels-photo-1797161.jpeg?auto=compress&cs=tinysrgb&w=400',
     'cultural', 'active', TRUE, 4.8, 324,
     '["4-star historic center hotels", "Daily Italian breakfast", "High-speed train tickets", "Skip-the-line museum entries", "Professional art guides", "Wine tasting experiences"]',
     '["International flights", "Main meals", "Personal shopping", "Travel insurance", "Tips", "Optional excursions"]',
     'cultural'),

    ('amalfi-coast-paradise', 'Amalfi Coast Paradise', region_id_to_use, country_it_id, 6, 5,
     'Relax along Italy''s most beautiful coastline with cliffside towns, Mediterranean cuisine, and azure waters.',
     'Escape to the stunning Amalfi Coast where dramatic cliffs meet crystal-clear waters, charming towns offer authentic Italian experiences, and every sunset is unforgettable.',
     '["Positano cliffside village exploration", "Amalfi cathedral and paper mills", "Ravello gardens and villas", "Capri island day trip", "Limoncello tasting experience", "Boat cruise along the coast"]',
     219998, 'INR',
     'https://images.pexels.com/photos/1483826/pexels-photo-1483826.jpeg?auto=compress&cs=tinysrgb&w=400',
     'beach', 'active', TRUE, 4.7, 198,
     '["Boutique coastal hotel", "Daily Mediterranean breakfast", "Private boat transfers", "Island excursions", "Local food tours", "Scenic drives"]',
     '["International flights", "Gourmet dining", "Personal purchases", "Travel insurance", "Gratuities", "Premium activities"]',
     'beach'),

    -- SPAIN PACKAGES (3 packages)
    ('barcelona-madrid-cultural', 'Barcelona Madrid Cultural', region_id_to_use, country_es_id, 7, 6,
     'Experience Spain''s art, architecture, and cuisine in its two most vibrant cities.',
     'Immerse yourself in Spanish culture through Gaudí''s masterpieces, Prado''s art treasures, flamenco shows, and authentic tapas experiences in Barcelona and Madrid.',
     '["Sagrada Familia and Park Güell tours", "Prado and Reina Sofia museums", "Flamenco show with dinner", "Tapas walking tours", "Toledo day trip", "Gothic Quarter exploration"]',
     189998, 'INR',
     'https://images.pexels.com/photos/1388030/pexels-photo-1388030.jpeg?auto=compress&cs=tinysrgb&w=400',
     'cultural', 'active', TRUE, 4.6, 267,
     '["4-star city center hotels", "Daily Spanish breakfast", "High-speed train between cities", "Museum skip-the-line tickets", "Flamenco show reservations", "Food tour guides"]',
     '["International flights", "Main meals", "Personal shopping", "Travel insurance", "Tips", "Optional day trips"]',
     'cultural'),

    ('andalusia-discovery', 'Andalusia Discovery', region_id_to_use, country_es_id, 8, 7,
     'Explore southern Spain''s Moorish heritage, white villages, and passionate flamenco culture.',
     'Journey through Andalusia''s most enchanting cities and villages, discovering centuries of Moorish influence, passionate flamenco traditions, and stunning architecture.',
     '["Alhambra Palace in Granada", "Seville Cathedral and Alcazar", "Cordoba Mezquita mosque", "Ronda white village and bridge", "Jerez sherry tasting", "Authentic flamenco performances"]',
     199998, 'INR',
     'https://images.pexels.com/photos/1388030/pexels-photo-1388030.jpeg?auto=compress&cs=tinysrgb&w=400',
     'cultural', 'active', FALSE, 4.7, 156,
     '["Historic paradores and boutique hotels", "Daily Andalusian breakfast", "Private transportation", "Monument entries", "Sherry bodega tours", "Flamenco show tickets"]',
     '["International flights", "Main meals", "Personal expenses", "Travel insurance", "Gratuities", "Optional activities"]',
     'cultural'),

    -- GERMANY PACKAGES (2 packages)
    ('bavarian-castles-tour', 'Bavarian Castles Tour', region_id_to_use, country_de_id, 6, 5,
     'Discover fairy-tale castles, alpine scenery, and traditional Bavarian culture.',
     'Explore Bavaria''s most magnificent castles, from Neuschwanstein''s fairy-tale beauty to Munich''s beer gardens and the stunning Alpine landscape.',
     '["Neuschwanstein and Hohenschwangau castles", "Munich city tour and beer gardens", "Salzburg Mozart heritage tour", "Eagle''s Nest historical site", "Traditional Bavarian folk show", "Alpine scenic drives"]',
     169998, 'INR',
     'https://images.pexels.com/photos/1802041/pexels-photo-1802041.jpeg?auto=compress&cs=tinysrgb&w=400',
     'cultural', 'active', FALSE, 4.5, 123,
     '["Traditional Bavarian hotels", "Daily German breakfast", "Castle entry tickets", "Private transportation", "Beer garden experiences", "Cultural shows"]',
     '["International flights", "Main meals", "Personal purchases", "Travel insurance", "Tips", "Optional alpine activities"]',
     'cultural'),

    -- THAILAND PACKAGES (4 packages)
    ('bangkok-phuket-island-hopping', 'Bangkok Phuket Island Hopping', region_id_to_use, country_th_id, 8, 7,
     'Experience Thailand''s vibrant capital and pristine southern islands.',
     'The perfect combination of urban exploration and tropical paradise, featuring Bangkok''s golden temples, street food culture, and Phuket''s stunning beaches and island adventures.',
     '["Grand Palace and Wat Pho temple", "Floating market boat tour", "Thai cooking class", "Phi Phi Islands day trip", "James Bond Island speedboat tour", "Traditional Thai massage spa"]',
     149998, 'INR',
     'https://images.pexels.com/photos/1007426/pexels-photo-1007426.jpeg?auto=compress&cs=tinysrgb&w=400',
     'beach', 'active', TRUE, 4.7, 456,
     '["4-star hotels in Bangkok and Phuket", "Daily Thai breakfast", "Domestic flights", "Island tour boats", "Temple entries", "Cooking class and spa"]',
     '["International flights", "Main meals", "Personal shopping", "Travel insurance", "Tips", "Water sports"]',
     'beach'),

    ('chiang-mai-cultural-immersion', 'Chiang Mai Cultural Immersion', region_id_to_use, country_th_id, 6, 5,
     'Discover northern Thailand''s rich culture, hill tribes, and natural beauty.',
     'Immerse yourself in authentic Thai culture in the peaceful northern region, visiting ancient temples, hill tribe villages, and experiencing traditional crafts and cuisine.',
     '["Ancient temple complex tours", "Hill tribe village visits", "Elephant sanctuary experience", "Traditional craft workshops", "Night bazaar exploration", "Khantoke dinner show"]',
     99998, 'INR',
     'https://images.pexels.com/photos/1371360/pexels-photo-1371360.jpeg?auto=compress&cs=tinysrgb&w=400',
     'cultural', 'active', FALSE, 4.6, 234,
     '["Boutique northern Thai hotel", "Daily breakfast", "Village tour transportation", "Elephant sanctuary entry", "Cultural workshops", "Traditional performances"]',
     '["International flights", "Main meals", "Personal purchases", "Travel insurance", "Donations to communities", "Optional adventures"]',
     'cultural'),

    -- SINGAPORE PACKAGES (2 packages)
    ('singapore-city-luxury', 'Singapore City Luxury', region_id_to_use, country_sg_id, 5, 4,
     'Experience the Garden City''s modern marvels, culinary scene, and luxury shopping.',
     'Discover Singapore''s perfect blend of cultures, cutting-edge architecture, world-class dining, and tropical gardens in this comprehensive city experience.',
     '["Marina Bay Sands infinity pool", "Gardens by the Bay light show", "Singapore Flyer giant wheel", "Hawker centers food tour", "Sentosa Island attractions", "Orchard Road shopping spree"]',
     159998, 'INR',
     'https://images.pexels.com/photos/1008155/pexels-photo-1008155.jpeg?auto=compress&cs=tinysrgb&w=400',
     'urban', 'active', TRUE, 4.8, 189,
     '["5-star Marina Bay hotel", "Daily breakfast", "Airport transfers", "Attraction passes", "Food tour guide", "Shopping vouchers"]',
     '["International flights", "Main meals", "Personal shopping", "Travel insurance", "Tips", "Premium experiences"]',
     'urban'),

    -- JAPAN PACKAGES (3 packages)
    ('tokyo-kyoto-cultural-journey', 'Tokyo Kyoto Cultural Journey', region_id_to_use, country_jp_id, 8, 7,
     'Experience Japan''s fascinating blend of ultra-modern cities and ancient traditions.',
     'Journey through Japan''s contrasts, from Tokyo''s neon-lit streets and innovative technology to Kyoto''s serene temples and traditional geisha districts.',
     '["Tokyo Skytree and Asakusa temple", "Tsukiji fish market sushi breakfast", "Mount Fuji day trip", "Kyoto golden pavilion tour", "Geisha district walking tour", "Traditional ryokan stay experience"]',
     329998, 'INR',
     'https://images.pexels.com/photos/1440476/pexels-photo-1440476.jpeg?auto=compress&cs=tinysrgb&w=400',
     'cultural', 'active', TRUE, 4.9, 267,
     '["Luxury hotels and traditional ryokan", "Daily Japanese breakfast", "JR Pass for bullet trains", "Temple entries", "Cultural experiences", "Professional guides"]',
     '["International flights", "Main meals", "Personal purchases", "Travel insurance", "Tips", "Optional sake tours"]',
     'cultural'),

    ('japan-cherry-blossom-special', 'Japan Cherry Blossom Special', region_id_to_use, country_jp_id, 10, 9,
     'Witness Japan''s most magical season with cherry blossoms in full bloom.',
     'Experience Japan during the spectacular cherry blossom season, visiting the most beautiful hanami spots and participating in traditional flower viewing celebrations.',
     '["Cherry blossom viewing in Tokyo parks", "Kyoto bamboo forest and temples", "Osaka castle and gardens", "Traditional hanami picnic", "Japanese tea ceremony", "Mount Yoshino cherry mountains"]',
     449998, 'INR',
     'https://images.pexels.com/photos/2070033/pexels-photo-2070033.jpeg?auto=compress&cs=tinysrgb&w=400',
     'seasonal', 'active', TRUE, 4.9, 145,
     '["Premium hotels with garden views", "Daily breakfast", "JR Pass unlimited travel", "Hanami experiences", "Tea ceremony classes", "Photography tours"]',
     '["International flights", "Main meals", "Personal shopping", "Travel insurance", "Gratuities", "Premium sake tastings"]',
     'seasonal'),

    -- AUSTRALIA PACKAGES (3 packages)
    ('sydney-melbourne-highlights', 'Sydney Melbourne Highlights', region_id_to_use, country_au_id, 8, 7,
     'Discover Australia''s two most vibrant cities with iconic landmarks and cultural experiences.',
     'Experience the best of Australia''s east coast, from Sydney''s harbor beauty to Melbourne''s cultural sophistication, including wildlife encounters and coastal drives.',
     '["Sydney Opera House and Harbor Bridge", "Blue Mountains day trip", "Melbourne laneways street art tour", "Great Ocean Road coastal drive", "Phillip Island penguin parade", "Wine tasting in Yarra Valley"]',
     299998, 'INR',
     'https://images.pexels.com/photos/783682/pexels-photo-783682.jpeg?auto=compress&cs=tinysrgb&w=400',
     'adventure', 'active', TRUE, 4.7, 234,
     '["4-star city center hotels", "Daily breakfast", "Domestic flights", "National park entries", "Wildlife experiences", "Wine tastings"]',
     '["International flights", "Main meals", "Personal expenses", "Travel insurance", "Tips", "Optional helicopter tours"]',
     'adventure'),

    ('great-barrier-reef-adventure', 'Great Barrier Reef Adventure', region_id_to_use, country_au_id, 6, 5,
     'Explore the world''s largest coral reef system with diving, snorkeling, and tropical islands.',
     'Discover one of the world''s seven natural wonders with snorkeling, diving, and island hopping adventures in the pristine waters of the Great Barrier Reef.',
     '["Great Barrier Reef snorkeling tours", "Whitsunday Islands sailing", "Cairns rainforest exploration", "Indigenous cultural experiences", "Helicopter reef scenic flights", "Underwater observatory visits"]',
     249998, 'INR',
     'https://images.pexels.com/photos/1371360/pexels-photo-1371360.jpeg?auto=compress&cs=tinysrgb&w=400',
     'adventure', 'active', TRUE, 4.8, 189,
     '["Beachfront resort accommodation", "Daily breakfast", "Reef tour boats", "Snorkeling equipment", "National park fees", "Scenic flights"]',
     '["International flights", "Main meals", "Diving certification", "Travel insurance", "Personal gear", "Premium excursions"]',
     'adventure'),

    -- GREECE PACKAGES (2 packages)
    ('greek-islands-odyssey', 'Greek Islands Odyssey', region_id_to_use, country_gr_id, 9, 8,
     'Island hop through Greece''s most beautiful islands with ancient history and stunning sunsets.',
     'Experience the magic of the Greek islands, from Santorini''s romantic sunsets to Mykonos'' vibrant nightlife and Crete''s ancient Minoan civilization.',
     '["Santorini sunset dinner cruise", "Mykonos windmills and beaches", "Crete Palace of Knossos", "Rhodes medieval old town", "Traditional Greek taverna nights", "Island hopping ferry passes"]',
     229998, 'INR',
     'https://images.pexels.com/photos/1285625/pexels-photo-1285625.jpeg?auto=compress&cs=tinysrgb&w=400',
     'beach', 'active', TRUE, 4.8, 312,
     '["Boutique island hotels", "Daily Greek breakfast", "Inter-island ferries", "Archaeological site entries", "Traditional music shows", "Sunset cruise dinners"]',
     '["International flights", "Main meals", "Personal shopping", "Travel insurance", "Tips", "Water sports"]',
     'beach'),

    -- TURKEY PACKAGES (2 packages)
    ('istanbul-cappadocia-magic', 'Istanbul Cappadocia Magic', region_id_to_use, country_tr_id, 7, 6,
     'Discover Turkey''s imperial history and fairy-tale landscapes.',
     'Experience the magic of Turkey from Istanbul''s historic grandeur to Cappadocia''s otherworldly landscape, including hot air balloon rides and underground cities.',
     '["Hagia Sophia and Blue Mosque", "Topkapi Palace and Grand Bazaar", "Cappadocia hot air balloon ride", "Underground cities exploration", "Turkish bath spa experience", "Whirling dervishes ceremony"]',
     179998, 'INR',
     'https://images.pexels.com/photos/1701595/pexels-photo-1701595.jpeg?auto=compress&cs=tinysrgb&w=400',
     'cultural', 'active', TRUE, 4.7, 267,
     '["Historic hotels and cave hotels", "Daily Turkish breakfast", "Domestic flights", "Monument entries", "Hot air balloon ride", "Cultural performances"]',
     '["International flights", "Main meals", "Personal purchases", "Travel insurance", "Tips", "Optional tours"]',
     'cultural'),

    -- SWITZERLAND PACKAGES (2 packages)
    ('swiss-alps-adventure', 'Swiss Alps Adventure', region_id_to_use, country_ch_id, 7, 6,
     'Experience Switzerland''s majestic Alps with scenic trains, mountain peaks, and charming villages.',
     'Journey through Switzerland''s most spectacular alpine scenery via scenic railways, cable cars, and mountain adventures, staying in charming alpine villages.',
     '["Jungfraujoch Top of Europe", "Matterhorn Glacier Paradise", "Rhine Falls boat cruise", "Scenic train journeys", "Alpine village walks", "Swiss cheese and chocolate tours"]',
     349998, 'INR',
     'https://images.pexels.com/photos/2382681/pexels-photo-2382681.jpeg?auto=compress&cs=tinysrgb&w=400',
     'adventure', 'active', TRUE, 4.8, 156,
     '["Alpine hotels with mountain views", "Daily Swiss breakfast", "All scenic train passes", "Cable car tickets", "Mountain excursions", "Local food experiences"]',
     '["International flights", "Main meals", "Personal shopping", "Travel insurance", "Tips", "Premium mountain activities"]',
     'adventure'),

    -- NETHERLANDS PACKAGES (1 package)
    ('amsterdam-tulips-canals', 'Amsterdam Tulips & Canals', region_id_to_use, country_nl_id, 5, 4,
     'Discover Holland''s iconic tulips, historic canals, and vibrant cultural scene.',
     'Experience the charm of Amsterdam with its famous canals, world-class museums, and seasonal tulip displays, plus traditional Dutch experiences.',
     '["Anne Frank House tour", "Van Gogh Museum visit", "Canal cruise with dinner", "Keukenhof tulip gardens", "Traditional windmill tours", "Dutch cheese tasting"]',
     149998, 'INR',
     'https://images.pexels.com/photos/1388030/pexels-photo-1388030.jpeg?auto=compress&cs=tinysrgb&w=400',
     'cultural', 'active', FALSE, 4.6, 134,
     '["Canal-side boutique hotel", "Daily Dutch breakfast", "Museum skip-the-line tickets", "Canal cruise dinner", "Tulip garden entries", "Bike rental"]',
     '["International flights", "Main meals", "Personal purchases", "Travel insurance", "Tips", "Optional bike tours"]',
     'cultural'),

    -- CANADA PACKAGES (2 packages)
    ('canada-rockies-adventure', 'Canada Rockies Adventure', region_id_to_use, country_ca_id, 8, 7,
     'Explore the Canadian Rockies with stunning lakes, glaciers, and wildlife.',
     'Experience Canada''s most spectacular mountain scenery in the Rockies, with pristine lakes, ancient glaciers, and abundant wildlife in Banff and Jasper.',
     '["Lake Louise canoe experience", "Banff National Park wildlife tour", "Jasper Skytram mountain views", "Icefields Parkway scenic drive", "Columbia Icefield glacier walk", "Indigenous cultural experiences"]',
     279998, 'INR',
     'https://images.pexels.com/photos/1459505/pexels-photo-1459505.jpeg?auto=compress&cs=tinysrgb&w=400',
     'adventure', 'active', TRUE, 4.8, 198,
     '["Mountain lodge accommodation", "Daily breakfast", "National park passes", "Wildlife tour guides", "Glacier experiences", "Cultural programs"]',
     '["International flights", "Main meals", "Personal gear", "Travel insurance", "Tips", "Optional helicopter tours"]',
     'adventure'),

    -- MALAYSIA PACKAGES (2 packages)
    ('malaysia-cultural-triangle', 'Malaysia Cultural Triangle', region_id_to_use, country_my_id, 7, 6,
     'Discover Malaysia''s multicultural heritage in Kuala Lumpur, Penang, and Malacca.',
     'Experience Malaysia''s rich cultural diversity through its historic cities, street food, and traditional crafts, showcasing Malay, Chinese, and Indian influences.',
     '["Petronas Twin Towers skybridge", "Batu Caves temple complex", "Penang Georgetown heritage walk", "Malacca river cruise", "Traditional craft workshops", "Street food tour adventures"]',
     119998, 'INR',
     'https://images.pexels.com/photos/1007426/pexels-photo-1007426.jpeg?auto=compress&cs=tinysrgb&w=400',
     'cultural', 'active', FALSE, 4.5, 167,
     '["4-star city hotels", "Daily breakfast", "Inter-city transportation", "Heritage site entries", "Food tour guides", "Cultural workshops"]',
     '["International flights", "Main meals", "Personal shopping", "Travel insurance", "Tips", "Optional island trips"]',
     'cultural'),

    -- INDONESIA PACKAGES (2 packages)
    ('bali-cultural-beaches', 'Bali Cultural & Beaches', region_id_to_use, country_id_id, 8, 7,
     'Experience Bali''s spiritual culture, stunning rice terraces, and pristine beaches.',
     'Discover Bali''s perfect blend of ancient Hindu culture, dramatic landscapes, and tropical beaches, with temple visits, rice terrace walks, and beach relaxation.',
     '["Ancient temple complex tours", "Tegallalang rice terraces walk", "Traditional Balinese cooking class", "Ubud monkey forest sanctuary", "Sunset beach dinner at Jimbaran", "Traditional kecak fire dance"]',
     129998, 'INR',
     'https://images.pexels.com/photos/2474689/pexels-photo-2474689.jpeg?auto=compress&cs=tinysrgb&w=400',
     'cultural', 'active', TRUE, 4.7, 289,
     '["Boutique resorts in Ubud and beach", "Daily breakfast", "Temple entries", "Cooking classes", "Cultural performances", "Airport transfers"]',
     '["International flights", "Main meals", "Personal shopping", "Travel insurance", "Tips", "Water sports"]',
     'cultural');

    RAISE NOTICE '✅ Successfully inserted comprehensive packages for all major destinations!';
    RAISE NOTICE '📦 Check packages count after insert';
END $$;

-- Create package departures for all packages
DO $$
DECLARE
    pkg RECORD;
    departure_count INTEGER := 0;
BEGIN
    RAISE NOTICE '🗓️ Creating package departures for all packages...';
    
    -- Create departures for each package
    FOR pkg IN SELECT id, slug, base_price_pp FROM packages WHERE status = 'active' LOOP
        -- Insert 6 departure dates for each package over the next 6 months
        INSERT INTO package_departures (
            package_id, departure_city_code, departure_city_name,
            departure_date, return_date, price_per_person, child_price,
            currency, total_seats, is_guaranteed
        )
        SELECT
            pkg.id,
            'DEL',
            'New Delhi',
            CURRENT_DATE + (generate_series(1, 6) * INTERVAL '30 days'),
            CURRENT_DATE + (generate_series(1, 6) * INTERVAL '30 days') + INTERVAL '7 days',
            pkg.base_price_pp,
            pkg.base_price_pp * 0.75,
            'INR',
            25,
            TRUE;
            
        -- Also add Mumbai departures for popular packages
        IF pkg.base_price_pp > 150000 THEN
            INSERT INTO package_departures (
                package_id, departure_city_code, departure_city_name,
                departure_date, return_date, price_per_person, child_price,
                currency, total_seats, is_guaranteed
            )
            SELECT
                pkg.id,
                'BOM',
                'Mumbai',
                CURRENT_DATE + (generate_series(1, 4) * INTERVAL '45 days'),
                CURRENT_DATE + (generate_series(1, 4) * INTERVAL '45 days') + INTERVAL '7 days',
                pkg.base_price_pp + 5000,
                (pkg.base_price_pp + 5000) * 0.75,
                'INR',
                20,
                TRUE;
        END IF;
        
        departure_count := departure_count + 1;
    END LOOP;
    
    RAISE NOTICE '✅ Created departures for % packages', departure_count;
    
    -- Final summary
    RAISE NOTICE '📊 FINAL SUMMARY:';
    RAISE NOTICE '📦 Total packages: %', (SELECT COUNT(*) FROM packages);
    RAISE NOTICE '🗓️ Total departures: %', (SELECT COUNT(*) FROM package_departures);
    RAISE NOTICE '🌍 Countries with packages: %', (SELECT COUNT(DISTINCT country_id) FROM packages WHERE country_id IS NOT NULL);
END $$;
