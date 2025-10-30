/**
 * Booking Utilities
 * Helper functions for booking operations
 */

const crypto = require('crypto');

/**
 * Generate unique booking reference
 * Format: FD + YYYYMMDD + Random alphanumeric (6 chars)
 * Example: FD202504051A2B3C
 */
function generateBookingRef() {
  const date = new Date().toISOString().replace(/-/g, '').split('T')[0];
  const random = crypto.randomBytes(4).toString('hex').toUpperCase().slice(0, 6);
  return `FD${date}${random}`;
}

/**
 * Generate document number
 * Format for vouchers: VCH + YYYYMMDD + Sequential ID
 * Format for invoices: INV + YYYYMMDD + Sequential ID
 */
function generateDocumentNumber(documentType = 'voucher') {
  const date = new Date().toISOString().replace(/-/g, '').split('T')[0];
  const timestamp = Date.now().toString().slice(-6);
  const random = Math.random().toString(36).substr(2, 3).toUpperCase();
  
  const prefix = documentType === 'invoice' ? 'INV' : 'VCH';
  return `${prefix}${date}${timestamp}${random}`;
}

/**
 * Sanitize PAN card number (remove spaces and dashes)
 */
function sanitizePAN(panNumber) {
  return panNumber.replace(/[\s\-]/g, '').toUpperCase();
}

/**
 * Validate PAN format
 * PAN format: 5 letters + 4 digits + 1 letter + 1 digit + 1 letter
 * But we also accept alphanumeric up to 20 chars for flexibility
 */
function validatePAN(panNumber) {
  const sanitized = sanitizePAN(panNumber);
  
  // Check length
  if (sanitized.length > 20 || sanitized.length < 1) {
    return {
      valid: false,
      error: 'PAN must be between 1 and 20 characters',
    };
  }
  
  // Check alphanumeric
  if (!/^[A-Z0-9]+$/.test(sanitized)) {
    return {
      valid: false,
      error: 'PAN must be alphanumeric (A-Z, 0-9)',
    };
  }
  
  return {
    valid: true,
    sanitized,
  };
}

/**
 * Hash PAN for storage
 */
function hashPAN(panNumber) {
  const sanitized = sanitizePAN(panNumber);
  return crypto.createHash('sha256').update(sanitized).digest('hex');
}

/**
 * Mask PAN for display
 * Shows only last 4 characters
 */
function maskPAN(panNumber) {
  const sanitized = sanitizePAN(panNumber);
  if (sanitized.length <= 4) {
    return sanitized;
  }
  return '*'.repeat(sanitized.length - 4) + sanitized.slice(-4);
}

/**
 * Calculate booking pricing breakdown
 */
function calculatePricingBreakdown(basePrice, markupPercentage = 0, taxPercentage = 0, fees = 0) {
  const markupAmount = (basePrice * markupPercentage) / 100;
  const taxableAmount = basePrice + markupAmount;
  const taxAmount = (taxableAmount * taxPercentage) / 100;
  const total = basePrice + markupAmount + taxAmount + fees;
  
  return {
    basePrice: parseFloat(basePrice.toFixed(2)),
    markupPercentage,
    markupAmount: parseFloat(markupAmount.toFixed(2)),
    taxPercentage,
    taxAmount: parseFloat(taxAmount.toFixed(2)),
    fees: parseFloat(fees.toFixed(2)),
    total: parseFloat(total.toFixed(2)),
  };
}

/**
 * Format date for display
 * Returns: "Mon, 15 Apr 2025"
 */
function formatBookingDate(date) {
  const d = new Date(date);
  const options = { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' };
  return d.toLocaleDateString('en-IN', options);
}

/**
 * Calculate number of nights
 */
function calculateNights(checkInDate, checkOutDate) {
  const checkIn = new Date(checkInDate);
  const checkOut = new Date(checkOutDate);
  return Math.ceil((checkOut - checkIn) / (1000 * 60 * 60 * 24));
}

/**
 * Generate bargain summary
 */
function generateBargainSummary(basePrice, finalPrice, rounds = 0) {
  const discountAmount = basePrice - finalPrice;
  const discountPercentage = ((discountAmount / basePrice) * 100).toFixed(2);
  
  return {
    basePrice: parseFloat(basePrice.toFixed(2)),
    finalPrice: parseFloat(finalPrice.toFixed(2)),
    discountAmount: parseFloat(discountAmount.toFixed(2)),
    discountPercentage: parseFloat(discountPercentage),
    rounds,
    savingsPercentage: `${discountPercentage}%`,
  };
}

module.exports = {
  generateBookingRef,
  generateDocumentNumber,
  sanitizePAN,
  validatePAN,
  hashPAN,
  maskPAN,
  calculatePricingBreakdown,
  formatBookingDate,
  calculateNights,
  generateBargainSummary,
};
