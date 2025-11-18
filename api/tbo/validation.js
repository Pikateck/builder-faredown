/**
 * TBO Hotel API Validation Module
 *
 * Comprehensive validation for all TBO Hotel API requests
 * Includes: PAN, Passport, Nationality, Pricing, Dates, Passengers, etc.
 *
 * Usage:
 * const { validatePassenger, validatePAN, validatePrice, validateRoomConfig } = require("./validation");
 * validatePassenger(passengerObj);
 * validatePAN("AAAAA0000A");
 */

// =====================================================================
// NATIONALITY VALIDATION
// =====================================================================

/**
 * List of TBO-supported nationalities (ISO 2-letter codes)
 * This should be maintained and synced with TBO's master list
 */
const TBO_SUPPORTED_NATIONALITIES = {
  IN: "India",
  US: "United States",
  GB: "United Kingdom",
  CA: "Canada",
  AU: "Australia",
  NZ: "New Zealand",
  SG: "Singapore",
  MY: "Malaysia",
  TH: "Thailand",
  ID: "Indonesia",
  PH: "Philippines",
  VN: "Vietnam",
  AE: "United Arab Emirates",
  SA: "Saudi Arabia",
  KW: "Kuwait",
  QA: "Qatar",
  BH: "Bahrain",
  OM: "Oman",
  JO: "Jordan",
  EG: "Egypt",
  FR: "France",
  DE: "Germany",
  IT: "Italy",
  ES: "Spain",
  NL: "Netherlands",
  BE: "Belgium",
  CH: "Switzerland",
  AT: "Austria",
  SE: "Sweden",
  NO: "Norway",
  DK: "Denmark",
  FI: "Finland",
  PL: "Poland",
  CZ: "Czechia",
  IE: "Ireland",
  PT: "Portugal",
  GR: "Greece",
  TR: "Turkey",
  IL: "Israel",
  RU: "Russian Federation",
  CN: "China",
  JP: "Japan",
  KR: "South Korea",
  HK: "Hong Kong",
  TW: "Taiwan",
  MX: "Mexico",
  BR: "Brazil",
  AR: "Argentina",
  CO: "Colombia",
  CL: "Chile",
  PE: "Peru",
  ZA: "South Africa",
  NG: "Nigeria",
  KE: "Kenya",
};

/**
 * Validate nationality code
 * @param {string} nationalityCode - ISO 2-letter code (e.g., "IN", "US")
 * @returns {object} { valid: boolean, error: string | null }
 */
function validateNationality(nationalityCode) {
  if (!nationalityCode) {
    return { valid: false, error: "Nationality code is required" };
  }

  const normalized = String(nationalityCode).toUpperCase().trim();

  if (!/^[A-Z]{2}$/.test(normalized)) {
    return {
      valid: false,
      error: `Invalid nationality format: "${nationalityCode}". Expected ISO 2-letter code.`,
    };
  }

  if (!TBO_SUPPORTED_NATIONALITIES[normalized]) {
    return {
      valid: false,
      error: `Nationality "${normalized}" not supported by TBO. See supported list.`,
    };
  }

  return { valid: true };
}

// =====================================================================
// PAN (PERMANENT ACCOUNT NUMBER) VALIDATION
// =====================================================================

/**
 * Validate Indian PAN format
 * Format: AAAAA9999A (5 letters + 4 digits + 1 letter, uppercase)
 * Example: AAAPK1234A
 *
 * @param {string} pan - PAN string
 * @returns {object} { valid: boolean, error: string | null }
 */
function validatePAN(pan) {
  if (!pan) {
    return { valid: false, error: "PAN is required when IsPANMandatory=true" };
  }

  const normalizedPAN = String(pan).toUpperCase().trim();

  // PAN regex: 5 letters, 4 digits, 1 letter
  if (!/^[A-Z]{5}[0-9]{4}[A-Z]$/.test(normalizedPAN)) {
    return {
      valid: false,
      error: `Invalid PAN format: "${pan}". Expected: AAAAA9999A (5 letters + 4 digits + 1 letter)`,
    };
  }

  return { valid: true };
}

// =====================================================================
// PASSPORT VALIDATION
// =====================================================================

/**
 * Validate passport number format
 * Accepts most international passport formats (8-20 alphanumeric characters)
 *
 * @param {string} passportNo - Passport number
 * @returns {object} { valid: boolean, error: string | null }
 */
