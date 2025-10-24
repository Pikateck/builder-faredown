let HttpsProxyAgentCtor = null;
let HttpProxyAgentCtor = null;
try {
  HttpsProxyAgentCtor = require("https-proxy-agent").HttpsProxyAgent;
  HttpProxyAgentCtor = require("http-proxy-agent").HttpProxyAgent;
} catch (_) {}

const FIXIE_URL = process.env.FIXIE_URL || "";
const USE_SUPPLIER_PROXY =
  String(process.env.USE_SUPPLIER_PROXY || "false") === "true";

console.log("🔌 PROXY CONFIGURATION:");
console.log("  USE_SUPPLIER_PROXY:", USE_SUPPLIER_PROXY);
console.log("  FIXIE_URL:", FIXIE_URL ? "✅ SET" : "❌ NOT SET");
console.log("  HttpsProxyAgentCtor:", HttpsProxyAgentCtor ? "✅ LOADED" : "❌ NOT LOADED");
console.log("  HttpProxyAgentCtor:", HttpProxyAgentCtor ? "✅ LOADED" : "❌ NOT LOADED");

let agents = { https: undefined, http: undefined };
if (
  USE_SUPPLIER_PROXY &&
  FIXIE_URL &&
  HttpsProxyAgentCtor &&
  HttpProxyAgentCtor
) {
  try {
    agents.https = new HttpsProxyAgentCtor(FIXIE_URL);
    agents.http = new HttpProxyAgentCtor(FIXIE_URL);
    console.log("✅ Proxy agents initialized successfully");
  } catch (err) {
    console.log("❌ Proxy agent initialization failed:", err.message);
  }
} else {
  console.log("⚠️ Proxy NOT configured (missing dependencies or env vars)");
}

function agentFor(url) {
  try {
    if (!USE_SUPPLIER_PROXY || !FIXIE_URL) return {};
    if (!HttpsProxyAgentCtor || !HttpProxyAgentCtor) return {};
    return url && url.startsWith("https:")
      ? { httpsAgent: agents.https }
      : { httpAgent: agents.http };
  } catch (_) {
    return {};
  }
}

function proxyMode() {
  return USE_SUPPLIER_PROXY &&
    FIXIE_URL &&
    HttpsProxyAgentCtor &&
    HttpProxyAgentCtor
    ? "fixie"
    : "direct";
}

module.exports = { agents, agentFor, proxyMode };
