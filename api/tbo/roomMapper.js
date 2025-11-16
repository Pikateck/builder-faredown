/**
 * Room Details Mapper for TBO BlockRoom API
 *
 * Transforms room details from GetHotelRoom response format
 * to BlockRoom request format with all required fields
 */

/**
 * Map a single room from GetHotelRoom to BlockRoom format
 *
 * @param {Object} room - Room object from GetHotelRoom response
 * @param {number} roomIndex - Index of the room in the array
 * @returns {Object} Mapped room object for BlockRoom API
 */
function mapRoomForBlockRequest(room, roomIndex = 0) {
  if (!room) {
    throw new Error("Room object is required");
  }

  return {
    // MANDATORY: Index of the room
    RoomIndex: roomIndex,

    // MANDATORY: Rate plan code - might have different field names in TBO response
    RatePlanCode:
      room.RatePlanCode ||
      room.PlanCode ||
      room.OfferCode ||
      room.RateCode ||
      room.PromoCode ||
      "",

    // OPTIONAL: Rate plan name
    RatePlanName: room.RatePlanName || room.PlanName || "",

    // MANDATORY: Room type identifier
    RoomTypeCode: room.RoomTypeCode || "",

    // MANDATORY: Room type description
    RoomTypeName: room.RoomTypeName || room.RoomName || "",

    // OPTIONAL: Bed type information
    BedTypes: room.BedTypes || [],

    // MANDATORY: Smoking preference (0=NoPreference, 1=Smoking, 2=NonSmoking, 3=Either)
    SmokingPreference: room.SmokingPreference ?? 0,

    // MANDATORY: Supplements list (can be empty array)
    Supplements: room.Supplements || room.SupplementList || [],

    // MANDATORY: Price details array
    Price: room.Price || [
      {
        CurrencyCode: room.CurrencyCode || "INR",
        RoomPrice: room.RoomPrice || 0,
        Tax: room.Tax || 0,
        ExtraGuestCharge: room.ExtraGuestCharge || 0,
        ChildCharge: room.ChildCharge || 0,
        OtherCharges: room.OtherCharges || 0,
        Discount: room.Discount || 0,
        PublishedPrice: room.PublishedPrice || room.RoomPrice || 0,
        PublishedPriceRoundedOff: room.PublishedPriceRoundedOff || 0,
        OfferedPrice: room.OfferedPrice || room.RoomPrice || 0,
        OfferedPriceRoundedOff: room.OfferedPriceRoundedOff || 0,
        AgentCommission: room.AgentCommission || 0,
        AgentMarkUp: room.AgentMarkUp || 0,
        TDS: room.TDS || 0,
      },
    ],
  };
}

/**
 * Map multiple rooms for BlockRoom request
 *
 * @param {Array} rooms - Array of room objects from GetHotelRoom
 * @returns {Array} Array of mapped room objects
 */
function mapRoomsForBlockRequest(rooms) {
  if (!Array.isArray(rooms)) {
    throw new Error("Rooms must be an array");
  }

  return rooms.map((room, index) => mapRoomForBlockRequest(room, index));
}

/**
 * Validate room object has required fields for BlockRoom API
 *
 * @param {Object} room - Room object to validate
 * @returns {Object} Validation result with success boolean and errors array
 */
function validateRoomForBlockRequest(room) {
  const errors = [];

  // Check mandatory fields
  if (room.RoomIndex === undefined) {
    errors.push("RoomIndex is required");
  }

  if (!room.RoomTypeCode) {
    errors.push("RoomTypeCode is required");
  }

  if (!room.RoomTypeName) {
    errors.push("RoomTypeName is required");
  }

  if (room.SmokingPreference === undefined) {
    errors.push("SmokingPreference is required");
  }

  if (!Array.isArray(room.Supplements)) {
    errors.push("Supplements must be an array");
  }

  if (!Array.isArray(room.Price) || room.Price.length === 0) {
    errors.push("Price must be a non-empty array");
  } else {
    // Validate price fields
    const price = room.Price[0];
    if (!price.CurrencyCode) {
      errors.push("Price.CurrencyCode is required");
    }
    if (price.RoomPrice === undefined) {
      errors.push("Price.RoomPrice is required");
    }
  }

  return {
    success: errors.length === 0,
    errors: errors,
  };
}

module.exports = {
  mapRoomForBlockRequest,
  mapRoomsForBlockRequest,
  validateRoomForBlockRequest,
};