function validatePassportNumber(passportNo) {
  if (!passportNo) {
    return {
      valid: false,
      error: "Passport number is required when IsPassportMandatory=true",
    };
  }

  const normalized = String(passportNo).toUpperCase().trim();

  if (!/^[A-Z0-9]{6,20}$/.test(normalized)) {
    return {
      valid: false,
      error: `Invalid passport format: "${passportNo}". Expected 6-20 alphanumeric characters.`,
    };
  }

  return { valid: true };
}

/**
 * Validate passport expiration
 * @param {string} expiryDate - ISO format date (YYYY-MM-DD)
 * @param {string} checkInDate - ISO format check-in date (YYYY-MM-DD)
 * @returns {object} { valid: boolean, error: string | null }
 */
function validatePassportExpiry(expiryDate, checkInDate) {
  if (!expiryDate) {
    return { valid: false, error: "Passport expiry date is required" };
  }

  const expiry = new Date(expiryDate);
  const checkIn = new Date(checkInDate);

  if (isNaN(expiry.getTime())) {
    return {
      valid: false,
      error: `Invalid expiry date format: "${expiryDate}". Expected YYYY-MM-DD.`,
    };
  }

  if (isNaN(checkIn.getTime())) {
    return {
      valid: false,
      error: `Invalid check-in date format: "${checkInDate}". Expected YYYY-MM-DD.`,
    };
  }

  if (expiry <= checkIn) {
    return {
      valid: false,
      error: `Passport expired or expires before check-in. Expiry: ${expiryDate}, CheckIn: ${checkInDate}`,
    };
  }

  // Optional: Check 6+ months validity (common requirement)
  const sixMonthsFromCheckIn = new Date(checkIn);
  sixMonthsFromCheckIn.setMonth(sixMonthsFromCheckIn.getMonth() + 6);

  if (expiry < sixMonthsFromCheckIn) {
    console.warn(
      `⚠️  Passport expires within 6 months of check-in. Some countries may require 6+ month validity.`,
    );
  }

  return { valid: true };
}

// =====================================================================
// PASSENGER VALIDATION
// =====================================================================

/**
 * Validate passenger personal information
 * @param {object} passenger - Passenger object
 * @param {object} roomConfig - Room configuration (for document requirements)
 * @returns {object} { valid: boolean, errors: array }
 */
