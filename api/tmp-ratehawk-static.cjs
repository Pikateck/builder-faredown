const RateHawkAdapter = require("./services/adapters/ratehawkAdapter");

(async () => {
  const adapter = new RateHawkAdapter();
  try {
    const staticData = await adapter.getHotelStatic(1, 0);
    console.log("Type:", typeof staticData);
    if (staticData && typeof staticData === "object") {
      console.log("Keys:", Object.keys(staticData));
      if (Array.isArray(staticData.hotels)) {
        console.log("Hotels length:", staticData.hotels.length);
        console.log("Sample keys:", Object.keys(staticData.hotels[0] || {}));
      }
    } else if (Array.isArray(staticData)) {
      console.log("Array length:", staticData.length);
      console.log("Sample keys:", Object.keys(staticData[0] || {}));
    } else {
      console.log(staticData);
    }
  } catch (error) {
    console.error("Failed", error.response?.data || error.message);
  } finally {
    setTimeout(() => process.exit(), 200);
  }
})();
