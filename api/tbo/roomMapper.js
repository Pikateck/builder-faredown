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

  // ✅ CRITICAL: Price must be a single OBJECT (not array) for BlockRoom
  // TBO's BlockRoom expects the exact same structure as GetHotelRoom returns
  let priceObject = {};
  if (
    typeof room.Price === "object" &&
    room.Price !== null &&
    !Array.isArray(room.Price)
  ) {
    // If Price is already a single object, use it directly (1:1 mapping from GetHotelRoom)
    priceObject = room.Price;
  } else if (Array.isArray(room.Price) && room.Price.length > 0) {
    // If Price is an array (from older responses), extract the first element
    priceObject = room.Price[0];
  } else {
    // Build Price object from individual room fields
    priceObject = {
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
    };
  }

  return {
    // MANDATORY: Index of the room (1-based, not 0-based)
    RoomIndex: roomIndex + 1,

    // ✅ MANDATORY: Category ID (required by BlockRoom API - from GetHotelRoom response)
    // ⚠️  DO NOT default to empty string - TBO requires actual CategoryId value
    CategoryId:
      room.CategoryId || room.CategoryCode || room.RoomCategoryId || undefined,

    // OPTIONAL: Room status and availability fields (from GetHotelRoom)
    AvailabilityType: room.AvailabilityType || "Confirm",
    RoomStatus: room.RoomStatus !== undefined ? room.RoomStatus : 0,
    RoomId: room.RoomId !== undefined ? room.RoomId : 0,
    ChildCount: room.ChildCount !== undefined ? room.ChildCount : 0,
    IsTransferIncluded:
      room.IsTransferIncluded !== undefined ? room.IsTransferIncluded : false,
    RequireAllPaxDetails:
      room.RequireAllPaxDetails !== undefined
        ? room.RequireAllPaxDetails
        : false,

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
    RatePlan: room.RatePlan || "",

    // MANDATORY: Room type identifier
    RoomTypeCode: room.RoomTypeCode || "",

    // MANDATORY: Room type description
    RoomTypeName: room.RoomTypeName || room.RoomName || "",
    RoomDescription: room.RoomDescription || "",

    // OPTIONAL: Bed type information
    BedTypes: room.BedTypes || [],

    // ✅ MANDATORY: Smoking preference (INTEGER - 0=NoPreference, 1=Smoking, 2=NonSmoking, 3=Either)
    SmokingPreference: smokingPref,

    // MANDATORY: Supplements list (can be empty array)
    Supplements: room.Supplements || room.SupplementList || [],

    // OPTIONAL: Additional fields from GetHotelRoom response
    InfoSource: room.InfoSource || "",
    SequenceNo: room.SequenceNo || "",
    IsPerStay: room.IsPerStay !== undefined ? room.IsPerStay : false,
    DayRates: Array.isArray(room.DayRates) ? room.DayRates : [],
    Amenities: Array.isArray(room.Amenities) ? room.Amenities : [],
    LastCancellationDate: room.LastCancellationDate || "",
    CancellationPolicies: Array.isArray(room.CancellationPolicies)
      ? room.CancellationPolicies
      : [],
    LastVoucherDate: room.LastVoucherDate || "",
    CancellationPolicy: room.CancellationPolicy || "",
    IsPassportMandatory:
      room.IsPassportMandatory !== undefined ? room.IsPassportMandatory : false,
    IsPANMandatory:
      room.IsPANMandatory !== undefined ? room.IsPANMandatory : false,

    // ✅ MANDATORY: Price details as OBJECT (not array) - matches TBO GetHotelRoom structure
    Price: priceObject,
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

  // CategoryId validation: only warn if it appears to be a de-dupe context
  // (de-dupe context is detected at flow-runner level, here we just warn)
  if (!room.CategoryId) {
    // Log warning but DO NOT push to errors array - CategoryId is only required for de-dupe flows
    // Normal flows (non-de-dupe) should not send CategoryId at all per TBO docs
    console.warn(
      "⚠️ BlockRoom called without CategoryId. " +
        "This is normal for non-de-dupe flows. " +
        "If this is a de-dupe result, TBO may reject the request.",
      { roomIndex: room.RoomIndex },
    );
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

  // ✅ Price MUST be an OBJECT (not array) - matches TBO GetHotelRoom structure
  if (
    typeof room.Price !== "object" ||
    room.Price === null ||
    Array.isArray(room.Price)
  ) {
    errors.push("Price must be an object (not array)");
  } else {
    // Validate price fields
    if (!room.Price.CurrencyCode) {
      errors.push("Price.CurrencyCode is required");
    }
    if (room.Price.RoomPrice === undefined) {
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
