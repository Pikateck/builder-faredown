#!/usr/bin/env node

/**
 * TBO Booking Chain End-to-End Test
 * Tests: Search → Room Details → Block → Book → Voucher
 * 
 * Usage:
 *   node api/scripts/test-tbo-booking-chain.js [--destination=Mumbai] [--dry-run]
 * 
 * Exit codes:
 *   0 = All tests passed
 *   1 = Test failed
 */

const axios = require('axios');
const { v4: uuidv4 } = require('uuid');

const API_BASE = process.env.API_BASE_URL || 'http://localhost:3001/api';
const DESTINATION = process.argv.includes('--destination=Mumbai') ? 'Mumbai' : 'Dubai';
const DRY_RUN = process.argv.includes('--dry-run');

// Test data
const testData = {
  search: {
    cityId: DESTINATION === 'Mumbai' ? 'MUM' : 'DXB',
    destination: DESTINATION,
    cityName: DESTINATION,
    countryCode: DESTINATION === 'Mumbai' ? 'IN' : 'AE',
    checkIn: '2025-12-21',
    checkOut: '2025-12-22',
    rooms: '1',
    adults: '2',
    children: '0',
    currency: 'INR',
  },
  guestDetails: [
    {
      Title: 'Mr',
      FirstName: 'John',
      LastName: 'Doe',
      PaxType: 1,
      Age: 30,
      Email: 'john.doe@example.com',
      Phoneno: '+971501234567',
      AddressLine1: '123 Test Street',
      City: 'Dubai',
      CountryCode: 'AE',
      CountryName: 'United Arab Emirates',
      Nationality: 'IN',
    },
    {
      Title: 'Ms',
      FirstName: 'Jane',
      LastName: 'Doe',
      PaxType: 1,
      Age: 28,
      Email: 'jane.doe@example.com',
      Phoneno: '+971501234568',
      AddressLine1: '123 Test Street',
      City: 'Dubai',
      CountryCode: 'AE',
      CountryName: 'United Arab Emirates',
      Nationality: 'IN',
    },
  ],
};

let testResults = {
  search: null,
  prebook: null,
  block: null,
  book: null,
  errors: [],
};

/**
 * Test Step 1: Search Hotels
 */
async function testSearch() {
  console.log('\n' + '='.repeat(80));
  console.log('STEP 1: SEARCH Hotels');
  console.log('='.repeat(80));
  
  try {
    console.log(`📡 POST ${API_BASE}/hotels/search`);
    console.log(`📍 Destination: ${testData.search.destination}`);
    
    if (DRY_RUN) {
      console.log('🔍 [DRY RUN] Skipping search');
      return;
    }

    const response = await axios.post(`${API_BASE}/hotels/search`, testData.search, {
      timeout: 60000,
    });

    const { hotels, searchId, session } = response.data;
    console.log(`✅ Search successful:`);
    console.log(`   Hotels found: ${hotels.length}`);
    console.log(`   Search ID: ${searchId}`);
    console.log(`   Session TTL: ${session.sessionTtlSeconds}s`);

    if (hotels.length === 0) {
      throw new Error('No hotels found in search results');
    }

    testResults.search = {
      searchHash: response.data.traceId, // Use traceId as identifier
      hotelId: hotels[0].hotelId,
      hotelName: hotels[0].name,
      hotels,
      session,
    };

    console.log(`\n✅ SEARCH PASSED`);
    return testResults.search;
  } catch (error) {
    const msg = `❌ SEARCH FAILED: ${error.message}`;
    console.error(msg);
    testResults.errors.push({ step: 'search', error: msg });
    throw error;
  }
}

/**
 * Test Step 2: PreBook (Get Room Details)
 */
