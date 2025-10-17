/**
 * Tests for HotelNormalizer TBO mappings
 */

const HotelNormalizer = require("../services/normalization/hotelNormalizer");

function iso(d) { return new Date(d).toISOString(); }

describe("HotelNormalizer.normalizeTBOHotel", () => {
  test("maps core fields and geo safely", () => {
    const raw = {
      HotelName: "Test Hotel",
      Address: "Sheikh Zayed Rd",
      CityName: "Dubai",
      CountryCode: "AE",
      StarRating: "5",
      Latitude: "25.2048",
      Longitude: "55.2708",
      GiataId: "12345",
      ImageUrl: "https://img/h.jpg",
      CheckInTime: "14:00",
      CheckOutTime: "12:00",
      Amenities: ["WiFi", "Pool"],
    };
    const out = HotelNormalizer.normalizeTBOHotel(raw, "TBO");
    expect(out).toBeTruthy();
    const h = out.hotelMasterData;
    expect(h.hotel_name).toBe("Test Hotel");
    expect(h.city).toBe("Dubai");
    expect(h.country).toBe("AE");
    expect(h.star_rating).toBe(5);
    expect(h.lat).toBeCloseTo(25.2048);
    expect(h.lng).toBeCloseTo(55.2708);
    expect(h.giata_id).toBe("12345");
    expect(h.thumbnail_url).toContain("https://img/");
    expect(Array.isArray(h.amenities_json)).toBe(true);
  });
});

describe("HotelNormalizer.normalizeTBORoomOffer", () => {
  test("derives cancellable_until from free cancel until and computes per-night", () => {
    const search = { checkin: "2026-01-10", checkout: "2026-01-12", currency: "INR", adults: 2, children: 0 };
    const rawOffer = {
      RoomName: "Deluxe Room",
      MealType: "BB",
      IsNonRefundable: false,
      FreeCancellationTill: "2026-01-09T23:59:59Z",
      Currency: "INR",
      TotalPrice: 6000,
      BasePrice: 5000,
      Taxes: 1000,
      Availability: 3,
      RateKey: "RATEKEY123",
      Adults: 2,
      Children: 0,
    };
    const out = HotelNormalizer.normalizeTBORoomOffer(rawOffer, "prop-1", "TBO", search);
    expect(out.room_name).toBe("Deluxe Room");
    expect(out.board_basis).toBe("BB");
    expect(out.currency).toBe("INR");
    expect(out.price_total).toBe(6000);
    expect(out.price_base).toBe(5000);
    expect(out.price_taxes).toBe(1000);
    expect(out.price_per_night).toBe(3000);
    expect(out.cancellable_until).toBe(iso("2026-01-09T23:59:59Z"));
    expect(out.free_cancellation).toBe(true);
    expect(out.rate_key_or_token).toBe("RATEKEY123");
  });

  test("uses cancellation policies when FreeCancellationTill absent", () => {
    const search = { checkin: "2026-01-10", checkout: "2026-01-11", currency: "INR" };
    const rawOffer = {
      RoomName: "Standard",
      BoardType: "RO",
      CancellationPolicies: [
        { FromDate: "2026-01-08T12:00:00Z", CancellationCharge: 0 },
        { FromDate: "2026-01-09T12:00:00Z", CancellationCharge: 50 },
      ],
      TotalPrice: 4000,
      RateCurrency: "INR",
    };
    const out = HotelNormalizer.normalizeTBORoomOffer(rawOffer, "p-2", "TBO", search);
    expect(out.board_basis).toBe("RO");
    expect(out.cancellable_until).toBe(iso("2026-01-08T12:00:00Z"));
    expect(out.free_cancellation).toBe(true);
    expect(out.price_total).toBe(4000);
    expect(out.price_per_night).toBe(4000);
  });
});
