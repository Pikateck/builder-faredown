const express = require("express");

const router = express.Router();
const { requireAdmin } = require("../middleware/auth");
const { audit } = require("../middleware/audit.cjs");

// Wrapper function for backward compatibility
const auditLog = (action) => async (req, res, next) => {
  try {
    await audit.adminAction(req, action, {});
    next();
  } catch (error) {
    console.error("Audit logging error:", error);
    next(); // Continue even if audit fails
  }
};

// Load comprehensive seed data
const { loadSeedData } = require("../scripts/seed-admin-data");
const seedData = loadSeedData();

// Mock database for promo codes - In production, replace with actual database
let promoCodes = seedData.promoCodes || [
  {
    id: "promo_001",
    code: "FAREDOWNHOTEL",
    description: "Hotel booking discount for loyal customers",
    category: "hotel",
    image:
      "https://cdn.builder.io/api/v1/image/assets%2F4235b10530ff469795aa00c0333d773c%2F57003a8eaa4240e5a35dce05a23e72f5?format=webp&width=800",
    discountType: "percentage",
    discountMinValue: 15,
    discountMaxValue: 5000,
    minimumFareAmount: 10000,
    marketingBudget: 100000,
    expiryDate: "2024-12-31",
    promoCodeImage: "",
    displayOnHomePage: "yes",
    status: "active",
    hotelCity: "ALL",
    hotelName: "",
    createdOn: "2024-01-14 13:31",
    updatedOn: "2024-01-16 13:58",
    module: "hotel",
    validityType: "unlimited",
    usageCount: 67,
    maxUsage: null,
    totalSavings: 234500,
  },
  {
    id: "promo_002",
    code: "FAREDOWNFLIGHT",
    description: "Flight discount promo for domestic and international routes",
    category: "flight",
    image:
      "https://cdn.builder.io/api/v1/image/assets%2F4235b10530ff469795aa00c0333d773c%2F8542893d1c0b422f87eee4c35e5441ae?format=webp&width=800",
    discountType: "fixed",
    discountMinValue: 1500,
    discountMaxValue: 3000,
    minimumFareAmount: 8000,
    marketingBudget: 150000,
    expiryDate: "2024-11-30",
    promoCodeImage: "",
    displayOnHomePage: "no",
    status: "active",
    origin: "ALL",
    destination: "ALL",
    carrierCode: "ALL",
    cabinClass: "ALL",
    flightBy: "",
    createdOn: "2024-01-10 09:15",
    updatedOn: "2024-01-15 16:45",
    module: "flight",
    validityType: "limited",
    usageCount: 45,
    maxUsage: 100,
    totalSavings: 127500,
  },
  {
    id: "promo_003",
    code: "SIGHTSEEING20",
    description: "20% off on all sightseeing tours and activities",
    category: "sightseeing",
    discountType: "percentage",
    discountMinValue: 20,
    discountMaxValue: 2000,
    minimumFareAmount: 2500,
    marketingBudget: 50000,
    expiryDate: "2024-12-31",
    promoCodeImage: "",
    displayOnHomePage: "yes",
    status: "active",
    tourType: "ALL",
    tourCity: "ALL",
    tourDuration: "",
    createdOn: "2024-01-20 10:30",
    updatedOn: "2024-01-22 14:20",
    module: "sightseeing",
    validityType: "unlimited",
    usageCount: 89,
    maxUsage: null,
    totalSavings: 178000,
  },
  {
    id: "promo_004",
    code: "TRANSFER15",
    description: "15% discount on airport transfers and city rides",
    category: "transfers",
    discountType: "percentage",
    discountMinValue: 15,
    discountMaxValue: 1500,
    minimumFareAmount: 2000,
    marketingBudget: 75000,
    expiryDate: "2024-12-31",
    promoCodeImage: "",
    displayOnHomePage: "no",
    status: "active",
    vehicleType: "ALL",
    transferRoute: "Airport",
    pickupLocation: "",
    dropLocation: "",
    createdOn: "2024-01-25 11:45",
    updatedOn: "2024-01-26 09:30",
    module: "transfers",
    validityType: "unlimited",
    usageCount: 34,
    maxUsage: null,
    totalSavings: 51000,
  },
  {
    id: "promo_005",
    code: "PACKAGE25",
    description: "Special discount on luxury holiday packages",
    category: "packages",
    discountType: "fixed",
    discountMinValue: 5000,
    discountMaxValue: 25000,
    minimumFareAmount: 25000,
    marketingBudget: 200000,
    expiryDate: "2024-12-31",
    promoCodeImage: "",
    displayOnHomePage: "yes",
    status: "active",
    packageCategory: "luxury",
    packageDuration: "",
    packageRegion: "ALL",
    createdOn: "2024-01-30 16:20",
    updatedOn: "2024-02-01 12:15",
    module: "packages",
    validityType: "limited",
    usageCount: 23,
    maxUsage: 200,
    totalSavings: 115000,
  },
  {
    id: "promo_006",
    code: "WELCOME10",
    description: "Welcome bonus for new customers - all modules",
    category: "all",
    discountType: "percentage",
    discountMinValue: 10,
    discountMaxValue: 3000,
    minimumFareAmount: 5000,
    marketingBudget: 300000,
    expiryDate: "2024-12-31",
    promoCodeImage: "",
    displayOnHomePage: "yes",
    status: "active",
    createdOn: "2024-02-01 08:00",
    updatedOn: "2024-02-05 10:30",
    module: "all",
    validityType: "unlimited",
    usageCount: 156,
    maxUsage: null,
    totalSavings: 468000,
  },
  {
    id: "promo_007",
    code: "SUMMER2024",
    description: "Summer special - limited time offer",
    category: "packages",
    discountType: "percentage",
    discountMinValue: 18,
    discountMaxValue: 15000,
    minimumFareAmount: 20000,
    marketingBudget: 250000,
    expiryDate: "2024-08-31",
    promoCodeImage: "",
    displayOnHomePage: "yes",
    status: "pending",
    packageCategory: "beach",
    packageDuration: "5-7 days",
    packageRegion: "International",
    createdOn: "2024-02-10 14:30",
    updatedOn: "2024-02-12 11:45",
    module: "packages",
    validityType: "limited",
    usageCount: 0,
    maxUsage: 500,
    totalSavings: 0,
  },
];

