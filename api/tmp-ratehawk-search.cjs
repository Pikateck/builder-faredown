const supplierAdapterManager = require("./services/adapters/supplierAdapterManager");

(async () => {
  try {
    supplierAdapterManager.resetAdapterCircuitBreaker("RATEHAWK");
    const result = await supplierAdapterManager.searchAllHotels(
      {
        destination: "DXB",
        destinationName: "Dubai",
        checkIn: "2026-01-12",
        checkOut: "2026-01-15",
        rooms: [
          {
            adults: 2,
            children: 0,
            childAges: [],
          },
        ],
        currency: "AED",
        maxResults: 50,
        adults: 2,
        children: 0,
        roomsCount: 1,
        childAges: [],
        destinationCode: "DXB",
        rawDestination: "Dubai",
      },
      ["HOTELBEDS", "RATEHAWK"],
    );

    const summary = {
      totalResults: result.totalResults,
      supplierMetrics: result.supplierMetrics,
      suppliers: Object.keys(result.supplierMetrics),
      samples: result.products.slice(0, 5).map((product) => ({
        supplier: product.supplier,
        hotelId: product.hotelId || product.id,
        totalPrice: product.totalPrice || product.price,
        currency: product.currency,
      })),
    };

    console.log(JSON.stringify(summary, null, 2));
  } catch (error) {
    console.error("RateHawk search script failed", error);
    process.exitCode = 1;
  } finally {
    setTimeout(() => process.exit(), 200);
  }
})();
