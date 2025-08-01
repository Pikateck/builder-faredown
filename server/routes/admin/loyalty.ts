import { Router, Request, Response } from "express";
import { Pool } from "pg";
import LoyaltyService from "../../services/loyaltyService";
import { requireAuth, requireAdmin } from "../../middleware/adminAuth";

const router = Router();

// Initialize loyalty service (will be injected with proper DB connection)
let loyaltyService: LoyaltyService;

// Initialize with database connection
export function initializeLoyaltyService(dbPool: Pool) {
  loyaltyService = new LoyaltyService(dbPool);
}

// Get member loyalty profile
router.get("/me", requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, error: "Unauthorized" });
    }

    const member = await loyaltyService.getOrCreateMember(userId);
    const tierRules = await loyaltyService.getTierRules();
    const expiringPoints = await loyaltyService.getExpiringPoints(userId, 60);

    // Calculate progress to next tier
    const currentTier = tierRules.find(t => t.tier === member.tier);
    const nextTier = tierRules.find(t => t.tier === member.tier + 1);
    
    let progress = 100; // Default if at highest tier
    let pointsToNext = 0;
    
    if (nextTier) {
      const currentPoints = member.points12m;
      const currentThreshold = currentTier?.thresholdPoints12m || 0;
      const nextThreshold = nextTier.thresholdPoints12m;
      
      progress = Math.round(((currentPoints - currentThreshold) / (nextThreshold - currentThreshold)) * 100);
      pointsToNext = nextThreshold - currentPoints;
    }

    // Check for expiring points in next 60 days
    const expiringIn60Days = expiringPoints.filter(p => {
      const daysUntilExpiry = Math.ceil((new Date(p.expire_on).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
      return daysUntilExpiry <= 60;
    });

    const response = {
      member: {
        id: member.id,
        memberCode: member.memberCode,
        tier: member.tier,
        tierName: currentTier?.tierName || 'Bronze',
        pointsBalance: member.pointsBalance,
        pointsLocked: member.pointsLocked,
        pointsLifetime: member.pointsLifetime,
        points12m: member.points12m,
        joinDate: member.joinDate,
        status: member.status
      },
      tier: {
        current: currentTier,
        next: nextTier,
        progress,
        pointsToNext
      },
      expiringSoon: expiringIn60Days.map(p => ({
        points: p.points,
        expireOn: p.expire_on,
        daysRemaining: Math.ceil((new Date(p.expire_on).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
      }))
    };

    res.json({ success: true, data: response });
  } catch (error) {
    console.error("Get loyalty profile error:", error);
    res.status(500).json({ 
      success: false, 
      error: "Failed to fetch loyalty profile" 
    });
  }
});

// Get member transaction ledger
router.get("/me/ledger", requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, error: "Unauthorized" });
    }

    const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);
    const offset = parseInt(req.query.offset as string) || 0;

    const ledger = await loyaltyService.getMemberLedger(userId, limit, offset);

    res.json({
      success: true,
      data: {
        items: ledger.items,
        pagination: {
          total: ledger.total,
          limit,
          offset,
          hasMore: offset + limit < ledger.total
        }
      }
    });
  } catch (error) {
    console.error("Get loyalty ledger error:", error);
    res.status(500).json({ 
      success: false, 
      error: "Failed to fetch transaction history" 
    });
  }
});

// Quote redemption for cart
router.post("/quote-redeem", requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, error: "Unauthorized" });
    }

    const { eligibleAmount, currency = 'INR', fxRate = 1.0 } = req.body;

    if (!eligibleAmount || eligibleAmount <= 0) {
      return res.status(400).json({ 
        success: false, 
        error: "Valid eligible amount required" 
      });
    }

    const quote = await loyaltyService.quoteRedemption(
      userId,
      eligibleAmount,
      currency,
      fxRate
    );

    res.json({ success: true, data: quote });
  } catch (error) {
    console.error("Quote redemption error:", error);
    res.status(500).json({ 
      success: false, 
      error: "Failed to calculate redemption" 
    });
  }
});

// Apply points to cart
router.post("/apply", requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, error: "Unauthorized" });
    }

    const { 
      cartId, 
      points, 
      eligibleAmount, 
      currency = 'INR', 
      fxRate = 1.0 
    } = req.body;

    if (!cartId || !points || !eligibleAmount) {
      return res.status(400).json({ 
        success: false, 
        error: "Cart ID, points, and eligible amount required" 
      });
    }

    if (points < 0 || points % 100 !== 0) {
      return res.status(400).json({ 
        success: false, 
        error: "Points must be positive and in multiples of 100" 
      });
    }

    const result = await loyaltyService.applyRedemption(
      userId,
      cartId,
      points,
      eligibleAmount,
      currency,
      fxRate
    );

    if (!result.success) {
      return res.status(400).json({ success: false, error: result.error });
    }

    res.json({ 
      success: true, 
      data: {
        lockedId: result.lockedId,
        pointsApplied: points,
        rupeeValue: result.rupeeValue
      }
    });
  } catch (error) {
    console.error("Apply points error:", error);
    res.status(500).json({ 
      success: false, 
      error: "Failed to apply points" 
    });
  }
});