let promoStats = {
  totalCodes: promoCodes.length,
  activeCodes: promoCodes.filter((p) => p.status === "active").length,
  totalUsage: promoCodes.reduce((sum, p) => sum + p.usageCount, 0),
  totalSavings: promoCodes.reduce((sum, p) => sum + p.totalSavings, 0),
  topPerformingCode: "WELCOME10",
  moduleBreakdown: {
    flight: promoCodes.filter((p) => p.module === "flight").length,
    hotel: promoCodes.filter((p) => p.module === "hotel").length,
    sightseeing: promoCodes.filter((p) => p.module === "sightseeing").length,
    transfers: promoCodes.filter((p) => p.module === "transfers").length,
    packages: promoCodes.filter((p) => p.module === "packages").length,
    all: promoCodes.filter((p) => p.module === "all").length,
  },
};

/**
 * @route GET /api/promo
 * @desc Get all promo codes with filtering
 * @access Admin
 */
router.get("/", requireAdmin, async (req, res) => {
  try {
    const { search, module, status, page = 1, limit = 10 } = req.query;

    let filteredCodes = [...promoCodes];

    // Filter by search term
    if (search) {
      const searchLower = search.toLowerCase();
      filteredCodes = filteredCodes.filter(
        (code) =>
          code.code.toLowerCase().includes(searchLower) ||
          code.description.toLowerCase().includes(searchLower),
      );
    }

    // Filter by module
    if (module && module !== "all") {
      filteredCodes = filteredCodes.filter(
        (code) => code.module === module || code.module === "all",
      );
    }

    // Filter by status
    if (status && status !== "all") {
      filteredCodes = filteredCodes.filter((code) => code.status === status);
    }

    // Sort by creation date (newest first)
    filteredCodes.sort((a, b) => new Date(b.createdOn) - new Date(a.createdOn));

    // Pagination
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + parseInt(limit);
    const paginatedCodes = filteredCodes.slice(startIndex, endIndex);

    res.json({
      success: true,
      data: {
        promoCodes: paginatedCodes,
        total: filteredCodes.length,
        page: parseInt(page),
        totalPages: Math.ceil(filteredCodes.length / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching promo codes:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch promo codes",
      error: error.message,
    });
  }
});

/**
 * @route GET /api/promo/stats
 * @desc Get promo code statistics
 * @access Admin
 */
router.get("/stats", requireAdmin, async (req, res) => {
  try {
    // Recalculate stats
    const stats = {
      totalCodes: promoCodes.length,
      activeCodes: promoCodes.filter((p) => p.status === "active").length,
      pendingCodes: promoCodes.filter((p) => p.status === "pending").length,
      totalUsage: promoCodes.reduce((sum, p) => sum + p.usageCount, 0),
      totalSavings: promoCodes.reduce((sum, p) => sum + p.totalSavings, 0),
      avgSavingsPerCode:
        promoCodes.length > 0
          ? promoCodes.reduce((sum, p) => sum + p.totalSavings, 0) /
            promoCodes.length
          : 0,
      topPerformingCode:
        promoCodes.reduce(
          (top, current) =>
            current.totalSavings > (top?.totalSavings || 0) ? current : top,
          null,
        )?.code || "None",
      moduleBreakdown: {
        flight: promoCodes.filter((p) => p.module === "flight").length,
        hotel: promoCodes.filter((p) => p.module === "hotel").length,
        sightseeing: promoCodes.filter((p) => p.module === "sightseeing")
          .length,
        transfers: promoCodes.filter((p) => p.module === "transfers").length,
        packages: promoCodes.filter((p) => p.module === "packages").length,
        all: promoCodes.filter((p) => p.module === "all").length,
      },
      recentActivity: promoCodes
        .sort((a, b) => new Date(b.updatedOn) - new Date(a.updatedOn))
        .slice(0, 5)
        .map((p) => ({
          code: p.code,
          action: "Updated",
          date: p.updatedOn,
        })),
    };

    res.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    console.error("Error fetching promo stats:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch promo statistics",
      error: error.message,
    });
  }
});

/**
 * @route POST /api/promo
 * @desc Create new promo code
 * @access Admin
 */
router.post("/", requireAdmin, auditLog("create_promo"), async (req, res) => {
  try {
    const {
      code,
      description,
      category,
      discountType,
      discountMinValue,
      discountMaxValue,
      minimumFareAmount,
      marketingBudget,
      expiryDate,
      displayOnHomePage,
      status,
      validityType,
      maxUsage,
      // Module-specific fields
      ...moduleFields
    } = req.body;

    // Validation
    if (!code || !description || !category || !discountType) {
      return res.status(400).json({
        success: false,
        message:
          "Missing required fields: code, description, category, discountType",
      });
    }

    // Check for duplicate code
    const existingCode = promoCodes.find(
      (p) => p.code.toLowerCase() === code.toLowerCase(),
    );
    if (existingCode) {
      return res.status(400).json({
        success: false,
        message: "Promo code already exists",
      });
    }

    const newPromo = {
      id: `promo_${Date.now()}`,
      code: code.toUpperCase(),
      description,
      category,
      discountType,
      discountMinValue: parseFloat(discountMinValue) || 0,
      discountMaxValue: parseFloat(discountMaxValue) || 0,
      minimumFareAmount: parseFloat(minimumFareAmount) || 0,
      marketingBudget: parseFloat(marketingBudget) || 0,
      expiryDate,
      promoCodeImage: req.body.promoCodeImage || "",
      displayOnHomePage: displayOnHomePage || "no",
      status: status || "pending",
      validityType: validityType || "unlimited",
      maxUsage: maxUsage ? parseInt(maxUsage) : null,
      usageCount: 0,
      totalSavings: 0,
      createdOn:
        new Date().toISOString().split("T")[0] +
        " " +
        new Date().toTimeString().split(" ")[0],
      updatedOn:
        new Date().toISOString().split("T")[0] +
        " " +
        new Date().toTimeString().split(" ")[0],
      module: category === "all" ? "all" : category,
      ...moduleFields,
    };

    promoCodes.push(newPromo);

    res.status(201).json({
      success: true,
      data: { promoCode: newPromo },
      message: "Promo code created successfully",
    });
  } catch (error) {
    console.error("Error creating promo code:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create promo code",
      error: error.message,
    });
  }
});

