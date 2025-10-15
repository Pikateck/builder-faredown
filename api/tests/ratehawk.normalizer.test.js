/**
 * RateHawk Adapter Normalization Tests
 */

const RateHawkAdapter = require("../services/adapters/ratehawkAdapter");

describe("RateHawkAdapter.transformRateHawkHotel", () => {
  const adapter = new RateHawkAdapter({});

  test("normalizes RateHawk hotel payload", () => {
    const payload = {
      id: 9988,
      name: "Downtown Suites",
      region: { id: 123, name: "Dubai" },
      location: { coordinates: { lat: 25.2, lon: 55.3 } },
      star_rating: 5,
      images: [{ url: "https://img.example/hotel.jpg" }],
      rates: [
        {
          book_hash: "RH-9988-1",
          room_name: "Deluxe Room",
          meal: "Breakfast",
          payment_options: {
            cancellation_penalties: [],
            payment_types: [
              {
                amount: 520,
                currency_code: "AED",
              },
            ],
          },
        },
      ],
    };

    const normalized = adapter.transformRateHawkHotel(
      payload,
      "2025-12-20",
      "2025-12-25",
    );

    expect(normalized.id).toBe("rh_9988");
    expect(normalized.hotelId).toBe("9988");
    expect(normalized.name).toBe("Downtown Suites");
    expect(normalized.price.amount).toBe(520);
    expect(normalized.price.currency).toBe("AED");
    expect(normalized.rates).toHaveLength(1);
    expect(normalized.rates[0]).toMatchObject({
      rateKey: "RH-9988-1",
      roomType: "Deluxe Room",
      boardType: "Breakfast",
    });
    expect(normalized.supplierHotelId).toBe("9988");
  });
});
