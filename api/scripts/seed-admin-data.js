/**
 * Comprehensive Seed Data Script for Faredown Admin Panel
 * Populates all modules with realistic sample data
 */

const fs = require("fs");
const path = require("path");

// Seed data for all modules
const seedData = {
  // Promo Codes for all modules
  promoCodes: [
    {
      id: "promo_001",
      code: "FAREDOWNHOTEL",
      description: "Exclusive hotel booking discount for premium properties",
      category: "hotel",
      image:
        "https://cdn.builder.io/api/v1/image/assets%2F4235b10530ff469795aa00c0333d773c%2F57003a8eaa4240e5a35dce05a23e72f5?format=webp&width=800",
      discountType: "percentage",
      discountMinValue: 15,
      discountMaxValue: 5000,
      minimumFareAmount: 10000,
      marketingBudget: 100000,
      expiryDate: "2024-12-31",
      promoCodeImage: "",
      displayOnHomePage: "yes",
      status: "active",
      hotelCity: "ALL",
      hotelName: "",
      createdOn: "2024-01-14 13:31",
      updatedOn: "2024-01-16 13:58",
      module: "hotel",
      validityType: "unlimited",
      usageCount: 67,
      maxUsage: null,
      totalSavings: 234500,
    },
    {
      id: "promo_002",
      code: "FLYSMART",
      description: "Smart flight deals for domestic and international routes",
      category: "flight",
      image:
        "https://cdn.builder.io/api/v1/image/assets%2F4235b10530ff469795aa00c0333d773c%2F8542893d1c0b422f87eee4c35e5441ae?format=webp&width=800",
      discountType: "fixed",
      discountMinValue: 2000,
      discountMaxValue: 5000,
      minimumFareAmount: 8000,
      marketingBudget: 150000,
      expiryDate: "2024-11-30",
      promoCodeImage: "",
      displayOnHomePage: "yes",
      status: "active",
      origin: "ALL",
      destination: "ALL",
      carrierCode: "ALL",
      cabinClass: "ALL",
      flightBy: "",
      createdOn: "2024-01-10 09:15",
      updatedOn: "2024-01-15 16:45",
      module: "flight",
      validityType: "limited",
      usageCount: 123,
      maxUsage: 500,
      totalSavings: 246000,
    },
    {
      id: "promo_003",
      code: "EXPLORE20",
      description: "20% off on guided tours and cultural experiences",
      category: "sightseeing",
      discountType: "percentage",
      discountMinValue: 20,
      discountMaxValue: 3000,
      minimumFareAmount: 2500,
      marketingBudget: 75000,
      expiryDate: "2024-12-31",
      promoCodeImage: "",
      displayOnHomePage: "yes",
      status: "active",
      tourType: "cultural",
      tourCity: "ALL",
      tourDuration: "",
      createdOn: "2024-01-20 10:30",
      updatedOn: "2024-01-22 14:20",
      module: "sightseeing",
      validityType: "unlimited",
      usageCount: 89,
      maxUsage: null,
      totalSavings: 178000,
    },
    {
      id: "promo_004",
      code: "RIDE15",
      description: "15% discount on premium airport transfers",
      category: "transfers",
      discountType: "percentage",
      discountMinValue: 15,
      discountMaxValue: 2000,
      minimumFareAmount: 1500,
      marketingBudget: 50000,
      expiryDate: "2024-12-31",
      promoCodeImage: "",
      displayOnHomePage: "no",
      status: "active",
      vehicleType: "luxury",
      transferRoute: "Airport",
      pickupLocation: "",
      dropLocation: "",
      createdOn: "2024-01-25 11:45",
      updatedOn: "2024-01-26 09:30",
      module: "transfers",
      validityType: "unlimited",
      usageCount: 54,
      maxUsage: null,
      totalSavings: 81000,
    },
    {
      id: "promo_005",
      code: "LUXURY25",
      description: "Exclusive luxury package discounts for premium experiences",
      category: "packages",
      discountType: "fixed",
      discountMinValue: 8000,
      discountMaxValue: 30000,
      minimumFareAmount: 50000,
      marketingBudget: 200000,
      expiryDate: "2024-12-31",
      promoCodeImage: "",
      displayOnHomePage: "yes",
      status: "active",
      packageCategory: "luxury",
      packageDuration: "5-7 days",
      packageRegion: "International",
      createdOn: "2024-01-30 16:20",
      updatedOn: "2024-02-01 12:15",
      module: "packages",
      validityType: "limited",
      usageCount: 34,
      maxUsage: 200,
      totalSavings: 272000,
    },
    {
      id: "promo_006",
      code: "WELCOME10",
      description: "Welcome bonus for new customers across all services",
      category: "all",
      discountType: "percentage",
      discountMinValue: 10,
      discountMaxValue: 4000,
      minimumFareAmount: 5000,
      marketingBudget: 300000,
      expiryDate: "2024-12-31",
      promoCodeImage: "",
      displayOnHomePage: "yes",
      status: "active",
      createdOn: "2024-02-01 08:00",
      updatedOn: "2024-02-05 10:30",
      module: "all",
      validityType: "unlimited",
      usageCount: 267,
      maxUsage: null,
      totalSavings: 534000,
    },
  ],

  // Extranet Inventory for all modules
  extranetInventory: [
    // Flights
    {
      id: "flight_001",
      module: "flights",
      title: "Mumbai to Dubai - Premium Direct Flight",
      description:
        "Comfortable direct flight with excellent service and amenities. Perfect for business and leisure travelers.",
      location: { city: "Mumbai", country: "India", region: "South Asia" },
      pricing: { basePrice: 28000, currency: "INR", priceType: "per_person" },
      availability: {
        status: "active",
        capacity: 180,
        availableSlots: 95,
        startDate: "2024-03-01",
        endDate: "2024-12-31",
      },
      details: {
        duration: "3h 30m",
        includes: [
          "Meals",
          "Baggage 20kg",
          "Seat Selection",
          "Priority Boarding",
        ],
        excludes: ["Airport Transfers", "Travel Insurance", "Visa Assistance"],
        highlights: [
          "Premium Service",
          "On-time Performance",
          "Comfortable Seating",
          "Entertainment System",
        ],
      },
      metadata: {
        created_at: "2024-01-15T10:30:00Z",
        updated_at: "2024-02-10T14:45:00Z",
        created_by: "admin",
        source: "extranet",
      },
      origin: "Mumbai",
      destination: "Dubai",
      airline: "Faredown Airways",
      cabin_class: "Economy",
      flight_duration: "3h 30m",
    },
    {
      id: "flight_002",
      module: "flights",
      title: "Delhi to London - Business Class",
      description:
        "Luxury business class experience with lie-flat seats and premium dining.",
      location: { city: "Delhi", country: "India", region: "South Asia" },
      pricing: { basePrice: 95000, currency: "INR", priceType: "per_person" },
      availability: {
        status: "active",
        capacity: 40,
        availableSlots: 18,
        startDate: "2024-03-01",
        endDate: "2024-12-31",
      },
      details: {
        duration: "8h 45m",
        includes: [
          "Gourmet Meals",
          "Baggage 30kg",
          "Lounge Access",
          "Lie-flat Seats",
        ],
        excludes: ["Airport Transfers", "Travel Insurance"],
        highlights: [
          "Business Class",
          "Premium Lounge",
          "Priority Check-in",
          "Extra Legroom",
        ],
      },
      metadata: {
        created_at: "2024-01-18T09:15:00Z",
        updated_at: "2024-02-08T11:30:00Z",
        created_by: "admin",
        source: "extranet",
      },
      origin: "Delhi",
      destination: "London",
      airline: "British Airways",
      cabin_class: "Business",
      flight_duration: "8h 45m",
    },

    // Hotels
    {
      id: "hotel_001",
      module: "hotels",
      title: "Luxury Beach Resort - Goa",
      description:
        "5-star beachfront resort with stunning ocean views, world-class spa, and multiple dining options.",
      location: { city: "Goa", country: "India", region: "South Asia" },
      pricing: { basePrice: 15000, currency: "INR", priceType: "per_room" },
      availability: {
        status: "active",
        capacity: 120,
        availableSlots: 67,
        startDate: "2024-03-01",
        endDate: "2024-12-31",
      },
      details: {
        includes: [
          "Breakfast",
          "WiFi",
          "Pool Access",
          "Beach Access",
          "Gym",
          "Spa Discount",
        ],
        excludes: [
          "Airport Transfers",
          "Spa Services",
          "Minibar",
          "Room Service",
        ],
        highlights: [
          "Beachfront Location",
          "Ocean View",
          "Multiple Pools",
          "Kids Club",
          "24/7 Room Service",
        ],
      },
      metadata: {
        created_at: "2024-01-20T11:45:00Z",
        updated_at: "2024-02-05T16:20:00Z",
        created_by: "admin",
        source: "extranet",
      },
      room_type: "Ocean View Suite",
      star_rating: "5",
      amenities: "Pool, Spa, Gym, Restaurant, Beach Access, WiFi, Kids Club",
    },
    {
      id: "hotel_002",
      module: "hotels",
      title: "Downtown Business Hotel - Mumbai",
      description:
        "Modern business hotel in the heart of Mumbai's financial district with executive facilities.",
      location: { city: "Mumbai", country: "India", region: "South Asia" },
      pricing: { basePrice: 8500, currency: "INR", priceType: "per_room" },
      availability: {
        status: "active",
        capacity: 200,
        availableSlots: 123,
        startDate: "2024-03-01",
        endDate: "2024-12-31",
      },
      details: {
        includes: [
          "Breakfast",
          "WiFi",
          "Business Center",
          "Gym",
          "Airport Shuttle",
        ],
        excludes: ["Minibar", "Laundry", "Spa Services"],
        highlights: [
          "Central Location",
          "Business Facilities",
          "Metro Connectivity",
          "24/7 Front Desk",
        ],
      },
      metadata: {
        created_at: "2024-01-22T14:30:00Z",
        updated_at: "2024-02-07T09:15:00Z",
        created_by: "admin",
        source: "extranet",
      },
      room_type: "Executive Room",
      star_rating: "4",
      amenities: "Business Center, Gym, Restaurant, WiFi, Conference Rooms",
    },

    // Sightseeing
    {
      id: "sight_001",
      module: "sightseeing",
      title: "Taj Mahal Sunrise Tour - Agra",
      description:
        "Experience the breathtaking beauty of Taj Mahal at sunrise with expert guide and transportation.",
      location: { city: "Agra", country: "India", region: "North India" },
      pricing: { basePrice: 4500, currency: "INR", priceType: "per_person" },
      availability: {
        status: "active",
        capacity: 25,
        availableSlots: 12,
        startDate: "2024-03-01",
        endDate: "2024-12-31",
      },
      details: {
        duration: "6 hours",
        includes: [
          "Expert Guide",
          "Transportation",
          "Entry Tickets",
          "Breakfast",
          "Water",
        ],
        excludes: ["Personal Expenses", "Tips", "Additional Meals"],
        highlights: [
          "Sunrise Experience",
          "Professional Photography",
          "Historical Insights",
          "Small Group",
        ],
      },
      metadata: {
        created_at: "2024-01-25T08:00:00Z",
        updated_at: "2024-02-03T12:45:00Z",
        created_by: "admin",
        source: "extranet",
      },
      tour_type: "cultural",
      tour_duration: "6 hours",
      group_size: "25",
      difficulty_level: "easy",
      languages: "English, Hindi",
    },
    {
      id: "sight_002",
      module: "sightseeing",
      title: "Dubai City Tour with Burj Khalifa",
      description:
        "Comprehensive Dubai city tour including Burj Khalifa observation deck and major attractions.",
      location: { city: "Dubai", country: "UAE", region: "Middle East" },
      pricing: { basePrice: 12000, currency: "INR", priceType: "per_person" },
      availability: {
        status: "active",
        capacity: 35,
        availableSlots: 21,
        startDate: "2024-03-01",
        endDate: "2024-12-31",
      },
      details: {
        duration: "8 hours",
        includes: [
          "Guide",
          "Transportation",
          "Burj Khalifa Tickets",
          "Dubai Mall Visit",
          "Lunch",
        ],
        excludes: ["Personal Shopping", "Additional Attractions", "Dinner"],
        highlights: [
          "Burj Khalifa 124th Floor",
          "Dubai Mall",
          "Dubai Fountain",
          "Gold Souk",
          "Modern Architecture",
        ],
      },
      metadata: {
        created_at: "2024-01-28T10:15:00Z",
        updated_at: "2024-02-01T15:30:00Z",
        created_by: "admin",
        source: "extranet",
      },
      tour_type: "city_tour",
      tour_duration: "8 hours",
      group_size: "35",
      difficulty_level: "easy",
      languages: "English, Arabic",
    },

    // Transfers
    {
      id: "transfer_001",
      module: "transfers",
      title: "Mumbai Airport to City - Luxury Sedan",
      description:
        "Comfortable luxury sedan transfer from Mumbai airport to city hotels with professional driver.",
      location: { city: "Mumbai", country: "India", region: "West India" },
      pricing: { basePrice: 2500, currency: "INR", priceType: "per_vehicle" },
      availability: {
        status: "active",
        capacity: 50,
        availableSlots: 32,
        startDate: "2024-03-01",
        endDate: "2024-12-31",
      },
      details: {
        includes: [
          "Professional Driver",
          "Fuel",
          "Tolls",
          "Airport Pickup",
          "60min Wait Time",
        ],
        excludes: ["Tips", "Additional Stops", "Excess Luggage Charges"],
        highlights: [
          "Luxury Vehicle",
          "Professional Driver",
          "24/7 Service",
          "Flight Tracking",
          "Meet & Greet",
        ],
      },
      metadata: {
        created_at: "2024-02-01T07:30:00Z",
        updated_at: "2024-02-08T14:15:00Z",
        created_by: "admin",
        source: "extranet",
      },
      vehicle_type: "luxury",
      pickup_location: "Mumbai Airport",
      drop_location: "City Hotels",
      journey_time: "45-60 minutes",
      vehicle_capacity: "4",
    },
    {
      id: "transfer_002",
      module: "transfers",
      title: "Dubai City Transfer - Premium SUV",
      description:
        "Spacious premium SUV for comfortable city transfers in Dubai with experienced local driver.",
      location: { city: "Dubai", country: "UAE", region: "Middle East" },
      pricing: { basePrice: 8000, currency: "INR", priceType: "per_vehicle" },
      availability: {
        status: "active",
        capacity: 30,
        availableSlots: 18,
        startDate: "2024-03-01",
        endDate: "2024-12-31",
      },
      details: {
        includes: [
          "Premium SUV",
          "Professional Driver",
          "Fuel",
          "Tolls",
          "Water Bottles",
        ],
        excludes: ["Tips", "Parking Fees", "Additional Waiting"],
        highlights: [
          "Premium SUV",
          "Local Expert Driver",
          "Climate Control",
          "Spacious Interior",
          "City Knowledge",
        ],
      },
      metadata: {
        created_at: "2024-02-03T09:45:00Z",
        updated_at: "2024-02-06T11:20:00Z",
        created_by: "admin",
        source: "extranet",
      },
      vehicle_type: "suv",
      pickup_location: "Any Dubai Location",
      drop_location: "Any Dubai Location",
      journey_time: "Variable",
      vehicle_capacity: "6",
    },

    // Packages
    {
      id: "package_001",
      module: "packages",
      title: "Golden Triangle Tour - 6 Days",
      description:
        "Classic India tour covering Delhi, Agra, and Jaipur with luxury accommodations and guided experiences.",
      location: { city: "Delhi", country: "India", region: "North India" },
      pricing: { basePrice: 45000, currency: "INR", priceType: "per_person" },
      availability: {
        status: "active",
        capacity: 20,
        availableSlots: 8,
        startDate: "2024-03-01",
        endDate: "2024-12-31",
      },
      details: {
        duration: "6 Days 5 Nights",
        includes: [
          "5-star Hotels",
          "All Meals",
          "Transportation",
          "Guide",
          "Entry Tickets",
          "Airport Transfers",
        ],
        excludes: [
          "International Flights",
          "Personal Expenses",
          "Tips",
          "Travel Insurance",
        ],
        highlights: [
          "Taj Mahal",
          "Red Fort",
          "Amber Fort",
          "City Palace",
          "Luxury Hotels",
          "Expert Guides",
        ],
      },
      metadata: {
        created_at: "2024-02-05T12:00:00Z",
        updated_at: "2024-02-09T16:45:00Z",
        created_by: "admin",
        source: "extranet",
      },
      package_category: "cultural",
      package_duration: "6 Days 5 Nights",
      package_inclusions: "Hotels, Meals, Transportation, Guide, Tickets",
    },
    {
      id: "package_002",
      module: "packages",
      title: "Dubai Luxury Experience - 4 Days",
      description:
        "Premium Dubai experience with luxury hotels, desert safari, and exclusive dining experiences.",
      location: { city: "Dubai", country: "UAE", region: "Middle East" },
      pricing: { basePrice: 85000, currency: "INR", priceType: "per_person" },
      availability: {
        status: "active",
        capacity: 15,
        availableSlots: 5,
        startDate: "2024-03-01",
        endDate: "2024-12-31",
      },
      details: {
        duration: "4 Days 3 Nights",
        includes: [
          "5-star Hotel",
          "Desert Safari",
          "Burj Khalifa",
          "Dubai Mall",
          "Fine Dining",
          "Transfers",
        ],
        excludes: [
          "International Flights",
          "Personal Shopping",
          "Spa Services",
          "Travel Insurance",
        ],
        highlights: [
          "Burj Al Arab View",
          "Desert Experience",
          "Luxury Shopping",
          "Fine Dining",
          "Premium Hotels",
        ],
      },
      metadata: {
        created_at: "2024-02-07T14:30:00Z",
        updated_at: "2024-02-10T10:15:00Z",
        created_by: "admin",
        source: "extranet",
      },
      package_category: "luxury",
      package_duration: "4 Days 3 Nights",
      package_inclusions: "Luxury Hotels, Safari, Attractions, Dining",
    },
  ],

  // Markup Rules for all modules
  markupRules: [
    // Flight Markup Rules
    {
      id: "markup_flight_001",
      module: "flights",
      name: "International Flight Premium",
      description: "Premium markup for international flight routes",
      ruleType: "percentage",
      value: 18,
      maxValue: 8000,
      conditions: { route: "international", cabinClass: ["Business", "First"] },
      priority: 1,
      isActive: true,
      appliesTo: "all",
      usage: { totalApplications: 234, revenue: 1876000, avgMarkup: 17.2 },
    },
    {
      id: "markup_flight_002",
      module: "flights",
      name: "Domestic Economy Base",
      description: "Standard markup for domestic economy flights",
      ruleType: "percentage",
      value: 12,
      maxValue: 3000,
      conditions: { route: "domestic", cabinClass: ["Economy"] },
      priority: 2,
      isActive: true,
      appliesTo: "all",
      usage: { totalApplications: 567, revenue: 2134000, avgMarkup: 11.8 },
    },

    // Hotel Markup Rules
    {
      id: "markup_hotel_001",
      module: "hotels",
      name: "Luxury Hotel Premium",
      description: "Premium markup for 5-star luxury properties",
      ruleType: "percentage",
      value: 22,
      maxValue: 12000,
      conditions: { starRating: "5", category: "luxury" },
      priority: 1,
      isActive: true,
      appliesTo: "all",
      usage: { totalApplications: 189, revenue: 2567000, avgMarkup: 20.5 },
    },
    {
      id: "markup_hotel_002",
      module: "hotels",
      name: "Business Hotel Standard",
      description: "Standard markup for business hotels",
      ruleType: "percentage",
      value: 15,
      maxValue: 5000,
      conditions: { starRating: ["3", "4"], category: "business" },
      priority: 2,
      isActive: true,
      appliesTo: "all",
      usage: { totalApplications: 345, revenue: 1789000, avgMarkup: 14.3 },
    },

    // Sightseeing Markup Rules
    {
      id: "markup_sight_001",
      module: "sightseeing",
      name: "Premium Experience Tours",
      description: "Premium markup for exclusive and luxury tour experiences",
      ruleType: "percentage",
      value: 25,
      maxValue: 3000,
      conditions: { tourType: ["luxury", "exclusive"], groupSize: { max: 15 } },
      priority: 1,
      isActive: true,
      appliesTo: "all",
      usage: { totalApplications: 156, revenue: 467000, avgMarkup: 23.8 },
    },
    {
      id: "markup_sight_002",
      module: "sightseeing",
      name: "Standard Group Tours",
      description: "Standard markup for regular group sightseeing tours",
      ruleType: "percentage",
      value: 15,
      maxValue: 1500,
      conditions: { tourType: ["group", "standard"] },
      priority: 2,
      isActive: true,
      appliesTo: "all",
      usage: { totalApplications: 289, revenue: 578000, avgMarkup: 14.2 },
    },

    // Transfer Markup Rules
    {
      id: "markup_transfer_001",
      module: "transfers",
      name: "Luxury Vehicle Premium",
      description: "Premium markup for luxury and premium vehicle transfers",
      ruleType: "percentage",
      value: 20,
      maxValue: 2000,
      conditions: { vehicleType: ["luxury", "premium"] },
      priority: 1,
      isActive: true,
      appliesTo: "all",
      usage: { totalApplications: 134, revenue: 267000, avgMarkup: 18.9 },
    },
    {
      id: "markup_transfer_002",
      module: "transfers",
      name: "Standard Transfer Base",
      description: "Base markup for standard transfer services",
      ruleType: "percentage",
      value: 12,
      maxValue: 800,
      conditions: { vehicleType: ["sedan", "suv"] },
      priority: 2,
      isActive: true,
      appliesTo: "all",
      usage: { totalApplications: 423, revenue: 456000, avgMarkup: 11.5 },
    },

    // Package Markup Rules
    {
      id: "markup_package_001",
      module: "packages",
      name: "Luxury Package Premium",
      description: "Premium markup for luxury holiday packages",
      ruleType: "percentage",
      value: 28,
      maxValue: 25000,
      conditions: { packageCategory: ["luxury"], priceRange: { min: 50000 } },
      priority: 1,
      isActive: true,
      appliesTo: "all",
      usage: { totalApplications: 78, revenue: 2184000, avgMarkup: 26.3 },
    },
    {
      id: "markup_package_002",
      module: "packages",
      name: "Standard Package Base",
      description: "Standard markup for regular holiday packages",
      ruleType: "percentage",
      value: 18,
      maxValue: 10000,
      conditions: { packageCategory: ["cultural", "adventure", "family"] },
      priority: 2,
      isActive: true,
      appliesTo: "all",
      usage: { totalApplications: 167, revenue: 1345000, avgMarkup: 17.1 },
    },
  ],

  // Statistics for dashboard
  dashboardStats: {
    overview: {
      totalBookings: 2847,
      totalRevenue: 14567000,
      activePromoCodes: 6,
      totalSavings: 1489500,
      averageOrderValue: 23400,
      conversionRate: 3.4,
    },
    moduleBreakdown: {
      flights: { bookings: 1245, revenue: 6234000, avgPrice: 28500 },
      hotels: { bookings: 896, revenue: 4567000, avgPrice: 15800 },
      packages: { bookings: 234, revenue: 2890000, avgPrice: 65400 },
      sightseeing: { bookings: 345, revenue: 567000, avgPrice: 4200 },
      transfers: { bookings: 127, revenue: 309000, avgPrice: 2800 },
    },
    recentActivity: [
      { type: "booking", module: "flight", amount: 32000, time: "5 min ago" },
      { type: "promo", code: "WELCOME10", used: true, time: "12 min ago" },
      { type: "booking", module: "hotel", amount: 18500, time: "18 min ago" },
      { type: "booking", module: "package", amount: 75000, time: "25 min ago" },
    ],
  },
};

