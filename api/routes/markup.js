const express = require("express");
const router = express.Router();

// Mock database
let airMarkups = [
  {
    id: "1",
    name: "Mumbai-Dubai Economy Markup",
    description: "Standard markup for Mumbai to Dubai economy flights",
    airline: "EK",
    route: { from: "BOM", to: "DXB" },
    class: "economy",
    markupType: "percentage",
    markupValue: 5.5,
    minAmount: 500,
    maxAmount: 2000,
    validFrom: "2024-01-01",
    validTo: "2024-12-31",
    status: "active",
    priority: 1,
    userType: "all",
    specialConditions: "Valid for advance bookings only",
    createdAt: "2024-01-15T10:00:00Z",
    updatedAt: "2024-01-20T15:30:00Z",
  },
];

let hotelMarkups = [
  {
    id: "1",
    name: "Mumbai Luxury Hotels Markup",
    description: "Standard markup for luxury hotels in Mumbai",
    city: "Mumbai",
    hotelName: "Taj Hotel",
    hotelChain: "Taj Hotels",
    starRating: 5,
    roomCategory: "deluxe",
    markupType: "percentage",
    markupValue: 8.5,
    minAmount: 1000,
    maxAmount: 5000,
    validFrom: "2024-01-01",
    validTo: "2024-12-31",
    checkInDays: ["friday", "saturday", "sunday"],
    minStay: 1,
    maxStay: 7,
    status: "active",
    priority: 1,
    userType: "all",
    seasonType: "peak",
    specialConditions: "Valid for weekend bookings only",
    createdAt: "2024-01-15T10:00:00Z",
    updatedAt: "2024-01-20T15:30:00Z",
  },
];

// Middleware to check authentication
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({ error: "Access token required" });
  }

  // In production, verify JWT token properly
  req.user = { id: "1", role: "admin" }; // Mock user
  next();
};

// AIR MARKUP ROUTES

// GET /api/markup/air - Get all air markups
router.get("/air", authenticateToken, (req, res) => {
  try {
    const {
      search,
      airline,
      class: cabinClass,
      status,
      page = 1,
      limit = 10,
    } = req.query;

    let filteredMarkups = [...airMarkups];

    // Apply filters
    if (search) {
      filteredMarkups = filteredMarkups.filter(
        (markup) =>
          markup.name.toLowerCase().includes(search.toLowerCase()) ||
          markup.description.toLowerCase().includes(search.toLowerCase()) ||
          `${markup.route.from}-${markup.route.to}`
            .toLowerCase()
            .includes(search.toLowerCase()),
      );
    }

    if (airline && airline !== "all") {
      filteredMarkups = filteredMarkups.filter(
        (markup) => markup.airline === airline,
      );
    }

    if (cabinClass && cabinClass !== "all") {
      filteredMarkups = filteredMarkups.filter(
        (markup) => markup.class === cabinClass,
      );
    }

    if (status && status !== "all") {
      filteredMarkups = filteredMarkups.filter(
        (markup) => markup.status === status,
      );
    }

    // Pagination
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + parseInt(limit);
    const paginatedMarkups = filteredMarkups.slice(startIndex, endIndex);

    res.json({
      markups: paginatedMarkups,
      total: filteredMarkups.length,
      page: parseInt(page),
      totalPages: Math.ceil(filteredMarkups.length / limit),
    });
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch air markups" });
  }
});

