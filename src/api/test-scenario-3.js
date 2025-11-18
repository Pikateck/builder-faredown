#!/usr/bin/env node
const axios = require('axios');
require('dotenv').config({ path: './src/api/.env' });

const API_BASE = process.env.API_BASE_URL || 'http://localhost:3000/api';

async function testScenario3() {
  console.log('\n' + '='.repeat(80));
  console.log('SCENARIO 3: Domestic Booking (2 Rooms, 1 Adult each)');
  console.log('Destination: Mumbai | Dates: 2025-12-26 to 2025-12-28 | Nationality: IN');
  console.log('='.repeat(80));

  try {
    console.log('\n[Step 1/4] Searching for hotels...');
    const searchRes = await axios.post(`${API_BASE}/tbo/search`, {
      destination: 'Mumbai',
      cityId: 10449,
      countryCode: 'IN',
      checkIn: '2025-12-26',
      checkOut: '2025-12-28',
      rooms: [
        { adults: 1, children: 0, childAges: [] },
        { adults: 1, children: 0, childAges: [] }
      ],
      currency: 'INR',
      guestNationality: 'IN'
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
      checkInDate: '2025-12-26',
      checkOutDate: '2025-12-28',
      noOfRooms: 2
    }, { timeout: 30000 });

    if (!roomRes.data.success) throw new Error('Room details failed: ' + roomRes.data.error);
    console.log(`✅ Room details retrieved for 2 rooms`);

    console.log('\n[Step 3/4] Blocking rooms...');
    const blockRes = await axios.post(`${API_BASE}/tbo/block`, {
      traceId,
      resultIndex: hotel.resultIndex,
      hotelCode: hotel.hotelCode,
      hotelName: hotel.hotelName,
      guestNationality: 'IN',
      noOfRooms: 2,
      isVoucherBooking: true,
      hotelRoomDetails: roomRes.data.hotelRoomDetails
    }, { timeout: 30000 });

    if (!blockRes.data.success) throw new Error('Block failed: ' + blockRes.data.error);
    const bookingId = blockRes.data.bookingId;
    console.log(`✅ Rooms blocked | Booking ID: ${bookingId}`);

    console.log('\n[Step 4/4] Booking hotel...');
    const bookRes = await axios.post(`${API_BASE}/tbo/book`, {
      traceId,
      resultIndex: hotel.resultIndex,
      hotelCode: hotel.hotelCode,
      hotelName: hotel.hotelName,
      bookingId,
      guestNationality: 'IN',
      noOfRooms: 2,
      isVoucherBooking: true,
      hotelRoomDetails: blockRes.data.hotelRoomDetails,
      hotelPassenger: [
        {
          Title: 'Mr',
          FirstName: 'Vikram',
          LastName: 'Patel',
          PaxType: 1,
          Nationality: 'IN',
          Email: 'vikram@example.com',
          Phoneno: '+919876543212'
        },
        {
          Title: 'Mr',
          FirstName: 'Rohan',
          LastName: 'Sharma',
          PaxType: 1,
          Nationality: 'IN',
          Email: 'rohan@example.com',
          Phoneno: '+919876543213'
        }
      ]
    }, { timeout: 30000 });

    if (!bookRes.data.success) throw new Error('Book failed: ' + bookRes.data.error);
    console.log(`✅ Hotel booked successfully!`);
    console.log(`   Confirmation #: ${bookRes.data.confirmationNo}`);

    console.log('\n✅ SCENARIO 3 PASSED\n');
    return { scenario: 3, status: 'PASSED', confirmationNo: bookRes.data.confirmationNo };

  } catch (error) {
    console.error('\n❌ SCENARIO 3 FAILED');
    console.error('Error:', error.response?.data || error.message);
    return { scenario: 3, status: 'FAILED', error: error.message };
  }
}

testScenario3().then(result => {
  console.log('='.repeat(80));
  console.log(JSON.stringify(result, null, 2));
  process.exit(result.status === 'PASSED' ? 0 : 1);
});