// Function to save seed data to files for easy import
function generateSeedFiles() {
  const outputDir = path.join(__dirname, "../data/seed");

  // Create directory if it doesn't exist
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  // Save each data type to separate files
  Object.keys(seedData).forEach((dataType) => {
    const filePath = path.join(outputDir, `${dataType}.json`);
    fs.writeFileSync(filePath, JSON.stringify(seedData[dataType], null, 2));
    console.log(`Generated: ${filePath}`);
  });

  // Create combined file
  const combinedPath = path.join(outputDir, "complete-seed-data.json");
  fs.writeFileSync(combinedPath, JSON.stringify(seedData, null, 2));
  console.log(`Generated: ${combinedPath}`);

  console.log("\nâœ… Seed data files generated successfully!");
  console.log("Files created:");
  console.log(`- promoCodes.json (${seedData.promoCodes.length} promo codes)`);
  console.log(
    `- extranetInventory.json (${seedData.extranetInventory.length} inventory items)`,
  );
  console.log(
    `- markupRules.json (${seedData.markupRules.length} markup rules)`,
  );
  console.log("- dashboardStats.json (dashboard statistics)");
  console.log("- complete-seed-data.json (all data combined)");
}

// Function to populate in-memory data for APIs
function loadSeedData() {
  console.log("Loading seed data into application...");

  // This would be used by the API routes to populate their mock data
  return seedData;
}

// Export for use in other modules
module.exports = {
  seedData,
  generateSeedFiles,
  loadSeedData,
};

// Run if called directly
if (require.main === module) {
  console.log(
    "ðŸŒ± Generating comprehensive seed data for Faredown Admin Panel...\n",
  );
  generateSeedFiles();
}
