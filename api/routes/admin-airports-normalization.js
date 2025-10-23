/**
 * Server-side normalization utilities for airport data
 * Defense in depth: Normalize "ALL" to NULL when saving to database
 */

/**
 * Normalize airport field values for database storage
 * @param {string|null} value - The airport value from UI
 * @returns {string|null} - Normalized value (NULL for "ALL", otherwise the value)
 */
function normalizeAirportField(value) {
  if (!value || value === "" || value === "ALL" || value === "all") {
    return null;
  }
  return value.toString().trim().toUpperCase();
}

/**
 * Normalize airport markup data before saving
 * @param {Object} markupData - Markup data from UI
 * @returns {Object} - Normalized markup data
 */
function normalizeMarkupData(markupData) {
  return {
    ...markupData,
    origin_iata: normalizeAirportField(
      markupData.origin_iata || markupData.origin,
    ),
    dest_iata: normalizeAirportField(
      markupData.dest_iata || markupData.destination,
    ),
    origin: normalizeAirportField(markupData.origin),
    destination: normalizeAirportField(markupData.destination),
  };
}

/**
 * Normalize promo code data before saving
 * @param {Object} promoData - Promo code data from UI
 * @returns {Object} - Normalized promo code data
 */
function normalizePromoCodeData(promoData) {
  return {
    ...promoData,
    origin: normalizeAirportField(promoData.origin),
    destination: normalizeAirportField(promoData.destination),
  };
}

module.exports = {
  normalizeAirportField,
  normalizeMarkupData,
  normalizePromoCodeData,
};
