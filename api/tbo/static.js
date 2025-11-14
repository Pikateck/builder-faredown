/**
 * TBO Debug - Static Data
 * Base URL: https://apiwr.tboholidays.com/HotelAPI/
 * Endpoints: CountryList, DestinationCityList
 * Method: POST with JSON body
 * Auth: UserName/Password (separate from TokenId)
 */

const { tboRequest } = require("../lib/tboRequest");

/**
 * Get Country List
 * POST https://apiwr.tboholidays.com/HotelAPI/CountryList
 */
async function getCountryList() {
  const url = process.env.TBO_HOTEL_STATIC_DATA + "CountryList";
  
  const requestBody = {
    UserName: process.env.TBO_STATIC_USER,
    Password: process.env.TBO_STATIC_PASSWORD
  };

  console.log("📍 TBO Country List Request");
  console.log("  Full URL:", url);
  console.log("  Method: POST");
  console.log("  Request Body:", JSON.stringify(requestBody, null, 2));
  console.log("");

  const response = await tboRequest(url, {
    method: "POST",
    data: requestBody,
    headers: {
      "Content-Type": "application/json",
      "Accept": "application/json",
      "Accept-Encoding": "gzip, deflate"
    }
  });

  console.log("📥 TBO Country List Response");
  console.log("  HTTP Status:", response.status);
  console.log("  Response Body:", JSON.stringify(response.data, null, 2).substring(0, 500));
  console.log("");

  return response.data;
}

/**
 * Get City List for a country
 * POST https://apiwr.tboholidays.com/HotelAPI/DestinationCityList
 */
async function getCityList(countryCode = "AE") {
  const url = process.env.TBO_HOTEL_STATIC_DATA + "DestinationCityList";
  
  const requestBody = {
    UserName: process.env.TBO_STATIC_USER,
    Password: process.env.TBO_STATIC_PASSWORD,
    CountryCode: countryCode
  };

  console.log("📍 TBO City List Request");
  console.log("  Full URL:", url);
  console.log("  Method: POST");
  console.log("  Request Body:", JSON.stringify(requestBody, null, 2));
  console.log("");

  const response = await tboRequest(url, {
    method: "POST",
    data: requestBody,
    headers: {
      "Content-Type": "application/json",
      "Accept": "application/json",
      "Accept-Encoding": "gzip, deflate"
    }
  });

  console.log("📥 TBO City List Response");
  console.log("  HTTP Status:", response.status);
  console.log("  Response Body:", JSON.stringify(response.data, null, 2).substring(0, 1000));
  console.log("");

  return response.data;
}

module.exports = { getCountryList, getCityList };