// POST /api/markup/air - Create new air markup
router.post("/air", authenticateToken, (req, res) => {
  try {
    const {
      name,
      description,
      airline,
      route,
      class: cabinClass,
      markupType,
      markupValue,
      minAmount,
      maxAmount,
      validFrom,
      validTo,
      status,
      priority,
      userType,
      specialConditions,
    } = req.body;

    // Validate required fields
    if (!name || !airline || !route || !markupType || !markupValue) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const newMarkup = {
      id: Date.now().toString(),
      name,
      description: description || "",
      airline,
      route,
      class: cabinClass || "all",
      markupType,
      markupValue,
      minAmount: minAmount || 0,
      maxAmount: maxAmount || 0,
      validFrom: validFrom || new Date().toISOString().split("T")[0],
      validTo: validTo || "2024-12-31",
      status: status || "active",
      priority: priority || 1,
      userType: userType || "all",
      specialConditions: specialConditions || "",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    airMarkups.push(newMarkup);
    res.status(201).json(newMarkup);
  } catch (error) {
    res.status(500).json({ error: "Failed to create air markup" });
  }
});

// PUT /api/markup/air/:id - Update air markup
router.put("/air/:id", authenticateToken, (req, res) => {
  try {
    const markupIndex = airMarkups.findIndex((m) => m.id === req.params.id);
    if (markupIndex === -1) {
      return res.status(404).json({ error: "Air markup not found" });
    }

    const updatedMarkup = {
      ...airMarkups[markupIndex],
      ...req.body,
      updatedAt: new Date().toISOString(),
    };

    airMarkups[markupIndex] = updatedMarkup;
    res.json(updatedMarkup);
  } catch (error) {
    res.status(500).json({ error: "Failed to update air markup" });
  }
});

// DELETE /api/markup/air/:id - Delete air markup
router.delete("/air/:id", authenticateToken, (req, res) => {
  try {
    const markupIndex = airMarkups.findIndex((m) => m.id === req.params.id);
    if (markupIndex === -1) {
      return res.status(404).json({ error: "Air markup not found" });
    }

    airMarkups.splice(markupIndex, 1);
    res.json({ message: "Air markup deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: "Failed to delete air markup" });
  }
});

// HOTEL MARKUP ROUTES

// GET /api/markup/hotel - Get all hotel markups
router.get("/hotel", authenticateToken, (req, res) => {
  try {
    const { search, city, category, status, page = 1, limit = 10 } = req.query;

    let filteredMarkups = [...hotelMarkups];

    // Apply filters
    if (search) {
      filteredMarkups = filteredMarkups.filter(
        (markup) =>
          markup.name.toLowerCase().includes(search.toLowerCase()) ||
          markup.description.toLowerCase().includes(search.toLowerCase()) ||
          markup.city.toLowerCase().includes(search.toLowerCase()) ||
          markup.hotelName.toLowerCase().includes(search.toLowerCase()),
      );
    }

    if (city && city !== "all") {
      filteredMarkups = filteredMarkups.filter((markup) =>
        markup.city.toLowerCase().includes(city.toLowerCase()),
      );
    }

    if (category && category !== "all") {
      filteredMarkups = filteredMarkups.filter(
        (markup) => markup.roomCategory === category,
      );
    }

    if (status && status !== "all") {
      filteredMarkups = filteredMarkups.filter(
        (markup) => markup.status === status,
      );
    }

    // Pagination
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + parseInt(limit);
    const paginatedMarkups = filteredMarkups.slice(startIndex, endIndex);

    res.json({
      markups: paginatedMarkups,
      total: filteredMarkups.length,
      page: parseInt(page),
      totalPages: Math.ceil(filteredMarkups.length / limit),
    });
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch hotel markups" });
  }
});

// POST /api/markup/hotel - Create new hotel markup
router.post("/hotel", authenticateToken, (req, res) => {
  try {
    const {
      name,
      description,
      city,
      hotelName,
      hotelChain,
      starRating,
      roomCategory,
      markupType,
      markupValue,
      minAmount,
      maxAmount,
      validFrom,
      validTo,
      checkInDays,
      minStay,
      maxStay,
      status,
      priority,
      userType,
      seasonType,
      specialConditions,
    } = req.body;

    // Validate required fields
    if (!name || !city || !markupType || !markupValue) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const newMarkup = {
      id: Date.now().toString(),
      name,
      description: description || "",
      city,
      hotelName: hotelName || "",
      hotelChain: hotelChain || "",
      starRating: starRating || 3,
      roomCategory: roomCategory || "standard",
      markupType,
      markupValue,
      minAmount: minAmount || 0,
      maxAmount: maxAmount || 0,
      validFrom: validFrom || new Date().toISOString().split("T")[0],
      validTo: validTo || "2024-12-31",
      checkInDays: checkInDays || [],
      minStay: minStay || 1,
      maxStay: maxStay || 30,
      status: status || "active",
      priority: priority || 1,
      userType: userType || "all",
      seasonType: seasonType || "all",
      specialConditions: specialConditions || "",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    hotelMarkups.push(newMarkup);
    res.status(201).json(newMarkup);
  } catch (error) {
    res.status(500).json({ error: "Failed to create hotel markup" });
  }
});

// PUT /api/markup/hotel/:id - Update hotel markup
router.put("/hotel/:id", authenticateToken, (req, res) => {
  try {
    const markupIndex = hotelMarkups.findIndex((m) => m.id === req.params.id);
    if (markupIndex === -1) {
      return res.status(404).json({ error: "Hotel markup not found" });
    }

    const updatedMarkup = {
      ...hotelMarkups[markupIndex],
      ...req.body,
      updatedAt: new Date().toISOString(),
    };

    hotelMarkups[markupIndex] = updatedMarkup;
    res.json(updatedMarkup);
  } catch (error) {
    res.status(500).json({ error: "Failed to update hotel markup" });
  }
});

// DELETE /api/markup/hotel/:id - Delete hotel markup
router.delete("/hotel/:id", authenticateToken, (req, res) => {
  try {
    const markupIndex = hotelMarkups.findIndex((m) => m.id === req.params.id);
    if (markupIndex === -1) {
      return res.status(404).json({ error: "Hotel markup not found" });
    }

    hotelMarkups.splice(markupIndex, 1);
    res.json({ message: "Hotel markup deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: "Failed to delete hotel markup" });
  }
});

// COMMON ROUTES

// POST /api/markup/:type/:id/toggle-status - Toggle markup status
router.post("/:type/:id/toggle-status", authenticateToken, (req, res) => {
  try {
    const { type, id } = req.params;
    let markups = type === "air" ? airMarkups : hotelMarkups;

    const markupIndex = markups.findIndex((m) => m.id === id);
    if (markupIndex === -1) {
      return res.status(404).json({ error: "Markup not found" });
    }

    markups[markupIndex].status =
      markups[markupIndex].status === "active" ? "inactive" : "active";
    markups[markupIndex].updatedAt = new Date().toISOString();

    res.json(markups[markupIndex]);
  } catch (error) {
    res.status(500).json({ error: "Failed to toggle markup status" });
  }
});

// GET /api/markup/stats - Get markup statistics
router.get("/stats", authenticateToken, (req, res) => {
  try {
    const airStats = {
      total: airMarkups.length,
      active: airMarkups.filter((m) => m.status === "active").length,
      inactive: airMarkups.filter((m) => m.status === "inactive").length,
    };

    const hotelStats = {
      total: hotelMarkups.length,
      active: hotelMarkups.filter((m) => m.status === "active").length,
      inactive: hotelMarkups.filter((m) => m.status === "inactive").length,
    };

    res.json({
      air: airStats,
      hotel: hotelStats,
      total: airStats.total + hotelStats.total,
    });
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch markup statistics" });
  }
});

module.exports = router;
