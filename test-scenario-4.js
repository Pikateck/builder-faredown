#!/usr/bin/env node
const axios = require('axios');
require('dotenv').config();
const API_BASE = process.env.API_BASE_URL || 'http://localhost:3000/api';

async function testScenario4() {
  console.log('\n' + '='.repeat(80));
  console.log('SCENARIO 4: Domestic (Mumbai, 2 Rooms Mixed: 1A+2C + 2A)');
  console.log('='.repeat(80));
  try {
    const searchRes = await axios.post(`${API_BASE}/tbo/search`, {
      destination: 'Mumbai', cityId: 10449, countryCode: 'IN', checkIn: '2025-12-29', checkOut: '2025-12-31',
      rooms: [{ adults: 1, children: 2, childAges: [6, 10] }, { adults: 2, children: 0, childAges: [] }],
      currency: 'INR', guestNationality: 'IN'
    }, { timeout: 30000 });
    if (!searchRes.data.success) throw new Error('Search failed');
    const hotel = searchRes.data.hotels[0];
    const roomRes = await axios.post(`${API_BASE}/tbo/room`, {
      traceId: searchRes.data.traceId, resultIndex: hotel.resultIndex, hotelCode: hotel.hotelCode, hotelName: hotel.hotelName,
      checkInDate: '2025-12-29', checkOutDate: '2025-12-31', noOfRooms: 2
    }, { timeout: 30000 });
    if (!roomRes.data.success) throw new Error('Room failed');
    const blockRes = await axios.post(`${API_BASE}/tbo/block`, {
      traceId: searchRes.data.traceId, resultIndex: hotel.resultIndex, hotelCode: hotel.hotelCode, hotelName: hotel.hotelName,
      guestNationality: 'IN', noOfRooms: 2, isVoucherBooking: true, hotelRoomDetails: roomRes.data.hotelRoomDetails
    }, { timeout: 30000 });
    if (!blockRes.data.success) throw new Error('Block failed');
    const bookRes = await axios.post(`${API_BASE}/tbo/book`, {
      traceId: searchRes.data.traceId, resultIndex: hotel.resultIndex, hotelCode: hotel.hotelCode, hotelName: hotel.hotelName,
      bookingId: blockRes.data.bookingId, guestNationality: 'IN', noOfRooms: 2, isVoucherBooking: true,
      hotelRoomDetails: blockRes.data.hotelRoomDetails,
      hotelPassenger: [
        { Title: 'Mr', FirstName: 'Suresh', LastName: 'Verma', PaxType: 1, Nationality: 'IN', Email: 'suresh@example.com', Phoneno: '+919876543214' },
        { Title: 'Master', FirstName: 'Aman', LastName: 'Verma', PaxType: 2, Age: 6, Nationality: 'IN', Email: 'suresh@example.com', Phoneno: '+919876543214' },
        { Title: 'Miss', FirstName: 'Ananya', LastName: 'Verma', PaxType: 2, Age: 10, Nationality: 'IN', Email: 'suresh@example.com', Phoneno: '+919876543214' },
        { Title: 'Mr', FirstName: 'Anil', LastName: 'Gupta', PaxType: 1, Nationality: 'IN', Email: 'anil@example.com', Phoneno: '+919876543215' },
        { Title: 'Mrs', FirstName: 'Sunita', LastName: 'Gupta', PaxType: 1, Nationality: 'IN', Email: 'sunita@example.com', Phoneno: '+919876543216' }
      ]
    }, { timeout: 30000 });
    if (!bookRes.data.success) throw new Error('Book failed');
    console.log(`✅ PASSED | Confirmation: ${bookRes.data.confirmationNo}`);
    return { scenario: 4, status: 'PASSED', confirmationNo: bookRes.data.confirmationNo };
  } catch (error) {
    console.error(`❌ FAILED: ${error.message}`);
    return { scenario: 4, status: 'FAILED', error: error.message };
  }
}
testScenario4().then(r => { console.log('='.repeat(80)); console.log(JSON.stringify(r, null, 2)); process.exit(r.status === 'PASSED' ? 0 : 1); });
