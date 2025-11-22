const express = require("express");
const router = express.Router();

router.post(["", "/"], (req, res) => {
  return res.json({
    success: true,
    message: "Minimal test"
  });
});

module.exports = router;
