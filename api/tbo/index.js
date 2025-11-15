/**
 * TBO Hotel API - Complete Module
 *
 * All methods tested and verified end-to-end
 * Uses TokenId-based authentication throughout
 *
 * Flow:
 * 1. Authenticate → Get TokenId
 * 2. GetDestinationSearchStaticData → Get CityId (DestinationId)
 * 3. Search Hotels → Get TraceId + Hotel List
 * 4. Get Room Details → Get Room Options
 * 5. Block Room (PreBook) → Validate Pricing
 * 6. Book → Confirm Reservation
 * 7. Generate Voucher → Get Booking Document
 */

const { authenticateTBO } = require("./auth");
const {
  getDestinationSearchStaticData,
  getCityId,
  searchCities,
} = require("./static");
const { searchHotels, formatDateForTBO } = require("./search");
const { getHotelRoom } = require("./room");
const { blockRoom, bookHotel } = require("./book");
const { generateVoucher, getBookingDetails } = require("./voucher");

module.exports = {
  // Authentication
  authenticateTBO,

  // Static Data (City Lookup)
  getDestinationSearchStaticData,
  getCityId,
  searchCities,

  // Hotel Search
  searchHotels,
  formatDateForTBO,

  // Room Details
  getHotelRoom,

  // Booking
  blockRoom,
  bookHotel,

  // Voucher
  generateVoucher,
  getBookingDetails,

  // Cancel/Change Request (newly implemented)
  sendChangeRequest: require("./cancel").sendChangeRequest,
  getChangeRequestStatus: require("./cancel").getChangeRequestStatus,
  cancelHotelBooking: require("./cancel").cancelHotelBooking,
};
