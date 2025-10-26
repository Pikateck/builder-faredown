import express from "express";
import db from "../lib/db.js";

const router = express.Router();

/**
 * Calculate rewards for a booking
 * POST /api/rewards/calculate-earnings
 * Body: { final_price, tier_category, module, user_id }
 */
router.post("/calculate-earnings", async (req, res) => {
  try {
    const { final_price, tier_category = "Silver", module, user_id } = req.body;

    if (!final_price || !module) {
      return res.status(400).json({ error: "final_price and module required" });
    }

    const result = await db.query(
      `SELECT * FROM calculate_booking_rewards($1, $2, $3)`,
      [final_price, tier_category, module]
    );

    const rewards = result.rows[0] || {};

    return res.status(200).json({
      points_earned: rewards.points_earned || 0,
      monetary_value: rewards.monetary_value || 0,
      tier_multiplier: rewards.tier_multiplier || 1,
      tier_category,
      module,
    });
  } catch (error) {
    console.error("Error calculating earnings:", error);
    return res.status(500).json({ error: error.message });
  }
});

/**
 * Record reward earning from a booking
 * POST /api/rewards/earn-from-booking
 * Body: { user_id, booking_id, final_price, module, tier_category, discount_amount }
 */
router.post("/earn-from-booking", async (req, res) => {
  try {
    const {
      user_id,
      booking_id,
      final_price,
      module,
      tier_category = "Silver",
      discount_amount = 0,
    } = req.body;

    if (!user_id || !booking_id || !final_price || !module) {
      return res.status(400).json({
        error: "user_id, booking_id, final_price, module required",
      });
    }

    // Calculate points
    const basePoints = Math.floor(final_price / 100);
    const multipliers = { Platinum: 1.5, Gold: 1.25, Silver: 1.0 };
    const multiplier = multipliers[tier_category] || 1;
    const pointsEarned = Math.floor(basePoints * multiplier);
    const monetaryValue = pointsEarned * 1; // 1 point = ₹1

    // Store in user_rewards
    const rewardResult = await db.query(
      `INSERT INTO user_rewards (user_id, booking_id, module, points_earned, monetary_value, tier_category, status, metadata)
       VALUES ($1, $2, $3, $4, $5, $6, 'earned', $7)
       RETURNING id, points_earned, monetary_value, tier_category`,
      [
        user_id,
        booking_id,
        module,
        pointsEarned,
        monetaryValue,
        tier_category,
        JSON.stringify({
          original_final_price: final_price,
          discount_amount,
          discount_percentage: ((discount_amount / final_price) * 100).toFixed(
            2
          ),
        }),
      ]
    );

    const reward = rewardResult.rows[0];

    // Get updated user tier
    const tierResult = await db.query(
      `SELECT COALESCE(SUM(points_earned) - COALESCE(SUM(points_redeemed), 0), 0) as total_points
       FROM user_rewards
       WHERE user_id = $1 AND status IN ('earned', 'pending')`,
      [user_id]
    );

    const totalPoints = tierResult.rows[0]?.total_points || 0;
    const newTier = totalPoints >= 15001 ? "Platinum" : totalPoints >= 5001 ? "Gold" : "Silver";

    return res.status(201).json({
      reward_id: reward.id,
      points_earned: reward.points_earned,
      monetary_value: reward.monetary_value,
      tier_category: reward.tier_category,
      user_total_points: totalPoints,
      user_tier: newTier,
      message: `Earned ${reward.points_earned} points (₹${reward.monetary_value})`,
    });
  } catch (error) {
    console.error("Error earning from booking:", error);
    return res.status(500).json({ error: error.message });
  }
});

/**
 * Get user reward balance and tier
 * GET /api/rewards/user-balance/:user_id
 */
