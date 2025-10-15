const RateHawkAdapter = require("./services/adapters/ratehawkAdapter");

(async () => {
  try {
    const adapter = new RateHawkAdapter();
    const regions = await adapter.searchRegions("Dubai", "en");
    console.log(JSON.stringify(regions.slice(0, 10), null, 2));
  } catch (error) {
    console.error("Failed to fetch regions", error);
    process.exitCode = 1;
  } finally {
    setTimeout(() => process.exit(), 200);
  }
})();
