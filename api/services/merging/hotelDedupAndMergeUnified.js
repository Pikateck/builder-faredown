/**
 * Hotel Dedup & Merge for Phase 1 Unified Tables
 * Writes to hotel_unified, hotel_supplier_map_unified, room_offer_unified
 */

const db = require("../../database/connection");

class HotelDedupAndMergeUnified {
  /**
   * Merge normalized hotels and offers into unified Phase 1 tables
   */
  static async mergeNormalizedResults(
    normalizedHotels,
    normalizedOffers,
    supplierCode,
  ) {
    const insertedProperties = new Map();
    const results = {
      hotelsInserted: 0,
      offersInserted: 0,
    };

    try {
      // 1. Upsert hotels into hotel_unified
      for (const hotel of normalizedHotels) {
        const propertyId = require("uuid").v4();

        // Check for duplicate GIATA
        let existingProperty = null;
        if (hotel.giata_id) {
          const giataCheck = await db.query(
            `SELECT property_id FROM hotel_unified WHERE giata_id = $1 LIMIT 1`,
            [hotel.giata_id],
          );
          if (giataCheck.rows.length > 0) {
            existingProperty = giataCheck.rows[0].property_id;
          }
        }

        // Use existing or new property ID
        const finalPropertyId = existingProperty || propertyId;

        // Insert into hotel_unified
        await db.query(
          `INSERT INTO hotel_unified (
            property_id, supplier_code, supplier_hotel_id,
            hotel_name, address, city, country, postal_code,
            lat, lng, star_rating, review_score, review_count,
            chain_code, brand_code, giata_id, thumbnail_url,
            district, zone, neighborhood, amenities_json, checkin_from, checkout_until
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23)
          ON CONFLICT DO NOTHING`,
          [
            finalPropertyId,
            supplierCode,
            hotel.supplier_hotel_id,
            hotel.hotel_name,
            hotel.address,
            hotel.city,
            hotel.country,
            hotel.postal_code,
            hotel.lat,
            hotel.lng,
            hotel.star_rating,
            hotel.review_score,
            hotel.review_count,
            hotel.chain_code,
            hotel.brand_code,
            hotel.giata_id,
            hotel.thumbnail_url,
            hotel.district,
            hotel.zone,
            hotel.neighborhood,
            hotel.amenities_json ? JSON.stringify(hotel.amenities_json) : null,
            hotel.checkin_from,
            hotel.checkout_until,
          ],
        );

        // Insert supplier mapping
        await db.query(
          `INSERT INTO hotel_supplier_map_unified (
            property_id, supplier_code, supplier_hotel_id,
            confidence_score, matched_on
          ) VALUES ($1, $2, $3, $4, $5)
          ON CONFLICT (supplier_code, supplier_hotel_id) DO NOTHING`,
          [
            finalPropertyId,
            supplierCode,
            hotel.supplier_hotel_id,
            1.0,
            "raw_insertion",
          ],
        );

        insertedProperties.set(hotel.supplier_hotel_id, finalPropertyId);
        results.hotelsInserted++;
      }

      // 2. Upsert offers into room_offer_unified
      for (const offer of normalizedOffers) {
        const propertyId = insertedProperties.get(offer.supplier_hotel_id);
        if (!propertyId) continue;

        await db.query(
          `INSERT INTO room_offer_unified (
            offer_id, property_id, supplier_code,
            room_name, board_basis, bed_type,
            refundable, cancellable_until, free_cancellation,
            occupancy_adults, occupancy_children, inclusions_json,
            currency, price_base, price_taxes, price_total, price_per_night,
            rate_key_or_token, availability_count,
            search_checkin, search_checkout, hotel_name, city
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23)
          ON CONFLICT DO NOTHING`,
          [
            offer.offer_id,
            propertyId,
            offer.supplier_code,
            offer.room_name,
            offer.board_basis,
            offer.bed_type,
            offer.refundable,
            offer.cancellable_until,
            offer.free_cancellation,
            offer.occupancy_adults,
            offer.occupancy_children,
            offer.inclusions_json ? JSON.stringify(offer.inclusions_json) : null,
            offer.currency,
            offer.price_base,
            offer.price_taxes,
            offer.price_total,
            offer.price_per_night,
            offer.rate_key_or_token,
            offer.availability_count,
            offer.search_checkin,
            offer.search_checkout,
            offer.hotel_name, // Add from offer for denormalization
            offer.city, // Add from offer for denormalization
          ],
        );

        results.offersInserted++;
      }

      return results;
    } catch (error) {
      console.error("Error merging into unified tables", {
        supplier: supplierCode,
        error: error.message,
      });
      throw error;
    }
  }
}

module.exports = HotelDedupAndMergeUnified;
