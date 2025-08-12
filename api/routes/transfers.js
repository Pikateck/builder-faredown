/**
 * Transfers API Routes
 * Handles all transfer-related API endpoints
 */

const express = require("express");
const transfersService = require("../services/transfersService");
const transfersRepository = require("../repositories/transfersRepository");
const { validateBookingData } = require("../middleware/validation");
const { auditRequest } = require("../middleware/audit");
const router = express.Router();

/**
 * @route POST /api/transfers/search
 * @desc Search for available transfers
 * @access Public
 */
router.post("/search", auditRequest, async (req, res) => {
  try {
    const {
      pickupLocation,
      dropoffLocation,
      pickupDate,
      pickupTime = "10:00",
      returnDate,
      returnTime = "14:00",
      passengers = { adults: 2, children: 0, infants: 0 },
      isRoundTrip = false,
      vehicleType,
      currency = "INR",
      promoCode,
    } = req.body;

    // Validate required fields
    if (!pickupLocation || !dropoffLocation || !pickupDate) {
      return res.status(400).json({
        success: false,
        error: "Missing required fields: pickupLocation, dropoffLocation, pickupDate",
      });
    }

    const searchParams = {
      pickupLocation,
      dropoffLocation,
      pickupDate,
      pickupTime,
      returnDate,
      returnTime,
      passengers,
      isRoundTrip,
      vehicleType,
      currency,
      promoCode,
      userAgent: req.headers["user-agent"],
      ipAddress: req.ip,
    };

    const results = await transfersService.searchTransfers(searchParams);

    res.json({
      success: true,
      data: results,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Transfer search error:", error);
    res.status(500).json({
      success: false,
      error: error.message || "Failed to search transfers",
    });
  }
});

/**
 * @route GET /api/transfers/product/:transferId
 * @desc Get detailed information about a specific transfer
 * @access Public
 */
router.get("/product/:transferId", auditRequest, async (req, res) => {
  try {
    const { transferId } = req.params;
    const searchParams = req.query;

    if (!transferId) {
      return res.status(400).json({
        success: false,
        error: "Transfer ID is required",
      });
    }

    const details = await transfersService.getTransferDetails(transferId, searchParams);

    res.json({
      success: true,
      data: details,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Get transfer details error:", error);
    
    if (error.message.includes("not found")) {
      return res.status(404).json({
        success: false,
        error: "Transfer not found",
      });
    }

    res.status(500).json({
      success: false,
      error: error.message || "Failed to get transfer details",
    });
  }
});

/**
 * @route POST /api/transfers/book
 * @desc Book a transfer
 * @access Public (should be protected with auth in production)
 */
router.post("/book", auditRequest, validateBookingData, async (req, res) => {
  try {
    const {
      transferId,
      guestDetails,
      pickupLocation,
      dropoffLocation,
      pickupDate,
      pickupTime,
      returnDate,
      returnTime,
      isRoundTrip = false,
      passengers,
      flightNumber,
      specialRequests,
      mobilityRequirements,
      childSeatsRequired = 0,
      totalAmount,
      currency = "INR",
      promoCode,
      paymentMethod = "card",
    } = req.body;

    // Validate required fields
    if (!transferId || !guestDetails || !totalAmount) {
      return res.status(400).json({
        success: false,
        error: "Missing required fields: transferId, guestDetails, totalAmount",
      });
    }

    // Validate guest details
    const requiredGuestFields = ["firstName", "lastName", "email", "phone"];
    for (const field of requiredGuestFields) {
      if (!guestDetails[field]) {
        return res.status(400).json({
          success: false,
          error: `Missing required guest field: ${field}`,
        });
      }
    }

    const bookingData = {
      transferId,
      guestDetails,
      pickupLocation,
      dropoffLocation,
      pickupDate,
      pickupTime,
      returnDate,
      returnTime,
      isRoundTrip,
      passengers,
      flightNumber,
      specialRequests,
      mobilityRequirements,
      childSeatsRequired,
      totalAmount,
      currency,
      promoCode,
      paymentMethod,
      userId: req.user?.id, // From auth middleware if implemented
      userAgent: req.headers["user-agent"],
      ipAddress: req.ip,
    };

    const booking = await transfersService.bookTransfer(bookingData);

    res.json({
      success: true,
      data: booking,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Transfer booking error:", error);
    
    if (error.message.includes("validation")) {
      return res.status(400).json({
        success: false,
        error: error.message,
      });
    }

    res.status(500).json({
      success: false,
      error: error.message || "Failed to book transfer",
    });
  }
});

/**
 * @route GET /api/transfers/booking/:bookingRef
 * @desc Get booking details by reference
 * @access Public (should be protected with auth in production)
 */
router.get("/booking/:bookingRef", auditRequest, async (req, res) => {
  try {
    const { bookingRef } = req.params;

    if (!bookingRef) {
      return res.status(400).json({
        success: false,
        error: "Booking reference is required",
      });
    }

    const booking = await transfersService.getBookingDetails(bookingRef);

    if (!booking) {
      return res.status(404).json({
        success: false,
        error: "Booking not found",
      });
    }

    res.json({
      success: true,
      data: booking,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Get booking details error:", error);
    
    if (error.message.includes("not found")) {
      return res.status(404).json({
        success: false,
        error: "Booking not found",
      });
    }

    res.status(500).json({
      success: false,
      error: error.message || "Failed to get booking details",
    });
  }
});

/**
 * @route POST /api/transfers/booking/:bookingRef/cancel
 * @desc Cancel a transfer booking
 * @access Public (should be protected with auth in production)
 */
router.post("/booking/:bookingRef/cancel", auditRequest, async (req, res) => {
  try {
    const { bookingRef } = req.params;
    const { reason, cancellationFlag = "CANCELLATION" } = req.body;

    if (!bookingRef) {
      return res.status(400).json({
        success: false,
        error: "Booking reference is required",
      });
    }

    const cancellationData = {
      reason,
      cancellationFlag,
      userId: req.user?.id,
      userAgent: req.headers["user-agent"],
      ipAddress: req.ip,
    };

    const result = await transfersService.cancelTransfer(bookingRef, cancellationData);

    res.json({
      success: true,
      data: result,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Transfer cancellation error:", error);
    
    if (error.message.includes("not found")) {
      return res.status(404).json({
        success: false,
        error: "Booking not found",
      });
    }

    if (error.message.includes("already cancelled")) {
      return res.status(400).json({
        success: false,
        error: "Booking is already cancelled",
      });
    }

    res.status(500).json({
      success: false,
      error: error.message || "Failed to cancel transfer",
    });
  }
});

/**
 * @route GET /api/transfers/bookings/user/:userId
 * @desc Get all bookings for a user
 * @access Private (requires auth)
 */
router.get("/bookings/user/:userId", auditRequest, async (req, res) => {
  try {
    const { userId } = req.params;
    const { limit = 20, offset = 0, status } = req.query;

    if (!userId) {
      return res.status(400).json({
        success: false,
        error: "User ID is required",
      });
    }

    const options = {
      limit: parseInt(limit),
      offset: parseInt(offset),
      status,
    };

    const bookings = await transfersRepository.getBookingsByUser(parseInt(userId), options);

    res.json({
      success: true,
      data: bookings,
      pagination: {
        limit: options.limit,
        offset: options.offset,
        total: bookings.length,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Get user bookings error:", error);
    res.status(500).json({
      success: false,
      error: error.message || "Failed to get user bookings",
    });
  }
});

/**
 * @route POST /api/transfers/repricing
 * @desc Re-price a transfer with updated parameters
 * @access Public
 */
router.post("/repricing", auditRequest, async (req, res) => {
  try {
    const {
      transferId,
      promoCode,
      passengers,
      additionalServices,
    } = req.body;

    if (!transferId) {
      return res.status(400).json({
        success: false,
        error: "Transfer ID is required for repricing",
      });
    }

    // This would typically re-calculate pricing with new parameters
    // For now, return a placeholder response
    const repricingResult = {
      transferId,
      originalPrice: 1000,
      adjustments: {
        promoDiscount: promoCode ? -100 : 0,
        additionalServices: additionalServices?.length ? 50 : 0,
      },
      finalPrice: 950,
      currency: "INR",
      validUntil: new Date(Date.now() + 15 * 60 * 1000).toISOString(), // 15 minutes
    };

    res.json({
      success: true,
      data: repricingResult,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Transfer repricing error:", error);
    res.status(500).json({
      success: false,
      error: error.message || "Failed to reprice transfer",
    });
  }
});

/**
 * @route GET /api/transfers/stats
 * @desc Get transfer booking statistics
 * @access Private (Admin only)
 */
router.get("/stats", auditRequest, async (req, res) => {
  try {
    const { startDate, endDate, status } = req.query;

    const filters = {};
    if (startDate) filters.startDate = new Date(startDate);
    if (endDate) filters.endDate = new Date(endDate);
    if (status) filters.status = status;

    const stats = await transfersRepository.getBookingStats(filters);

    res.json({
      success: true,
      data: stats,
      filters,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Get transfer stats error:", error);
    res.status(500).json({
      success: false,
      error: error.message || "Failed to get transfer statistics",
    });
  }
});

/**
 * @route GET /api/transfers/health
 * @desc Health check for transfers service
 * @access Public
 */
router.get("/health", async (req, res) => {
  try {
    // Check database connectivity
    const dbHealth = await transfersRepository.connect()
      .then(() => ({ status: "healthy", timestamp: new Date().toISOString() }))
      .catch((error) => ({ status: "unhealthy", error: error.message, timestamp: new Date().toISOString() }));

    // Check supplier adapters
    const supplierHealth = {};
    
    // This would typically check each adapter's health
    supplierHealth.hotelbeds = {
      status: "healthy",
      timestamp: new Date().toISOString(),
    };

    const overallHealth = {
      status: dbHealth.status === "healthy" && supplierHealth.hotelbeds.status === "healthy" ? "healthy" : "unhealthy",
      components: {
        database: dbHealth,
        suppliers: supplierHealth,
      },
      timestamp: new Date().toISOString(),
    };

    res.status(overallHealth.status === "healthy" ? 200 : 503).json({
      success: overallHealth.status === "healthy",
      data: overallHealth,
    });
  } catch (error) {
    console.error("Health check error:", error);
    res.status(503).json({
      success: false,
      error: "Health check failed",
      timestamp: new Date().toISOString(),
    });
  }
});

/**
 * Error handling middleware for transfers routes
 */
router.use((error, req, res, next) => {
  console.error("Transfers API error:", error);

  // Don't leak error details in production
  const isDevelopment = process.env.NODE_ENV === "development";

  res.status(500).json({
    success: false,
    error: isDevelopment ? error.message : "Internal server error",
    timestamp: new Date().toISOString(),
    ...(isDevelopment && { stack: error.stack }),
  });
});

module.exports = router;
