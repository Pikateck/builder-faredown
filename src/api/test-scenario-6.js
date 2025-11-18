#!/usr/bin/env node
const axios = require('axios');
require('dotenv').config({ path: './src/api/.env' });

const API_BASE = process.env.API_BASE_URL || 'http://localhost:3000/api';

async function testScenario6() {
  console.log('\n' + '='.repeat(80));
  console.log('SCENARIO 6: International Booking (1 Room, 2 Adults + 2 Children)');
  console.log('Destination: Paris | Dates: 2026-01-08 to 2026-01-10 | Nationality: GB');
  console.log('='.repeat(80));

  try {
    console.log('\n[Step 1/4] Searching for hotels...');
    const searchRes = await axios.post(`${API_BASE}/tbo/search`, {
      destination: 'Paris',
      cityId: 3,
      countryCode: 'FR',
      checkIn: '2026-01-08',
      checkOut: '2026-01-10',
      rooms: [{ adults: 2, children: 2, childAges: [7, 11] }],
      currency: 'EUR',
      guestNationality: 'GB'
    }, { timeout: 30000 });

    if (!searchRes.data.success) throw new Error('Search failed: ' + searchRes.data.error);
    const hotel = searchRes.data.hotels[0];
    const traceId = searchRes.data.traceId;
    console.log(`✅ Found ${searchRes.data.hotels.length} hotels | Hotel: ${hotel.hotelName}`);

    console.log('\n[Step 2/4] Getting room details...');
    const roomRes = await axios.post(`${API_BASE}/tbo/room`, {
      traceId,
      resultIndex: hotel.resultIndex,
      hotelCode: hotel.hotelCode,
      hotelName: hotel.hotelName,
      checkInDate: '2026-01-08',
      checkOutDate: '2026-01-10',
      noOfRooms: 1
    }, { timeout: 30000 });

    if (!roomRes.data.success) throw new Error('Room details failed: ' + roomRes.data.error);
    console.log(`✅ Room details retrieved`);

    console.log('\n[Step 3/4] Blocking room...');
    const blockRes = await axios.post(`${API_BASE}/tbo/block`, {
      traceId,
      resultIndex: hotel.resultIndex,
      hotelCode: hotel.hotelCode,
      hotelName: hotel.hotelName,
      guestNationality: 'GB',
      noOfRooms: 1,
      isVoucherBooking: true,
      hotelRoomDetails: roomRes.data.hotelRoomDetails
    }, { timeout: 30000 });

    if (!blockRes.data.success) throw new Error('Block failed: ' + blockRes.data.error);
    const bookingId = blockRes.data.bookingId;
    console.log(`✅ Room blocked (Paris) | Booking ID: ${bookingId}`);

    console.log('\n[Step 4/4] Booking hotel...');
    const bookRes = await axios.post(`${API_BASE}/tbo/book`, {
      traceId,
      resultIndex: hotel.resultIndex,
      hotelCode: hotel.hotelCode,
      hotelName: hotel.hotelName,
      bookingId,
      guestNationality: 'GB',
      noOfRooms: 1,
      isVoucherBooking: true,
      hotelRoomDetails: blockRes.data.hotelRoomDetails,
      hotelPassenger: [
        {
          Title: 'Mr',
          FirstName: 'James',
          LastName: 'Wilson',
          PaxType: 1,
          Nationality: 'GB',
          Email: 'james.wilson@example.co.uk',
          Phoneno: '+442071838750'
        },
        {
          Title: 'Mrs',
          FirstName: 'Sarah',
          LastName: 'Wilson',
          PaxType: 1,
          Nationality: 'GB',
          Email: 'sarah.wilson@example.co.uk',
          Phoneno: '+442071838750'
        },
        {
          Title: 'Master',
          FirstName: 'Oliver',
          LastName: 'Wilson',
          PaxType: 2,
          Age: 7,
          Nationality: 'GB',
          Email: 'james.wilson@example.co.uk',
          Phoneno: '+442071838750'
        },
        {
          Title: 'Miss',
          FirstName: 'Emma',
          LastName: 'Wilson',
          PaxType: 2,
          Age: 11,
          Nationality: 'GB',
          Email: 'james.wilson@example.co.uk',
          Phoneno: '+442071838750'
        }
      ]
    }, { timeout: 30000 });

    if (!bookRes.data.success) throw new Error('Book failed: ' + bookRes.data.error);
    console.log(`✅ Hotel booked successfully!`);
    console.log(`   Confirmation #: ${bookRes.data.confirmationNo}`);

    console.log('\n✅ SCENARIO 6 PASSED\n');
    return { scenario: 6, status: 'PASSED', confirmationNo: bookRes.data.confirmationNo };

  } catch (error) {
    console.error('\n❌ SCENARIO 6 FAILED');
    console.error('Error:', error.response?.data || error.message);
    return { scenario: 6, status: 'FAILED', error: error.message };
  }
}

testScenario6().then(result => {
  console.log('='.repeat(80));
  console.log(JSON.stringify(result, null, 2));
  process.exit(result.status === 'PASSED' ? 0 : 1);
});