function validatePassenger(passenger, roomConfig = {}) {
  const errors = [];

  if (!passenger) {
    return { valid: false, errors: ["Passenger object is required"] };
  }

  // Title validation
  const validTitles = [
    "Mr",
    "Mrs",
    "Miss",
    "Ms",
    "Master",
    "Mademoiselle",
    "Dr",
    "Prof",
  ];
  const title = passenger.Title || passenger.title;
  if (!title || !validTitles.includes(title)) {
    errors.push(
      `Invalid title: "${title}". Expected one of: ${validTitles.join(", ")}`,
    );
  }

  // First name validation
  const firstName = passenger.FirstName || passenger.firstName;
  if (!firstName || !/^[a-zA-Z\s'-]{2,50}$/.test(firstName)) {
    errors.push(
      `Invalid first name: "${firstName}". Must be 2-50 alphabetic characters.`,
    );
  }

  // Last name validation
  const lastName = passenger.LastName || passenger.lastName;
  if (!lastName || !/^[a-zA-Z\s'-]{2,50}$/.test(lastName)) {
    errors.push(
      `Invalid last name: "${lastName}". Must be 2-50 alphabetic characters.`,
    );
  }

  // Email validation
  const email = passenger.Email || passenger.email;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (email && !emailRegex.test(email)) {
    errors.push(`Invalid email format: "${email}".`);
  }

  // Phone number validation (basic)
  const phone = passenger.Phoneno || passenger.phoneno || passenger.phone;
  if (phone && !/^\+?[0-9\s\-()]{7,20}$/.test(phone)) {
    errors.push(
      `Invalid phone number: "${phone}". Expected international format.`,
    );
  }

  // Age validation
  const age = passenger.Age || passenger.age;
  if (age !== undefined && (isNaN(age) || age < 0 || age > 150)) {
    errors.push(`Invalid age: ${age}. Must be between 0 and 150.`);
  }

  // PaxType validation
  const paxType = passenger.PaxType || passenger.paxType;
  if (!paxType || ![1, 2].includes(paxType)) {
    errors.push(
      `Invalid PaxType: ${paxType}. Expected 1 (Adult) or 2 (Child).`,
    );
  }

  // Nationality validation
  const nationality = passenger.Nationality || passenger.nationality;
  if (!nationality) {
    errors.push("Nationality is required.");
  } else {
    const nationalityCheck = validateNationality(nationality);
    if (!nationalityCheck.valid) {
      errors.push(nationalityCheck.error);
    }
  }

  // Document validations (if room config specifies requirements)
  if (roomConfig.isPassportMandatory || roomConfig.IsPassportMandatory) {
    const passportNo = passenger.PassportNo || passenger.passportNo;
    if (!passportNo) {
      errors.push("Passport number is required (IsPassportMandatory=true).");
    } else {
      const passportCheck = validatePassportNumber(passportNo);
      if (!passportCheck.valid) {
        errors.push(passportCheck.error);
      }

      // Validate expiry if provided
      const passportExp =
        passenger.PassportExpDate || passenger.passportExpDate;
      const checkInDate = roomConfig.checkInDate || "2025-12-15"; // Default for testing
      if (passportExp) {
        const expiryCheck = validatePassportExpiry(passportExp, checkInDate);
        if (!expiryCheck.valid) {
          errors.push(expiryCheck.error);
        }
      }
    }
  }

  // PAN validation (if room config specifies requirement)
  if (roomConfig.isPANMandatory || roomConfig.IsPANMandatory) {
    const pan = passenger.PAN || passenger.pan;
    if (!pan) {
      errors.push("PAN is required (IsPANMandatory=true).");
    } else {
      const panCheck = validatePAN(pan);
      if (!panCheck.valid) {
        errors.push(panCheck.error);
      }
    }
  }

  // Address validation (basic)
  const address = passenger.AddressLine1 || passenger.addressLine1;
  if (!address || address.length < 5) {
    errors.push("Address must be at least 5 characters.");
  }

  // City validation
  const city = passenger.City || passenger.city;
  if (!city || city.length < 2) {
    errors.push("City is required and must be at least 2 characters.");
  }

  // Country code validation
  const countryCode = passenger.CountryCode || passenger.countryCode;
  if (!countryCode || !/^[A-Z]{2}$/.test(countryCode)) {
    errors.push(
      `Invalid country code: "${countryCode}". Expected ISO 2-letter code.`,
    );
  }

  return {
    valid: errors.length === 0,
    errors: errors,
  };
}

// =====================================================================
// PRICE VALIDATION (RSP - Rate Shopping Prevention)
// =====================================================================

/**
 * Validate price object for RSP compliance
 * PublishedPrice ≥ RoomPrice (base must be published)
 * OfferedPrice ≤ PublishedPrice (offered must not exceed published)
 *
 * @param {object} price - Price object from TBO
 * @returns {object} { valid: boolean, errors: array, warnings: array }
 */
function validatePrice(price) {
  const errors = [];
  const warnings = [];

  if (!price || typeof price !== "object") {
    return { valid: false, errors: ["Price must be an object"] };
  }

  // Currency validation
  const currency = price.CurrencyCode || price.currencyCode;
  if (!currency || !/^[A-Z]{3}$/.test(currency)) {
    errors.push(
      `Invalid currency code: "${currency}". Expected ISO 3-letter code (USD, INR, etc.).`,
    );
  }

  // Room price validation
  const roomPrice = parseFloat(price.RoomPrice || price.roomPrice || 0);
  if (isNaN(roomPrice) || roomPrice < 0) {
    errors.push(`Invalid room price: ${roomPrice}. Must be >= 0.`);
  }

  // Tax validation
  const tax = parseFloat(price.Tax || price.tax || 0);
  if (isNaN(tax) || tax < 0) {
    errors.push(`Invalid tax: ${tax}. Must be >= 0.`);
  }

  // Published price validation (RSP rule: PublishedPrice ≥ RoomPrice)
  const publishedPrice = parseFloat(
    price.PublishedPrice || price.publishedPrice || roomPrice,
  );
  if (publishedPrice < roomPrice) {
    errors.push(
      `RSP violation: PublishedPrice (${publishedPrice}) < RoomPrice (${roomPrice}). ` +
        `Published must be ≥ Room price.`,
    );
  }

  // Offered price validation (RSP rule: OfferedPrice ≤ PublishedPrice)
  const offeredPrice = parseFloat(
    price.OfferedPrice || price.offeredPrice || publishedPrice,
  );
  if (offeredPrice > publishedPrice) {
    errors.push(
      `RSP violation: OfferedPrice (${offeredPrice}) > PublishedPrice (${publishedPrice}). ` +
        `Offered must be ≤ Published price.`,
    );
  }

  // Calculate discount percentage for warnings
  if (publishedPrice > 0) {
    const discountPercentage =
      ((publishedPrice - offeredPrice) / publishedPrice) * 100;
    if (discountPercentage > 50) {
      warnings.push(
        `⚠️  High discount detected: ${discountPercentage.toFixed(1)}% off. ` +
          `Verify against agency markup rules.`,
      );
    }
  }

  // Other charges validation
  const otherCharges = parseFloat(
    price.OtherCharges || price.otherCharges || 0,
  );
  if (isNaN(otherCharges) || otherCharges < 0) {
    errors.push(`Invalid other charges: ${otherCharges}. Must be >= 0.`);
  }

  return {
    valid: errors.length === 0,
    errors: errors,
    warnings: warnings,
  };
}

// =====================================================================
// DATE VALIDATION
// =====================================================================

/**
 * Validate check-in and check-out dates
 * @param {string} checkInDate - Format: dd/MM/yyyy or YYYY-MM-DD
 * @param {number} noOfNights - Number of nights (must be > 0)
 * @returns {object} { valid: boolean, error: string | null, checkOutDate: string }
 */
function validateDates(checkInDate, noOfNights) {
  if (!checkInDate) {
    return { valid: false, error: "Check-in date is required" };
  }

  if (!noOfNights || noOfNights < 1) {
    return {
      valid: false,
      error: `Invalid number of nights: ${noOfNights}. Must be > 0.`,
    };
  }

  // Parse check-in date
  let checkInObj;
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(checkInDate)) {
    // dd/MM/yyyy format
    const [day, month, year] = checkInDate.split("/");
    checkInObj = new Date(year, month - 1, day);
  } else if (/^\d{4}-\d{2}-\d{2}$/.test(checkInDate)) {
    // YYYY-MM-DD format
    checkInObj = new Date(checkInDate);
  } else {
    return {
      valid: false,
      error: `Invalid date format: "${checkInDate}". Expected dd/MM/yyyy or YYYY-MM-DD.`,
    };
  }

  if (isNaN(checkInObj.getTime())) {
    return { valid: false, error: `Invalid check-in date: "${checkInDate}".` };
  }

  // Check if date is in past (allow same day for same-day bookings, but warn)
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  if (checkInObj < today) {
    return {
      valid: false,
      error: `Check-in date cannot be in the past: "${checkInDate}".`,
    };
  }

  // Calculate check-out date
  const checkOutObj = new Date(checkInObj);
  checkOutObj.setDate(checkOutObj.getDate() + noOfNights);

  const checkOutFormatted =
    String(checkOutObj.getDate()).padStart(2, "0") +
    "/" +
    String(checkOutObj.getMonth() + 1).padStart(2, "0") +
    "/" +
    checkOutObj.getFullYear();

  return {
    valid: true,
    checkOutDate: checkOutFormatted,
  };
}

// =====================================================================
// ROOM CONFIGURATION VALIDATION
// =====================================================================

/**
 * Validate room configuration (guest counts, occupancy)
 * @param {object} roomConfig - Room configuration
 * @returns {object} { valid: boolean, errors: array }
 */
function validateRoomConfig(roomConfig) {
  const errors = [];

  if (!roomConfig) {
    return { valid: false, errors: ["Room configuration is required"] };
  }

  // Adult count validation
  const adults =
    roomConfig.NoOfAdults || roomConfig.adults || roomConfig.noOfAdults;
  if (!adults || adults < 1 || adults > 4) {
    errors.push(`Invalid adult count: ${adults}. Must be 1-4 per room.`);
  }

  // Child count validation
  const children =
    roomConfig.NoOfChild || roomConfig.children || roomConfig.noOfChild || 0;
  if (children < 0 || children > 3) {
    errors.push(`Invalid child count: ${children}. Must be 0-3 per room.`);
  }

  // Child ages validation
  const childAges = roomConfig.ChildAge || roomConfig.childAges || [];
  if (Array.isArray(childAges) && childAges.length > 0) {
    if (childAges.length !== children) {
      errors.push(
        `Child age count mismatch: provided ${childAges.length} ages but NoOfChild=${children}.`,
      );
    }

    childAges.forEach((age, idx) => {
      const numAge = parseInt(age);
      if (isNaN(numAge) || numAge < 0 || numAge > 17) {
        errors.push(`Invalid child age at index ${idx}: ${age}. Must be 0-17.`);
      }
    });
  } else if (
    children > 0 &&
    (!Array.isArray(childAges) || childAges.length === 0)
  ) {
    errors.push(
      `Child ages required when NoOfChild > 0. Provided: ${childAges}`,
    );
  }

  return {
    valid: errors.length === 0,
    errors: errors,
  };
}

// =====================================================================
// DE-DUPE HOTEL VALIDATION
// =====================================================================

/**
 * Validate de-dupe hotel context and CategoryId requirement
 * @param {object} hotel - Hotel object from search
 * @param {string} categoryId - CategoryId to validate
 * @returns {object} { isDeDupe: boolean, categoryIdRequired: boolean, error: string | null }
 */
function validateDeDupeContext(hotel, categoryId) {
  if (!hotel) {
    return { isDeDupe: false, categoryIdRequired: false };
  }

  // Detect de-dupe context
  const isTBOMapped = hotel.IsTBOMapped || hotel.isTBOMapped;
  const hasCategoryId = !!(hotel.CategoryId || hotel.categoryId);
  const isDeDupe = isTBOMapped && hasCategoryId;

  if (!isDeDupe) {
    // Non-de-dupe: CategoryId should NOT be sent
    return {
      isDeDupe: false,
      categoryIdRequired: false,
      shouldOmit: true,
    };
  }

  // De-dupe hotel: CategoryId is REQUIRED
  if (!categoryId) {
    return {
      isDeDupe: true,
      categoryIdRequired: true,
      error:
        `De-dupe hotel detected (IsTBOMapped=true) but CategoryId is missing. ` +
        `CategoryId is REQUIRED for de-dupe hotels in BlockRoom/Book.`,
    };
  }

  return {
    isDeDupe: true,
    categoryIdRequired: true,
    providedCategoryId: categoryId,
  };
}

// =====================================================================
// SMOKING PREFERENCE VALIDATION
// =====================================================================

/**
 * Validate and convert smoking preference to TBO integer format
 * @param {string | number} preference - Smoking preference
 * @returns {object} { valid: boolean, value: number | null, error: string | null }
 */
function validateSmokingPreference(preference) {
  if (preference === undefined || preference === null) {
    return { valid: true, value: 0, note: "Defaulting to NoPreference (0)" };
  }

  const smokingMap = {
    0: 0, // NoPreference
    1: 1, // Smoking
    2: 2, // NonSmoking
    3: 3, // Either
    nopreference: 0,
    smoking: 1,
    nonsmoking: 2,
    either: 3,
  };

  let value;

  if (typeof preference === "number") {
    value = preference;
  } else if (typeof preference === "string") {
    value = smokingMap[preference.toLowerCase()];
  } else {
    return {
      valid: false,
      error: `Invalid smoking preference type: ${typeof preference}. Expected number or string.`,
    };
  }

  if (![0, 1, 2, 3].includes(value)) {
    return {
      valid: false,
      error: `Invalid smoking preference value: ${preference}. Expected 0 (NoPreference), 1 (Smoking), 2 (NonSmoking), or 3 (Either).`,
    };
  }

  return { valid: true, value: value };
}

// =====================================================================
// EXPORTS
// =====================================================================

module.exports = {
  // Nationality
  validateNationality,
  TBO_SUPPORTED_NATIONALITIES,

  // PAN & Passport
  validatePAN,
  validatePassportNumber,
  validatePassportExpiry,

  // Passenger
  validatePassenger,

  // Pricing
  validatePrice,

  // Dates
  validateDates,

  // Room Configuration
  validateRoomConfig,

  // De-Dupe
  validateDeDupeContext,

  // Smoking Preference
  validateSmokingPreference,
};
