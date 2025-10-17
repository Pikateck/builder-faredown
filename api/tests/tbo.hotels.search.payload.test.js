/**
 * Tests for TBOAdapter.searchHotels payload construction
 * - Supports multi-room arrays with per-room child ages
 * - Falls back to single room (adults/children/childAges)
 */

const TBOAdapter = require("../services/adapters/tboAdapter");

describe("TBOAdapter.searchHotels payload", () => {
  test("builds RoomGuests from rooms array with child ages and sets NoOfRooms", async () => {
    const adapter = new TBOAdapter({});

    // Stub token and HTTP client
    adapter.getHotelToken = jest.fn().mockResolvedValue("token-abc");
    const postMock = jest.fn().mockResolvedValue({ data: { HotelResult: [] } });
    adapter.hotelSearchClient.post = postMock;

    const params = {
      destination: "DXB",
      checkIn: "2026-01-12",
      checkOut: "2026-01-15",
      currency: "INR",
      rooms: [
        { adults: 2, children: 1, childAges: [7] },
        { adults: 1, children: 2, childAges: [4, 9] },
      ],
    };

    await adapter.searchHotels(params);

    expect(adapter.getHotelToken).toHaveBeenCalled();
    expect(postMock).toHaveBeenCalledTimes(1);

    const [endpoint, payload] = postMock.mock.calls[0];
    expect(endpoint).toBe("/Search");

    // Payload assertions
    expect(payload.TokenId).toBe("token-abc");
    expect(payload.City).toBe("DXB");
    expect(payload.CheckIn).toBe("2026-01-12");
    expect(payload.CheckOut).toBe("2026-01-15");
    expect(payload.PreferredCurrency).toBe("INR");
    expect(payload.NoOfRooms).toBe(2);
    expect(Array.isArray(payload.RoomGuests)).toBe(true);
    expect(payload.RoomGuests).toEqual([
      { NoOfAdults: 2, NoOfChild: 1, ChildAge: [7] },
      { NoOfAdults: 1, NoOfChild: 2, ChildAge: [4, 9] },
    ]);
  });

  test("uses single-room adults/children/childAges when rooms is a number", async () => {
    const adapter = new TBOAdapter({});

    adapter.getHotelToken = jest.fn().mockResolvedValue("token-xyz");
    const postMock = jest.fn().mockResolvedValue({ data: { HotelResult: [] } });
    adapter.hotelSearchClient.post = postMock;

    const params = {
      destination: "BOM",
      checkIn: "2026-02-01",
      checkOut: "2026-02-03",
      currency: "INR",
      rooms: 1,
      adults: 2,
      children: 1,
      childAges: [6],
    };

    await adapter.searchHotels(params);

    const [endpoint, payload] = postMock.mock.calls[0];
    expect(endpoint).toBe("/Search");
    expect(payload.NoOfRooms).toBe(1);
    expect(payload.RoomGuests).toEqual([
      { NoOfAdults: 2, NoOfChild: 1, ChildAge: [6] },
    ]);
  });
});
