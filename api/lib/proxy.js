const { HttpsProxyAgent } = require("https-proxy-agent");
const { HttpProxyAgent } = require("http-proxy-agent");

const FIXIE_URL = process.env.FIXIE_URL || "";
const USE_SUPPLIER_PROXY =
  String(process.env.USE_SUPPLIER_PROXY || "false") === "true";

const agents = {
  https:
    USE_SUPPLIER_PROXY && FIXIE_URL
      ? new HttpsProxyAgent(FIXIE_URL)
      : undefined,
  http:
    USE_SUPPLIER_PROXY && FIXIE_URL ? new HttpProxyAgent(FIXIE_URL) : undefined,
};

function agentFor(url) {
  try {
    if (!USE_SUPPLIER_PROXY || !FIXIE_URL) return {};
    return url && url.startsWith("https:")
      ? { httpsAgent: agents.https }
      : { httpAgent: agents.http };
  } catch (_) {
    return {};
  }
}

function proxyMode() {
  return USE_SUPPLIER_PROXY && FIXIE_URL ? "fixie" : "direct";
}

module.exports = { agents, agentFor, proxyMode };
