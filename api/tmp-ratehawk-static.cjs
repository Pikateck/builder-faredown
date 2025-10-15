const RateHawkAdapter = require("./services/adapters/ratehawkAdapter");

(async () => {
  const adapter = new RateHawkAdapter();
  try {
    const staticData = await adapter.getHotelStatic(5, 0);
    console.log(JSON.stringify(staticData.slice(0, 5), null, 2));
  } catch (error) {
    console.error("Failed to fetch static data", error);
  } finally {
    setTimeout(() => process.exit(), 500);
  }
})();