async function testPrebook(searchData) {
  console.log('\n' + '='.repeat(80));
  console.log('STEP 2: PREBOOK (Get Room Details)');
  console.log('='.repeat(80));

  try {
    const payload = {
      searchHash: searchData.searchHash,
      hotelId: searchData.hotelId,
      checkIn: testData.search.checkIn,
      checkOut: testData.search.checkOut,
      roomConfig: { rooms: 1 },
    };

    console.log(`📡 POST ${API_BASE}/hotels/prebook`);
    console.log(`🏨 Hotel: ${searchData.hotelName}`);

    if (DRY_RUN) {
      console.log('🔍 [DRY RUN] Skipping prebook');
      return;
    }

    const response = await axios.post(`${API_BASE}/hotels/prebook`, payload, {
      timeout: 30000,
    });

    const { rooms, traceId } = response.data;
    console.log(`✅ PreBook successful:`);
    console.log(`   Rooms available: ${rooms.length}`);
    console.log(`   First room: ${rooms[0].roomName}`);
    console.log(`   Price: ${rooms[0].price.offered} ${rooms[0].price.currency}`);
    console.log(`   Trace ID: ${traceId.substring(0, 8)}...`);

    if (rooms.length === 0) {
      throw new Error('No rooms available');
    }

    testResults.prebook = {
      traceId,
      roomId: rooms[0].roomId,
      roomName: rooms[0].roomName,
      rooms,
      hotelRoomDetails: rooms[0], // This would contain full details from TBO
    };

    console.log(`\n✅ PREBOOK PASSED`);
    return testResults.prebook;
  } catch (error) {
    const msg = `❌ PREBOOK FAILED: ${error.message}`;
    console.error(msg);
    testResults.errors.push({ step: 'prebook', error: msg });
    throw error;
  }
}

/**
 * Test Step 3: Block Room
 */
async function testBlock(searchData, prebookData) {
  console.log('\n' + '='.repeat(80));
  console.log('STEP 3: BLOCK ROOM');
  console.log('='.repeat(80));

  try {
    const payload = {
      searchHash: searchData.searchHash,
      hotelId: searchData.hotelId,
      roomId: prebookData.roomId,
      hotelRoomDetails: [prebookData.hotelRoomDetails],
    };

    console.log(`📡 POST ${API_BASE}/hotels/block`);
    console.log(`🔒 Room: ${prebookData.roomName}`);

    if (DRY_RUN) {
      console.log('🔍 [DRY RUN] Skipping block');
      return;
    }

    const response = await axios.post(`${API_BASE}/hotels/block`, payload, {
      timeout: 30000,
    });

    const { isPriceChanged, isPolicyChanged, traceId, warningMessage } = response.data;
    console.log(`✅ Block successful:`);
    console.log(`   Availability: Confirmed`);
    console.log(`   Price changed: ${isPriceChanged ? '⚠️ YES' : '✅ No'}`);
    console.log(`   Policy changed: ${isPolicyChanged ? '⚠️ YES' : '✅ No'}`);
    if (warningMessage) {
      console.log(`   ⚠️ Warning: ${warningMessage}`);
    }
    console.log(`   Trace ID: ${traceId.substring(0, 8)}...`);

    testResults.block = {
      traceId,
      isPriceChanged,
      isPolicyChanged,
      roomDetails: response.data.roomDetails,
    };

    console.log(`\n✅ BLOCK PASSED`);
    return testResults.block;
  } catch (error) {
    const msg = `❌ BLOCK FAILED: ${error.message}`;
    console.error(msg);
    testResults.errors.push({ step: 'block', error: msg });
    throw error;
  }
}

/**
 * Test Step 4: Book Hotel
 */
