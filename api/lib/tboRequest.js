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
    responseType: 'arraybuffer', // Get raw buffer, not auto-parsed
    transformResponse: [(data) => data], // Disable all transformations
  };

  try {
    const response = await axios(req);

    // Convert buffer to string
    let dataStr = '';
    if (Buffer.isBuffer(response.data)) {
      dataStr = response.data.toString('utf-8');
    } else if (typeof response.data === 'string') {
      dataStr = response.data;
    }

    // Manually parse JSON if content-type is JSON
    if (response.headers['content-type']?.includes('application/json')) {
      if (!dataStr || dataStr.length === 0) {
        console.error('❌ Empty response body from TBO API:', {
          url,
          status: response.status,
          headers: response.headers,
        });
        throw new Error(`TBO API returned empty response (status ${response.status})`);
      }

      try {
        response.data = JSON.parse(dataStr);
      } catch (parseError) {
        console.error('❌ JSON Parse Error in tboRequest:', {
          url,
          error: parseError.message,
          dataLength: dataStr.length,
          dataSample: dataStr.substring(0, 300),
          status: response.status,
          contentType: response.headers['content-type'],
        });
        throw new Error(`TBO API returned invalid JSON: ${parseError.message}. Response: ${dataStr.substring(0, 200)}`);
      }
    } else {
      // Not JSON, return as string
      response.data = dataStr;
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