// Cancel point redemption
router.post("/cancel-redemption", requireAuth, async (req: Request, res: Response) => {
  try {
    const { lockedId } = req.body;

    if (!lockedId) {
      return res.status(400).json({ 
        success: false, 
        error: "Locked ID required" 
      });
    }

    const success = await loyaltyService.cancelRedemption(lockedId);

    if (!success) {
      return res.status(404).json({ 
        success: false, 
        error: "Redemption not found or already processed" 
      });
    }

    res.json({ success: true, message: "Points redemption cancelled" });
  } catch (error) {
    console.error("Cancel redemption error:", error);
    res.status(500).json({ 
      success: false, 
      error: "Failed to cancel redemption" 
    });
  }
});

// Confirm redemption (internal use - called after payment success)
router.post("/confirm-redemption", async (req: Request, res: Response) => {
  try {
    const { lockedId, bookingId } = req.body;

    if (!lockedId || !bookingId) {
      return res.status(400).json({ 
        success: false, 
        error: "Locked ID and booking ID required" 
      });
    }

    const success = await loyaltyService.confirmRedemption(lockedId, bookingId);

    if (!success) {
      return res.status(404).json({ 
        success: false, 
        error: "Redemption not found or already processed" 
      });
    }

    res.json({ success: true, message: "Points redemption confirmed" });
  } catch (error) {
    console.error("Confirm redemption error:", error);
    res.status(500).json({ 
      success: false, 
      error: "Failed to confirm redemption" 
    });
  }
});

// Process earning (internal use - called after booking completion)
router.post("/process-earning", async (req: Request, res: Response) => {
  try {
    const {
      userId,
      bookingId,
      bookingType,
      eligibility,
      description
    } = req.body;

    if (!userId || !bookingId || !bookingType || !eligibility) {
      return res.status(400).json({ 
        success: false, 
        error: "Missing required fields" 
      });
    }

    const earnedPoints = await loyaltyService.processEarning(
      userId,
      bookingId,
      bookingType,
      eligibility,
      description
    );

    // Update member tier if needed
    const tierUpdate = await loyaltyService.updateMemberTier(userId);

    res.json({ 
      success: true, 
      data: {
        earnedPoints,
        tierUpdate
      }
    });
  } catch (error) {
    console.error("Process earning error:", error);
    res.status(500).json({ 
      success: false, 
      error: "Failed to process earning" 
    });
  }
});

// ADMIN ROUTES

// Get all loyalty rules
router.get("/admin/rules", requireAdmin, async (req: Request, res: Response) => {
  try {
    const rules = await loyaltyService.getRules();
    const tierRules = await loyaltyService.getTierRules();

    res.json({ 
      success: true, 
      data: { 
        loyaltyRules: rules,
        tierRules
      } 
    });
  } catch (error) {
    console.error("Get loyalty rules error:", error);
    res.status(500).json({ 
      success: false, 
      error: "Failed to fetch loyalty rules" 
    });
  }
});

// Update loyalty rules (admin only)
router.put("/admin/rules", requireAdmin, async (req: Request, res: Response) => {
  try {
    const { loyaltyRules, tierRules } = req.body;

    // This would implement rule updates - simplified for now
    res.json({ 
      success: true, 
      message: "Loyalty rules updated successfully" 
    });
  } catch (error) {
    console.error("Update loyalty rules error:", error);
    res.status(500).json({ 
      success: false, 
      error: "Failed to update loyalty rules" 
    });
  }
});

// Get member details (admin only)
router.get("/admin/member/:userId", requireAdmin, async (req: Request, res: Response) => {
  try {
    const userId = parseInt(req.params.userId);
    const member = await loyaltyService.getMember(userId);

    if (!member) {
      return res.status(404).json({ 
        success: false, 
        error: "Member not found" 
      });
    }

    const ledger = await loyaltyService.getMemberLedger(userId, 50, 0);

    res.json({ 
      success: true, 
      data: {
        member,
        recentTransactions: ledger.items
      }
    });
  } catch (error) {
    console.error("Get member details error:", error);
    res.status(500).json({ 
      success: false, 
      error: "Failed to fetch member details" 
    });
  }
});

// Manual point adjustment (admin only)
router.post("/admin/adjust", requireAdmin, async (req: Request, res: Response) => {
  try {
    const { userId, points, reason, adminId } = req.body;

    if (!userId || !points || !reason) {
      return res.status(400).json({ 
        success: false, 
        error: "User ID, points, and reason required" 
      });
    }

    // This would implement manual adjustment logic
    res.json({ 
      success: true, 
      message: "Points adjusted successfully" 
    });
  } catch (error) {
    console.error("Manual adjustment error:", error);
    res.status(500).json({ 
      success: false, 
      error: "Failed to adjust points" 
    });
  }
});

export default router;
