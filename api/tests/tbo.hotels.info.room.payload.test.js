/**
 * Tests for TBOAdapter getHotelInfo and getHotelRoom payload construction
 */

const TBOAdapter = require("../services/adapters/tboAdapter");

describe("TBOAdapter hotel info/room payloads", () => {
  test("getHotelInfo posts to /HotelInfo with TokenId and HotelCode", async () => {
    const adapter = new TBOAdapter({});
    adapter.getHotelToken = jest.fn().mockResolvedValue("tok-1");
    const postMock = jest.fn().mockResolvedValue({ data: { Status: 1, Hotel: {} } });
    adapter.hotelSearchClient.post = postMock;

    await adapter.getHotelInfo({ HotelCode: "12345" });

    expect(adapter.getHotelToken).toHaveBeenCalled();
    expect(postMock).toHaveBeenCalledTimes(1);
    const [endpoint, payload] = postMock.mock.calls[0];
    expect(endpoint).toBe("/HotelInfo");
    expect(payload.TokenId).toBe("tok-1");
    expect(payload.HotelCode).toBe("12345");
    expect(payload.EndUserIp).toBeDefined();
  });

  test("getHotelRoom posts to /HotelRoom with TokenId and RateKey", async () => {
    const adapter = new TBOAdapter({});
    adapter.getHotelToken = jest.fn().mockResolvedValue("tok-2");
    const postMock = jest.fn().mockResolvedValue({ data: { Status: 1, Rooms: [] } });
    adapter.hotelSearchClient.post = postMock;

    await adapter.getHotelRoom({ RateKey: "rate_abc" });

    const [endpoint, payload] = postMock.mock.calls[0];
    expect(endpoint).toBe("/HotelRoom");
    expect(payload.TokenId).toBe("tok-2");
    expect(payload.RateKey).toBe("rate_abc");
    expect(payload.EndUserIp).toBeDefined();
  });
});
