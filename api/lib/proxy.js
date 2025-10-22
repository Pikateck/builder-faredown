let HttpsProxyAgentCtor = null;
let HttpProxyAgentCtor = null;
try {
  HttpsProxyAgentCtor = require("https-proxy-agent").HttpsProxyAgent;
  HttpProxyAgentCtor = require("http-proxy-agent").HttpProxyAgent;
} catch (_) {}

const FIXIE_URL = process.env.FIXIE_URL || "";
const USE_SUPPLIER_PROXY = String(process.env.USE_SUPPLIER_PROXY || "false") === "true";

let agents = { https: undefined, http: undefined };
if (USE_SUPPLIER_PROXY && FIXIE_URL && HttpsProxyAgentCtor && HttpProxyAgentCtor) {
  try {
    agents.https = new HttpsProxyAgentCtor(FIXIE_URL);
    agents.http = new HttpProxyAgentCtor(FIXIE_URL);
  } catch (_) {}
}

function agentFor(url) {
  try {
    if (!USE_SUPPLIER_PROXY || !FIXIE_URL) return {};
    if (!HttpsProxyAgentCtor || !HttpProxyAgentCtor) return {};
    return url && url.startsWith("https:") ? { httpsAgent: agents.https } : { httpAgent: agents.http };
  } catch (_) {
    return {};
  }
}

function proxyMode() {
  return USE_SUPPLIER_PROXY && FIXIE_URL && HttpsProxyAgentCtor && HttpProxyAgentCtor ? "fixie" : "direct";
}

module.exports = { agents, agentFor, proxyMode };
