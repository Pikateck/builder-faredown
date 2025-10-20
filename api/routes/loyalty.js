const router = require("express").Router();
const { authenticateToken } = require("../middleware/auth");

// Optional auth: if token present, we'll include user id; otherwise anonymous
router.get("/me", async (req, res) => {
  try {
    const userId = req.user?.id || null;
    res.json({
      success: true,
      data: {
        userId,
        points: 0,
        tier: "Silver",
        perks: ["Basic support"],
        updatedAt: new Date().toISOString(),
      },
    });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

module.exports = router;
