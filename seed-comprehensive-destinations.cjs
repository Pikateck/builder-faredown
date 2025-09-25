const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function seedComprehensiveDestinations() {
  const client = await pool.connect();
  
  try {
    console.log('\n=== SEEDING COMPREHENSIVE DESTINATIONS DATA ===\n');
    
    await client.query('BEGIN');
    
    // ===== 1. GLOBAL REGIONS =====
    console.log('1. Seeding global regions...');
    
    await client.query("SELECT upsert_region('World','global',NULL,'world',0,TRUE)");
    await client.query("SELECT upsert_region('India','region','world','india',10,TRUE)");
    
    // World → macro regions
    await client.query("SELECT upsert_region('Africa','region','world','africa',20,TRUE)");
    await client.query("SELECT upsert_region('America','region','world','america',30,TRUE)");
    await client.query("SELECT upsert_region('Asia','region','world','asia',40,TRUE)");
    await client.query("SELECT upsert_region('Australia & New Zealand','region','world','anz',50,TRUE)");
    await client.query("SELECT upsert_region('Europe','region','world','europe',60,TRUE)");
    await client.query("SELECT upsert_region('Middle East','region','world','middle-east',70,TRUE)");
    await client.query("SELECT upsert_region('Antarctica','region','world','antarctica',80,TRUE)");
    
    console.log('✅ Global regions seeded');
    
    // ===== 2. INDIA SUBREGIONS =====
    console.log('2. Seeding India subregions...');
    
    // North India subregions/states
    await client.query("SELECT upsert_region('North India','subregion','india','north-india',10,TRUE)");
    await client.query("SELECT upsert_region('Himachal Pradesh','state','north-india','hp',11,TRUE)");
    await client.query("SELECT upsert_region('Kashmir','state','north-india','kashmir',12,TRUE)");
    await client.query("SELECT upsert_region('Leh-Ladakh','state','north-india','leh-ladakh',13,TRUE)");
    await client.query("SELECT upsert_region('Punjab & Haryana','state','north-india','punjab-haryana',14,TRUE)");
    await client.query("SELECT upsert_region('Uttarakhand','state','north-india','uttarakhand',15,TRUE)");
    await client.query("SELECT upsert_region('Uttar Pradesh','state','north-india','uttar-pradesh',16,TRUE)");
    
    // South India
    await client.query("SELECT upsert_region('South India','subregion','india','south-india',20,TRUE)");
    await client.query("SELECT upsert_region('Andaman & Nicobar Islands','state','south-india','andaman',21,TRUE)");
    await client.query("SELECT upsert_region('Andhra Pradesh','state','south-india','ap',22,TRUE)");
    await client.query("SELECT upsert_region('Telangana','state','south-india','telangana',23,TRUE)");
    await client.query("SELECT upsert_region('Karnataka','state','south-india','karnataka',24,TRUE)");
    await client.query("SELECT upsert_region('Kerala','state','south-india','kerala',25,TRUE)");
    await client.query("SELECT upsert_region('Tamil Nadu','state','south-india','tamil-nadu',26,TRUE)");
    
    // East & North East India
    await client.query("SELECT upsert_region('East & North East India','subregion','india','ene-india',30,TRUE)");
    await client.query("SELECT upsert_region('Arunachal Pradesh','state','ene-india','arunachal',31,TRUE)");
    await client.query("SELECT upsert_region('Assam','state','ene-india','assam',32,TRUE)");
    await client.query("SELECT upsert_region('Manipur','state','ene-india','manipur',33,TRUE)");
    await client.query("SELECT upsert_region('Meghalaya','state','ene-india','meghalaya',34,TRUE)");
    await client.query("SELECT upsert_region('Mizoram','state','ene-india','mizoram',35,TRUE)");
    await client.query("SELECT upsert_region('Nagaland','state','ene-india','nagaland',36,TRUE)");
    await client.query("SELECT upsert_region('Orissa','state','ene-india','orissa',37,TRUE)");
    await client.query("SELECT upsert_region('Sikkim','state','ene-india','sikkim',38,TRUE)");
    await client.query("SELECT upsert_region('Tripura','state','ene-india','tripura',39,TRUE)");
    await client.query("SELECT upsert_region('West Bengal','state','ene-india','west-bengal',40,TRUE)");
    
    // Rajasthan, West & Central India
    await client.query("SELECT upsert_region('Rajasthan, West & Central India','subregion','india','rwc-india',50,TRUE)");
    await client.query("SELECT upsert_region('Goa','state','rwc-india','goa',51,TRUE)");
    await client.query("SELECT upsert_region('Gujarat','state','rwc-india','gujarat',52,TRUE)");
    await client.query("SELECT upsert_region('Madhya Pradesh','state','rwc-india','mp',53,TRUE)");
    await client.query("SELECT upsert_region('Maharashtra','state','rwc-india','maharashtra',54,TRUE)");
    await client.query("SELECT upsert_region('Rajasthan','state','rwc-india','rajasthan',55,TRUE)");
    
    console.log('✅ India subregions seeded');
    
    // ===== 3. INDIA COUNTRY & CITIES =====
    console.log('3. Seeding India country and cities...');
    
    // Country
    await client.query("SELECT upsert_country('India','IN','india','india-country','INR',10,TRUE)");
    
    // North India cities
    await client.query("SELECT upsert_city('Delhi','DEL','india-country','delhi','north-india',10,TRUE)");
    
    // Himachal Pradesh cities
    const himachalCities = [
      "SELECT upsert_city('Chamba',NULL,'india-country','chamba','hp',10,TRUE)",
      "SELECT upsert_city('Dalhousie',NULL,'india-country','dalhousie','hp',11,TRUE)",
      "SELECT upsert_city('Dharamshala',NULL,'india-country','dharamshala','hp',12,TRUE)",
      "SELECT upsert_city('Kaza',NULL,'india-country','kaza','hp',13,TRUE)",
      "SELECT upsert_city('Manali',NULL,'india-country','manali','hp',14,TRUE)",
      "SELECT upsert_city('Shimla',NULL,'india-country','shimla','hp',15,TRUE)",
      "SELECT upsert_city('Spiti Valley',NULL,'india-country','spiti-valley','hp',16,TRUE)"
    ];
    
    for (const query of himachalCities) {
      await client.query(query);
    }
    
    // Kashmir cities
    const kashmirCities = [
      "SELECT upsert_city('Gulmarg',NULL,'india-country','gulmarg','kashmir',10,TRUE)",
      "SELECT upsert_city('Pahalgam',NULL,'india-country','pahalgam','kashmir',11,TRUE)",
      "SELECT upsert_city('Sonmarg',NULL,'india-country','sonmarg','kashmir',12,TRUE)",
      "SELECT upsert_city('Srinagar','SXR','india-country','srinagar','kashmir',13,TRUE)"
    ];
    
    for (const query of kashmirCities) {
      await client.query(query);
    }
    
    // Leh-Ladakh cities
    const ladakhCities = [
      "SELECT upsert_city('Kargil',NULL,'india-country','kargil','leh-ladakh',10,TRUE)",
      "SELECT upsert_city('Leh','IXL','india-country','leh','leh-ladakh',11,TRUE)",
      "SELECT upsert_city('Nubra Valley',NULL,'india-country','nubra-valley','leh-ladakh',12,TRUE)",
      "SELECT upsert_city('Pangong Tso',NULL,'india-country','pangong-tso','leh-ladakh',13,TRUE)",
      "SELECT upsert_city('Turtuk',NULL,'india-country','turtuk','leh-ladakh',14,TRUE)"
    ];
    
    for (const query of ladakhCities) {
      await client.query(query);
    }
    
    // Uttarakhand cities
    const uttarakhandCities = [
      "SELECT upsert_city('Jim Corbett Park',NULL,'india-country','jim-corbett-park','uttarakhand',10,TRUE)",
      "SELECT upsert_city('Haridwar',NULL,'india-country','haridwar','uttarakhand',11,TRUE)",
      "SELECT upsert_city('Mussoorie',NULL,'india-country','mussoorie','uttarakhand',12,TRUE)",
      "SELECT upsert_city('Nainital',NULL,'india-country','nainital','uttarakhand',13,TRUE)",
      "SELECT upsert_city('Rishikesh',NULL,'india-country','rishikesh','uttarakhand',14,TRUE)"
    ];
    
    for (const query of uttarakhandCities) {
      await client.query(query);
    }
    
    // Uttar Pradesh cities
    const upCities = [
      "SELECT upsert_city('Agra',NULL,'india-country','agra','uttar-pradesh',10,TRUE)",
      "SELECT upsert_city('Ayodhya',NULL,'india-country','ayodhya','uttar-pradesh',11,TRUE)",
      "SELECT upsert_city('Fatehpur Sikri',NULL,'india-country','fatehpur-sikri','uttar-pradesh',12,TRUE)",
      "SELECT upsert_city('Jhansi',NULL,'india-country','jhansi','uttar-pradesh',13,TRUE)",
      "SELECT upsert_city('Lucknow',NULL,'india-country','lucknow','uttar-pradesh',14,TRUE)",
      "SELECT upsert_city('Mathura',NULL,'india-country','mathura','uttar-pradesh',15,TRUE)",
      "SELECT upsert_city('Prayagraj',NULL,'india-country','prayagraj','uttar-pradesh',16,TRUE)",
      "SELECT upsert_city('Varanasi','VNS','india-country','varanasi','uttar-pradesh',17,TRUE)",
      "SELECT upsert_city('Vrindavan',NULL,'india-country','vrindavan','uttar-pradesh',18,TRUE)"
    ];
    
    for (const query of upCities) {
      await client.query(query);
    }
    
    // South India cities
    const southIndiaCities = [
      // Andaman
      "SELECT upsert_city('Havelock',NULL,'india-country','havelock','andaman',10,TRUE)",
      "SELECT upsert_city('Port Blair',NULL,'india-country','port-blair','andaman',11,TRUE)",
      // Telangana
      "SELECT upsert_city('Hyderabad','HYD','india-country','hyderabad','telangana',10,TRUE)",
      "SELECT upsert_city('Ramoji',NULL,'india-country','ramoji','telangana',11,TRUE)",
      // Karnataka
      "SELECT upsert_city('Bengaluru','BLR','india-country','bengaluru','karnataka',10,TRUE)",
      "SELECT upsert_city('Coorg',NULL,'india-country','coorg','karnataka',11,TRUE)",
      "SELECT upsert_city('Hampi',NULL,'india-country','hampi','karnataka',12,TRUE)",
      "SELECT upsert_city('Mangalore',NULL,'india-country','mangalore','karnataka',13,TRUE)",
      "SELECT upsert_city('Mysore',NULL,'india-country','mysore','karnataka',14,TRUE)",
      // Kerala
      "SELECT upsert_city('Alleppey',NULL,'india-country','alleppey','kerala',10,TRUE)",
      "SELECT upsert_city('Munnar',NULL,'india-country','munnar','kerala',11,TRUE)",
      "SELECT upsert_city('Cochin','COK','india-country','cochin','kerala',12,TRUE)",
      // Tamil Nadu
      "SELECT upsert_city('Chennai','MAA','india-country','chennai','tamil-nadu',10,TRUE)",
      "SELECT upsert_city('Ooty',NULL,'india-country','ooty','tamil-nadu',11,TRUE)",
      "SELECT upsert_city('Rameswaram',NULL,'india-country','rameswaram','tamil-nadu',12,TRUE)"
    ];
    
    for (const query of southIndiaCities) {
      await client.query(query);
    }
    
    // ENE India cities
    const eneCities = [
      "SELECT upsert_city('Bomdila',NULL,'india-country','bomdila','arunachal',10,TRUE)",
      "SELECT upsert_city('Tawang',NULL,'india-country','tawang','arunachal',11,TRUE)",
      "SELECT upsert_city('Guwahati','GAU','india-country','guwahati','assam',10,TRUE)",
      "SELECT upsert_city('Kaziranga National Park',NULL,'india-country','kaziranga','assam',11,TRUE)",
      "SELECT upsert_city('Shillong',NULL,'india-country','shillong','meghalaya',10,TRUE)"
    ];
    
    for (const query of eneCities) {
      await client.query(query);
    }
    
    // RWC India cities
    const rwcCities = [
      "SELECT upsert_city('Ahmedabad','AMD','india-country','ahmedabad','gujarat',10,TRUE)",
      "SELECT upsert_city('Rann of Kutch',NULL,'india-country','rann-of-kutch','gujarat',11,TRUE)",
      "SELECT upsert_city('Somnath',NULL,'india-country','somnath','gujarat',12,TRUE)",
      "SELECT upsert_city('Jaipur','JAI','india-country','jaipur','rajasthan',10,TRUE)",
      "SELECT upsert_city('Jodhpur','JDH','india-country','jodhpur','rajasthan',11,TRUE)",
      "SELECT upsert_city('Udaipur','UDR','india-country','udaipur','rajasthan',12,TRUE)"
    ];
    
    for (const query of rwcCities) {
      await client.query(query);
    }
    
    console.log('✅ India cities seeded');
    
    // ===== 4. WORLD COUNTRIES & CITIES =====
    console.log('4. Seeding world countries and cities...');
    
    // Africa
    console.log('   4a. Africa...');
    const africaCountries = [
      "SELECT upsert_country('Egypt','EG','africa','egypt','EGP',10,TRUE)",
      "SELECT upsert_country('Kenya','KE','africa','kenya','KES',20,TRUE)",
      "SELECT upsert_country('Mauritius','MU','africa','mauritius','MUR',30,TRUE)",
      "SELECT upsert_country('Seychelles','SC','africa','seychelles','SCR',40,TRUE)",
      "SELECT upsert_country('South Africa','ZA','africa','south-africa','ZAR',50,TRUE)",
      "SELECT upsert_country('Zimbabwe','ZW','africa','zimbabwe','ZWL',60,TRUE)",
      "SELECT upsert_country('Tanzania','TZ','africa','tanzania','TZS',70,TRUE)"
    ];
    
    for (const query of africaCountries) {
      await client.query(query);
    }
    
    const africaCities = [
      // Egypt
      "SELECT upsert_city('Alexandria',NULL,'egypt','alexandria',NULL,10,TRUE)",
      "SELECT upsert_city('Aswan',NULL,'egypt','aswan',NULL,11,TRUE)",
      "SELECT upsert_city('Cairo','CAI','egypt','cairo',NULL,12,TRUE)",
      "SELECT upsert_city('Hurghada',NULL,'egypt','hurghada',NULL,13,TRUE)",
      "SELECT upsert_city('Luxor',NULL,'egypt','luxor',NULL,14,TRUE)",
      "SELECT upsert_city('Nile Cruise',NULL,'egypt','nile-cruise',NULL,15,TRUE)",
      // Kenya
      "SELECT upsert_city('Maasai Mara',NULL,'kenya','maasai-mara',NULL,10,TRUE)",
      // Mauritius
      "SELECT upsert_city('Port Louis','MRU','mauritius','port-louis',NULL,10,TRUE)",
      // South Africa
      "SELECT upsert_city('Cape Town','CPT','south-africa','cape-town',NULL,10,TRUE)",
      "SELECT upsert_city('Johannesburg','JNB','south-africa','johannesburg',NULL,11,TRUE)",
      "SELECT upsert_city('Knysna',NULL,'south-africa','knysna',NULL,12,TRUE)",
      "SELECT upsert_city('Mossel Bay',NULL,'south-africa','mossel-bay',NULL,13,TRUE)",
      "SELECT upsert_city('Oudtshoorn',NULL,'south-africa','oudtshoorn',NULL,14,TRUE)",
      "SELECT upsert_city('Pilansberg National Park',NULL,'south-africa','pilansberg-np',NULL,15,TRUE)",
      "SELECT upsert_city('Port Elizabeth (Gqeberha)',NULL,'south-africa','port-elizabeth',NULL,16,TRUE)",
      "SELECT upsert_city('Stellenbosch',NULL,'south-africa','stellenbosch',NULL,17,TRUE)",
      "SELECT upsert_city('Sun City',NULL,'south-africa','sun-city',NULL,18,TRUE)",
      // Zimbabwe
      "SELECT upsert_city('Victoria Falls','VFA','zimbabwe','victoria-falls',NULL,10,TRUE)"
    ];
    
    for (const query of africaCities) {
      await client.query(query);
    }
    
    // America
    console.log('   4b. America...');
    const americaCountries = [
      "SELECT upsert_country('Argentina','AR','america','argentina','ARS',10,TRUE)",
      "SELECT upsert_country('Brazil','BR','america','brazil','BRL',20,TRUE)",
      "SELECT upsert_country('Canada','CA','america','canada','CAD',30,TRUE)",
      "SELECT upsert_country('USA','US','america','usa','USD',40,TRUE)"
    ];
    
    for (const query of americaCountries) {
      await client.query(query);
    }
    
    const americaCities = [
      // Brazil
      "SELECT upsert_city('Rio De Janeiro','RIO','brazil','rio-de-janeiro',NULL,10,TRUE)",
      // Canada
      "SELECT upsert_city('Banff',NULL,'canada','banff',NULL,10,TRUE)",
      "SELECT upsert_city('Calgary','YYC','canada','calgary',NULL,11,TRUE)",
      "SELECT upsert_city('Jasper',NULL,'canada','jasper',NULL,12,TRUE)",
      "SELECT upsert_city('Montreal','YUL','canada','montreal',NULL,13,TRUE)",
      "SELECT upsert_city('Ottawa','YOW','canada','ottawa',NULL,14,TRUE)",
      "SELECT upsert_city('Toronto','YYZ','canada','toronto',NULL,15,TRUE)",
      "SELECT upsert_city('Vancouver','YVR','canada','vancouver',NULL,16,TRUE)",
      // USA
      "SELECT upsert_city('Chicago','CHI','usa','chicago',NULL,10,TRUE)",
      "SELECT upsert_city('Las Vegas','LAS','usa','las-vegas',NULL,11,TRUE)",
      "SELECT upsert_city('Los Angeles','LAX','usa','los-angeles',NULL,12,TRUE)",
      "SELECT upsert_city('New York','NYC','usa','new-york',NULL,13,TRUE)",
      "SELECT upsert_city('Niagara Falls',NULL,'usa','niagara-falls',NULL,14,TRUE)",
      "SELECT upsert_city('Orlando','MCO','usa','orlando',NULL,15,TRUE)",
      "SELECT upsert_city('Philadelphia','PHL','usa','philadelphia',NULL,16,TRUE)",
      "SELECT upsert_city('San Francisco','SFO','usa','san-francisco',NULL,17,TRUE)",
      "SELECT upsert_city('Washington','WAS','usa','washington',NULL,18,TRUE)"
    ];
    
    for (const query of americaCities) {
      await client.query(query);
    }
    
    // Asia
    console.log('   4c. Asia...');
    const asiaCountries = [
      "SELECT upsert_country('Bhutan','BT','asia','bhutan','BTN',10,TRUE)",
      "SELECT upsert_country('Nepal','NP','asia','nepal','NPR',20,TRUE)",
      "SELECT upsert_country('Sri Lanka','LK','asia','sri-lanka','LKR',30,TRUE)",
      "SELECT upsert_country('Maldives','MV','asia','maldives','MVR',40,TRUE)",
      "SELECT upsert_country('Cambodia','KH','asia','cambodia','KHR',50,TRUE)",
      "SELECT upsert_country('Singapore','SG','asia','singapore','SGD',60,TRUE)",
      "SELECT upsert_country('Malaysia','MY','asia','malaysia','MYR',70,TRUE)",
      "SELECT upsert_country('Indonesia','ID','asia','indonesia','IDR',80,TRUE)",
      "SELECT upsert_country('Hong Kong','HK','asia','hong-kong','HKD',90,TRUE)",
      "SELECT upsert_country('Macao','MO','asia','macao','MOP',100,TRUE)",
      "SELECT upsert_country('China','CN','asia','china','CNY',110,TRUE)",
      "SELECT upsert_country('Taiwan','TW','asia','taiwan','TWD',120,TRUE)",
      "SELECT upsert_country('Vietnam','VN','asia','vietnam','VND',130,TRUE)",
      "SELECT upsert_country('Myanmar','MM','asia','myanmar','MMK',140,TRUE)",
      "SELECT upsert_country('Laos','LA','asia','laos','LAK',150,TRUE)",
      "SELECT upsert_country('Thailand','TH','asia','thailand','THB',160,TRUE)",
      "SELECT upsert_country('Japan','JP','asia','japan','JPY',170,TRUE)",
      "SELECT upsert_country('South Korea','KR','asia','south-korea','KRW',180,TRUE)",
      "SELECT upsert_country('Philippines','PH','asia','philippines','PHP',190,TRUE)"
    ];
    
    for (const query of asiaCountries) {
      await client.query(query);
    }
    
    const asiaCities = [
      // Nepal
      "SELECT upsert_city('Chitwan',NULL,'nepal','chitwan',NULL,10,TRUE)",
      "SELECT upsert_city('Kathmandu','KTM','nepal','kathmandu',NULL,11,TRUE)",
      "SELECT upsert_city('Pokhara',NULL,'nepal','pokhara',NULL,12,TRUE)",
      // Sri Lanka
      "SELECT upsert_city('Bentota',NULL,'sri-lanka','bentota',NULL,10,TRUE)",
      "SELECT upsert_city('Colombo','CMB','sri-lanka','colombo',NULL,11,TRUE)",
      "SELECT upsert_city('Galle',NULL,'sri-lanka','galle',NULL,12,TRUE)",
      "SELECT upsert_city('Kandy',NULL,'sri-lanka','kandy',NULL,13,TRUE)",
      "SELECT upsert_city('Nuwara Eliya',NULL,'sri-lanka','nuwara-eliya',NULL,14,TRUE)",
      // Indonesia
      "SELECT upsert_city('Bali','DPS','indonesia','bali',NULL,10,TRUE)",
      "SELECT upsert_city('Kuta',NULL,'indonesia','kuta',NULL,11,TRUE)",
      "SELECT upsert_city('Nusa Penida',NULL,'indonesia','nusa-penida',NULL,12,TRUE)",
      "SELECT upsert_city('Ubud',NULL,'indonesia','ubud',NULL,13,TRUE)",
      // China
      "SELECT upsert_city('Beijing','PEK','china','beijing',NULL,10,TRUE)",
      "SELECT upsert_city('Shanghai','PVG','china','shanghai',NULL,11,TRUE)",
      "SELECT upsert_city('Shenzhen','SZX','china','shenzhen',NULL,12,TRUE)",
      // Vietnam
      "SELECT upsert_city('Hanoi','HAN','vietnam','hanoi',NULL,10,TRUE)",
      "SELECT upsert_city('Ho Chi Minh','SGN','vietnam','ho-chi-minh',NULL,11,TRUE)",
      // Thailand
      "SELECT upsert_city('Bangkok','BKK','thailand','bangkok',NULL,10,TRUE)",
      "SELECT upsert_city('Krabi','KBV','thailand','krabi',NULL,11,TRUE)",
      "SELECT upsert_city('Pattaya',NULL,'thailand','pattaya',NULL,12,TRUE)",
      "SELECT upsert_city('Phuket','HKT','thailand','phuket',NULL,13,TRUE)",
      // Japan
      "SELECT upsert_city('Tokyo','TYO','japan','tokyo',NULL,10,TRUE)",
      "SELECT upsert_city('Kyoto',NULL,'japan','kyoto',NULL,11,TRUE)",
      "SELECT upsert_city('Osaka','OSA','japan','osaka',NULL,12,TRUE)",
      "SELECT upsert_city('Hiroshima',NULL,'japan','hiroshima',NULL,13,TRUE)",
      // South Korea
      "SELECT upsert_city('Seoul','SEL','south-korea','seoul',NULL,10,TRUE)"
    ];
    
    for (const query of asiaCities) {
      await client.query(query);
    }
    
    // Australia & New Zealand
    console.log('   4d. Australia & New Zealand...');
    const anzCountries = [
      "SELECT upsert_country('Australia','AU','anz','australia','AUD',10,TRUE)",
      "SELECT upsert_country('Fiji','FJ','anz','fiji','FJD',20,TRUE)",
      "SELECT upsert_country('New Zealand','NZ','anz','new-zealand','NZD',30,TRUE)"
    ];
    
    for (const query of anzCountries) {
      await client.query(query);
    }
    
    const anzCities = [
      // Australia
      "SELECT upsert_city('Adelaide','ADL','australia','adelaide',NULL,10,TRUE)",
      "SELECT upsert_city('Brisbane','BNE','australia','brisbane',NULL,11,TRUE)",
      "SELECT upsert_city('Cairns','CNS','australia','cairns',NULL,12,TRUE)",
      "SELECT upsert_city('Canberra','CBR','australia','canberra',NULL,13,TRUE)",
      "SELECT upsert_city('Gold Coast','OOL','australia','gold-coast',NULL,14,TRUE)",
      "SELECT upsert_city('Great Barrier Reef',NULL,'australia','great-barrier-reef',NULL,15,TRUE)",
      "SELECT upsert_city('Great Ocean Road',NULL,'australia','great-ocean-road',NULL,16,TRUE)",
      "SELECT upsert_city('Perth','PER','australia','perth',NULL,17,TRUE)",
      "SELECT upsert_city('Western Australia',NULL,'australia','western-australia',NULL,18,TRUE)",
      "SELECT upsert_city('Melbourne','MEL','australia','melbourne',NULL,19,TRUE)",
      "SELECT upsert_city('Sydney','SYD','australia','sydney',NULL,20,TRUE)",
      "SELECT upsert_city('Queensland',NULL,'australia','queensland',NULL,21,TRUE)",
      // New Zealand
      "SELECT upsert_city('Auckland','AKL','new-zealand','auckland',NULL,10,TRUE)",
      "SELECT upsert_city('Christchurch','CHC','new-zealand','christchurch',NULL,11,TRUE)",
      "SELECT upsert_city('Rotorua',NULL,'new-zealand','rotorua',NULL,12,TRUE)",
      "SELECT upsert_city('Queenstown','ZQN','new-zealand','queenstown',NULL,13,TRUE)"
    ];
    
    for (const query of anzCities) {
      await client.query(query);
    }
    
    // Europe
    console.log('   4e. Europe...');
    const europeCountries = [
      "SELECT upsert_country('Austria','AT','europe','austria','EUR',10,TRUE)",
      "SELECT upsert_country('Belgium','BE','europe','belgium','EUR',11,TRUE)",
      "SELECT upsert_country('France','FR','europe','france','EUR',12,TRUE)",
      "SELECT upsert_country('Germany','DE','europe','germany','EUR',13,TRUE)",
      "SELECT upsert_country('Italy','IT','europe','italy','EUR',14,TRUE)",
      "SELECT upsert_country('Netherlands','NL','europe','netherlands','EUR',15,TRUE)",
      "SELECT upsert_country('Spain','ES','europe','spain','EUR',16,TRUE)",
      "SELECT upsert_country('Switzerland','CH','europe','switzerland','EUR',17,TRUE)",
      "SELECT upsert_country('United Kingdom','GB','europe','united-kingdom','GBP',18,TRUE)",
      "SELECT upsert_country('Portugal','PT','europe','portugal','EUR',19,TRUE)",
      "SELECT upsert_country('Greece','GR','europe','greece','EUR',20,TRUE)",
      "SELECT upsert_country('Croatia','HR','europe','croatia','EUR',21,TRUE)",
      "SELECT upsert_country('Czech Republic','CZ','europe','czech-republic','EUR',22,TRUE)",
      "SELECT upsert_country('Poland','PL','europe','poland','EUR',23,TRUE)",
      "SELECT upsert_country('Hungary','HU','europe','hungary','EUR',24,TRUE)"
    ];
    
    for (const query of europeCountries) {
      await client.query(query);
    }
    
    // Add some major European cities (subset)
    const europeCities = [
      // France
      "SELECT upsert_city('Paris','PAR','france','paris',NULL,10,TRUE)",
      "SELECT upsert_city('Lyon','LYO','france','lyon',NULL,11,TRUE)",
      "SELECT upsert_city('Nice','NCE','france','nice',NULL,12,TRUE)",
      // Italy
      "SELECT upsert_city('Rome','ROM','italy','rome',NULL,10,TRUE)",
      "SELECT upsert_city('Milan','MIL','italy','milan',NULL,11,TRUE)",
      "SELECT upsert_city('Venice','VCE','italy','venice',NULL,12,TRUE)",
      "SELECT upsert_city('Florence','FLR','italy','florence',NULL,13,TRUE)",
      // Spain
      "SELECT upsert_city('Madrid','MAD','spain','madrid',NULL,10,TRUE)",
      "SELECT upsert_city('Barcelona','BCN','spain','barcelona',NULL,11,TRUE)",
      // Germany
      "SELECT upsert_city('Berlin','BER','germany','berlin',NULL,10,TRUE)",
      "SELECT upsert_city('Munich','MUC','germany','munich',NULL,11,TRUE)",
      // United Kingdom
      "SELECT upsert_city('London','LON','united-kingdom','london',NULL,10,TRUE)",
      "SELECT upsert_city('Edinburgh','EDI','united-kingdom','edinburgh',NULL,11,TRUE)",
      // Netherlands
      "SELECT upsert_city('Amsterdam','AMS','netherlands','amsterdam',NULL,10,TRUE)",
      // Switzerland
      "SELECT upsert_city('Zurich','ZUR','switzerland','zurich',NULL,10,TRUE)",
      "SELECT upsert_city('Geneva','GVA','switzerland','geneva',NULL,11,TRUE)"
    ];
    
    for (const query of europeCities) {
      await client.query(query);
    }
    
    // Middle East
    console.log('   4f. Middle East...');
    const middleEastCountries = [
      "SELECT upsert_country('United Arab Emirates','AE','middle-east','uae','AED',10,TRUE)",
      "SELECT upsert_country('Israel','IL','middle-east','israel','ILS',20,TRUE)",
      "SELECT upsert_country('Jordan','JO','middle-east','jordan','JOD',30,TRUE)",
      "SELECT upsert_country('Oman','OM','middle-east','oman','OMR',40,TRUE)",
      "SELECT upsert_country('Saudi Arabia','SA','middle-east','saudi-arabia','SAR',50,TRUE)",
      "SELECT upsert_country('Qatar','QA','middle-east','qatar','QAR',60,TRUE)"
    ];
    
    for (const query of middleEastCountries) {
      await client.query(query);
    }
    
    const middleEastCities = [
      // UAE
      "SELECT upsert_city('Abu Dhabi','AUH','uae','abu-dhabi',NULL,10,TRUE)",
      "SELECT upsert_city('Dubai','DXB','uae','dubai',NULL,11,TRUE)",
      "SELECT upsert_city('Ferrari World',NULL,'uae','ferrari-world',NULL,12,TRUE)",
      // Jordan
      "SELECT upsert_city('Petra',NULL,'jordan','petra',NULL,10,TRUE)",
      // Oman
      "SELECT upsert_city('Muscat','MCT','oman','muscat',NULL,10,TRUE)",
      // Qatar
      "SELECT upsert_city('Doha','DOH','qatar','doha',NULL,10,TRUE)"
    ];
    
    for (const query of middleEastCities) {
      await client.query(query);
    }
    
    // Antarctica
    console.log('   4g. Antarctica...');
    await client.query("SELECT upsert_country('Antarctica','AQ','antarctica','antarctica','USD',10,TRUE)");
    await client.query("SELECT upsert_city('The 7th Continent',NULL,'antarctica','the-7th-continent',NULL,10,TRUE)");
    
    console.log('✅ World destinations seeded');
    
    await client.query('COMMIT');
    
    // ===== FINAL VERIFICATION =====
    console.log('\n5. Final verification...');
    const statsResult = await client.query('SELECT get_destination_stats() as stats');
    const stats = statsResult.rows[0].stats;
    
    console.log('✅ Final statistics:', stats);
    console.log('\n🎉 COMPREHENSIVE DESTINATIONS DATA SEEDED SUCCESSFULLY!');
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Error seeding destinations:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

seedComprehensiveDestinations();