router.get("/user-balance/:user_id", async (req, res) => {
  try {
    const { user_id } = req.params;

    // Get total points
    const pointsResult = await db.query(
      `SELECT 
         COALESCE(SUM(points_earned), 0) as total_earned,
         COALESCE(SUM(points_redeemed), 0) as total_redeemed,
         COALESCE(SUM(points_earned) - SUM(points_redeemed), 0) as available_points
       FROM user_rewards
       WHERE user_id = $1 AND status IN ('earned', 'pending')`,
      [user_id]
    );

    const points = pointsResult.rows[0] || {};
    const availablePoints = points.available_points || 0;

    // Determine tier
    const tier = availablePoints >= 15001 ? "Platinum" : availablePoints >= 5001 ? "Gold" : "Silver";

    // Get recent rewards
    const recentResult = await db.query(
      `SELECT id, booking_id, module, points_earned, monetary_value, tier_category, created_at, status
       FROM user_rewards
       WHERE user_id = $1
       ORDER BY created_at DESC
       LIMIT 10`,
      [user_id]
    );

    // Get expiring soon rewards (within 90 days)
    const expiringResult = await db.query(
      `SELECT id, points_earned, monetary_value, expires_at
       FROM user_rewards
       WHERE user_id = $1 AND status = 'earned'
       AND expires_at BETWEEN NOW() AND NOW() + INTERVAL '90 days'
       ORDER BY expires_at ASC`,
      [user_id]
    );

    return res.status(200).json({
      user_id,
      available_points: parseInt(availablePoints),
      total_earned: parseInt(points.total_earned) || 0,
      total_redeemed: parseInt(points.total_redeemed) || 0,
      tier_category: tier,
      points_to_next_tier: Math.max(0, (tier === "Silver" ? 5001 : 15001) - availablePoints),
      conversion_rate: "1 point = ₹1",
      max_redeemable_percentage: 10,
      recent_rewards: recentResult.rows,
      expiring_soon: expiringResult.rows,
      created_at: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error fetching user balance:", error);
    return res.status(500).json({ error: error.message });
  }
});

/**
 * Apply reward points redemption
 * POST /api/rewards/apply-redemption
 * Body: { user_id, booking_id, points_to_redeem, total_booking_value }
 */
router.post("/apply-redemption", async (req, res) => {
  try {
    const { user_id, booking_id, points_to_redeem, total_booking_value } = req.body;

    if (!user_id || !points_to_redeem || !total_booking_value) {
      return res
        .status(400)
        .json({ error: "user_id, points_to_redeem, total_booking_value required" });
    }

    // Check available balance
    const balanceResult = await db.query(
      `SELECT COALESCE(SUM(points_earned) - SUM(points_redeemed), 0) as available_points
       FROM user_rewards
       WHERE user_id = $1 AND status = 'earned'`,
      [user_id]
    );

    const availablePoints = balanceResult.rows[0]?.available_points || 0;

    if (points_to_redeem > availablePoints) {
      return res.status(400).json({
        error: "Insufficient points",
        available_points: availablePoints,
        requested_points: points_to_redeem,
      });
    }

    // Check redemption limit (max 10% of booking value)
    const maxRedeemable = Math.floor(total_booking_value * 0.1);
    const redeemableAmount = Math.min(points_to_redeem, maxRedeemable);

    if (redeemableAmount === 0) {
      return res.status(400).json({
        error: "Redemption amount exceeds 10% limit",
        max_redeemable: maxRedeemable,
        requested_amount: points_to_redeem,
      });
    }

    // Create redemption record
    const redemptionResult = await db.query(
      `INSERT INTO user_rewards (user_id, booking_id, module, points_redeemed, monetary_value, status, metadata)
       VALUES ($1, $2, 'multi-module', $3, $4, 'redeemed', $5)
       RETURNING id, monetary_value`,
      [
        user_id,
        booking_id,
        points_to_redeem,
        redeemableAmount,
        JSON.stringify({
          redeemed_for_booking: booking_id,
          original_total: total_booking_value,
          discount_applied: redeemableAmount,
        }),
      ]
    );

    const redemption = redemptionResult.rows[0];
    const newTotal = total_booking_value - redeemableAmount;

    return res.status(200).json({
      redemption_id: redemption.id,
      points_redeemed: points_to_redeem,
      amount_redeemed: redeemableAmount,
      original_total: total_booking_value,
      new_total: newTotal,
      savings: redeemableAmount,
      message: `Redeemed ${points_to_redeem} points (₹${redeemableAmount}) - New total: ₹${newTotal.toFixed(2)}`,
    });
  } catch (error) {
    console.error("Error applying redemption:", error);
    return res.status(500).json({ error: error.message });
  }
});

/**
 * Get tier progression info
 * GET /api/rewards/tier-info
 */
router.get("/tier-info", (req, res) => {
  const tiers = [
    {
      name: "Silver",
      min_points: 0,
      max_points: 5000,
      multiplier: 1.0,
      benefits: ["Standard earning rate", "3-year point validity"],
    },
    {
      name: "Gold",
      min_points: 5001,
      max_points: 15000,
      multiplier: 1.25,
      benefits: ["25% bonus points", "Extended redemption window", "Monthly points summary"],
    },
    {
      name: "Platinum",
      min_points: 15001,
      multiplier: 1.5,
      benefits: ["50% bonus points", "Priority customer support", "Exclusive deals", "Lifetime point validity"],
    },
  ];

  return res.status(200).json({
    tiers,
    conversion_rate: "1 point = ₹1",
    max_redemption_percentage: 10,
    point_validity: "3 years",
    earning_formula: "1 point per ₹100 spent × tier multiplier",
  });
});

export default router;
