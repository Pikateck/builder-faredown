/**
 * Tests for TBOAdapter.getChangeRequestStatus payload
 */

const TBOAdapter = require("../services/adapters/tboAdapter");

describe("TBOAdapter change request status payload", () => {
  test("posts to /GetChangeRequestStatus with TokenId and params", async () => {
    const adapter = new TBOAdapter({});
    adapter.getHotelToken = jest.fn().mockResolvedValue("tok-3");
    const postMock = jest.fn().mockResolvedValue({ data: { Status: 1, Result: {} } });
    adapter.hotelBookingClient.post = postMock;

    await adapter.getChangeRequestStatus({ ChangeRequestId: 9876, BookingId: 555 });

    expect(postMock).toHaveBeenCalledTimes(1);
    const [endpoint, payload] = postMock.mock.calls[0];
    expect(endpoint).toBe("/GetChangeRequestStatus");
    expect(payload.TokenId).toBe("tok-3");
    expect(payload.ChangeRequestId).toBe(9876);
    expect(payload.BookingId).toBe(555);
    expect(payload.EndUserIp).toBeDefined();
  });
});
