/**
 * TBO Bookings Management Routes
 * Get booking details, history, and analytics
 */

const express = require("express");
const router = express.Router();
const TBOHotelBooking = require("../../models/TBOHotelBooking");
const TBOHotelRateHistory = require("../../models/TBOHotelRateHistory");

/**
 * GET /api/tbo/bookings/:id
 * Get a single booking by ID
 */
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const result = await TBOHotelBooking.findById(id);

    if (!result.success) {
      return res.status(404).json({
        success: false,
        error: "Booking not found",
      });
    }

    // Get rate history for this booking
    const historyResult = await TBOHotelRateHistory.getByBookingId(id);

    res.json({
      success: true,
      data: result.data,
      rateHistory: historyResult.data || [],
    });
  } catch (error) {
    console.error("Error fetching booking:", error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * GET /api/tbo/bookings/trace/:traceId
 * Get bookings by trace ID
 */
router.get("/trace/:traceId", async (req, res) => {
  try {
    const { traceId } = req.params;

    const result = await TBOHotelBooking.findByTraceId(traceId);

    if (!result.success) {
      return res.status(404).json({
        success: false,
        error: "Booking not found",
      });
    }

    // Get rate history
    const historyResult = await TBOHotelRateHistory.getByTraceId(traceId);

    res.json({
      success: true,
      data: result.data,
      rateHistory: historyResult.data || [],
    });
  } catch (error) {
    console.error("Error fetching booking by trace ID:", error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * GET /api/tbo/bookings
 * Get all bookings with filters and pagination
 * Query params: hotel_code, hotel_name, block_status, book_status, page, limit
 */
router.get("/", async (req, res) => {
  try {
    const {
      hotel_code,
      hotel_name,
      block_status,
      book_status,
      page = 1,
      limit = 20,
    } = req.query;

    const filters = {};
    if (hotel_code) filters.hotel_code = hotel_code;
    if (hotel_name) filters.hotel_name = hotel_name;
    if (block_status) filters.block_status = block_status;
    if (book_status) filters.book_status = book_status;

    const result = await TBOHotelBooking.getAll(
      filters,
      parseInt(page),
      parseInt(limit)
    );

    res.json(result);
  } catch (error) {
    console.error("Error fetching bookings:", error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * GET /api/tbo/bookings/:id/rate-history
 * Get rate history for a specific booking
 */
router.get("/:id/rate-history", async (req, res) => {
  try {
    const { id } = req.params;

    const result = await TBOHotelRateHistory.getByBookingId(id);

    res.json({
      success: true,
      data: result.data || [],
    });
  } catch (error) {
    console.error("Error fetching rate history:", error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * GET /api/tbo/bookings/analytics/stats
 * Get analytics and statistics
 * Query params: dateFrom, dateTo
 */
router.get("/analytics/stats", async (req, res) => {
  try {
    const { dateFrom, dateTo } = req.query;

    if (!dateFrom || !dateTo) {
      return res.status(400).json({
        success: false,
        error: "Missing required query parameters: dateFrom, dateTo",
      });
    }

    const [bookingAnalytics, priceStats] = await Promise.all([
      TBOHotelBooking.getAnalytics(dateFrom, dateTo),
      TBOHotelRateHistory.getPriceChangeStats(dateFrom, dateTo),
    ]);

    res.json({
      success: true,
      bookingAnalytics: bookingAnalytics.data,
      priceChangeStats: priceStats.data,
    });
  } catch (error) {
    console.error("Error fetching analytics:", error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * GET /api/tbo/bookings/analytics/price-changes
 * Get hotels with frequent price changes
 * Query params: dateFrom, dateTo, threshold
 */
router.get("/analytics/price-changes", async (req, res) => {
  try {
    const { dateFrom, dateTo, threshold = 5 } = req.query;

    if (!dateFrom || !dateTo) {
      return res.status(400).json({
        success: false,
        error: "Missing required query parameters: dateFrom, dateTo",
      });
    }

    const result = await TBOHotelRateHistory.getHotelsWithFrequentChanges(
      dateFrom,
      dateTo,
      parseInt(threshold)
    );

    res.json({
      success: true,
      data: result.data || [],
    });
  } catch (error) {
    console.error("Error fetching price change analysis:", error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

module.exports = router;
