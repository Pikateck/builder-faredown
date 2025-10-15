/**
 * Supplier Markup Service Tests
 */

jest.mock("../database/connection", () => ({
  query: jest.fn(),
}));

const db = require("../database/connection");
const {
  resolveSupplierMarkup,
  applyMarkupToAmount,
  buildPricingBreakdown,
  buildPricingHash,
} = require("../services/pricing/supplierMarkupService");

describe("supplierMarkupService", () => {
  beforeEach(() => {
    db.query.mockReset();
  });

  describe("resolveSupplierMarkup", () => {
    test("returns most specific rule from database", async () => {
      db.query.mockResolvedValue({
        rows: [
          {
            value_type: "PERCENT",
            value: 12,
            priority: 5,
          },
        ],
      });

      const rule = await resolveSupplierMarkup({
        supplierCode: "ratehawk",
        module: "hotels",
        market: "IN",
        currency: "AED",
        hotelId: "123",
        destination: "DXB",
        channel: "web",
      });

      expect(db.query).toHaveBeenCalledWith(
        expect.stringContaining("get_effective_supplier_markup"),
        ["ratehawk", "hotels", "IN", "AED", "123", "DXB", "web"],
      );
      expect(rule).toEqual({ value_type: "PERCENT", value: 12, priority: 5 });
    });

    test("falls back to default rule when no data", async () => {
      db.query.mockResolvedValue({ rows: [] });

      const rule = await resolveSupplierMarkup({
        supplierCode: "missing",
        module: "flights",
      });

      expect(rule.value_type).toBe("PERCENT");
      expect(rule.value).toBeGreaterThan(0);
    });
  });

  describe("applyMarkupToAmount", () => {
    test("applies percentage markup", () => {
      const result = applyMarkupToAmount(100, { value_type: "PERCENT", value: 10 });
      expect(result.finalAmount).toBe(110);
      expect(result.markupAmount).toBe(10);
    });

    test("applies flat markup", () => {
      const result = applyMarkupToAmount(200, { value_type: "FLAT", value: 25 });
      expect(result.finalAmount).toBe(225);
      expect(result.markupAmount).toBe(25);
    });
  });

  describe("buildPricingBreakdown", () => {
    test("returns consistent breakdown and final price", () => {
      const pricing = buildPricingBreakdown({
        base: 500,
        taxes: 75,
        fees: 25,
        markup: 50,
        discount: 20,
        currency: "AED",
      });

      expect(pricing.breakdown).toEqual({
        base: 500,
        taxes: 75,
        fees: 25,
        markup: 50,
        discount: 20,
      });
      expect(pricing.final_price).toEqual({ amount: 630, currency: "AED" });
    });
  });

  describe("buildPricingHash", () => {
    test("generates deterministic hash", () => {
      const hashA = buildPricingHash({ supplier: "tbo", rate: "R1" });
      const hashB = buildPricingHash({ supplier: "tbo", rate: "R1" });
      const hashC = buildPricingHash({ supplier: "tbo", rate: "R2" });

      expect(hashA).toBe(hashB);
      expect(hashA).not.toBe(hashC);
    });
  });
});
