const express = require('express');
const router = express.Router();

router.get('/rates', (req, res) => {
  res.json({ success: true, data: { USD: 1, INR: 83.12, EUR: 0.92 } });
});

module.exports = router;
