const RateHawkAdapter = require("./services/adapters/ratehawkAdapter");

(async () => {
  const adapter = new RateHawkAdapter();
  try {
    const staticData = await adapter.getHotelStatic(5, 0);
    console.log("Type:", typeof staticData, Array.isArray(staticData));
    console.log(JSON.stringify(staticData, null, 2));
  } catch (error) {
    console.error("Failed to fetch static data", error);
  } finally {
    setTimeout(() => process.exit(), 500);
  }
})();
