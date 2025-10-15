const RateHawkAdapter = require("./services/adapters/ratehawkAdapter");

(async () => {
  const adapter = new RateHawkAdapter();
  try {
    const staticData = await adapter.getHotelStatic(3, 0);
    const hotels = Array.isArray(staticData)
      ? staticData
      : Array.isArray(staticData?.hotels)
        ? staticData.hotels
        : Array.isArray(staticData?.data)
          ? staticData.data
          : [];

    console.log("Hotel count:", hotels.length);
    hotels.slice(0, 3).forEach((hotel, index) => {
      console.log(`\nHotel #${index + 1}`);
      console.log("ID:", hotel?.id);
      console.log("Region ID:", hotel?.region_id);
      console.log("City ID:", hotel?.city_id);
      console.log("Country ID:", hotel?.country_id);
      console.log("Name EN:", hotel?.name?.find?.((n) => n.lang === "en")?.value);
    });
  } catch (error) {
    console.error("Failed to fetch static data", error.response?.data || error);
  } finally {
    setTimeout(() => process.exit(), 500);
  }
})();
