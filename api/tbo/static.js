/**
 * TBO Debug - Static Data
 * Base URL: https://apiwr.tboholidays.com/HotelAPI/
 * Endpoints: CountryList, HotelCityList
 * Method: GET with query parameters
 * Auth: UserName/Password (NOT TokenId)
 */

const { tboRequest } = require("../lib/tboRequest");

/**
 * Get Country List
 */
async function getCountryList() {
  const url = process.env.TBO_HOTEL_STATIC_DATA + "CountryList";
  
  const params = {
    UserName: process.env.TBO_STATIC_USER,
    Password: process.env.TBO_STATIC_PASSWORD
  };

  console.log("📍 TBO Country List Request");
  console.log("  URL:", url);
  console.log("  Method: GET");
  console.log("  UserName:", params.UserName);
  console.log("");

  const response = await tboRequest(url, {
    method: "GET",
    params: params,
    headers: {
      "Accept": "application/json",
      "Accept-Encoding": "gzip, deflate"
    }
  });

  console.log("📥 TBO Country List Response");
  console.log("  HTTP Status:", response.status);
  console.log("  Status:", response.data?.Status);
  console.log("  Country Count:", response.data?.Countries?.length || 0);
  console.log("  Error:", response.data?.Error?.ErrorMessage || "None");
  
  if (response.data?.Countries?.length > 0) {
    console.log("\nSample Countries:");
    response.data.Countries.slice(0, 5).forEach(c => {
      console.log(`  - ${c.Name} (${c.Code})`);
    });
  }
  console.log("");

  return response.data;
}

/**
 * Get City List for a country
 * ✅ CORRECTED: Endpoint is "HotelCityList" (not "DestinationCityList")
 */
async function getCityList(countryCode = "AE") {
  const url = process.env.TBO_HOTEL_STATIC_DATA + "HotelCityList";
  
  const params = {
    UserName: process.env.TBO_STATIC_USER,
    Password: process.env.TBO_STATIC_PASSWORD,
    CountryCode: countryCode
  };

  console.log("📍 TBO City List Request");
  console.log("  URL:", url);
  console.log("  Method: GET");
  console.log("  UserName:", params.UserName);
  console.log("  CountryCode:", countryCode);
  console.log("");

  const response = await tboRequest(url, {
    method: "GET",
    params: params,
    headers: {
      "Accept": "application/json",
      "Accept-Encoding": "gzip, deflate"
    }
  });

  console.log("📥 TBO City List Response");
  console.log("  HTTP Status:", response.status);
  console.log("  Status:", response.data?.Status);
  console.log("  City Count:", response.data?.Cities?.length || 0);
  console.log("  Error:", response.data?.Error?.ErrorMessage || "None");
  
  if (response.data?.Cities?.length > 0) {
    console.log(`\nSample Cities in ${countryCode}:`);
    response.data.Cities.slice(0, 10).forEach(c => {
      console.log(`  - ${c.Name} (ID: ${c.Id}, Code: ${c.Code || 'N/A'})`);
    });
  }
  console.log("");

  return response.data;
}

module.exports = { getCountryList, getCityList };
