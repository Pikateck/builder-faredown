/**
 * Hotel Deduplication & Merge Service
 * Fuses supplier properties based on GIATA, chain mapping, and fuzzy geo matching
 */

const db = require("../../database/connection");

class HotelDedupAndMerge {
  /**
   * Fuzzy match: check if two hotels are likely the same
   * Returns confidence score 0-1
   */
  static fuzzyMatchHotels(hotel1, hotel2, config = {}) {
    const minGeoDist = config.minGeoDist || 0.2; // km
    const maxStarDiff = config.maxStarDiff || 0.5;
    const nameWeight = config.nameWeight || 0.4;
    const geoWeight = config.geoWeight || 0.4;
    const starWeight = config.starWeight || 0.2;

    let score = 0;

    // 1. Name similarity (lowercased, strip special chars)
    const name1 = (hotel1.hotel_name || "")
      .toLowerCase()
      .replace(/[^a-z0-9 ]/g, "");
    const name2 = (hotel2.hotel_name || "")
      .toLowerCase()
      .replace(/[^a-z0-9 ]/g, "");

    if (name1 && name2) {
      const nameScore = this.stringSimilarity(name1, name2);
      score += nameScore * nameWeight;
    }

    // 2. Geo proximity (if both have coords)
    if (
      hotel1.lat &&
      hotel1.lng &&
      hotel2.lat &&
      hotel2.lng &&
      hotel1.city === hotel2.city &&
      hotel1.country === hotel2.country
    ) {
      const dist = this.geoDistance(hotel1.lat, hotel1.lng, hotel2.lat, hotel2.lng);
      if (dist <= minGeoDist) {
        score += 1.0 * geoWeight; // perfect geo match within threshold
      } else {
        score += Math.max(0, 1 - dist / minGeoDist) * geoWeight;
      }
    }

    // 3. Star rating proximity
    if (
      hotel1.star_rating &&
      hotel2.star_rating &&
      Math.abs(hotel1.star_rating - hotel2.star_rating) <= maxStarDiff
    ) {
      const starDiff = Math.abs(hotel1.star_rating - hotel2.star_rating);
      score += (1 - starDiff / maxStarDiff) * starWeight;
    }

    return score;
  }

