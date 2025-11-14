/**
 * TBO Debug - Authentication
 * Endpoint: https://api.travelboutiqueonline.com/SharedAPI/SharedData.svc/rest/Authenticate
 * Method: POST
 * Returns: TokenId (valid 24 hours)
 */

const { tboRequest } = require("../lib/tboRequest");

async function authenticateTBO() {
  const authUrl = process.env.TBO_AUTH_URL;
  
  const request = {
    ClientId: process.env.TBO_CLIENT_ID || "tboprod",
    UserName: process.env.TBO_API_USER_ID || "BOMF145",
    Password: process.env.TBO_API_PASSWORD || "@Bo#4M-Api@",
    EndUserIp: process.env.TBO_END_USER_IP || "52.5.155.132"
  };

  console.log("🔐 TBO Authentication Request");
  console.log("  URL:", authUrl);
  console.log("  ClientId:", request.ClientId, "(should be 'tboprod')");
  console.log("  UserName:", request.UserName);
  console.log("  Password:", request.Password ? "***" + request.Password.substring(request.Password.length - 4) : "MISSING");
  console.log("  EndUserIp:", request.EndUserIp);
  console.log("");

  const response = await tboRequest(authUrl, {
    method: "POST",
    data: request,
    headers: {
      "Content-Type": "application/json",
      "Accept": "application/json",
      "Accept-Encoding": "gzip, deflate"
    }
  });

  console.log("📥 TBO Auth Response");
  console.log("  HTTP Status:", response.status);
  console.log("  Status:", response.data?.Status);
  console.log("  TokenId:", response.data?.TokenId ? `✅ ${response.data.TokenId.substring(0, 30)}...` : "❌ MISSING");
  console.log("  Member ID:", response.data?.Member?.MemberId);
  console.log("  Agency ID:", response.data?.Member?.AgencyId);
  console.log("  Error:", response.data?.Error?.ErrorMessage || "None");
  console.log("");

  return response.data;
}

module.exports = { authenticateTBO };
