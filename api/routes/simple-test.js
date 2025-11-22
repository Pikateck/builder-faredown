const express = require("express");
const router = express.Router();

router.post("/", (req, res) => {
  console.log("Simple test route handler called");
  return res.json({
    success: true,
    message: "Simple test route works",
    timestamp: new Date().toISOString(),
  });
});

module.exports = router;
