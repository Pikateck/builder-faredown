/**
 * TBO Hotels Static Data Routes
 */
const express = require("express");
const router = express.Router();
const supplierAdapterManager = require("../services/adapters/supplierAdapterManager");

function getTbo() {
  const a = supplierAdapterManager.getAdapter("TBO");
  if (!a) throw new Error("TBO adapter not initialized");
  return a;
}

router.get("/countries", async (req, res) => {
  try {
    const data = await getTbo().getCountryList(req.query.force === "1");
    res.json({ success: true, data });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

router.get("/cities/:country", async (req, res) => {
  try {
    const data = await getTbo().getCityList(req.params.country, req.query.force === "1");
    res.json({ success: true, data });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

router.get("/hotels/:city", async (req, res) => {
  try {
    const data = await getTbo().getHotelCodes(req.params.city, req.query.force === "1");
    res.json({ success: true, data });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

router.get("/hotel/:code", async (req, res) => {
  try {
    const data = await getTbo().getHotelDetails(req.params.code, req.query.force === "1");
    res.json({ success: true, data });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

router.get("/top-destinations", async (req, res) => {
  try {
    const data = await getTbo().getTopDestinations(req.query.force === "1");
    res.json({ success: true, data });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

module.exports = router;
