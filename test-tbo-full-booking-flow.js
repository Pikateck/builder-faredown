#!/usr/bin/env node

/**
 * TBO Complete Hotel Booking Flow Test
 * 
 * This script demonstrates the full end-to-end TBO hotel booking pipeline:
 * 1. Authenticate → Get TokenId
 * 2. GetDestinationSearchStaticData → Get real CityId (DestinationId)
 * 3. SearchHotels → Get hotel results with TraceId
 * 4. GetHotelRoom → Get room details using TraceId + ResultIndex
 * 5. BlockRoom → Hold the room temporarily
 * 6. Book → Confirm the booking
 * 7. GenerateVoucher → Get booking voucher
 * 
 * All steps use the correct JSON API endpoints and TokenId authentication.
 */

require('dotenv').config({ path: 'api/.env', override: true });
require('dotenv').config({ override: true });

const fs = require('fs');
const path = require('path');

// Import TBO modules
const { authenticate } = require('./api/tbo/auth');
const { getCityId, searchCities } = require('./api/tbo/static');
const { searchHotels } = require('./api/tbo/search');
const { getHotelRoom } = require('./api/tbo/room');
const { blockRoom, bookHotel } = require('./api/tbo/book');
const { generateVoucher, getBookingDetails } = require('./api/tbo/voucher');

// Test parameters
const TEST_PARAMS = {
  destination: 'Dubai',
  countryCode: 'AE',
  checkInDate: '2025-06-15',
  checkOutDate: '2025-06-20',
  nationality: 'AE',
  adults: 2,
  children: 0,
  rooms: 1,
  // Passenger details for booking
  passengers: [
    {
      Title: 'Mr',
      FirstName: 'John',
      LastName: 'Doe',
      PaxType: 1, // Adult
      Age: 30,
      PassportNo: 'AB1234567',
      PassportIssueDate: '2020-01-01',
      PassportExpDate: '2030-01-01',
      Email: 'john.doe@test.com',
      Phoneno: '+971501234567',
      AddressLine1: 'Test Address',
      City: 'Dubai',
      CountryCode: 'AE',
      CountryName: 'United Arab Emirates',
      Nationality: 'AE',
    },
    {
      Title: 'Mrs',
      FirstName: 'Jane',
      LastName: 'Doe',
      PaxType: 1, // Adult
      Age: 28,
      PassportNo: 'AB7654321',
      PassportIssueDate: '2020-01-01',
      PassportExpDate: '2030-01-01',
      Email: 'jane.doe@test.com',
      Phoneno: '+971501234568',
      AddressLine1: 'Test Address',
      City: 'Dubai',
      CountryCode: 'AE',
      CountryName: 'United Arab Emirates',
      Nationality: 'AE',
    }
  ]
};

// Logging helper
function logStep(stepNumber, title, data = null) {
  console.log('\n' + '='.repeat(80));
  console.log(`STEP ${stepNumber}: ${title}`);
  console.log('='.repeat(80));
  if (data) {
    console.log(JSON.stringify(data, null, 2));
  }
}

function logSuccess(message) {
  console.log('\n✅ SUCCESS:', message);
}

function logError(message, error = null) {
  console.log('\n❌ ERROR:', message);
  if (error) {
    console.error(error);
  }
}

