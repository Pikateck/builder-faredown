/**
 * TBO Content API Client
 * Fetches and manages country, city, and hotel master data from TBO
 * Uses TBO Static Data API endpoints from HotelAPI
 */

const { tboRequest } = require("../lib/tboRequest");

const hotelStaticBase =
  process.env.TBO_HOTEL_STATIC_DATA ||
  "https://apiwr.tboholidays.com/HotelAPI/";
const staticUserName = process.env.TBO_STATIC_USER;
const staticPassword = process.env.TBO_STATIC_PASSWORD;

if (!staticUserName || !staticPassword) {
  console.warn(
    "⚠️  TBO Static Data credentials not fully configured. Sync may fail.",
    {
      hotelStaticBase: !!hotelStaticBase,
      staticUserName: !!staticUserName,
      staticPassword: !!staticPassword,
    },
  );
}

/**
 * Fetch all countries from TBO
 */
async function* fetchCountries() {
  try {
    const response = await tboRequest(`${hotelStaticBase}/CountryList`, {
      method: "POST",
      data: {
        UserName: staticUserName?.trim(),
        Password: staticPassword,
      },
      timeout: 30000,
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
    });

    const countries = response.data?.CountryList || response.data?.Result || [];
    console.log(`📥 Fetched ${countries.length} countries from TBO`);

    for (const country of countries) {
      yield country;
    }
  } catch (error) {
    console.error("Failed to fetch TBO countries:", error.message);
    throw error;
  }
}

/**
 * Fetch all cities for a country from TBO
 */
async function* fetchCitiesForCountry(countryCode) {
  try {
    const response = await tboRequest(`${hotelStaticBase}/CityList`, {
      method: "POST",
      data: {
        UserName: staticUserName?.trim(),
        Password: staticPassword,
        CountryCode: countryCode,
      },
      timeout: 30000,
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
    });

    const cities = response.data?.CityList || response.data?.Result || [];
    console.log(
      `📥 Fetched ${cities.length} cities for country ${countryCode}`,
    );

    for (const city of cities) {
      yield city;
    }
  } catch (error) {
    console.error(
      `Failed to fetch TBO cities for country ${countryCode}:`,
      error.message,
    );
    // Don't throw - continue with other countries
  }
}

/**
 * Fetch all hotel codes for a city from TBO
 */
async function* fetchHotelCodesForCity(cityCode) {
  try {
    const response = await tboRequest(`${hotelStaticBase}/HotelCodesList`, {
      method: "POST",
      data: {
        UserName: staticUserName?.trim(),
        Password: staticPassword,
        CityCode: cityCode,
      },
      timeout: 30000,
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
    });

    const hotelCodes = response.data?.HotelCodes || response.data?.Result || [];
    console.log(`📥 Fetched ${hotelCodes.length} hotels for city ${cityCode}`);

    for (const hotelCode of hotelCodes) {
      yield hotelCode;
    }
  } catch (error) {
    console.error(
      `Failed to fetch hotel codes for city ${cityCode}:`,
      error.message,
    );
    // Don't throw - continue with other cities
  }
}

/**
 * Fetch hotel details for a specific hotel code
 */
async function fetchHotelDetails(hotelCode) {
  try {
    const response = await tboRequest(`${hotelStaticBase}/HotelDetails`, {
      method: "POST",
      data: {
        UserName: staticUserName?.trim(),
        Password: staticPassword,
        HotelCode: hotelCode,
      },
      timeout: 30000,
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
    });

    return response.data?.Hotel || response.data?.Result || null;
  } catch (error) {
    console.error(
      `Failed to fetch hotel details for code ${hotelCode}:`,
      error.message,
    );
    return null;
  }
}

/**
 * Legacy fetchPages function - kept for backward compatibility
 * Maps to the new country/city/hotel structure
 */
async function* fetchPages(endpoint, params = {}) {
  if (endpoint === "lists/countries") {
    yield* fetchCountries();
  } else if (endpoint === "lists/cities") {
    // This needs to be called per-country - handled in sync job
    console.warn("fetchPages(lists/cities) called without country context");
  } else if (endpoint === "lists/hotels") {
    // This needs to be called per-city - handled in sync job
    console.warn("fetchPages(lists/hotels) called without city context");
  } else {
    console.error(`Unknown endpoint: ${endpoint}`);
  }
}

module.exports = {
  fetchPages,
  fetchCountries,
  fetchCitiesForCountry,
  fetchHotelCodesForCity,
  fetchHotelDetails,
};
