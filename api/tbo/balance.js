/**
 * TBO Get Agency Balance
 * 
 * Endpoint: https://api.travelboutiqueonline.com/SharedAPI/SharedData.svc/rest/GetAgencyBalance
 * Method: POST
 * 
 * Returns: Current agency balance and currency
 * 
 * Request Format (JSON):
 * {
 *   "TokenId": "string",
 *   "EndUserIp": "string"
 * }
 * 
 * Response Format (JSON):
 * {
 *   "Status": 1,
 *   "Result": {
 *     "Balance": 123456.78,
 *     "Currency": "INR"
 *   },
 *   "Error": null
 * }
 */

const { tboRequest } = require("../lib/tboRequest");
const { authenticateTBO } = require("./auth");

/**
 * Get Agency Balance
 * Returns current account balance for TBO agency
 */
async function getAgencyBalance() {
  console.log("═".repeat(80));
  console.log("TBO GET AGENCY BALANCE");
  console.log("═".repeat(80));

  // 1. Get TokenId
  console.log("\nStep 1: Authenticating...");
  const authData = await authenticateTBO();
  const tokenId = authData.TokenId;

  if (!tokenId) {
    throw new Error("Authentication failed - no TokenId");
  }
  console.log("✅ TokenId obtained");

  // 2. Build balance request (EXACT TBO JSON specification)
  const balanceRequest = {
    TokenId: tokenId,
    EndUserIp: process.env.TBO_END_USER_IP || "52.5.155.132",
  };

  const url =
    process.env.TBO_BALANCE_URL ||
    "https://api.travelboutiqueonline.com/SharedAPI/SharedData.svc/rest/GetAgencyBalance";

  console.log("\nStep 2: Fetching agency balance...");
  console.log("  URL:", url);
  console.log("  EndUserIp:", balanceRequest.EndUserIp);
  console.log("");

  const response = await tboRequest(url, {
    method: "POST",
    data: balanceRequest,
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      "Accept-Encoding": "gzip, deflate",
    },
    timeout: 30000,
  });

  console.log("📥 TBO Balance Response");
  console.log("  HTTP Status:", response.status);
  console.log("  Status:", response.data?.Status);
  console.log("  Balance:", response.data?.Result?.Balance);
  console.log("  Currency:", response.data?.Result?.Currency);
  console.log("  Error:", response.data?.Error?.ErrorMessage || "None");
  console.log("");

  // Check response status
  if (response.data?.Status !== 1) {
    const errorMsg = response.data?.Error?.ErrorMessage || "Unknown error";
    throw new Error(`TBO GetAgencyBalance failed: ${errorMsg}`);
  }

  // Return standardized response
  return {
    status: response.data.Status,
    balance: response.data.Result?.Balance || 0,
    currency: response.data.Result?.Currency || "INR",
    supplier: "TBO",
    timestamp: new Date().toISOString(),
    raw: response.data,
  };
}

module.exports = { getAgencyBalance };