async function runCompleteFlow() {
  const results = {
    timestamp: new Date().toISOString(),
    testParams: TEST_PARAMS,
    steps: {}
  };

  try {
    // STEP 1: Authentication
    logStep(1, 'Authentication - Get TokenId');
    const authResult = await authenticate();
    
    if (!authResult.success || !authResult.tokenId) {
      logError('Authentication failed', authResult);
      results.steps.authentication = { success: false, error: authResult };
      return results;
    }
    
    const tokenId = authResult.tokenId;
    logSuccess(`TokenId obtained: ${tokenId}`);
    results.steps.authentication = {
      success: true,
      tokenId,
      endpoint: authResult.endpoint
    };

    // STEP 2: Get Static Data - Real CityId
    logStep(2, 'Get Static Data - Retrieve Real CityId for ' + TEST_PARAMS.destination);
    const cityId = await getCityId(TEST_PARAMS.destination, TEST_PARAMS.countryCode, tokenId);
    
    if (!cityId) {
      logError('Failed to retrieve CityId for ' + TEST_PARAMS.destination);
      results.steps.staticData = { success: false, error: 'No CityId found' };
      return results;
    }
    
    logSuccess(`Real CityId retrieved: ${cityId}`);
    results.steps.staticData = {
      success: true,
      destination: TEST_PARAMS.destination,
      cityId: Number(cityId),
      countryCode: TEST_PARAMS.countryCode
    };

    // STEP 3: Hotel Search
    logStep(3, 'Hotel Search - Search hotels with real CityId');
    const searchResult = await searchHotels({
      destination: TEST_PARAMS.destination,
      countryCode: TEST_PARAMS.countryCode,
      checkInDate: TEST_PARAMS.checkInDate,
      checkOutDate: TEST_PARAMS.checkOutDate,
      nationality: TEST_PARAMS.nationality,
      adults: TEST_PARAMS.adults,
      children: TEST_PARAMS.children,
      rooms: TEST_PARAMS.rooms,
      tokenId
    });

    if (!searchResult.success || !searchResult.data?.HotelSearchResult?.TraceId) {
      logError('Hotel search failed', searchResult);
      results.steps.hotelSearch = { success: false, error: searchResult };
      return results;
    }

    const traceId = searchResult.data.HotelSearchResult.TraceId;
    const hotels = searchResult.data.HotelSearchResult.HotelResults || [];
    
    logSuccess(`Hotel search successful. TraceId: ${traceId}, Hotels found: ${hotels.length}`);
    
    if (hotels.length === 0) {
      logError('No hotels found in search results');
      results.steps.hotelSearch = { success: false, error: 'No hotels found' };
      return results;
    }

    // Select first hotel for testing
    const selectedHotel = hotels[0];
    const resultIndex = selectedHotel.ResultIndex;
    const hotelCode = selectedHotel.HotelCode;

    results.steps.hotelSearch = {
      success: true,
      traceId,
      totalHotels: hotels.length,
      selectedHotel: {
        name: selectedHotel.HotelName,
        code: hotelCode,
        resultIndex,
        price: selectedHotel.Price
      },
      endpoint: searchResult.endpoint
    };

    console.log('\nSelected Hotel:', {
      name: selectedHotel.HotelName,
      code: hotelCode,
      resultIndex,
      price: selectedHotel.Price
    });

    // STEP 4: Get Hotel Room Details
    logStep(4, 'Get Hotel Room Details');
    const roomResult = await getHotelRoom({
      tokenId,
      traceId,
      resultIndex,
      hotelCode
    });

    if (!roomResult.success || !roomResult.data?.GetHotelRoomResult) {
      logError('Failed to get room details', roomResult);
      results.steps.roomDetails = { success: false, error: roomResult };
      return results;
    }

    const roomDetails = roomResult.data.GetHotelRoomResult;
    const hotelRoomsDetails = roomDetails.HotelRoomsDetails || [];
    
    logSuccess(`Room details retrieved. Available rooms: ${hotelRoomsDetails.length}`);
    
    if (hotelRoomsDetails.length === 0) {
      logError('No rooms available');
      results.steps.roomDetails = { success: false, error: 'No rooms available' };
      return results;
    }

    // Select first room
    const selectedRoom = hotelRoomsDetails[0];
    
    results.steps.roomDetails = {
      success: true,
      totalRooms: hotelRoomsDetails.length,
      selectedRoom: {
        roomTypeName: selectedRoom.RoomTypeName,
        roomTypeCode: selectedRoom.RoomTypeCode,
        price: selectedRoom.Price,
        cancellationPolicy: selectedRoom.CancellationPolicy
      },
      endpoint: roomResult.endpoint
    };

    console.log('\nSelected Room:', {
      name: selectedRoom.RoomTypeName,
      code: selectedRoom.RoomTypeCode,
      price: selectedRoom.Price
    });

    // STEP 5: Block Room
    logStep(5, 'Block Room - Hold room temporarily');
    const blockResult = await blockRoom({
      tokenId,
      traceId,
      resultIndex,
      hotelCode,
      hotelName: selectedHotel.HotelName,
      guestNationality: TEST_PARAMS.nationality,
      noOfRooms: TEST_PARAMS.rooms,
      clientReferenceNo: `TEST-${Date.now()}`,
      isVoucherBooking: true,
      hotelRoomsDetails: [selectedRoom]
    });

    if (!blockResult.success || !blockResult.data?.BlockRoomResult) {
      logError('Failed to block room', blockResult);
      results.steps.blockRoom = { success: false, error: blockResult };
      return results;
    }

    const blockRoomResult = blockResult.data.BlockRoomResult;
    
    logSuccess(`Room blocked successfully. Status: ${blockRoomResult.ResponseStatus}`);
    
    results.steps.blockRoom = {
      success: true,
      status: blockRoomResult.ResponseStatus,
      isPriceChanged: blockRoomResult.IsPriceChanged,
      isPolicyChanged: blockRoomResult.IsPolicyChanged,
      endpoint: blockResult.endpoint
    };

    // STEP 6: Book Hotel
    logStep(6, 'Book Hotel - Confirm booking');
    const bookResult = await bookHotel({
      tokenId,
      traceId,
      resultIndex,
      hotelCode,
      hotelName: selectedHotel.HotelName,
      guestNationality: TEST_PARAMS.nationality,
      noOfRooms: TEST_PARAMS.rooms,
      clientReferenceNo: `TEST-${Date.now()}`,
      isVoucherBooking: true,
      passengers: TEST_PARAMS.passengers,
      hotelRoomsDetails: [selectedRoom]
    });

    if (!bookResult.success || !bookResult.data?.BookResult) {
      logError('Failed to book hotel', bookResult);
      results.steps.booking = { success: false, error: bookResult };
      return results;
    }

    const bookingResult = bookResult.data.BookResult;
    const bookingId = bookingResult.BookingId;
    const confirmationNo = bookingResult.ConfirmationNo;
    
    logSuccess(`Hotel booked successfully. BookingId: ${bookingId}, ConfirmationNo: ${confirmationNo}`);
    
    results.steps.booking = {
      success: true,
      bookingId,
      confirmationNo,
      status: bookingResult.ResponseStatus,
      invoiceNumber: bookingResult.InvoiceNumber,
      endpoint: bookResult.endpoint
    };

    // STEP 7: Generate Voucher
    logStep(7, 'Generate Voucher');
    const voucherResult = await generateVoucher({
      tokenId,
      bookingId,
      bookingRefNo: confirmationNo
    });

    if (!voucherResult.success || !voucherResult.data?.GenerateVoucherResult) {
      logError('Failed to generate voucher', voucherResult);
      results.steps.voucher = { success: false, error: voucherResult };
      return results;
    }

    const voucherData = voucherResult.data.GenerateVoucherResult;
    const voucherUrl = voucherData.VoucherURL;
    
    logSuccess(`Voucher generated successfully. URL: ${voucherUrl}`);
    
    results.steps.voucher = {
      success: true,
      voucherUrl,
      status: voucherData.ResponseStatus,
      endpoint: voucherResult.endpoint
    };

    // OPTIONAL: Get Booking Details
    logStep(8, 'Get Booking Details (Optional Verification)');
    const bookingDetailsResult = await getBookingDetails({
      tokenId,
      bookingId,
      bookingRefNo: confirmationNo
    });

    if (bookingDetailsResult.success && bookingDetailsResult.data?.GetBookingDetailResult) {
      const bookingDetails = bookingDetailsResult.data.GetBookingDetailResult;
      logSuccess('Booking details retrieved successfully');
      
      results.steps.bookingDetails = {
        success: true,
        status: bookingDetails.ResponseStatus,
        bookingStatus: bookingDetails.BookingStatus,
        endpoint: bookingDetailsResult.endpoint
      };
    }

    // Final summary
    console.log('\n' + '='.repeat(80));
    console.log('COMPLETE BOOKING FLOW SUMMARY');
    console.log('='.repeat(80));
    console.log('\n✅ All steps completed successfully!\n');
    console.log('Flow Summary:');
    console.log('1. ✅ Authentication');
    console.log('2. ✅ Static Data (Real CityId)');
    console.log('3. ✅ Hotel Search');
    console.log('4. ✅ Room Details');
    console.log('5. ✅ Block Room');
    console.log('6. ✅ Book Hotel');
    console.log('7. ✅ Generate Voucher');
    console.log('8. ✅ Booking Details (Verification)');
    console.log('\nBooking Information:');
    console.log(`  - BookingId: ${bookingId}`);
    console.log(`  - ConfirmationNo: ${confirmationNo}`);
    console.log(`  - Voucher URL: ${voucherUrl}`);
    console.log(`  - Hotel: ${selectedHotel.HotelName}`);
    console.log(`  - Room: ${selectedRoom.RoomTypeName}`);
    console.log(`  - Check-in: ${TEST_PARAMS.checkInDate}`);
    console.log(`  - Check-out: ${TEST_PARAMS.checkOutDate}`);

    results.overallSuccess = true;

  } catch (error) {
    logError('Unexpected error during flow execution', error);
    results.overallSuccess = false;
    results.error = {
      message: error.message,
      stack: error.stack
    };
  }

  // Save results to file
  const resultsFile = path.join(__dirname, 'tbo-full-booking-flow-results.json');
  fs.writeFileSync(resultsFile, JSON.stringify(results, null, 2));
  console.log(`\n📄 Results saved to: ${resultsFile}`);

  return results;
}

// Run the test
if (require.main === module) {
  console.log('Starting TBO Complete Hotel Booking Flow Test...');
  console.log('Test Parameters:', TEST_PARAMS);
  
  runCompleteFlow()
    .then(results => {
      if (results.overallSuccess) {
        console.log('\n🎉 COMPLETE BOOKING FLOW TEST PASSED! 🎉\n');
        process.exit(0);
      } else {
        console.log('\n⚠️  BOOKING FLOW TEST FAILED ⚠️\n');
        process.exit(1);
      }
    })
    .catch(error => {
      console.error('\n💥 FATAL ERROR:', error);
      process.exit(1);
    });
}

module.exports = { runCompleteFlow };
