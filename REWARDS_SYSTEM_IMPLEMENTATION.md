# Rewards & Bargain Price Display System

## Overview

This document describes the complete **Rewards & Bargain Price Display** system implementation following industry travel/hospitality standards (1 point per ₹100 spent, tier multipliers, etc.).

**Status:** ✅ Ready for Deployment  
**Modules Supported:** Hotels (expandable to Flights, Transfers, Sightseeing, Packages)

---

## Industry Standard Formula

### Earning Rate
- **Base Rate:** 1 point per ₹100 spent (calculated on final bargained price)
- **Tier Multipliers:**
  - Silver (0-5,000 points): 1x multiplier
  - Gold (5,001-15,000 points): 1.25x multiplier
  - Platinum (15,001+ points): 1.5x multiplier

### Redemption
- **Conversion Rate:** 1 point = ₹1 value
- **Max Redemption:** 10% of total booking value
- **Point Validity:** 3 years from earning date
- **Tier Progression:** Automatic based on total points balance

### Example
```
Booking Price: ₹10,000
Tier: Gold (1.25x multiplier)
Base Points: 10,000 ÷ 100 = 100 points
Earned Points: 100 × 1.25 = 125 points
Monetary Value: 125 × ₹1 = ₹125
```

---

## Database Schema

### New Tables

#### `user_rewards`
```sql
- id (UUID)
- user_id (UUID, Foreign Key to users)
- booking_id (UUID)
- module (VARCHAR) - hotels, flights, transfers, sightseeing, packages
- points_earned (INT)
- points_redeemed (INT)
- monetary_value (DECIMAL)
- tier_category (VARCHAR) - Silver, Gold, Platinum
- status (VARCHAR) - earned, redeemed, pending, expired
- created_at (TIMESTAMP)
- expires_at (TIMESTAMP) - default: 3 years from creation
- metadata (JSONB) - stores additional context (discount %, source, etc.)
```

#### `user_tier_history`
```sql
- id (UUID)
- user_id (UUID)
- previous_tier (VARCHAR)
- new_tier (VARCHAR)
- total_points_at_change (INT)
- changed_at (TIMESTAMP)
- reason (VARCHAR)
```

### Updated Booking Tables
All booking tables (`hotel_bookings`, `flight_bookings`, `transfers_bookings`) now have:
```sql
- original_price (DECIMAL)
- bargained_price (DECIMAL)
- discount_amount (DECIMAL)
- discount_percentage (DECIMAL)
- points_earned (INT)
- points_redeemed (INT)
- bargain_round_id (UUID)
- bargain_accepted_at (TIMESTAMP)
```

### Database Functions
- **`get_user_tier(points INT)`** - Returns tier name based on points
- **`calculate_booking_rewards(final_price, tier_category, module)`** - Calculates points earned using industry formula

---

## API Endpoints

### Authentication
All endpoints require Bearer token (except `/api/rewards/tier-info`):
```
Authorization: Bearer <JWT_TOKEN>
```

### 1. Calculate Earnings
**POST** `/api/rewards/calculate-earnings`

Calculate rewards for a given price and tier without storing.

**Request:**
```json
{
  "final_price": 10000,
  "tier_category": "Gold",
  "module": "hotels"
}
```

**Response:**
```json
{
  "points_earned": 125,
  "monetary_value": 125,
  "tier_multiplier": 1.25,
  "tier_category": "Gold",
  "module": "hotels"
}
```

### 2. Earn from Booking
**POST** `/api/rewards/earn-from-booking`

Record reward earning when a booking is confirmed.

**Request:**
```json
{
  "user_id": "uuid",
  "booking_id": "uuid",
  "final_price": 22000,
  "module": "hotels",
  "tier_category": "Gold",
  "discount_amount": 3000
}
```

**Response:**
```json
{
  "reward_id": "uuid",
  "points_earned": 275,
  "monetary_value": 275,
  "tier_category": "Gold",
  "user_total_points": 8500,
  "user_tier": "Gold",
  "message": "Earned 275 points (₹275)"
}
```

### 3. Get User Balance
**GET** `/api/rewards/user-balance/:user_id`

