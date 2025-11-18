/**
 * TBO Hotel Certification Flow Runner
 *
 * Orchestrates the complete booking flow for certification testing:
 * 1. Search (GetHotelResult)
 * 2. Room Details (GetHotelRoom)
 * 3. Block Room (BlockRoom)
 * 4. Book Hotel (BookRoom)
 * 5. Generate Voucher (GenerateVoucher)
 * 6. Check Agency Balance (GetAgencyBalance)
 *
 * Returns all request/response pairs for certification submission
 */

const { authenticateTBO } = require("../tbo/auth");
const { searchHotels } = require("../tbo/search");
const { getHotelRoom } = require("../tbo/room");
const { blockRoom, bookHotel } = require("../tbo/book");
const { generateVoucher } = require("../tbo/voucher");
const { getAgencyBalance } = require("../tbo/balance");

/**
 * Build room guest configuration
 * Example: { adults: 2, children: 0, childAges: [] }
 */
function buildRoomGuests(roomConfig) {
  return {
    NoOfAdults: roomConfig.adults || 1,
    NoOfChild: roomConfig.children || 0,
    ChildAge: roomConfig.childAges || [],
  };
}

/**
 * Generate passenger data for a room
 * @param {number} startIndex - Index to start numbering passengers
 * @param {number} totalAdults - Total adults in room
 * @param {number} totalChildren - Total children in room
 * @returns {array} Array of passenger objects
 */
