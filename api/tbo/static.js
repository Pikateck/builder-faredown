/**
 * TBO Static Data API
 *
 * WORKING ENDPOINT (VERIFIED):
 * https://api.travelboutiqueonline.com/SharedAPI/StaticData.svc/rest/GetDestinationSearchStaticData
 *
 * Uses TokenId-based authentication (same as hotel search)
 */

const { tboRequest } = require("../lib/tboRequest");
const { authenticateTBO } = require("./auth");

/**
 * Get Destination Search Static Data
 * Returns cities for a given country with their DestinationIds
 *
 * VERIFIED WORKING - Returns real data
 */
async function getDestinationSearchStaticData(
  countryCode = "AE",
  tokenId = null,
) {
  const url =
    "https://api.travelboutiqueonline.com/SharedAPI/StaticData.svc/rest/GetDestinationSearchStaticData";

  // Get TokenId if not provided
  if (!tokenId) {
    const authData = await authenticateTBO();
    tokenId = authData.TokenId;

    if (!tokenId) {
      throw new Error("Authentication failed - no TokenId");
    }
  }

  const request = {
    EndUserIp: process.env.TBO_END_USER_IP || "52.5.155.132",
    TokenId: tokenId,
    CountryCode: countryCode,
    SearchType: "1", // 1 = City-wise
  };

  console.log("📍 TBO GetDestinationSearchStaticData Request");
  console.log("  URL:", url);
  console.log("  CountryCode:", request.CountryCode);
  console.log("  SearchType:", request.SearchType);
  console.log("");

  const response = await tboRequest(url, {
    method: "POST",
    data: request,
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      "Accept-Encoding": "gzip, deflate",
    },
    timeout: 30000,
  });

  console.log("📥 TBO Static Data Response");
  console.log("  HTTP Status:", response.status);
  console.log("  Status:", response.data?.Status);
  console.log(
    "  Destinations Count:",
    response.data?.Destinations?.length || 0,
  );
  console.log("  TraceId:", response.data?.TraceId);
  console.log("");

  if (response.data?.Status !== 1) {
    throw new Error(
      `Static data failed: ${response.data?.Error?.ErrorMessage || "Unknown error"}`,
    );
  }

  const destinations = response.data?.Destinations || [];

  if (destinations.length > 0) {
    console.log("Sample destinations:");
    destinations.slice(0, 5).forEach((d) => {
      console.log(`  - ${d.CityName} (DestinationId: ${d.DestinationId})`);
    });
    console.log("");
  }

  return {
    status: response.data.Status,
    traceId: response.data.TraceId,
    tokenId: response.data.TokenId,
    destinations: destinations.map((d) => ({
      cityName: d.CityName,
      countryCode: d.CountryCode?.trim(),
      countryName: d.CountryName,
      destinationId: d.DestinationId,
      stateProvince: d.StateProvince,
      type: d.Type,
    })),
  };
}

/**
 * Get CityId (DestinationId) for a specific city
 */
async function getCityId(cityName, countryCode = "AE", tokenId = null) {
  const staticData = await getDestinationSearchStaticData(countryCode, tokenId);

  const city = staticData.destinations.find(
    (d) =>
      d.cityName.toLowerCase() === cityName.toLowerCase() ||
      d.cityName.toLowerCase().includes(cityName.toLowerCase()),
  );

  if (!city) {
    console.warn(`⚠️  City not found: ${cityName} in ${countryCode}`);
    return null;
  }

  console.log(
    `✅ Found ${city.cityName}: DestinationId = ${city.destinationId}`,
  );
  return city.destinationId;
}

/**
 * Search cities by name (for autocomplete)
 */
async function searchCities(query, countryCode = null, tokenId = null) {
  // If country code provided, search that country only
  if (countryCode) {
    const staticData = await getDestinationSearchStaticData(
      countryCode,
      tokenId,
    );
    const matches = staticData.destinations.filter((d) =>
      d.cityName.toLowerCase().includes(query.toLowerCase()),
    );
    return matches;
  }

  // Otherwise, search common countries (can be expanded)
  const countries = ["AE", "GB", "FR", "US", "IN"];
  const allMatches = [];

  for (const cc of countries) {
    try {
      const staticData = await getDestinationSearchStaticData(cc, tokenId);
      const matches = staticData.destinations.filter((d) =>
        d.cityName.toLowerCase().includes(query.toLowerCase()),
      );
      allMatches.push(...matches);
    } catch (error) {
      console.error(`Failed to search ${cc}:`, error.message);
    }
  }

  return allMatches;
}

module.exports = {
  getDestinationSearchStaticData,
  getCityId,
  searchCities,
};
