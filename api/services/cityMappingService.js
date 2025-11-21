/**
 * City Mapping Service
 * Handles matching Hotelbeds cities to TBO cities with confidence scoring
 */

const db = require("../database/connection");
const Levenshtein = require("js-levenshtein"); // For fuzzy matching (npm install js-levenshtein)

class CityMappingService {
  /**
   * Normalize city/country names for matching
   */
  static normalize(str) {
    if (!str) return "";
    return str
      .toLowerCase()
      .trim()
      .replace(/[\s\/-]+/g, " ")
      .replace(/[^\w\s]/g, "");
  }

  /**
   * Calculate Levenshtein distance (0-100 confidence)
   */
  static levenshteinConfidence(str1, str2) {
    const norm1 = this.normalize(str1);
    const norm2 = this.normalize(str2);

    if (norm1 === norm2) return 100; // Exact match

    const maxLen = Math.max(norm1.length, norm2.length);
    if (maxLen === 0) return 0;

    const distance = Levenshtein(norm1, norm2);
    return Math.max(0, 100 - (distance / maxLen) * 100);
  }

  /**
   * Find best TBO city match for a Hotelbeds city
   * Returns { tbo_city_id, confidence, method }
   */
  static async findBestMatch(hbCityName, hbCountryCode) {
    // Get all TBO cities for the country
    const query = `
      SELECT tbo_city_id, city_name, city_name_normalized
      FROM public.tbo_cities
      WHERE country_code = $1 AND is_active = true
      ORDER BY hotel_count DESC, popularity_score DESC
    `;

    const result = await db.query(query, [hbCountryCode.toUpperCase()]);
    if (!result.rows.length) {
      return null; // No TBO cities for this country
    }

    const tboCities = result.rows;
    const hbNormalized = this.normalize(hbCityName);

    // Strategy 1: Exact match on normalized name
    let match = tboCities.find((tc) => tc.city_name_normalized === hbNormalized);
    if (match) {
      return {
        tbo_city_id: match.tbo_city_id,
        tbo_city_name: match.city_name,
        confidence: 100,
        method: "exact_name",
      };
    }

    // Strategy 2: Substring match (Hotelbeds city is substring of TBO city)
    // e.g., "Delhi" in "New Delhi / Delhi"
    match = tboCities.find(
      (tc) =>
        hbNormalized.split(" ").some((word) => tc.city_name_normalized.includes(word)) ||
        tc.city_name_normalized.split(" ").some((word) => hbNormalized.includes(word))
    );
    if (match) {
      return {
        tbo_city_id: match.tbo_city_id,
        tbo_city_name: match.city_name,
        confidence: 85,
        method: "substring_match",
      };
    }

    // Strategy 3: Fuzzy match (Levenshtein distance)
    const confidences = tboCities.map((tc) => ({
      tbo_city_id: tc.tbo_city_id,
      tbo_city_name: tc.city_name,
      confidence: this.levenshteinConfidence(hbCityName, tc.city_name),
    }));

    confidences.sort((a, b) => b.confidence - a.confidence);
    match = confidences[0];

    if (match.confidence > 60) {
      return {
        ...match,
        method: "fuzzy_match",
      };
    }

    // No good match found
    return null;
  }

  /**
   * Create or update a city mapping
   */
  static async upsertMapping(
    hbCityCode,
    hbCityName,
    hbCountryCode,
    tboCityId,
    tboCityName,
    tboCountryCode,
    confidence,
    method,
    notes = null
  ) {
    const query = `
      INSERT INTO public.city_mapping
        (hotelbeds_city_code, hotelbeds_city_name, hotelbeds_country_code,
         tbo_city_id, tbo_city_name, tbo_country_code,
         match_confidence, match_method, match_notes, is_active)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, true)
      ON CONFLICT (hotelbeds_city_code) DO UPDATE SET
        tbo_city_id = $4,
        tbo_city_name = $5,
        tbo_country_code = $6,
        match_confidence = $7,
        match_method = $8,
        match_notes = $9,
        updated_at = NOW()
      RETURNING *
    `;

    const result = await db.query(query, [
      hbCityCode,
      hbCityName,
      hbCountryCode,
      tboCityId,
      tboCityName,
      tboCountryCode,
      confidence,
      method,
      notes,
    ]);

    return result.rows[0];
  }

  /**
   * Get mapping for a Hotelbeds city (or create if missing)
   */
  static async getOrCreateMapping(hbCityCode, hbCityName, hbCountryCode) {
    // Check if mapping exists
    const existing = await db.query(
      `SELECT * FROM public.city_mapping WHERE hotelbeds_city_code = $1`,
      [hbCityCode]
    );

    if (existing.rows.length > 0) {
      return existing.rows[0];
    }

    // Find best TBO match
    const match = await this.findBestMatch(hbCityName, hbCountryCode);

    if (!match) {
      console.warn(
        `⚠️  No TBO city match found for: ${hbCityName} (${hbCountryCode})`
      );
      return null;
    }

    // Create mapping
    const mapping = await this.upsertMapping(
      hbCityCode,
      hbCityName,
      hbCountryCode,
      match.tbo_city_id,
      match.tbo_city_name,
      hbCountryCode,
      match.confidence,
      match.method,
      `Auto-mapped on ${new Date().toISOString()}`
    );

    console.log(
      `✅ Created mapping: ${hbCityCode} (${hbCityName}) → TBO ${match.tbo_city_id} (${match.tbo_city_name}) [${match.confidence}% confidence via ${match.method}]`
    );

    return mapping;
  }

  /**
   * Get all active mappings
   */
  static async getAllMappings() {
    const result = await db.query(
      `SELECT * FROM public.city_mapping WHERE is_active = true ORDER BY match_confidence DESC`
    );
    return result.rows;
  }

  /**
   * Get cities ready for cache pre-seeding (verified or high confidence)
   */
  static async getCitiesForWarmup(minConfidence = 80, onlyVerified = false) {
    let query = `
      SELECT m.*, tc.hotel_count, tc.popularity_score
      FROM public.city_mapping m
      JOIN public.tbo_cities tc ON m.tbo_city_id = tc.tbo_city_id
      WHERE m.is_active = true AND m.match_confidence >= $1
    `;

    const params = [minConfidence];

    if (onlyVerified) {
      query += ` AND m.is_verified = true`;
    }

    query += ` ORDER BY tc.popularity_score DESC, m.match_confidence DESC`;

    const result = await db.query(query, params);
    return result.rows;
  }

  /**
   * Mark mapping as verified
   */
  static async verifyMapping(hbCityCode, verifiedBy = "system") {
    const result = await db.query(
      `
      UPDATE public.city_mapping
      SET is_verified = true, verified_by = $1, verified_at = NOW()
      WHERE hotelbeds_city_code = $2
      RETURNING *
    `,
      [verifiedBy, hbCityCode]
    );
    return result.rows[0];
  }
}

module.exports = CityMappingService;
