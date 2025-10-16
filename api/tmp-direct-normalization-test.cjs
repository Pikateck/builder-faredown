const HotelNormalizer = require("./services/normalization/hotelNormalizer");
const HotelDedupAndMergeUnified = require("./services/merging/hotelDedupAndMergeUnified");

// Sample RateHawk hotel response
const sampleHotel = {
  id: 12345,
  name: "Millennium Place Barsha Heights Hotel",
  region: { id: 6053839, name: "Dubai" },
  address: "Building 12, Barsha Heights, Dubai Marina",
  location: {
    coordinates: {
      lat: 25.088,
      lon: 55.144,
    },
  },
  star_rating: 4,
  review_score: 4.3,
  review_count: 285,
  chain_code: "MIL",
  brand_code: "MILLENNIUM",
  giata_id: "12345",
  image_url: "https://example.com/hotel.jpg",
  rates: [
    {
      id: "rate_001",
      room_name: "Deluxe Room",
      meal: "RO",
      board_basis: "RO",
      bed_type: "1 Double Bed",
      book_hash: "hash_001",
      free_cancellation: true,
      price: {
        total: 367,
        base: 300,
        taxes: 67,
        per_night: 122.33,
      },
      currency: "USD",
      payment_options: {
        payment_types: [
          {
            amount: 367,
            currency_code: "USD",
          },
        ],
        cancellation_penalties: [],
      },
    },
    {
      id: "rate_002",
      room_name: "Suite Room",
      meal: "BB",
      board_basis: "BB",
      bed_type: "1 King Bed",
      book_hash: "hash_002",
      free_cancellation: false,
      price: {
        total: 524,
        base: 450,
        taxes: 74,
        per_night: 174.67,
      },
      currency: "USD",
      payment_options: {
        payment_types: [
          {
            amount: 524,
            currency_code: "USD",
          },
        ],
        cancellation_penalties: [{ amount: 100 }],
      },
    },
  ],
};

(async () => {
  try {
    console.log("\n=== DIRECT NORMALIZATION TEST ===\n");

    console.log("1️⃣  Testing hotel normalization...\n");
    const normalizedHotel = HotelNormalizer.normalizeRateHawkHotel(
      sampleHotel,
      "RATEHAWK",
    );

    console.log("Normalized hotel master data:");
    console.log(JSON.stringify(normalizedHotel.hotelMasterData, null, 2));

    console.log("\nNormalized supplier map data:");
    console.log(JSON.stringify(normalizedHotel.supplierMapData, null, 2));

    console.log("\n2️⃣  Testing room offer normalization...\n");
    const searchContext = {
      checkin: "2026-01-12",
      checkout: "2026-01-15",
      adults: 2,
      children: 0,
      currency: "AED",
    };

    const normalizedOffers = sampleHotel.rates.map((rate) =>
      HotelNormalizer.normalizeRateHawkRoomOffer(
        rate,
        normalizedHotel.hotelMasterData.property_id,
        "RATEHAWK",
        searchContext,
      ),
    );

    console.log(`Normalized ${normalizedOffers.length} room offers:`);
    normalizedOffers.forEach((offer, idx) => {
      console.log(
        `\n  ${idx + 1}. ${offer.room_name} | ${offer.board_basis} | ${offer.currency} ${offer.price_total}`,
      );
      console.log(
        `     Refundable: ${offer.refundable} | Free Cancel: ${offer.free_cancellation}`,
      );
    });

    console.log("\n3️⃣  Testing merge into unified tables...\n");

    // Add denormalized fields
    normalizedOffers.forEach((offer) => {
      offer.supplier_hotel_id = sampleHotel.id;
      offer.hotel_name = sampleHotel.name;
      offer.city = sampleHotel.region.name;
    });

    const mergeResult = await HotelDedupAndMergeUnified.mergeNormalizedResults(
      [normalizedHotel.hotelMasterData],
      normalizedOffers,
      "RATEHAWK",
    );

    console.log("Merge result:");
    console.log(JSON.stringify(mergeResult, null, 2));

    console.log("\n✅ DIRECT TEST COMPLETE\n");
    process.exitCode = 0;
  } catch (error) {
    console.error("\n❌ ERROR:");
    console.error(error);
    process.exitCode = 1;
  } finally {
    setTimeout(() => process.exit(), 300);
  }
})();
