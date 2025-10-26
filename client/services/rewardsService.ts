import axios from "axios";

const API_BASE_URL =
  process.env.REACT_APP_API_BASE_URL ||
  process.env.VITE_API_BASE_URL ||
  "https://builder-faredown-pricing.onrender.com/api";

const api = axios.create({
  baseURL: `${API_BASE_URL}/rewards`,
  headers: {
    "Content-Type": "application/json",
  },
});

export const rewardsService = {
  /**
   * Calculate earnings for a booking
   */
  calculateEarnings: async (
    finalPrice: number,
    tier: string = "Silver",
    module: string = "hotels",
  ) => {
    try {
      const response = await api.post("/calculate-earnings", {
        final_price: finalPrice,
        tier_category: tier,
        module,
      });
      return response.data;
    } catch (error) {
      console.error("Error calculating earnings:", error);
      throw error;
    }
  },

  /**
   * Record reward earning from a booking
   */
  earnFromBooking: async (
    userId: string,
    bookingId: string,
    finalPrice: number,
    module: string = "hotels",
    tier: string = "Silver",
    discountAmount: number = 0,
  ) => {
    try {
      const response = await api.post(
        "/earn-from-booking",
        {
          user_id: userId,
          booking_id: bookingId,
          final_price: finalPrice,
          module,
          tier_category: tier,
          discount_amount: discountAmount,
        },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        },
      );
      return response.data;
    } catch (error) {
      console.error("Error earning from booking:", error);
      throw error;
    }
  },

  /**
   * Get user reward balance and tier
   */
  getUserBalance: async (userId: string) => {
    try {
      const response = await api.get(`/user-balance/${userId}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
      return response.data;
    } catch (error) {
      console.error("Error fetching user balance:", error);
      throw error;
    }
  },

  /**
   * Apply reward redemption
   */
  applyRedemption: async (
    userId: string,
    bookingId: string,
    pointsToRedeem: number,
    totalBookingValue: number,
  ) => {
    try {
      const response = await api.post(
        "/apply-redemption",
        {
          user_id: userId,
          booking_id: bookingId,
          points_to_redeem: pointsToRedeem,
          total_booking_value: totalBookingValue,
        },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        },
      );
      return response.data;
    } catch (error) {
      console.error("Error applying redemption:", error);
      throw error;
    }
  },

  /**
   * Get tier information
   */
  getTierInfo: async () => {
    try {
      const response = await api.get("/tier-info");
      return response.data;
    } catch (error) {
      console.error("Error fetching tier info:", error);
      throw error;
    }
  },
};

export default rewardsService;
