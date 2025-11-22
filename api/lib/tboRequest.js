const axios = require("axios");
const { agentFor, proxyMode } = require("./proxy");

async function tboRequest(url, config = {}) {
  const agentCfg = agentFor(url);
  const req = {
    url,
    method: "GET",
    timeout: 20000,
    ...agentCfg,
    ...config,
    validateStatus: () => true, // Don't throw on any status code
    responseType: 'text', // Get raw text response
  };

  try {
    const response = await axios(req);

    // Manually parse JSON if needed
    if (response.headers['content-type']?.includes('application/json')) {
      try {
        response.data = JSON.parse(response.data);
      } catch (parseError) {
        console.error('❌ JSON Parse Error in tboRequest:', {
          url,
          error: parseError.message,
          dataLength: response.data ? response.data.length : 0,
          dataSample: response.data ? response.data.substring(0, 200) : 'empty response',
          status: response.status,
          headers: response.headers,
        });
        // Return error details instead of throwing
        response.data = {
          __parseError: true,
          originalData: response.data ? response.data.substring(0, 500) : 'empty',
          error: parseError.message,
          url,
          status: response.status,
        };
      }
    }

    // Re-throw if status is not 2xx
    if (response.status < 200 || response.status >= 300) {
      const error = new Error(
        `TBO API returned ${response.status}: ${response.statusText}`
      );
      error.response = response;
      error.status = response.status;
      throw error;
    }

    return response;
  } catch (error) {
    // Add more context to the error
    error.url = url;
    throw error;
  }
}

function tboVia() {
  return proxyMode();
}

module.exports = { tboRequest, tboVia };
