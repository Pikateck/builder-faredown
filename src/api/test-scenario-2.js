#!/usr/bin/env node
const axios = require('axios');
require('dotenv').config();

const API_BASE = process.env.API_BASE_URL || 'http://localhost:3000/api';

async function testScenario2() {
  console.log('\n' + '='.repeat(80));
  console.log('SCENARIO 2: Domestic (1 Room, 2 Adults + 2 Children)');
  console.log('Destination: Mumbai | Dates: 2025-12-23 to 2025-12-25 | Nationality: IN');
  console.log('='.repeat(80));

  try {
    console.log('\n[Step 1/4] Searching for hotels...');
    const searchRes = await axios.post(`${API_BASE}/tbo/search`, {
      destination: 'Mumbai',
      cityId: 10449,
      countryCode: 'IN',
      checkIn: '2025-12-23',
      checkOut: '2025-12-25',
      rooms: [{ adults: 2, children: 2, childAges: [8, 12] }],
      currency: 'INR',
      guestNationality: 'IN'
    }, { timeout: 30000 });

    if (!searchRes.data.success) throw new Error('Search failed');
    const hotel = searchRes.data.hotels[0];
    const traceId = searchRes.data.traceId;
    console.log(`✅ Found ${searchRes.data.hotels.length} hotels`);

    console.log('\n[Step 2/4] Getting room details...');
    const roomRes = await axios.post(`${API_BASE}/tbo/room`, {
      traceId, resultIndex: hotel.resultIndex, hotelCode: hotel.hotelCode,
      hotelName: hotel.hotelName, checkInDate: '2025-12-23', checkOutDate: '2025-12-25', noOfRooms: 1
    }, { timeout: 30000 });

    if (!roomRes.data.success) throw new Error('Room details failed');
    console.log(`✅ Room details retrieved`);

    console.log('\n[Step 3/4] Blocking room...');
    const blockRes = await axios.post(`${API_BASE}/tbo/block`, {
      traceId, resultIndex: hotel.resultIndex, hotelCode: hotel.hotelCode, hotelName: hotel.hotelName,
      guestNationality: 'IN', noOfRooms: 1, isVoucherBooking: true, hotelRoomDetails: roomRes.data.hotelRoomDetails
    }, { timeout: 30000 });

    if (!blockRes.data.success) throw new Error('Block failed');
    console.log(`✅ Room blocked | Booking ID: ${blockRes.data.bookingId}`);

    console.log('\n[Step 4/4] Booking hotel...');
    const bookRes = await axios.post(`${API_BASE}/tbo/book`, {
      traceId, resultIndex: hotel.resultIndex, hotelCode: hotel.hotelCode, hotelName: hotel.hotelName,
      bookingId: blockRes.data.bookingId, guestNationality: 'IN', noOfRooms: 1,
      isVoucherBooking: true, hotelRoomDetails: blockRes.data.hotelRoomDetails,
      hotelPassenger: [
        { Title: 'Mr', FirstName: 'Amit', LastName: 'Singh', PaxType: 1, Nationality: 'IN', Email: 'amit@example.com', Phoneno: '+919876543211' },
        { Title: 'Mrs', FirstName: 'Priya', LastName: 'Singh', PaxType: 1, Nationality: 'IN', Email: 'priya@example.com', Phoneno: '+919876543211' },
        { Title: 'Master', FirstName: 'Arjun', LastName: 'Singh', PaxType: 2, Age: 8, Nationality: 'IN', Email: 'amit@example.com', Phoneno: '+919876543211' },
        { Title: 'Miss', FirstName: 'Aisha', LastName: 'Singh', PaxType: 2, Age: 12, Nationality: 'IN', Email: 'amit@example.com', Phoneno: '+919876543211' }
      ]
    }, { timeout: 30000 });

    if (!bookRes.data.success) throw new Error('Book failed');
    console.log(`✅ Booked! Confirmation: ${bookRes.data.confirmationNo}`);
    console.log('\n✅ SCENARIO 2 PASSED\n');
    return { scenario: 2, status: 'PASSED', confirmationNo: bookRes.data.confirmationNo };
  } catch (error) {
    console.error('\n❌ SCENARIO 2 FAILED:', error.response?.data || error.message);
    return { scenario: 2, status: 'FAILED', error: error.message };
  }
}

testScenario2().then(result => {
  console.log('='.repeat(80));
  console.log(JSON.stringify(result, null, 2));
  process.exit(result.status === 'PASSED' ? 0 : 1);
});
