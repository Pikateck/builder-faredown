const RateHawkAdapter = require("./services/adapters/ratehawkAdapter");

(async () => {
  const adapter = new RateHawkAdapter();
  try {
    const staticData = await adapter.getHotelStatic(3, 0);
    console.log("Static data type:", typeof staticData);
    console.log("Keys:", staticData && typeof staticData === "object" ? Object.keys(staticData) : null);
    if (staticData?.hotels) {
      console.log("hotels length:", staticData.hotels.length);
      console.log("Sample hotel keys:", Object.keys(staticData.hotels[0] || {}));
      console.log("Sample hotel region:", staticData.hotels[0]?.region_id);
    } else if (Array.isArray(staticData)) {
      console.log("Array length:", staticData.length);
      console.log("Sample keys:", Object.keys(staticData[0] || {}));
      console.log("Sample region:", staticData[0]?.region_id);
    } else {
      console.log(JSON.stringify(staticData, null, 2));
    }
  } catch (error) {
    console.error("Failed to fetch static data", error.response?.data || error);
  } finally {
    setTimeout(() => process.exit(), 500);
  }
})();
