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

  // ✅ CRITICAL: Convert SmokingPreference string to integer
  let smokingPref = room.SmokingPreference ?? 0;
  if (typeof smokingPref === "string") {
    const smokingMap = {
      nopreference: 0,
      smoking: 1,
      nonsmoking: 2,
      either: 3,
    };
    smokingPref = smokingMap[smokingPref.toLowerCase()] ?? 0;
  }

  // ✅ CRITICAL: Ensure Price is an ARRAY, not object
  let priceArray = [];
  if (Array.isArray(room.Price)) {
    // If Price is already an array, use it
    priceArray = room.Price;
  } else if (typeof room.Price === "object" && room.Price !== null) {
    // If Price is an object, convert to array
    priceArray = [room.Price];
  } else {
    // Create from individual price fields
    priceArray = [
      {
        CurrencyCode: room.CurrencyCode || "INR",
        RoomPrice: room.RoomPrice || 0,
        Tax: room.Tax || 0,
        ExtraGuestCharge: room.ExtraGuestCharge || 0,
        ChildCharge: room.ChildCharge || 0,
        OtherCharges: room.OtherCharges || 0,
        Discount: room.Discount || 0,
        PublishedPrice: room.PublishedPrice || room.RoomPrice || 0,
        PublishedPriceRoundedOff: Math.round(
          room.PublishedPriceRoundedOff || room.PublishedPrice || 0,
        ),
        OfferedPrice: room.OfferedPrice || room.RoomPrice || 0,
        OfferedPriceRoundedOff: Math.round(
          room.OfferedPriceRoundedOff || room.OfferedPrice || 0,
        ),
        AgentCommission: room.AgentCommission || 0,
        AgentMarkUp: room.AgentMarkUp || 0,
        TDS: room.TDS || 0,
      },
    ];
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

    // ✅ MANDATORY: Smoking preference (INTEGER - 0=NoPreference, 1=Smoking, 2=NonSmoking, 3=Either)
    SmokingPreference: smokingPref,

    // MANDATORY: Supplements list (can be empty array)
    Supplements: room.Supplements || room.SupplementList || [],

    // ✅ MANDATORY: Price details ARRAY (not object)
    Price: priceArray,
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

  // ✅ SmokingPreference must be an INTEGER (0-3)
  if (room.SmokingPreference === undefined) {
    errors.push("SmokingPreference is required");
  } else if (typeof room.SmokingPreference !== "number") {
    errors.push(
      `SmokingPreference must be integer (0-3), got ${typeof room.SmokingPreference}`,
    );
  } else if (![0, 1, 2, 3].includes(room.SmokingPreference)) {
    errors.push(`SmokingPreference must be 0-3, got ${room.SmokingPreference}`);
  }

  if (!Array.isArray(room.Supplements)) {
    errors.push("Supplements must be an array");
  }

  // ✅ Price MUST be an ARRAY (not object)
  if (!Array.isArray(room.Price)) {
    errors.push("Price must be an array (not object)");
  } else if (room.Price.length === 0) {
    errors.push("Price array must not be empty");
  } else {
    // Validate price fields
    const price = room.Price[0];
    if (!price.CurrencyCode) {
      errors.push("Price[0].CurrencyCode is required");
    }
    if (price.RoomPrice === undefined) {
      errors.push("Price[0].RoomPrice is required");
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
