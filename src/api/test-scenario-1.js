#!/usr/bin/env node
const axios = require('axios');
require('dotenv').config();

const API_BASE = process.env.API_BASE_URL || 'http://localhost:3000/api';

async function testScenario1() {
  console.log('\n' + '='.repeat(80));
  console.log('SCENARIO 1: Domestic Booking (1 Room, 1 Adult)');
  console.log('Destination: Mumbai | Dates: 2025-12-20 to 2025-12-22 | Nationality: IN');
  console.log('='.repeat(80));

  try {
    console.log('\n[Step 1/4] Searching for hotels...');
    const searchRes = await axios.post(`${API_BASE}/tbo/search`, {
      destination: 'Mumbai',
      cityId: 10449,
      countryCode: 'IN',
      checkIn: '2025-12-20',
      checkOut: '2025-12-22',
      rooms: [{ adults: 1, children: 0, childAges: [] }],
      currency: 'INR',
      guestNationality: 'IN'
    }, { timeout: 30000 });

    if (!searchRes.data.success) throw new Error('Search failed: ' + searchRes.data.error);
    const hotel = searchRes.data.hotels[0];
    const traceId = searchRes.data.traceId;
    console.log(`✅ Found ${searchRes.data.hotels.length} hotels | Hotel: ${hotel.hotelName} | Price: ${hotel.price?.offeredPrice} ${hotel.price?.currencyCode}`);

    console.log('\n[Step 2/4] Getting room details...');
    const roomRes = await axios.post(`${API_BASE}/tbo/room`, {
      traceId,
      resultIndex: hotel.resultIndex,
      hotelCode: hotel.hotelCode,
      hotelName: hotel.hotelName,
      checkInDate: '2025-12-20',
      checkOutDate: '2025-12-22',
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
      guestNationality: 'IN',
      noOfRooms: 1,
      isVoucherBooking: true,
      hotelRoomDetails: roomRes.data.hotelRoomDetails
    }, { timeout: 30000 });

    if (!blockRes.data.success) throw new Error('Block failed: ' + blockRes.data.error);
    const bookingId = blockRes.data.bookingId;
    console.log(`✅ Room blocked | Booking ID: ${bookingId}`);
    if (blockRes.data.isPriceChanged) console.log(`   ⚠️  Price changed: ${blockRes.data.hotelRoomDetails[0].price?.offeredPrice}`);

    console.log('\n[Step 4/4] Booking hotel...');
    const bookRes = await axios.post(`${API_BASE}/tbo/book`, {
      traceId,
      resultIndex: hotel.resultIndex,
      hotelCode: hotel.hotelCode,
      hotelName: hotel.hotelName,
      bookingId,
      guestNationality: 'IN',
      noOfRooms: 1,
      isVoucherBooking: true,
      hotelRoomDetails: blockRes.data.hotelRoomDetails,
      hotelPassenger: [{
        Title: 'Mr',
        FirstName: 'Rajesh',
        LastName: 'Kumar',
        PaxType: 1,
        Nationality: 'IN',
        Email: 'rajesh@example.com',
        Phoneno: '+919876543210'
      }]
    }, { timeout: 30000 });

    if (!bookRes.data.success) throw new Error('Book failed: ' + bookRes.data.error);
    console.log(`✅ Hotel booked successfully!`);
    console.log(`   Confirmation #: ${bookRes.data.confirmationNo}`);
    console.log(`   Booking Ref: ${bookRes.data.bookingRefNo}`);

    console.log('\n✅ SCENARIO 1 PASSED\n');
    return { scenario: 1, status: 'PASSED', confirmationNo: bookRes.data.confirmationNo };

  } catch (error) {
    console.error('\n❌ SCENARIO 1 FAILED');
    console.error('Error:', error.response?.data || error.message);
    return { scenario: 1, status: 'FAILED', error: error.message };
  }
}

testScenario1().then(result => {
  console.log('='.repeat(80));
  console.log(JSON.stringify(result, null, 2));
  process.exit(result.status === 'PASSED' ? 0 : 1);
});