/**
 * @route PUT /api/promo/:id
 * @desc Update promo code
 * @access Admin
 */
router.put("/:id", requireAdmin, auditLog("update_promo"), async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const promoIndex = promoCodes.findIndex((p) => p.id === id);
    if (promoIndex === -1) {
      return res.status(404).json({
        success: false,
        message: "Promo code not found",
      });
    }

    const currentPromo = promoCodes[promoIndex];

    // Check for duplicate code if code is being changed
    if (updateData.code && updateData.code !== currentPromo.code) {
      const existingCode = promoCodes.find(
        (p) =>
          p.id !== id && p.code.toLowerCase() === updateData.code.toLowerCase(),
      );
      if (existingCode) {
        return res.status(400).json({
          success: false,
          message: "Promo code already exists",
        });
      }
    }

    const updatedPromo = {
      ...currentPromo,
      ...updateData,
      id: currentPromo.id, // Ensure ID cannot be changed
      usageCount: currentPromo.usageCount, // Preserve usage stats
      totalSavings: currentPromo.totalSavings,
      createdOn: currentPromo.createdOn, // Preserve creation date
      updatedOn:
        new Date().toISOString().split("T")[0] +
        " " +
        new Date().toTimeString().split(" ")[0],
    };

    if (updateData.code) {
      updatedPromo.code = updateData.code.toUpperCase();
    }

    promoCodes[promoIndex] = updatedPromo;

    res.json({
      success: true,
      data: { promoCode: updatedPromo },
      message: "Promo code updated successfully",
    });
  } catch (error) {
    console.error("Error updating promo code:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update promo code",
      error: error.message,
    });
  }
});

