const express = require('express');
const router = express.Router();

router.post('/process', (req, res) => {
  res.json({ success: true, data: { status: 'pending' } });
});

module.exports = router;
