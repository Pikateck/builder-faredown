import { Pool } from 'pg';

export interface LoyaltyMember {
  id: number;
  userId: number;
  memberCode: string;
  tier: number;
  pointsBalance: number;
  pointsLocked: number;
  pointsLifetime: number;
  points12m: number;
  joinDate: string;
  status: string;
  optedOut: boolean;
}

export interface LoyaltyLedgerEntry {
  id: number;
  userId: number;
  bookingId?: string;
  eventType: 'earn' | 'redeem' | 'adjust' | 'expire' | 'revoke';
  pointsDelta: number;
  rupeeValue?: number;
  fxRate: number;
  description?: string;
  meta?: any;
  createdAt: string;
}

export interface TierRule {
  tier: number;
  thresholdPoints12m: number;
  earnMultiplier: number;
  benefits: any;
  tierName: string;
}

export interface LoyaltyRule {
  channel: 'AIR' | 'HOTEL';
  earnPer100: number;
  redeemValuePer100: number;
  minRedeem: number;
  maxCapPct: number;
}

export interface RedemptionQuote {
  maxPoints: number;
  rupeeValue: number;
  capReason?: string;
  appliedPoints?: number;
}

export interface BookingEligibility {
  baseAmount: number;
  eligibleAmount: number;
  currency: string;
  fxRate: number;
  excludedItems: string[];
}

export class LoyaltyService {
  private db: Pool;

  constructor(dbPool: Pool) {
    this.db = dbPool;
  }