/**
 * @route DELETE /api/promo/:id
 * @desc Delete promo code
 * @access Admin
 */
router.delete(
  "/:id",
  requireAdmin,
  auditLog("delete_promo"),
  async (req, res) => {
    try {
      const { id } = req.params;

      const promoIndex = promoCodes.findIndex((p) => p.id === id);
      if (promoIndex === -1) {
        return res.status(404).json({
          success: false,
          message: "Promo code not found",
        });
      }

      const deletedPromo = promoCodes[promoIndex];
      promoCodes.splice(promoIndex, 1);

      res.json({
        success: true,
        message: "Promo code deleted successfully",
        data: { deletedCode: deletedPromo.code },
      });
    } catch (error) {
      console.error("Error deleting promo code:", error);
      res.status(500).json({
        success: false,
        message: "Failed to delete promo code",
        error: error.message,
      });
    }
  },
);

/**
 * @route POST /api/promo/:id/toggle-status
 * @desc Toggle promo code status (active/pending)
 * @access Admin
 */
router.post(
  "/:id/toggle-status",
  requireAdmin,
  auditLog("toggle_promo_status"),
  async (req, res) => {
    try {
      const { id } = req.params;

      const promoIndex = promoCodes.findIndex((p) => p.id === id);
      if (promoIndex === -1) {
        return res.status(404).json({
          success: false,
          message: "Promo code not found",
        });
      }

      const promo = promoCodes[promoIndex];
      promo.status = promo.status === "active" ? "pending" : "active";
      promo.updatedOn =
        new Date().toISOString().split("T")[0] +
        " " +
        new Date().toTimeString().split(" ")[0];

      res.json({
        success: true,
        data: { promoCode: promo },
        message: `Promo code ${promo.status === "active" ? "activated" : "deactivated"} successfully`,
      });
    } catch (error) {
      console.error("Error toggling promo status:", error);
      res.status(500).json({
        success: false,
        message: "Failed to toggle promo code status",
        error: error.message,
      });
    }
  },
);

/**
 * @route GET /api/promo/:id
 * @desc Get single promo code
 * @access Admin
 */
router.get("/:id", requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    const promo = promoCodes.find((p) => p.id === id);
    if (!promo) {
      return res.status(404).json({
        success: false,
        message: "Promo code not found",
      });
    }

    res.json({
      success: true,
      data: promo,
    });
  } catch (error) {
    console.error("Error fetching promo code:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch promo code",
      error: error.message,
    });
  }
});

/**
 * @route POST /api/promo/validate
 * @desc Validate promo code for booking
 * @access Public
 */
