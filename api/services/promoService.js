/**
 * Promo Service
 * Handles promotional codes and discounts
 */

class PromoService {
  constructor() {
    this.promos = new Map();
  }

  /**
   * Validate a promo code
   */
  async validatePromo(promoCode, bookingDetails) {
    // Basic promo validation logic
    const promo = this.promos.get(promoCode);
    
    if (!promo || !promo.active) {
      return { valid: false, message: "Invalid promo code" };
    }

    return {
      valid: true,
      discount: promo.discount || 0,
      discountType: promo.discountType || "percentage"
    };
  }

  /**
   * Apply promo discount to price
   */
  async applyPromo(price, promoCode) {
    const validation = await this.validatePromo(promoCode);
    
    if (!validation.valid) {
      return { originalPrice: price, finalPrice: price, discount: 0 };
    }

    let discount = 0;
    if (validation.discountType === "percentage") {
      discount = price * (validation.discount / 100);
    } else {
      discount = validation.discount;
    }

    return {
      originalPrice: price,
      finalPrice: Math.max(0, price - discount),
      discount: discount
    };
  }

  /**
   * Get available promos
   */
  async getAvailablePromos() {
    return Array.from(this.promos.values()).filter(promo => promo.active);
  }
}

module.exports = new PromoService();
