/**
 * TBO Adapter Normalization Tests
 */

const TBOAdapter = require("../services/adapters/tboAdapter");

describe("TBOAdapter.transformTBOFlightOffer", () => {
  const adapter = new TBOAdapter({});

  test("maps TBO flight offer to canonical structure", () => {
    const offer = {
      ResultIndex: "R1",
      TraceId: "TRACE",
      Fare: {
        PublishedFare: 1000,
        BaseFare: 800,
        Tax: 150,
        OtherCharges: 30,
        ServiceFee: 20,
        Currency: "INR",
      },
      Segments: [
        [
          {
            Airline: {
              AirlineCode: "AI",
              FlightNumber: "101",
              AircraftType: "320",
            },
            Origin: {
              Airport: { AirportCode: "BOM" },
              DepTime: "2025-01-20T10:00:00",
            },
            Destination: {
              Airport: { AirportCode: "DXB" },
              ArrTime: "2025-01-20T12:30:00",
            },
            Duration: 150,
            CabinClass: 1,
            BookingClass: "Y",
            FareBasis: "YREF",
            FareClassification: { Type: "Flex" },
            Baggage: "25kg",
          },
        ],
      ],
      IsRefundable: true,
      IsLCC: false,
    };

    const normalized = adapter.transformTBOFlightOffer(offer);

    expect(normalized.id).toBe("R1");
    expect(normalized.airline).toBe("AI");
    expect(normalized.origin).toBe("BOM");
    expect(normalized.destination).toBe("DXB");
    expect(normalized.price).toBe(1000);
    expect(normalized.currency).toBe("INR");
    expect(normalized.taxes).toBeCloseTo(200);
    expect(normalized.netPrice).toBe(800);
    expect(normalized.baggageAllowance).toBe("25kg");
    expect(normalized.supplierCode).toBe("TBO");
  });
});