router.post("/validate", async (req, res) => {
  try {
    const { code, amount, category, ...bookingDetails } = req.body;

    if (!code || !amount || !category) {
      return res.status(400).json({
        success: false,
        valid: false,
        message: "Code, amount, and category are required",
      });
    }

    const promo = promoCodes.find(
      (p) =>
        p.code.toLowerCase() === code.toLowerCase() &&
        p.status === "active" &&
        (p.module === category || p.module === "all"),
    );

    if (!promo) {
      return res.json({
        success: true,
        valid: false,
        message: "Invalid or expired promo code",
      });
    }

    // Check expiry date
    const today = new Date();
    const expiry = new Date(promo.expiryDate);
    if (today > expiry) {
      return res.json({
        success: true,
        valid: false,
        message: "Promo code has expired",
      });
    }

    // Check minimum fare
    if (amount < promo.minimumFareAmount) {
      return res.json({
        success: true,
        valid: false,
        message: `Minimum fare of â‚¹${promo.minimumFareAmount} required`,
      });
    }

    // Check usage limit
    if (promo.maxUsage && promo.usageCount >= promo.maxUsage) {
      return res.json({
        success: true,
        valid: false,
        message: "Promo code usage limit exceeded",
      });
    }

    // Calculate discount
    let discount = 0;
    if (promo.discountType === "percentage") {
      discount = (amount * promo.discountMinValue) / 100;
      if (promo.discountMaxValue && discount > promo.discountMaxValue) {
        discount = promo.discountMaxValue;
      }
    } else if (promo.discountType === "fixed") {
      discount = promo.discountMinValue;
    }

    const finalAmount = Math.max(0, amount - discount);

    res.json({
      success: true,
      valid: true,
      discount: Math.round(discount * 100) / 100,
      finalAmount: Math.round(finalAmount * 100) / 100,
      message: `â‚¹${discount} discount applied successfully`,
    });
  } catch (error) {
    console.error("Error validating promo code:", error);
    res.status(500).json({
      success: false,
      message: "Failed to validate promo code",
      error: error.message,
    });
  }
});

/**
 * @route POST /api/promo/apply
 * @desc Apply promo code to booking
 * @access Public
 */
router.post("/apply", async (req, res) => {
  try {
    const { code, originalAmount, category } = req.body;

    const validation = await router.handle(
      { body: { code, amount: originalAmount, category } },
      {
        json: (data) => data,
      },
    );

    if (!validation.valid) {
      return res.json({
        success: false,
        message: validation.message,
      });
    }

    // Update usage count (in real implementation, this would be atomic)
    const promo = promoCodes.find(
      (p) => p.code.toLowerCase() === code.toLowerCase(),
    );
    if (promo) {
      promo.usageCount++;
      promo.totalSavings += validation.discount;
    }

    res.json({
      success: true,
      discount: validation.discount,
      finalAmount: validation.finalAmount,
      message: `Promo code applied successfully`,
      promoCodeId: promo?.id,
    });
  } catch (error) {
    console.error("Error applying promo code:", error);
    res.status(500).json({
      success: false,
      message: "Failed to apply promo code",
      error: error.message,
    });
  }
});

/**
 * @route GET /api/promo/:id/stats
 * @desc Get promo code usage statistics
 * @access Admin
 */
router.get("/:id/stats", requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    const promo = promoCodes.find((p) => p.id === id);
    if (!promo) {
      return res.status(404).json({
        success: false,
        message: "Promo code not found",
      });
    }

    const stats = {
      totalUsage: promo.usageCount,
      remainingUsage: promo.maxUsage
        ? promo.maxUsage - promo.usageCount
        : "Unlimited",
      totalSavings: promo.totalSavings,
      avgSavingsPerUse:
        promo.usageCount > 0 ? promo.totalSavings / promo.usageCount : 0,
      recentUsage: [
        // Mock recent usage data
        {
          date: "2024-02-15",
          bookingId: "BK001",
          amount: 12000,
          discount: 1800,
        },
        { date: "2024-02-14", bookingId: "BK002", amount: 8500, discount: 850 },
        {
          date: "2024-02-13",
          bookingId: "BK003",
          amount: 15000,
          discount: 2250,
        },
      ],
    };

    res.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    console.error("Error fetching promo stats:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch promo statistics",
      error: error.message,
    });
  }
});
module.exports = router;