async function testBook(searchData, prebookData, blockData) {
  console.log('\n' + '='.repeat(80));
  console.log('STEP 4: BOOK HOTEL');
  console.log('='.repeat(80));

  try {
    const payload = {
      searchHash: searchData.searchHash,
      hotelId: searchData.hotelId,
      roomId: prebookData.roomId,
      hotelRoomDetails: blockData.roomDetails || [prebookData.hotelRoomDetails],
      guestDetails: testData.guestDetails,
      contactEmail: testData.guestDetails[0].Email,
      contactPhone: testData.guestDetails[0].Phoneno,
    };

    console.log(`📡 POST ${API_BASE}/hotels/book`);
    console.log(`📖 Guest: ${testData.guestDetails[0].FirstName} ${testData.guestDetails[0].LastName}`);

    if (DRY_RUN) {
      console.log('🔍 [DRY RUN] Skipping book');
      return;
    }

    const response = await axios.post(`${API_BASE}/hotels/book`, payload, {
      timeout: 30000,
    });

    const {
      bookingReference,
      hotelConfirmationNo,
      bookingStatus,
      bookingDetails,
      traceId,
    } = response.data;

    console.log(`✅ Book successful:`);
    console.log(`   Booking Reference: ${bookingReference}`);
    console.log(`   Hotel Confirmation: ${hotelConfirmationNo}`);
    console.log(`   Status: ${bookingStatus}`);
    console.log(`   Hotel: ${bookingDetails.hotelName}`);
    console.log(`   Total Price: ${bookingDetails.totalPrice} ${bookingDetails.currency}`);
    console.log(`   Trace ID: ${traceId.substring(0, 8)}...`);

    testResults.book = {
      traceId,
      bookingReference,
      hotelConfirmationNo,
      bookingStatus,
      bookingDetails,
    };

    console.log(`\n✅ BOOK PASSED`);
    return testResults.book;
  } catch (error) {
    const msg = `❌ BOOK FAILED: ${error.message}`;
    console.error(msg);
    testResults.errors.push({ step: 'book', error: msg });
    throw error;
  }
}

/**
 * Main test runner
 */
async function runTests() {
  console.log('\n');
  console.log('█'.repeat(80));
  console.log('TBO BOOKING CHAIN END-TO-END TEST');
  console.log('█'.repeat(80));
  console.log(`API Base: ${API_BASE}`);
  console.log(`Destination: ${DESTINATION}`);
  console.log(`Dry Run: ${DRY_RUN ? 'YES' : 'NO'}`);
  console.log(`Start Time: ${new Date().toISOString()}`);

  try {
    // Step 1: Search
    const searchData = await testSearch();
    if (!searchData) return process.exit(1);

    // Step 2: PreBook
    const prebookData = await testPrebook(searchData);
    if (!prebookData) return process.exit(1);

    // Step 3: Block
    const blockData = await testBlock(searchData, prebookData);
    if (!blockData) return process.exit(1);

    // Step 4: Book
    const bookData = await testBook(searchData, prebookData, blockData);
    if (!bookData) return process.exit(1);

    // Summary
    console.log('\n' + '='.repeat(80));
    console.log('TEST SUMMARY');
    console.log('='.repeat(80));
    console.log(`✅ All tests PASSED`);
    console.log(`\nBooking Chain Completed:`);
    console.log(`  1. Search: ${searchData.hotels.length} hotels found`);
    console.log(`  2. PreBook: ${prebookData.rooms.length} rooms available`);
    console.log(`  3. Block: Price=${blockData.isPriceChanged ? '⚠️ Changed' : '✅ Stable'}`);
    console.log(`  4. Book: ${bookData.bookingReference}`);
    console.log(`\nBooking Details:`);
    console.log(`  Confirmation: ${bookData.hotelConfirmationNo}`);
    console.log(`  Total: ${bookData.bookingDetails.totalPrice} ${bookData.bookingDetails.currency}`);
    console.log(`  Check-in: ${bookData.bookingDetails.checkIn}`);
    console.log(`  Check-out: ${bookData.bookingDetails.checkOut}`);
    console.log(`\nTrace IDs (for debugging):`);
    console.log(`  Search: ${testResults.search.searchHash.substring(0, 16)}...`);
    console.log(`  PreBook: ${prebookData.traceId.substring(0, 16)}...`);
    console.log(`  Block: ${blockData.traceId.substring(0, 16)}...`);
    console.log(`  Book: ${bookData.traceId.substring(0, 16)}...`);

    process.exit(0);
  } catch (error) {
    console.error('\n❌ TEST CHAIN FAILED');
    console.error(`\nErrors encountered:`);
    testResults.errors.forEach((err) => {
      console.error(`  - ${err.step}: ${err.error}`);
    });
    process.exit(1);
  }
}

// Run tests
runTests().catch((error) => {
  console.error('Fatal error:', error.message);
  process.exit(1);
});