function generatePassengers(startIndex, totalAdults, totalChildren) {
  const passengers = [];

  // Generate adults
  for (let i = 0; i < totalAdults; i++) {
    const firstName = ["John", "Jane", "Michael", "Sarah"][i % 4];
    const lastName = ["Doe", "Smith", "Johnson", "Williams"][
      (startIndex + i) % 4
    ];

    passengers.push({
      Title: i === 0 ? "Mr" : "Mrs",
      FirstName: firstName,
      LastName: lastName,
      PaxType: 1, // Adult
      Age: 30 + i,
      PassportNo: `AB${1000000 + startIndex + i}`,
      PassportIssueDate: "2020-01-01",
      PassportExpDate: "2030-01-01",
      Email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}@test.com`,
      Phoneno: `+91987654${String(3210 + i).padStart(4, "0")}`,
      AddressLine1: "Test Address",
      City: "Mumbai",
      CountryCode: "IN",
      CountryName: "India",
      Nationality: "IN",
    });
  }

  // Generate children
  for (let i = 0; i < totalChildren; i++) {
    const childAge = 5 + (i % 5);
    passengers.push({
      Title: "Master",
      FirstName: `Child${i + 1}`,
      LastName: "Guest",
      PaxType: 2, // Child
      Age: childAge,
      PassportNo: `CD${1000000 + startIndex + i}`,
      PassportIssueDate: "2022-01-01",
      PassportExpDate: "2032-01-01",
      Email: `child${i + 1}@test.com`,
      Phoneno: `+91987654${String(5000 + i).padStart(4, "0")}`,
      AddressLine1: "Test Address",
      City: "Mumbai",
      CountryCode: "IN",
      CountryName: "India",
      Nationality: "IN",
    });
  }

  return passengers;
}

/**
 * Find cheapest hotel from search results
 * Returns: { hotel, resultIndex, hotelCode, traceId }
 */
function findCheapestHotel(searchResponse) {
  // Handle different response structures
  const hotelSearchResult = searchResponse?.HotelSearchResult;
  let hotels = Array.isArray(searchResponse?.hotels)
    ? searchResponse.hotels
    : Array.isArray(hotelSearchResult?.HotelResults)
      ? hotelSearchResult.HotelResults
      : Array.isArray(searchResponse?.HotelResults)
        ? searchResponse.HotelResults
        : [];

  console.log(`  Hotel Count (raw): ${hotels.length}`);

  if (!Array.isArray(hotels) || hotels.length === 0) {
    throw new Error("Search returned no hotels (HotelResults was empty)");
  }

  let cheapest = null;
  let resultIndex = -1;

  hotels.forEach((hotel, index) => {
    // Extract price - try multiple possible structures
    const price =
      hotel.Price?.OfferedPrice ||
      hotel.OfferedPrice ||
      hotel.Price?.PublishedPrice ||
      hotel.PublishedPrice ||
      hotel.MinPrice ||
      hotel.Price ||
      Infinity;

    const numPrice = typeof price === "number" ? price : parseFloat(price) || Infinity;

    if (!cheapest || numPrice < cheapest.minPrice) {
      cheapest = {
        hotel,
        minPrice: numPrice,
        resultIndex: index,
        hotelCode: hotel.HotelCode || hotel.hotelCode,
      };
      resultIndex = index;
    }
  });

  if (!cheapest) {
    throw new Error("No valid hotels found in search results");
  }

  return {
    hotel: cheapest.hotel,
    resultIndex: cheapest.resultIndex,
    hotelCode: cheapest.hotelCode,
    traceId: searchResponse?.traceId,
  };
}

/**
 * Find cheapest room from hotel room details
 * Returns: { room, roomIndex }
 */
function findCheapestRoom(roomResponse) {
  let rooms = roomResponse.HotelRoomsDetails || [];

  if (!Array.isArray(rooms) || rooms.length === 0) {
    throw new Error("No rooms found in room response");
  }

  let cheapest = null;
  let roomIndex = -1;

  rooms.forEach((room, index) => {
    const price = room.Price || room.RoomPrice || Infinity;
    if (!cheapest || price < cheapest.minPrice) {
      cheapest = {
        room,
        minPrice: price,
        roomIndex: index,
      };
      roomIndex = index;
    }
  });

  return {
    room: cheapest.room,
    roomIndex: cheapest.roomIndex,
  };
}

/**
 * Main flow runner - Executes complete booking flow
 *
 * @param {object} config - Test configuration
 * @returns {object} Object with all requests and responses
 */
async function runTboHotelFlow(config = {}) {
  const {
    destination = "Delhi",
    cityId = 10448,
    countryCode = "IN",
    checkInDate = "15/12/2025",
    checkOutDate = "16/12/2025",
    nationality = "IN",
    currency = "INR",
    roomConfigs = [{ adults: 1, children: 0 }], // Array of room configurations
    caseId = 1,
  } = config;

  console.log("\n" + "=".repeat(80));
  console.log(`TBO CERTIFICATION CASE #${caseId}: ${destination}`);
  console.log("=".repeat(80));
  console.log(`📅 Check-in: ${checkInDate}, Check-out: ${checkOutDate}`);
  console.log(`🏨 Destination: ${destination} (CityId: ${cityId})`);
  console.log(`🛏️  Rooms: ${roomConfigs.length}`);

  const results = {
    caseId,
    destination,
    cityId,
    countryCode,
    checkInDate,
    checkOutDate,
    roomConfigs,
    steps: {},
    errors: [],
  };

  try {
    // STEP 1: SEARCH HOTELS
    console.log("\n�� STEP 1: SEARCH HOTELS (GetHotelResult)");
    const searchReq = {
      destination,
      checkIn: checkInDate,
      checkOut: checkOutDate,
      countryCode,
      currency,
      guestNationality: nationality,
      rooms: roomConfigs.map((rc) => ({
        adults: rc.adults,
        children: rc.children,
        childAges: rc.childAges || [],
      })),
    };

    console.log(`  Params: CheckIn=${checkInDate}, CheckOut=${checkOutDate}`);

    const searchRes = await searchHotels(searchReq);
    results.steps.search = { request: searchReq, response: searchRes };

    const hotelCount = searchRes?.hotels?.length || 0;
    console.log(`✅ Found ${hotelCount} hotels`);

    if (hotelCount === 0) {
      throw new Error("Search returned no hotels");
    }

    // STEP 2: FIND CHEAPEST HOTEL & GET ROOM DETAILS
    console.log("\n📍 STEP 2: GET HOTEL ROOM DETAILS (GetHotelRoom)");
    const { hotel, resultIndex, hotelCode } = findCheapestHotel(searchRes);
    console.log(
      `✅ Selected cheapest hotel: ${hotelCode} (Index: ${resultIndex})`,
    );

    const roomReq = {
      traceId: searchRes.TraceId,
      resultIndex,
      hotelCode,
    };

    const roomRes = await getHotelRoom(roomReq);
    results.steps.room = { request: roomReq, response: roomRes };

    const roomCount = roomRes?.rooms?.length || roomRes?.HotelRoomsDetails?.length || 0;
    console.log(`✅ Got ${roomCount} room options`);

    if (roomCount === 0) {
      throw new Error("GetHotelRoom returned no room details");
    }

    // STEP 3: FIND CHEAPEST ROOM
    console.log("\n📍 STEP 3: SELECT CHEAPEST ROOM");
    const { room: selectedRoom, roomIndex } = findCheapestRoom(roomRes);
    console.log(`✅ Selected cheapest room (Index: ${roomIndex})`);

    // STEP 4: BLOCK ROOM
    console.log("\n📍 STEP 4: BLOCK ROOM (BlockRoom)");

    // Prepare hotelRoomDetails array for all rooms in this scenario
    const hotelRoomDetails = [];
    let passengerStartIndex = 0;

    for (const roomConfig of roomConfigs) {
      const passengers = generatePassengers(
        passengerStartIndex,
        roomConfig.adults,
        roomConfig.children,
      );
      passengerStartIndex += roomConfig.adults + roomConfig.children;

      hotelRoomDetails.push({
        RoomIndex: hotelRoomDetails.length,
        RoomId: selectedRoom.RoomId,
        CategoryId: selectedRoom.CategoryId,
        RoomName: selectedRoom.RoomName,
        Price: selectedRoom.Price,
        RoomPrice: selectedRoom.RoomPrice,
        SmokingPreference: selectedRoom.SmokingPreference,
        Guests: passengers,
      });
    }

    const blockReq = {
      traceId: searchRes.TraceId,
      resultIndex,
      hotelCode,
      hotelName: hotel.HotelName,
      guestNationality: nationality,
      noOfRooms: roomConfigs.length,
      hotelRoomDetails,
      isVoucherBooking: false,
    };

    const blockRes = await blockRoom(blockReq);
    results.steps.block = { request: blockReq, response: blockRes };
    console.log("✅ Room blocked successfully");

    // Validate BlockRoom response
    if (blockRes.ResponseStatus !== 1) {
      throw new Error(
        `BlockRoom failed: ${blockRes.Error?.ErrorMessage || "Unknown error"}`,
      );
    }

    // Extract CategoryId from block response for booking
    const categoryId = selectedRoom.CategoryId || blockRes.CategoryId;
    if (!categoryId) {
      throw new Error("CategoryId not found in block response");
    }

    // STEP 5: BOOK HOTEL
    console.log("\n📍 STEP 5: BOOK HOTEL (BookRoom)");

    const bookReq = {
      traceId: searchRes.TraceId,
      resultIndex,
      hotelCode,
      hotelName: hotel.HotelName,
      guestNationality: nationality,
      noOfRooms: roomConfigs.length,
      hotelRoomDetails,
      categoryId,
      isVoucherBooking: false,
    };

    const bookRes = await bookHotel(bookReq);
    results.steps.book = { request: bookReq, response: bookRes };

    if (bookRes.ResponseStatus !== 1) {
      throw new Error(
        `BookRoom failed: ${bookRes.Error?.ErrorMessage || "Unknown error"}`,
      );
    }

    const bookingId = bookRes.BookingId;
    const bookingRefNo = bookRes.BookingRefNo;
    const confirmationNo = bookRes.ConfirmationNo;

    console.log(`✅ Booking confirmed`);
    console.log(`   BookingId: ${bookingId}`);
    console.log(`   BookingRefNo: ${bookingRefNo}`);
    console.log(`   ConfirmationNo: ${confirmationNo}`);

    // STEP 6: GENERATE VOUCHER
    console.log("\n📍 STEP 6: GENERATE VOUCHER (GenerateVoucher)");

    const voucherReq = {
      bookingRefNo,
      bookingId,
    };

    const voucherRes = await generateVoucher(voucherReq);
    results.steps.voucher = { request: voucherReq, response: voucherRes };
    console.log(`✅ Voucher generated`);

    // STEP 7: CHECK AGENCY BALANCE
    console.log("\n📍 STEP 7: CHECK AGENCY BALANCE (GetAgencyBalance)");

    const creditReq = {};
    const creditRes = await getAgencyBalance();
    results.steps.credit = { request: creditReq, response: creditRes };
    console.log(
      `✅ Current Balance: ${creditRes.balance} ${creditRes.currency}`,
    );

    results.success = true;
    results.bookingDetails = {
      bookingId,
      bookingRefNo,
      confirmationNo,
      balance: creditRes.balance,
      currency: creditRes.currency,
    };

    console.log("\n" + "=".repeat(80));
    console.log("✅ CASE #" + caseId + " COMPLETED SUCCESSFULLY");
    console.log("=".repeat(80));
  } catch (error) {
    console.error("\n❌ ERROR:", error.message);
    results.success = false;
    results.error = error.message;
    results.errors.push({
      step: error.step || "unknown",
      message: error.message,
    });
  }

  return results;
}

module.exports = { runTboHotelFlow };