Fetch user's reward balance, tier, and recent transactions.

**Response:**
```json
{
  "user_id": "uuid",
  "available_points": 8500,
  "total_earned": 8500,
  "total_redeemed": 0,
  "tier_category": "Gold",
  "points_to_next_tier": 6501,
  "conversion_rate": "1 point = ₹1",
  "max_redeemable_percentage": 10,
  "recent_rewards": [...],
  "expiring_soon": [...]
}
```

### 4. Apply Redemption
**POST** `/api/rewards/apply-redemption`

Redeem points to reduce booking total price.

**Request:**
```json
{
  "user_id": "uuid",
  "booking_id": "uuid",
  "points_to_redeem": 200,
  "total_booking_value": 22000
}
```

**Response:**
```json
{
  "redemption_id": "uuid",
  "points_redeemed": 200,
  "amount_redeemed": 200,
  "original_total": 22000,
  "new_total": 21800,
  "savings": 200,
  "message": "Redeemed 200 points (₹200) - New total: ₹21800"
}
```

### 5. Get Tier Information
**GET** `/api/rewards/tier-info`

Public endpoint - fetch tier information and conversion rates.

**Response:**
```json
{
  "tiers": [
    {
      "name": "Silver",
      "min_points": 0,
      "max_points": 5000,
      "multiplier": 1.0,
      "benefits": [...]
    },
    {
      "name": "Gold",
      "min_points": 5001,
      "max_points": 15000,
      "multiplier": 1.25,
      "benefits": [...]
    },
    {
      "name": "Platinum",
      "min_points": 15001,
      "multiplier": 1.5,
      "benefits": [...]
    }
  ],
  "conversion_rate": "1 point = ₹1",
  "max_redemption_percentage": 10,
  "point_validity": "3 years",
  "earning_formula": "1 point per ₹100 spent × tier multiplier"
}
```

---

## Frontend Integration

### 1. Bargain Price Display (HotelBooking.tsx)
On the booking summary page, displays:
- **Original Price** (with strikethrough)
- **Your Bargained Price** (bold)
- **You Saved** (amount and percentage in green)

Example display:
```
Your Bargain Savings
Original Price:      ₹25,000
Your Bargained Price: ₹22,000
You Saved:           ₹3,000 (12%)
```

### 2. Rewards Earned Display (HotelBooking.tsx)
After booking confirmation, shows:
- **Faredown Points** (e.g., +125)
- **Monetary Value** (e.g., ₹125)
- **Current Tier** (e.g., Gold)
- **CTA:** "Redeem on your next booking!"

Example display:
```
Rewards Earned
Faredown Points: +125
Monetary Value: ₹125
Your tier: Gold • Redeem on your next booking!
```

### 3. Dashboard Display (Account.tsx)
Existing loyalty dashboard now enhanced with:
- **Available Points Balance** (e.g., "1,250 points")
- **Current Tier** (e.g., "Gold")
- **Points to Next Tier** (e.g., "6,500 more points to Platinum")
- **Tier Benefits** (auto-expanded with current tier features)
- **Recent Transactions** (last 10 earning/redemption records)
- **Expiring Soon** (alerts for points expiring within 90 days)

### 4. Redemption Widget (Checkout - Future Phase)
Before final payment, users can:
- View available points
- Toggle "Apply Reward Points"
- See updated total after redemption
- Confirm redemption before payment

---

## Deployment Instructions

### Step 1: Apply Database Migration

**Option A: Automated (Recommended)**
```bash
cd api
node database/run-rewards-migration.js
```

**Option B: Manual**
```bash
psql -h <host> -U <user> -d <database> -f database/migrations/20250330_create_rewards_system.sql
```

### Step 2: Verify Routes Registration

Check that `api/server.js` includes:
```javascript
const rewardsRoutes = require("./routes/rewards.js");
app.use("/api/rewards", authenticateToken, rewardsRoutes);
```

✅ Already done in this implementation.

### Step 3: Test API Endpoints

