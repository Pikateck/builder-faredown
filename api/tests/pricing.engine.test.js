/**
 * Pricing Engine Tests
 * Comprehensive test suite for the Faredown Pricing Engine
 */

const PricingEngine = require("../services/pricing/PricingEngine");

// Mock database connection
const mockDb = {
  query: jest.fn(),
};

describe("PricingEngine", () => {
  let pricingEngine;

  beforeEach(() => {
    pricingEngine = new PricingEngine(mockDb);
    jest.clearAllMocks();
  });

  describe("Parameter Validation", () => {
    test("should validate required parameters", () => {
      const result = pricingEngine.validateParams({});

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain("module is required");
      expect(result.errors).toContain("baseFare is required");
      expect(result.errors).toContain("currency is required");
    });

    test("should validate module values", () => {
      const result = pricingEngine.validateParams({
        module: "invalid",
        baseFare: 100,
        currency: "USD",
      });

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain(
        "module must be one of: air, hotel, sightseeing, transfer",
      );
    });

    test("should validate baseFare is positive number", () => {
      const result = pricingEngine.validateParams({
        module: "air",
        baseFare: -100,
        currency: "USD",
      });

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain("baseFare must be a positive number");
    });

    test("should pass validation with valid parameters", () => {
      const result = pricingEngine.validateParams({
        module: "air",
        baseFare: 500,
        currency: "USD",
      });

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });
  });

  describe("Markup Rule Matching", () => {
    test("should find most specific markup rule", async () => {
      const mockRule = {
        id: 1,
        module: "air",
        origin: "BOM",
        destination: "JFK",
        service_class: "Y",
        markup_type: "percent",
        markup_value: 8.0,
        priority: 10,
      };

      mockDb.query.mockResolvedValue({ rows: [mockRule] });

      const params = {
        module: "air",
        origin: "BOM",
        destination: "JFK",
        serviceClass: "Y",
        userType: "b2c",
      };

      const result = await pricingEngine.getApplicableMarkupRule(params);

      expect(result).toEqual(mockRule);
      expect(mockDb.query).toHaveBeenCalledWith(
        expect.stringContaining("SELECT * FROM markup_rules"),
        ["air", "BOM", "JFK", "Y", null, null, null, "b2c"],
      );
    });

    test("should return null when no rule matches", async () => {
      mockDb.query.mockResolvedValue({ rows: [] });

      const params = {
        module: "air",
        origin: "XXX",
        destination: "YYY",
      };

      const result = await pricingEngine.getApplicableMarkupRule(params);

      expect(result).toBeNull();
    });
  });

  describe("Promo Code Handling", () => {
    test("should find valid promo code", async () => {
      const mockPromo = {
        id: 1,
        code: "WELCOME10",
        type: "percent",
        value: 10.0,
        min_fare: null,
        max_discount: null,
      };

      mockDb.query.mockResolvedValue({ rows: [mockPromo] });

      const params = {
        module: "air",
        baseFare: 500,
        extras: { promoCode: "WELCOME10" },
      };

      const result = await pricingEngine.getPromoDiscount(params);

      expect(result).toEqual(mockPromo);
    });

    test("should return null for invalid promo code", async () => {
      mockDb.query.mockResolvedValue({ rows: [] });

      const params = {
        module: "air",
        baseFare: 500,
        extras: { promoCode: "INVALID" },
      };

      const result = await pricingEngine.getPromoDiscount(params);

      expect(result).toBeNull();
    });

    test("should return null when min fare not met", async () => {
      const mockPromo = {
        id: 1,
        code: "HIGHVALUE",
        type: "percent",
        value: 15.0,
        min_fare: 1000.0,
        max_discount: null,
      };

      mockDb.query.mockResolvedValue({ rows: [mockPromo] });

      const params = {
        module: "air",
        baseFare: 500, // Less than min_fare
        extras: { promoCode: "HIGHVALUE" },
      };

      const result = await pricingEngine.getPromoDiscount(params);

      expect(result).toBeNull();
    });

    test("should return promo when min fare is met", async () => {
      const mockPromo = {
        id: 1,
        code: "HIGHVALUE",
        type: "percent",
        value: 15.0,
        min_fare: 1000.0,
        max_discount: null,
      };

      mockDb.query.mockResolvedValue({ rows: [mockPromo] });

      const params = {
        module: "air",
        baseFare: 1500, // Meets min_fare
        extras: { promoCode: "HIGHVALUE" },
      };

      const result = await pricingEngine.getPromoDiscount(params);

      expect(result).toEqual(mockPromo);
    });
  });

  describe("Complete Quote Calculation", () => {
    test("should calculate quote with percentage markup and discount", async () => {
      // Mock markup rule
      const mockMarkupRule = {
        markup_type: "percent",
        markup_value: 10.0,
      };

      // Mock promo code
      const mockPromo = {
        type: "percent",
        value: 5.0,
        max_discount: null,
      };

      // Mock tax policy
      const mockTaxPolicy = {
        type: "percent",
        value: 12.0,
      };

      mockDb.query
        .mockResolvedValueOnce({ rows: [mockMarkupRule] }) // getApplicableMarkupRule
        .mockResolvedValueOnce({ rows: [mockPromo] }) // getPromoDiscount
        .mockResolvedValueOnce({ rows: [mockTaxPolicy] }); // getTaxPolicy

      const params = {
        module: "air",
        baseFare: 1000,
        currency: "USD",
        extras: { promoCode: "SAVE5" },
      };

      const result = await pricingEngine.quote(params);

      // Expected calculation:
      // baseFare: 1000
      // markup: 1000 * 0.10 = 100
      // discount: (1000 + 100) * 0.05 = 55
      // taxableAmount: 1000 + 100 - 55 = 1045
      // tax: 1045 * 0.12 = 125.40
      // totalFare: 1045 + 125.40 = 1170.40

      expect(result.baseFare).toBe(1000);
      expect(result.markup).toBe(100);
      expect(result.discount).toBe(55);
      expect(result.tax).toBe(125.4);
      expect(result.totalFare).toBe(1170.4);
      expect(result.currency).toBe("USD");
    });

    test("should calculate quote with fixed markup and no discount", async () => {
      // Mock markup rule
      const mockMarkupRule = {
        markup_type: "fixed",
        markup_value: 50.0,
      };

      // Mock tax policy
      const mockTaxPolicy = {
        type: "fixed",
        value: 25.0,
      };

      mockDb.query
        .mockResolvedValueOnce({ rows: [mockMarkupRule] }) // getApplicableMarkupRule
        .mockResolvedValueOnce({ rows: [] }) // getPromoDiscount (no promo)
        .mockResolvedValueOnce({ rows: [mockTaxPolicy] }); // getTaxPolicy

      const params = {
        module: "hotel",
        baseFare: 800,
        currency: "USD",
      };

      const result = await pricingEngine.quote(params);

      // Expected calculation:
      // baseFare: 800
      // markup: 50 (fixed)
      // discount: 0 (no promo)
      // taxableAmount: 800 + 50 - 0 = 850
      // tax: 25 (fixed)
      // totalFare: 850 + 25 = 875

      expect(result.baseFare).toBe(800);
      expect(result.markup).toBe(50);
      expect(result.discount).toBe(0);
      expect(result.tax).toBe(25);
      expect(result.totalFare).toBe(875);
    });

    test("should apply max discount limit", async () => {
      // Mock markup rule
      const mockMarkupRule = {
        markup_type: "percent",
        markup_value: 0, // No markup for simplicity
      };

      // Mock promo code with max discount
      const mockPromo = {
        type: "percent",
        value: 50.0, // 50% would be 500, but max_discount is 100
        max_discount: 100.0,
      };

      // Mock tax policy
      const mockTaxPolicy = {
        type: "percent",
        value: 0, // No tax for simplicity
      };

      mockDb.query
        .mockResolvedValueOnce({ rows: [mockMarkupRule] })
        .mockResolvedValueOnce({ rows: [mockPromo] })
        .mockResolvedValueOnce({ rows: [mockTaxPolicy] });

      const params = {
        module: "air",
        baseFare: 1000,
        currency: "USD",
        extras: { promoCode: "BIGDISCOUNT" },
      };

      const result = await pricingEngine.quote(params);

      // Discount should be capped at max_discount (100) instead of 50% of 1000 (500)
      expect(result.discount).toBe(100);
      expect(result.totalFare).toBe(900); // 1000 - 100
    });

    test("should handle debug mode", async () => {
      mockDb.query
        .mockResolvedValueOnce({ rows: [] }) // No markup rule
        .mockResolvedValueOnce({ rows: [] }) // No promo
        .mockResolvedValueOnce({ rows: [] }); // No tax

      const params = {
        module: "air",
        baseFare: 500,
        currency: "USD",
        debug: true,
      };

      const result = await pricingEngine.quote(params);

      expect(result.breakdown).toBeDefined();
      expect(result.breakdown.steps).toBeInstanceOf(Array);
      expect(result.breakdown.steps[0]).toEqual({
        label: "baseFare",
        value: 500,
      });
    });
  });

  describe("Promo Usage Tracking", () => {
    test("should increment promo usage count", async () => {
      mockDb.query.mockResolvedValue({ rowCount: 1 });

      await pricingEngine.incrementPromoUsage("WELCOME10");

      expect(mockDb.query).toHaveBeenCalledWith(
        expect.stringContaining(
          "UPDATE promo_codes SET usage_count = usage_count + 1",
        ),
        ["WELCOME10"],
      );
    });
  });

  describe("Rules Summary", () => {
    test("should get rules summary for all modules", async () => {
      const mockSummary = [
        {
          module: "air",
          total_rules: 5,
          active_rules: 4,
          avg_percent_markup: 8.5,
          avg_fixed_markup: null,
        },
      ];

      mockDb.query.mockResolvedValue({ rows: mockSummary });

      const result = await pricingEngine.getRulesSummary();

      expect(result).toEqual(mockSummary);
      expect(mockDb.query).toHaveBeenCalledWith(
        expect.stringContaining("SELECT module, COUNT(*) as total_rules"),
        [],
      );
    });

    test("should get rules summary for specific module", async () => {
      const mockSummary = [
        {
          module: "air",
          total_rules: 3,
          active_rules: 3,
          avg_percent_markup: 7.0,
          avg_fixed_markup: null,
        },
      ];

      mockDb.query.mockResolvedValue({ rows: mockSummary });

      const result = await pricingEngine.getRulesSummary("air");

      expect(result).toEqual(mockSummary);
      expect(mockDb.query).toHaveBeenCalledWith(
        expect.stringContaining("WHERE module = $1"),
        ["air"],
      );
    });
  });

  describe("Error Handling", () => {
    test("should handle database errors gracefully", async () => {
      mockDb.query.mockRejectedValue(new Error("Database connection failed"));

      await expect(pricingEngine.getApplicableMarkupRule({})).rejects.toThrow(
        "Database connection failed",
      );
    });

    test("should handle invalid parameters in quote method", async () => {
      const params = {
        module: "air",
        baseFare: "invalid", // Should be number
        currency: "USD",
      };

      // The quote method should handle this gracefully
      mockDb.query
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({ rows: [] });

      const result = await pricingEngine.quote(params);

      expect(result.baseFare).toBe(0); // Should default to 0 for invalid number
    });
  });
});
