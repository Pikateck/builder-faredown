const express = require("express");

const router = express.Router();

// Analytics dashboard
router.get("/dashboard", (req, res) => {
  res.json({ success: true, data: {} });
});

// Chat events endpoint for analytics tracking
// Note: Authentication bypassed for staging QA testing
router.post("/chat-events", (req, res) => {
  try {
    const { event, payload, timestamp } = req.body;

    // Validate required fields
    if (!event || !payload) {
      return res.status(400).json({
        error: "Missing required fields",
        message: "Both 'event' and 'payload' are required",
      });
    }

    // Validate payload has required chat analytics fields
    const requiredFields = ["module", "entityId", "sessionId"];
    const missingFields = requiredFields.filter((field) => !payload[field]);

    if (missingFields.length > 0) {
      return res.status(400).json({
        error: "Missing payload fields",
        message: `Required fields missing: ${missingFields.join(", ")}`,
        required: requiredFields,
      });
    }

    // Log the analytics event (in production, send to analytics service)
    console.log("[CHAT-ANALYTICS]", {
      event,
      payload,
      timestamp: timestamp || new Date().toISOString(),
      requestId: req.headers["x-request-id"] || "no-request-id",
      userAgent: req.headers["user-agent"] || "unknown",
      ip: req.ip || "unknown",
    });

    // Respond with success
    res.json({
      success: true,
      message: "Analytics event tracked successfully",
      event,
      tracked_at: new Date().toISOString(),
      event_id: `evt_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    });
  } catch (error) {
    console.error("[CHAT-ANALYTICS] Error tracking event:", error);
    res.status(500).json({
      error: "Failed to track analytics event",
      message: error.message,
    });
  }
});
module.exports = router;