  // Create new loyalty member
  async createMember(userId: number): Promise<LoyaltyMember> {
    const client = await this.db.connect();
    try {
      await client.query('BEGIN');

      const memberCodeResult = await client.query('SELECT generate_member_code() as code');
      const memberCode = memberCodeResult.rows[0].code;

      const result = await client.query(`
        INSERT INTO loyalty_members (user_id, member_code)
        VALUES ($1, $2)
        RETURNING *
      `, [userId, memberCode]);

      await client.query('COMMIT');
      return this.mapMemberRow(result.rows[0]);
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  // Get member by user ID
  async getMember(userId: number): Promise<LoyaltyMember | null> {
    const result = await this.db.query(`
      SELECT * FROM loyalty_members WHERE user_id = $1
    `, [userId]);

    return result.rows.length > 0 ? this.mapMemberRow(result.rows[0]) : null;
  }

  // Get or create member
  async getOrCreateMember(userId: number): Promise<LoyaltyMember> {
    let member = await this.getMember(userId);
    if (!member) {
      member = await this.createMember(userId);
    }
    return member;
  }

  // Get loyalty rules
  async getRules(): Promise<{ air: LoyaltyRule; hotel: LoyaltyRule }> {
    const result = await this.db.query(`
      SELECT * FROM loyalty_rules 
      WHERE (active_to IS NULL OR active_to > NOW())
      ORDER BY active_from DESC
    `);

    const rules = result.rows.reduce((acc, row) => {
      acc[row.channel.toLowerCase()] = {
        channel: row.channel,
        earnPer100: row.earn_per_100,
        redeemValuePer100: row.redeem_value_per_100,
        minRedeem: row.min_redeem,
        maxCapPct: row.max_cap_pct
      };
      return acc;
    }, {} as any);

    return rules;
  }

  // Get tier rules
  async getTierRules(): Promise<TierRule[]> {
    const result = await this.db.query(`
      SELECT * FROM tier_rules 
      WHERE (active_to IS NULL OR active_to > NOW())
      ORDER BY tier ASC
    `);

    return result.rows.map(row => ({
      tier: row.tier,
      thresholdPoints12m: row.threshold_points_12m,
      earnMultiplier: row.earn_multiplier,
      benefits: row.benefits,
      tierName: row.tier_name
    }));
  }

  // Calculate points earned from booking
  async calculateEarning(
    userId: number,
    bookingType: 'AIR' | 'HOTEL',
    eligibility: BookingEligibility
  ): Promise<number> {
    const member = await this.getOrCreateMember(userId);
    const rules = await this.getRules();
    const tierRules = await this.getTierRules();

    const rule = rules[bookingType.toLowerCase() as 'air' | 'hotel'];
    if (!rule) return 0;

    // Convert to INR if needed
    const inrAmount = eligibility.eligibleAmount * eligibility.fxRate;

    // Calculate base points
    const basePoints = Math.floor((inrAmount / 100) * rule.earnPer100);

    // Apply tier multiplier
    const currentTier = tierRules.find(t => t.tier === member.tier);
    const multiplier = currentTier?.earnMultiplier || 1.0;
    const earnedPoints = Math.floor(basePoints * multiplier);

    return earnedPoints;
  }

  // Process earning transaction
  async processEarning(
    userId: number,
    bookingId: string,
    bookingType: 'AIR' | 'HOTEL',
    eligibility: BookingEligibility,
    description?: string
  ): Promise<number> {
    const earnedPoints = await this.calculateEarning(userId, bookingType, eligibility);
    if (earnedPoints <= 0) return 0;

    const client = await this.db.connect();
    try {
      await client.query('BEGIN');

      // Add to ledger
      await client.query(`
        INSERT INTO loyalty_ledger 
        (user_id, booking_id, event_type, points_delta, rupee_value, fx_rate, description, meta)
        VALUES ($1, $2, 'earn', $3, $4, $5, $6, $7)
      `, [
        userId,
        bookingId,
        earnedPoints,
        eligibility.eligibleAmount,
        eligibility.fxRate,
        description || `Earned from ${bookingType} booking`,
        JSON.stringify({
          bookingType,
          baseAmount: eligibility.baseAmount,
          eligibleAmount: eligibility.eligibleAmount,
          currency: eligibility.currency
        })
      ]);

      // Update member balance
      await client.query(`
        UPDATE loyalty_members 
        SET points_balance = points_balance + $1,
            points_lifetime = points_lifetime + $1,
            points_12m = points_12m + $1,
            last_calc_date = NOW()
        WHERE user_id = $2
      `, [earnedPoints, userId]);

      // Add to expiry tracking (24 months from now)
      const expiryDate = new Date();
      expiryDate.setMonth(expiryDate.getMonth() + 24);
      
      await client.query(`
        INSERT INTO point_expiry (user_id, points, earn_batch_id, expire_on)
        VALUES ($1, $2, $3, $4)
      `, [userId, earnedPoints, bookingId, expiryDate.toISOString().split('T')[0]]);

      await client.query('COMMIT');
      return earnedPoints;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  // Quote redemption for cart
  async quoteRedemption(
    userId: number,
    eligibleAmount: number,
    currency: string = 'INR',
    fxRate: number = 1.0
  ): Promise<RedemptionQuote> {
    const member = await this.getMember(userId);
    if (!member) {
      return { maxPoints: 0, rupeeValue: 0, capReason: 'Not a loyalty member' };
    }

    const rules = await this.getRules();
    const redeemValuePer100 = rules.air?.redeemValuePer100 || rules.hotel?.redeemValuePer100 || 10;
    const maxCapPct = rules.air?.maxCapPct || rules.hotel?.maxCapPct || 0.2;
    const minRedeem = rules.air?.minRedeem || rules.hotel?.minRedeem || 200;

    // Convert eligible amount to INR
    const inrEligibleAmount = eligibleAmount * fxRate;

    // Calculate maximum redeemable value (20% of eligible amount)
    const maxRedeemValue = inrEligibleAmount * maxCapPct;

    // Calculate maximum points based on value cap and available balance
    const maxPointsByValue = Math.floor((maxRedeemValue / redeemValuePer100) * 100);
    const availablePoints = member.pointsBalance - member.pointsLocked;

    let maxPoints = Math.min(maxPointsByValue, availablePoints);
    let capReason = '';

    if (maxPoints < minRedeem) {
      maxPoints = 0;
      capReason = `Minimum ${minRedeem} points required`;
    } else if (maxPoints === maxPointsByValue) {
      capReason = `Limited to ${Math.round(maxCapPct * 100)}% of booking value`;
    } else if (maxPoints === availablePoints) {
      capReason = 'Limited by available point balance';
    }

    // Round down to nearest 100 for clean UX
    maxPoints = Math.floor(maxPoints / 100) * 100;

    const rupeeValue = (maxPoints / 100) * redeemValuePer100;

    return {
      maxPoints,
      rupeeValue,
      capReason: capReason || undefined
    };
  }

  // Apply redemption to cart
  async applyRedemption(
    userId: number,
    cartId: string,
    points: number,
    eligibleAmount: number,
    currency: string = 'INR',
    fxRate: number = 1.0
  ): Promise<{ success: boolean; lockedId?: string; rupeeValue?: number; error?: string }> {
    const quote = await this.quoteRedemption(userId, eligibleAmount, currency, fxRate);
    
    if (points > quote.maxPoints) {
      return { success: false, error: `Cannot redeem ${points} points. Maximum: ${quote.maxPoints}` };
    }

    const rules = await this.getRules();
    const redeemValuePer100 = rules.air?.redeemValuePer100 || rules.hotel?.redeemValuePer100 || 10;
    const rupeeValue = (points / 100) * redeemValuePer100;

    const client = await this.db.connect();
    try {
      await client.query('BEGIN');

      // Create redemption transaction
      const result = await client.query(`
        INSERT INTO loyalty_transactions 
        (user_id, cart_id, points_applied, rupee_value, expires_at)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING id
      `, [userId, cartId, points, rupeeValue, new Date(Date.now() + 30 * 60 * 1000)]); // 30 min expiry

      const lockedId = result.rows[0].id;

      // Lock points
      await client.query(`
        UPDATE loyalty_members 
        SET points_locked = points_locked + $1
        WHERE user_id = $2
      `, [points, userId]);

      await client.query('COMMIT');
      
      return {
        success: true,
        lockedId: lockedId.toString(),
        rupeeValue
      };
    } catch (error) {
      await client.query('ROLLBACK');
      return { success: false, error: 'Failed to apply redemption' };
    } finally {
      client.release();
    }
  }

  // Confirm redemption after successful payment
  async confirmRedemption(lockedId: string, bookingId: string): Promise<boolean> {
    const client = await this.db.connect();
    try {
      await client.query('BEGIN');

      // Get transaction details
      const txnResult = await client.query(`
        SELECT * FROM loyalty_transactions WHERE id = $1 AND status = 'pending'
      `, [lockedId]);

      if (txnResult.rows.length === 0) {
        await client.query('ROLLBACK');
        return false;
      }

      const transaction = txnResult.rows[0];

      // Add to ledger
      await client.query(`
        INSERT INTO loyalty_ledger 
        (user_id, booking_id, event_type, points_delta, rupee_value, description, meta)
        VALUES ($1, $2, 'redeem', $3, $4, $5, $6)
      `, [
        transaction.user_id,
        bookingId,
        -transaction.points_applied,
        transaction.rupee_value,
        'Points redeemed on booking',
        JSON.stringify({ transactionId: lockedId, cartId: transaction.cart_id })
      ]);

      // Update member balance
      await client.query(`
        UPDATE loyalty_members 
        SET points_balance = points_balance - $1,
            points_locked = points_locked - $1
        WHERE user_id = $2
      `, [transaction.points_applied, transaction.user_id]);

      // Update transaction status
      await client.query(`
        UPDATE loyalty_transactions 
        SET status = 'confirmed', booking_id = $1, updated_at = NOW()
        WHERE id = $2
      `, [bookingId, lockedId]);

      await client.query('COMMIT');
      return true;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  // Cancel redemption (release locked points)
  async cancelRedemption(lockedId: string): Promise<boolean> {
    const client = await this.db.connect();
    try {
      await client.query('BEGIN');

      const txnResult = await client.query(`
        SELECT * FROM loyalty_transactions WHERE id = $1 AND status = 'pending'
      `, [lockedId]);

      if (txnResult.rows.length === 0) {
        await client.query('ROLLBACK');
        return false;
      }

      const transaction = txnResult.rows[0];

      // Release locked points
      await client.query(`
        UPDATE loyalty_members 
        SET points_locked = points_locked - $1
        WHERE user_id = $2
      `, [transaction.points_applied, transaction.user_id]);

      // Update transaction status
      await client.query(`
        UPDATE loyalty_transactions 
        SET status = 'cancelled', updated_at = NOW()
        WHERE id = $1
      `, [lockedId]);

      await client.query('COMMIT');
      return true;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  // Get member ledger with pagination
  async getMemberLedger(
    userId: number,
    limit: number = 20,
    offset: number = 0
  ): Promise<{ items: LoyaltyLedgerEntry[]; total: number }> {
    const countResult = await this.db.query(
      'SELECT COUNT(*) FROM loyalty_ledger WHERE user_id = $1',
      [userId]
    );

    const result = await this.db.query(`
      SELECT * FROM loyalty_ledger 
      WHERE user_id = $1
      ORDER BY created_at DESC
      LIMIT $2 OFFSET $3
    `, [userId, limit, offset]);

    return {
      items: result.rows.map(this.mapLedgerRow),
      total: parseInt(countResult.rows[0].count)
    };
  }

  // Calculate and update member tier
  async updateMemberTier(userId: number): Promise<{ oldTier: number; newTier: number }> {
    const member = await this.getMember(userId);
    if (!member) throw new Error('Member not found');

    const tierRules = await this.getTierRules();
    
    // Find appropriate tier based on 12-month points
    let newTier = 1;
    for (const rule of tierRules.reverse()) {
      if (member.points12m >= rule.thresholdPoints12m) {
        newTier = rule.tier;
        break;
      }
    }

    if (newTier !== member.tier) {
      await this.db.query(`
        UPDATE loyalty_members 
        SET tier = $1, last_calc_date = NOW()
        WHERE user_id = $2
      `, [newTier, userId]);
    }

    return { oldTier: member.tier, newTier };
  }

  // Get expiring points
  async getExpiringPoints(userId: number, daysAhead: number = 60): Promise<any[]> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() + daysAhead);

    const result = await this.db.query(`
      SELECT * FROM point_expiry 
      WHERE user_id = $1 AND expire_on <= $2 AND status = 'active'
      ORDER BY expire_on ASC
    `, [userId, cutoffDate.toISOString().split('T')[0]]);

    return result.rows;
  }

  // Helper methods
  private mapMemberRow(row: any): LoyaltyMember {
    return {
      id: row.id,
      userId: row.user_id,
      memberCode: row.member_code,
      tier: row.tier,
      pointsBalance: row.points_balance,
      pointsLocked: row.points_locked,
      pointsLifetime: row.points_lifetime,
      points12m: row.points_12m,
      joinDate: row.join_date,
      status: row.status,
      optedOut: row.opted_out
    };
  }

  private mapLedgerRow(row: any): LoyaltyLedgerEntry {
    return {
      id: row.id,
      userId: row.user_id,
      bookingId: row.booking_id,
      eventType: row.event_type,
      pointsDelta: row.points_delta,
      rupeeValue: row.rupee_value ? parseFloat(row.rupee_value) : undefined,
      fxRate: parseFloat(row.fx_rate || '1.0'),
      description: row.description,
      meta: row.meta,
      createdAt: row.created_at
    };
  }
}

export default LoyaltyService;
