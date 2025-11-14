/**
 * TBO Debug - Static Data
 * Base URL: https://apiwr.tboholidays.com/HotelAPI/
 * Endpoints: CountryList, DestinationCityList
 * Auth: UserName/Password (NOT TokenId)
 */

const { tboRequest } = require("../lib/tboRequest");

/**
 * Get Country List
 */
async function getCountryList() {
  const url = process.env.TBO_HOTEL_STATIC_DATA + "CountryList";
  
  const request = {
    UserName: process.env.TBO_STATIC_USER,
    Password: process.env.TBO_STATIC_PASSWORD
  };

  console.log("📍 TBO Country List Request");
  console.log("  URL:", url);
  console.log("  UserName:", request.UserName);
  console.log("");

  const response = await tboRequest(url, {
    method: "POST",
    data: request,
    headers: {
      "Content-Type": "application/json",
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
 */
async function getCityList(countryCode = "AE") {
  const url = process.env.TBO_HOTEL_STATIC_DATA + "DestinationCityList";
  
  const request = {
    UserName: process.env.TBO_STATIC_USER,
    Password: process.env.TBO_STATIC_PASSWORD,
    CountryCode: countryCode
  };

  console.log("📍 TBO City List Request");
  console.log("  URL:", url);
  console.log("  UserName:", request.UserName);
  console.log("  CountryCode:", countryCode);
  console.log("");

  const response = await tboRequest(url, {
    method: "POST",
    data: request,
    headers: {
      "Content-Type": "application/json",
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
