const express = require("express");
const router = express.Router();

router.post(["", "/"], (req, res) => {
  res.setHeader("Content-Type", "text/plain");
  res.send("OK");
});

module.exports = router;