  /**
   * Haversine distance in km
   */
  static geoDistance(lat1, lng1, lat2, lng2) {
    const R = 6371; // Earth radius in km
    const dLat = this.deg2rad(lat2 - lat1);
    const dLng = this.deg2rad(lng2 - lng1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.deg2rad(lat1)) *
        Math.cos(this.deg2rad(lat2)) *
        Math.sin(dLng / 2) *
        Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  static deg2rad(deg) {
    return deg * (Math.PI / 180);
  }

  /**
   * Levenshtein distance-based string similarity (0-1)
   */
  static stringSimilarity(s1, s2) {
    const longer = s1.length > s2.length ? s1 : s2;
    const shorter = s1.length > s2.length ? s2 : s1;
    if (longer.length === 0) return 1.0;
    const editDist = this.levenshteinDistance(longer, shorter);
    return (longer.length - editDist) / longer.length;
  }

  static levenshteinDistance(s1, s2) {
    const costs = [];
    for (let k = 0; k <= s1.length; k++) {
      let lastValue = k;
      for (let i = 0; i <= s2.length; i++) {
        if (k === 0) {
          costs[i] = i;
        } else if (i > 0) {
          let newValue = costs[i - 1];
          if (s1.charAt(k - 1) !== s2.charAt(i - 1)) {
            newValue = Math.min(Math.min(newValue, lastValue), costs[i]) + 1;
          }
          costs[i - 1] = lastValue;
          lastValue = newValue;
        }
      }
      if (k > 0) costs[s2.length] = lastValue;
    }
    return costs[s2.length];
  }

  /**
   * Attempt to find or create a property_id for a hotel
   * Returns: { property_id, isNew, matchMethod }
   */
  static async resolveOrCreateProperty(
    hotelData,
    supplierCode,
    supplierHotelId,
  ) {
    // 1. Check GIATA exact match (highest confidence)
    if (hotelData.giata_id) {
      const giataMatch = await db.query(
        `SELECT property_id FROM hotel_master WHERE giata_id = $1 LIMIT 1`,
        [hotelData.giata_id],
      );

      if (giataMatch.rows.length > 0) {
        return {
          property_id: giataMatch.rows[0].property_id,
          isNew: false,
          matchMethod: "giata_exact",
        };
      }
    }

    // 2. Check chain + brand + supplier mapping
    if (hotelData.chain_code && hotelData.brand_code) {
      const chainMatch = await db.query(
        `SELECT hm.property_id
         FROM hotel_master hm
         WHERE hm.chain_code = $1
         AND hm.brand_code = $2
         AND hm.city = $3
         AND hm.country = $4
         LIMIT 1`,
        [
          hotelData.chain_code,
          hotelData.brand_code,
          hotelData.city,
          hotelData.country,
        ],
      );

      if (chainMatch.rows.length > 0) {
        return {
          property_id: chainMatch.rows[0].property_id,
          isNew: false,
          matchMethod: "chain_mapping",
        };
      }
    }

    // 3. Fuzzy match: name + geo + city/country
    if (hotelData.hotel_name && hotelData.city && hotelData.country) {
      const fuzzyMatches = await db.query(
        `SELECT property_id, hotel_name, lat, lng, star_rating
         FROM hotel_master
         WHERE city = $1
         AND country = $2
         AND hotel_name IS NOT NULL`,
        [hotelData.city, hotelData.country],
      );

      for (const row of fuzzyMatches.rows) {
        const confidence = this.fuzzyMatchHotels(hotelData, row);
        if (confidence > 0.75) {
          // High confidence threshold
          return {
            property_id: row.property_id,
            isNew: false,
            matchMethod: "fuzzy_geo",
            confidence,
          };
        }
      }
    }

    // No match found -> create new property
    return {
      property_id: require("uuid").v4(),
      isNew: true,
      matchMethod: "new_property",
    };
  }

  /**
   * Merge normalized hotels and room offers into master tables
   * Called after supplier adapters return normalized data
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
      dedupAudit: [],
    };

    try {
      // 1. Upsert hotels and resolve property IDs
      for (const hotel of normalizedHotels) {
        const { propertyId, isNew, matchMethod } =
          await this.resolveOrCreateProperty(
            hotel,
            supplierCode,
            hotel.supplier_hotel_id,
          );

        // Insert or update hotel_master
        await db.query(
          `INSERT INTO hotel_master (
            property_id, hotel_name, address, city, country, postal_code,
            lat, lng, star_rating, review_score, review_count,
            chain_code, brand_code, giata_id, thumbnail_url,
            district, zone, neighborhood, amenities_json, checkin_from, checkout_until
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21)
          ON CONFLICT (property_id) DO UPDATE SET
            hotel_name = COALESCE($2, hotel_master.hotel_name),
            thumbnail_url = COALESCE($15, hotel_master.thumbnail_url),
            star_rating = COALESCE($9, hotel_master.star_rating),
            updated_at = NOW()`,
          [
            propertyId,
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
            hotel.amenities_json,
            hotel.checkin_from,
            hotel.checkout_until,
          ],
        );

        // Insert supplier mapping
        await db.query(
          `INSERT INTO hotel_supplier_map (
            property_id, supplier_code, supplier_hotel_id,
            confidence_score, matched_on
          ) VALUES ($1, $2, $3, $4, $5)
          ON CONFLICT (supplier_code, supplier_hotel_id) DO UPDATE SET
            property_id = $1`,
          [
            propertyId,
            supplierCode,
            hotel.supplier_hotel_id,
            hotel.confidence_score || 1.0,
            matchMethod,
          ],
        );

        insertedProperties.set(hotel.supplier_hotel_id, propertyId);
        results.hotelsInserted++;

        if (!isNew) {
          results.dedupAudit.push({
            primaryPropertyId: propertyId,
            supplierCode,
            matchMethod,
          });
        }
      }

      // 2. Upsert room offers (link to resolved property_id)
      for (const offer of normalizedOffers) {
        const propertyId = insertedProperties.get(
          offer.supplier_hotel_id,
        );
        if (!propertyId) continue;

        await db.query(
          `INSERT INTO room_offer (
            offer_id, property_id, supplier_code, room_name, board_basis,
            bed_type, refundable, cancellable_until, free_cancellation,
            occupancy_adults, occupancy_children, inclusions_json,
            currency, price_base, price_taxes, price_total, price_per_night,
            rate_key_or_token, availability_count,
            search_checkin, search_checkout
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21)
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
            JSON.stringify(offer.inclusions_json),
            offer.currency,
            offer.price_base,
            offer.price_taxes,
            offer.price_total,
            offer.price_per_night,
            offer.rate_key_or_token,
            offer.availability_count,
            offer.search_checkin,
            offer.search_checkout,
          ],
        );

        results.offersInserted++;
      }

      return results;
    } catch (error) {
      console.error("Error merging normalized results", {
        supplier: supplierCode,
        error: error.message,
      });
      throw error;
    }
  }
}

module.exports = HotelDedupAndMerge;
