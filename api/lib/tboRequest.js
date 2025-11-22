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
    transformResponse: [
      // First, try to parse as JSON if Content-Type is application/json
      function(data, headers) {
        const contentType = headers['content-type'] || '';
        if (contentType.includes('application/json') && data) {
          try {
            return typeof data === 'string' ? JSON.parse(data) : data;
          } catch (e) {
            console.error('❌ JSON Parse Error in tboRequest:', {
              url,
              error: e.message,
              dataLength: data ? data.length : 0,
              dataSample: typeof data === 'string' ? data.substring(0, 200) : 'not a string',
            });
            // Return the raw data if JSON parsing fails
            return {
              __parseError: true,
              originalData: typeof data === 'string' ? data.substring(0, 500) : data,
              error: e.message
            };
          }
        }
        return data;
      }
    ]
  };

  try {
    const response = await axios(req);

    // Check if we got a JSON parse error
    if (response.data?.__parseError) {
      throw new Error(
        `TBO API returned invalid JSON: ${response.data.error}. Response: ${response.data.originalData}`
      );
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
