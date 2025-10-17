/**
 * Hotel Dedup & Merge for Phase 1 Unified Tables
 * Writes to hotel_unified, hotel_supplier_map_unified, room_offer_unified
 */

const db = require("../../database/connection");

class HotelDedupAndMergeUnified {
  static async ensureUnifiedTables() {
    await db.query(`CREATE TABLE IF NOT EXISTS hotel_unified (
      property_id UUID PRIMARY KEY,
      supplier_code TEXT NOT NULL,
      supplier_hotel_id TEXT NOT NULL,
      hotel_name TEXT,
      address TEXT,
      city TEXT,
      country TEXT,
      postal_code TEXT,
      lat DOUBLE PRECISION,
      lng DOUBLE PRECISION,
      star_rating NUMERIC(3,1),
      review_score NUMERIC(4,2),
      review_count INT,
      chain_code TEXT,
      brand_code TEXT,
      giata_id TEXT,
      thumbnail_url TEXT,
      district TEXT,
      zone TEXT,
      neighborhood TEXT,
      amenities_json JSONB,
      checkin_from TEXT,
      checkout_until TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW()
    )`);
    await db.query(`CREATE UNIQUE INDEX IF NOT EXISTS idx_hotel_unified_supplier_hotel ON hotel_unified (supplier_code, supplier_hotel_id)`);
    await db.query(`CREATE INDEX IF NOT EXISTS idx_hotel_unified_city_country ON hotel_unified (city, country)`);

    await db.query(`CREATE TABLE IF NOT EXISTS hotel_supplier_map_unified (
      property_id UUID NOT NULL,
      supplier_code TEXT NOT NULL,
      supplier_hotel_id TEXT NOT NULL,
      confidence_score NUMERIC(3,2) DEFAULT 1.0,
      matched_on TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      UNIQUE (supplier_code, supplier_hotel_id)
    )`);
    await db.query(`CREATE INDEX IF NOT EXISTS idx_hotel_supplier_map_property ON hotel_supplier_map_unified (property_id)`);

    await db.query(`CREATE TABLE IF NOT EXISTS room_offer_unified (
      offer_id UUID PRIMARY KEY,
      property_id UUID NOT NULL,
      supplier_code TEXT NOT NULL,
      room_name TEXT,
      board_basis TEXT,
      bed_type TEXT,
      refundable BOOLEAN,
      cancellable_until TIMESTAMPTZ,
      free_cancellation BOOLEAN,
      occupancy_adults INT,
      occupancy_children INT,
      inclusions_json JSONB,
      currency TEXT,
      price_base NUMERIC(12,2),
      price_taxes NUMERIC(12,2),
      price_total NUMERIC(12,2),
      price_per_night NUMERIC(12,2),
      rate_key_or_token TEXT,
      availability_count INT,
      search_checkin DATE,
      search_checkout DATE,
      hotel_name TEXT,
      city TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      expires_at TIMESTAMPTZ
    )`);
    await db.query(`CREATE INDEX IF NOT EXISTS idx_room_offer_property ON room_offer_unified (property_id)`);
    await db.query(`CREATE INDEX IF NOT EXISTS idx_room_offer_supplier ON room_offer_unified (supplier_code)`);
    await db.query(`CREATE INDEX IF NOT EXISTS idx_room_offer_city ON room_offer_unified (city)`);
    await db.query(`CREATE INDEX IF NOT EXISTS idx_room_offer_checkin ON room_offer_unified (search_checkin, search_checkout)`);
  }

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
      // Ensure tables exist (safe no-op if already created)
      await this.ensureUnifiedTables();

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

        // Compute expiry: at checkout end-of-day or 24h from now
        let expiresAt = null;
        if (offer.search_checkout) {
          const outD = new Date(offer.search_checkout);
          if (!isNaN(outD.getTime())) {
            outD.setHours(23, 59, 59, 999);
            expiresAt = outD.toISOString();
          }
        }
        if (!expiresAt) {
          const d = new Date(Date.now() + 24 * 60 * 60 * 1000);
          expiresAt = d.toISOString();
        }

        await db.query(
          `INSERT INTO room_offer_unified (
            offer_id, property_id, supplier_code,
            room_name, board_basis, bed_type,
            refundable, cancellable_until, free_cancellation,
            occupancy_adults, occupancy_children, inclusions_json,
            currency, price_base, price_taxes, price_total, price_per_night,
            rate_key_or_token, availability_count,
            search_checkin, search_checkout, hotel_name, city, expires_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24)
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
            offer.inclusions_json
              ? JSON.stringify(offer.inclusions_json)
              : null,
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
            expiresAt,
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