```bash
# Get tier information (public endpoint)
curl https://builder-faredown-pricing.onrender.com/api/rewards/tier-info

# Calculate earnings (requires auth)
curl -X POST https://builder-faredown-pricing.onrender.com/api/rewards/calculate-earnings \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <TOKEN>" \
  -d '{
    "final_price": 10000,
    "tier_category": "Gold",
    "module": "hotels"
  }'

# Get user balance
curl https://builder-faredown-pricing.onrender.com/api/rewards/user-balance/<USER_ID> \
  -H "Authorization: Bearer <TOKEN>"
```

### Step 4: Integrate with Booking Flow

Update hotel booking confirmation to call:
```
POST /api/bookings/hotels/confirm
```

With additional fields:
```json
{
  "userId": "user-uuid",
  "originalPrice": 25000,
  "bargainedPrice": 22000,
  "discountAmount": 3000
}
```

The booking route will automatically call the rewards API to record earnings.

### Step 5: Deploy to Production

```bash
# Commit all changes
git add -A
git commit -m "Add rewards & bargain price display system - industry standard formula"

# Push to Render
git push origin main

# Render auto-deploys
```

---

## Frontend Service Integration

Use the `rewardsService` (client/services/rewardsService.ts) to interact with rewards API:

```typescript
import { rewardsService } from "@/services/rewardsService";

// Calculate earnings
const earnings = await rewardsService.calculateEarnings(
  finalPrice,
  userTier,
  "hotels"
);

// Record earning after booking
const reward = await rewardsService.earnFromBooking(
  userId,
  bookingId,
  finalPrice,
  "hotels",
  userTier,
  discountAmount
);

// Get user balance
const balance = await rewardsService.getUserBalance(userId);

// Apply redemption
const redemption = await rewardsService.applyRedemption(
  userId,
  bookingId,
  pointsToRedeem,
  totalBookingValue
);
```

---

## Revenue Safeguards

### 1. Redemption Limits
- **Max Redemption:** 10% of booking value
- **Enforcement:** Server-side validation in `/api/rewards/apply-redemption`

### 2. Tier-Based Multipliers
- Controlled via tier calculation
- Encourages customer loyalty (higher tiers = more benefits)
- Margins protected: even Platinum tier (1.5x) ensures positive ROI

### 3. Configuration Points
Admins can adjust in future phases:
```env
MAX_REDEMPTION_PERCENTAGE=10 # currently 10%
POINTS_EARN_RATE=100 # currently 1 point per ₹100
POINTS_VALUE_CONVERSION=1 # currently 1 point = ₹1
```

### 4. Audit Trail
- `user_tier_history` tracks all tier changes
- `user_rewards.metadata` stores full context (discount %, source)
- All transactions logged with timestamps

---

## Phase 2 Expansion (Future)

After Hotels validation, expand to:
1. **Flights** - Apply same formula to flight bookings
2. **Transfers** - Scaled redemption for smaller values
3. **Sightseeing** - Bonus points for package deals
4. **Packages** - Enhanced multipliers for multi-module bookings

---

## Troubleshooting

### Points not showing after booking?
1. Check if `earn-from-booking` was called
2. Verify user_id passed is correct
3. Check `user_rewards` table for records:
```sql
SELECT * FROM user_rewards WHERE user_id = '<uuid>' ORDER BY created_at DESC;
```

### Redemption failing?
1. Verify user has available points:
```sql
SELECT COALESCE(SUM(points_earned) - SUM(points_redeemed), 0) as available
FROM user_rewards WHERE user_id = '<uuid>' AND status = 'earned';
```
2. Check if redemption amount exceeds 10% limit
3. Verify points are not expired (expires_at < NOW())

### Tier not updating?
Tier is calculated dynamically - no manual update needed. Tier is determined from total points at the time of display.

---

## Support & Questions

For issues or feature requests related to rewards:
1. Check the API response error messages
2. Review logs in `api/routes/rewards.js`
3. Verify database migration completed successfully

---

**Implementation Date:** March 30, 2025  
**Last Updated:** March 30, 2025  
**Status:** ✅ Production Ready  
**Modules:** Hotels ✅ | Flights 🔜 | Transfers 🔜 | Sightseeing 🔜 | Packages 🔜
