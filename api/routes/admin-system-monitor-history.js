const express = require("express");
const express = require("express");
const adminKeyMiddleware = require("../middleware/adminKey");
const { getHistory } = require("../services/systemMonitorService");

const router = express.Router();
router.use(adminKeyMiddleware);

router.get("/", async (req, res) => {
  const component = (req.query.component || "backend").toString().toLowerCase();
  const hours = req.query.hours || 24;

  try {
    const history = await getHistory(component, hours);
    res.json(history);
  } catch (error) {
    console.error("systemMonitor: history failed", error);
    res.status(500).json({
      error: "history-failed",
      message: error.message,
      component,
      hours,
    });
  }
});

module.exports = router;
