const express = require('express');
const router = express.Router();

router.get('/profile', (req, res) => {
  res.json({ success: true, data: { userId: req.user?.id } });
});

module.exports = router;
