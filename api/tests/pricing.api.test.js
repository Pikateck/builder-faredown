/**
 * Pricing API Integration Tests
 * Tests for the pricing API endpoints
 */

const request = require("supertest");
const express = require("express");
const pricingRoutes = require("../routes/pricing");

// Create test app
const app = express();
app.use(express.json());
app.use("/api/pricing", pricingRoutes);

// Mock database queries
jest.mock("pg", () => ({
  Pool: jest.fn().mockImplementation(() => ({
    query: jest.fn(),
  })),
}));

describe("Pricing API Endpoints", () => {
  let mockPool;

  beforeEach(() => {
    const { Pool } = require("pg");
    mockPool = new Pool();
    jest.clearAllMocks();
  });

  describe("POST /api/pricing/quote", () => {
    test("should return pricing quote for valid parameters", async () => {
      // Mock database responses
      mockPool.query
        .mockResolvedValueOnce({
          rows: [
            {
              // markup rule
              markup_type: "percent",
              markup_value: 8.0,
            },
          ],
        })
        .mockResolvedValueOnce({ rows: [] }) // no promo
        .mockResolvedValueOnce({
          rows: [
            {
              // tax policy
              type: "percent",
              value: 12.0,
            },
          ],
        });

      const requestBody = {
        module: "air",
        origin: "BOM",
        destination: "JFK",
        serviceClass: "Y",
        airlineCode: "AI",
        currency: "USD",
        baseFare: 500,
        userType: "b2c",
      };

      const response = await request(app)
        .post("/api/pricing/quote")
        .send(requestBody)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty("baseFare", 500);
      expect(response.body.data).toHaveProperty("markup", 40); // 8% of 500
      expect(response.body.data).toHaveProperty("discount", 0);
      expect(response.body.data).toHaveProperty("totalFare");
      expect(response.body.data).toHaveProperty("currency", "USD");
    });

    test("should return 400 for missing required parameters", async () => {
      const requestBody = {
        // Missing module, baseFare, currency
        origin: "BOM",
        destination: "JFK",
      };

      const response = await request(app)
        .post("/api/pricing/quote")
        .send(requestBody)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe("Validation failed");
      expect(response.body.details).toContain("module is required");
      expect(response.body.details).toContain("baseFare is required");
      expect(response.body.details).toContain("currency is required");
    });

    test("should return 400 for invalid module", async () => {
      const requestBody = {
        module: "invalid_module",
        baseFare: 500,
        currency: "USD",
      };

      const response = await request(app)
        .post("/api/pricing/quote")
        .send(requestBody)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.details).toContain(
        "module must be one of: air, hotel, sightseeing, transfer",
      );
    });

    test("should handle promo code in request", async () => {
      // Mock database responses
      mockPool.query
        .mockResolvedValueOnce({ rows: [] }) // no markup rule
        .mockResolvedValueOnce({
          rows: [
            {
              // promo code
              type: "percent",
              value: 10.0,
              max_discount: null,
            },
          ],
        })
        .mockResolvedValueOnce({ rows: [] }) // no tax
        .mockResolvedValueOnce({ rowCount: 1 }); // promo usage update

      const requestBody = {
        module: "air",
        baseFare: 1000,
        currency: "USD",
        extras: {
          promoCode: "WELCOME10",
        },
      };

      const response = await request(app)
        .post("/api/pricing/quote")
        .send(requestBody)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.discount).toBe(100); // 10% of 1000
    });

    test("should enable debug mode when requested", async () => {
      mockPool.query
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({ rows: [] });

      const requestBody = {
        module: "air",
        baseFare: 500,
        currency: "USD",
        debug: true,
      };

      const response = await request(app)
        .post("/api/pricing/quote")
        .send(requestBody)
        .expect(200);

      expect(response.body.data.breakdown).toBeDefined();
      expect(response.body.data.breakdown.steps).toBeInstanceOf(Array);
    });

    test("should handle database errors", async () => {
      mockPool.query.mockRejectedValue(new Error("Database error"));

      const requestBody = {
        module: "air",
        baseFare: 500,
        currency: "USD",
      };

      const response = await request(app)
        .post("/api/pricing/quote")
        .send(requestBody)
        .expect(500);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe("Pricing calculation failed");
    });
  });

  describe("GET /api/pricing/rules/preview", () => {
    test("should return rule preview for given parameters", async () => {
      const mockRule = {
        id: 1,
        module: "air",
        markup_type: "percent",
        markup_value: 8.0,
      };

      const mockTaxPolicy = {
        id: 1,
        module: "air",
        type: "percent",
        value: 12.0,
      };

      mockPool.query
        .mockResolvedValueOnce({ rows: [mockRule] }) // markup rule
        .mockResolvedValueOnce({ rows: [mockTaxPolicy] }); // tax policy

      const response = await request(app)
        .get("/api/pricing/rules/preview")
        .query({
          module: "air",
          origin: "BOM",
          destination: "JFK",
          serviceClass: "Y",
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.matchedRule).toEqual(mockRule);
      expect(response.body.data.taxPolicy).toEqual(mockTaxPolicy);
      expect(response.body.data.parameters.module).toBe("air");
    });

    test("should include promo code when provided", async () => {
      const mockPromo = {
        id: 1,
        code: "WELCOME10",
        type: "percent",
        value: 10.0,
      };

      mockPool.query
        .mockResolvedValueOnce({ rows: [] }) // no markup rule
        .mockResolvedValueOnce({ rows: [] }) // no tax policy
        .mockResolvedValueOnce({ rows: [mockPromo] }); // promo code

      const response = await request(app)
        .get("/api/pricing/rules/preview")
        .query({
          module: "air",
          promoCode: "WELCOME10",
        })
        .expect(200);

      expect(response.body.data.promoCode).toEqual(mockPromo);
    });
  });

  describe("GET /api/pricing/rules/summary", () => {
    test("should return rules summary for all modules", async () => {
      const mockSummary = [
        {
          module: "air",
          total_rules: 5,
          active_rules: 4,
          avg_percent_markup: 8.5,
        },
        {
          module: "hotel",
          total_rules: 3,
          active_rules: 3,
          avg_percent_markup: 10.0,
        },
      ];

      mockPool.query.mockResolvedValueOnce({ rows: mockSummary });

      const response = await request(app)
        .get("/api/pricing/rules/summary")
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual(mockSummary);
    });

    test("should return rules summary for specific module", async () => {
      const mockSummary = [
        {
          module: "air",
          total_rules: 5,
          active_rules: 4,
          avg_percent_markup: 8.5,
        },
      ];

      mockPool.query.mockResolvedValueOnce({ rows: mockSummary });

      const response = await request(app)
        .get("/api/pricing/rules/summary")
        .query({ module: "air" })
        .expect(200);

      expect(response.body.data).toEqual(mockSummary);
    });
  });

  describe("POST /api/pricing/validate", () => {
    test("should validate parameters correctly", async () => {
      const requestBody = {
        module: "air",
        baseFare: 500,
        currency: "USD",
      };

      const response = await request(app)
        .post("/api/pricing/validate")
        .send(requestBody)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.isValid).toBe(true);
      expect(response.body.data.errors).toHaveLength(0);
    });

    test("should return validation errors for invalid parameters", async () => {
      const requestBody = {
        module: "invalid",
        baseFare: -100,
        // missing currency
      };

      const response = await request(app)
        .post("/api/pricing/validate")
        .send(requestBody)
        .expect(200);

      expect(response.body.data.isValid).toBe(false);
      expect(response.body.data.errors.length).toBeGreaterThan(0);
    });
  });

  describe("GET /api/pricing/health", () => {
    test("should return healthy status when database is accessible", async () => {
      mockPool.query.mockResolvedValueOnce({ rows: [{ "?column?": 1 }] });

      const response = await request(app)
        .get("/api/pricing/health")
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.status).toBe("healthy");
      expect(response.body.service).toBe("Faredown Pricing Engine");
    });

    test("should return unhealthy status when database is not accessible", async () => {
      mockPool.query.mockRejectedValue(new Error("Connection failed"));

      const response = await request(app)
        .get("/api/pricing/health")
        .expect(503);

      expect(response.body.success).toBe(false);
      expect(response.body.status).toBe("unhealthy");
    });
  });

  describe("Error Handling", () => {
    test("should handle malformed JSON in request body", async () => {
      const response = await request(app)
        .post("/api/pricing/quote")
        .set("Content-Type", "application/json")
        .send("{ invalid json }")
        .expect(400);

      // Express will handle malformed JSON and return 400
    });

    test("should handle missing Content-Type header", async () => {
      const response = await request(app)
        .post("/api/pricing/quote")
        .send("module=air&baseFare=500") // URL encoded instead of JSON
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });
});
