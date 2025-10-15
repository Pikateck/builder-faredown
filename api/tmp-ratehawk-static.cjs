const RateHawkAdapter = require("./services/adapters/ratehawkAdapter");

(async () => {
  const adapter = new RateHawkAdapter();
  try {
    const staticData = await adapter.getHotelStatic(5, 0);
    if (Array.isArray(staticData)) {
      console.log("Array length:", staticData.length);
      console.log(JSON.stringify(staticData[0], null, 2));
    } else if (staticData && typeof staticData === "object") {
      console.log("Keys:", Object.keys(staticData));
      const hotels = staticData.hotels || staticData.data || staticData.items;
      if (Array.isArray(hotels)) {
        console.log("Hotels length:", hotels.length);
        console.log(JSON.stringify(hotels[0], null, 2));
      } else {
        console.log(JSON.stringify(staticData, null, 2));
      }
    } else {
      console.log("Received:", staticData);
    }
  } catch (error) {
    console.error("Failed to fetch static data", error.response?.data || error);
  } finally {
    setTimeout(() => process.exit(), 500);
  }
})();
