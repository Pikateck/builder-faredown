const axios = require("axios");
const { agentFor, proxyMode } = require("./proxy");

async function tboRequest(url, config = {}) {
  const agentCfg = agentFor(url);

  // Create a new axios instance to avoid default JSON parsing which causes "Unexpected end of JSON input" errors
  const instance = axios.create();

  const req = {
    url,
    method: "GET",
    timeout: 20000,
    ...agentCfg,
    ...config,
    validateStatus: () => true, // Don't throw on any status code
    responseType: "text", // Get response as plain text, not auto-parsed
    transformResponse: [(data) => data], // Disable transformations
  };

  try {
    console.log(`[tboRequest] Calling ${req.method || 'GET'} ${url} via ${tboVia()}`);

    const response = await instance.request(req);

    // Get response body as string
    let dataStr = response.data || "";

    // Ensure dataStr is a string
    if (typeof dataStr !== "string") {
      dataStr = String(dataStr || "");
    }

    console.log(`[tboRequest] Received ${response.status} with content-type: ${response.headers["content-type"]}, body length: ${dataStr.length}`);

    // Manually parse JSON if content-type indicates JSON
    if (response.headers["content-type"]?.includes("application/json") || response.status >= 400) {
      if (!dataStr || dataStr.trim().length === 0) {
        console.error("❌ Empty response body from TBO API:", {
          url,
          status: response.status,
          statusText: response.statusText,
          contentType: response.headers["content-type"],
        });

        // Return a safe error response
        response.data = {
          __error: true,
          message: `TBO API returned empty response (HTTP ${response.status})`,
          url,
          status: response.status,
        };
        response.__parseError = true;
        return response;
      }

      try {
        response.data = JSON.parse(dataStr);
      } catch (parseError) {
        console.error("❌ JSON Parse Error in tboRequest:", {
          url,
          error: parseError.message,
          dataLength: dataStr.length,
          dataSample: dataStr.substring(0, 500),
          status: response.status,
          statusText: response.statusText,
          contentType: response.headers["content-type"],
        });

        // Return error details instead of throwing
        response.data = {
          __error: true,
          message: `Failed to parse TBO response as JSON: ${parseError.message}`,
          url,
          bodyPreview: dataStr.substring(0, 200),
          status: response.status,
        };
        response.__parseError = true;
        return response;
      }
    }

    // Log non-2xx status
    if (response.status < 200 || response.status >= 300) {
      console.warn(`[tboRequest] Non-2xx status: ${response.status}`, {
        url,
        statusText: response.statusText,
        dataPreview:
          typeof response.data === "string"
            ? response.data.substring(0, 100)
            : JSON.stringify(response.data).substring(0, 100),
      });
    }

    return response;
  } catch (error) {
    console.error("[tboRequest] Unexpected error:", {
      message: error.message,
      code: error.code,
      url,
    });
    // Return a safe error response instead of throwing
    return {
      data: {
        __error: true,
        message: `Request failed: ${error.message}`,
        url,
        errorCode: error.code,
      },
      status: error.response?.status || 500,
      __requestError: true,
    };
  }
}

function tboVia() {
  return proxyMode();
}

module.exports = { tboRequest, tboVia };
