const axios = require("axios");
const { agentFor, proxyMode } = require("./proxy");

async function rhRequest(url, config = {}) {
  const agentCfg = agentFor(url);
  const req = { url, method: "GET", timeout: 20000, ...agentCfg, ...config };
  return axios(req);
}

function rhVia() {
  return proxyMode();
}

module.exports = { rhRequest, rhVia };
