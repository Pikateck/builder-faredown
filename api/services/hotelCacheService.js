/**
 * HotelCacheService
 * Manages hotel search cache and TBO response normalization
 * 
 * Responsibilities:
 * - Generate search hash from parameters
 * - Check cache freshness
 * - Store normalized hotel/room data
 * - Map searches to hotel results
 */

const crypto = require('crypto');
const db = require('../database/connection');

class HotelCacheService {
  /**
   * Generate SHA256 search hash from parameters
   * Ensures consistent hashing for identical searches
   */
  generateSearchHash(params) {
    const hashKey = JSON.stringify({
      cityId: params.cityId,
      countryCode: params.countryCode || 'AE',
      guestNationality: params.guestNationality || 'IN',
      checkInDate: params.checkIn || params.checkInDate,
      checkOutDate: params.checkOut || params.checkOutDate,
      numberOfRooms: params.rooms || '1',
      roomOccupancy: this._normalizeRoomOccupancy(params)
    });
    
    return crypto.createHash('sha256').update(hashKey).digest('hex');
  }

  /**
   * Normalize room occupancy to consistent format
   */
  _normalizeRoomOccupancy(params) {
    const rooms = params.rooms || 1;
    const adults = params.adults || 2;
    const children = params.children || 0;
    const childAges = params.childAges || [];
    
    const numRooms = parseInt(rooms) || 1;
    const occupancy = [];
    
    for (let i = 0; i < numRooms; i++) {
      occupancy.push({
        adults: parseInt(adults) || 2,
        children: parseInt(children) || 0,
        childAges: childAges.map(a => parseInt(a))
      });
    }
    
    return occupancy;
  }

  /**
   * Check if search exists in cache and is fresh
   */
  async getCachedSearch(searchHash) {
    try {
      const result = await db.query(
        `SELECT * FROM public.hotel_search_cache
         WHERE search_hash = $1
         AND is_fresh = true
         AND ttl_expires_at > NOW()`,
        [searchHash]
      );
      return result.rows[0] || null;
    } catch (error) {
      console.error('❌ Error checking cache:', error.message);
      return null;
    }
  }

  /**
   * Store new search in cache
   */
  async cacheSearchResults(searchHash, params, hotelIds, source = 'tbo') {
    try {
      const ttlExpiresAt = new Date();
      ttlExpiresAt.setHours(ttlExpiresAt.getHours() + 4);

      // Insert search cache entry
      await db.query(
        `INSERT INTO public.hotel_search_cache
         (search_hash, city_id, country_code, check_in_date, check_out_date,
          guest_nationality, num_rooms, room_config, hotel_count, cache_source, ttl_expires_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
         ON CONFLICT (search_hash) DO UPDATE SET
           updated_at = NOW(),
           ttl_expires_at = $11,
           is_fresh = true`,
        [
          searchHash,
          params.cityId,
          params.countryCode || 'AE',
          params.checkIn || params.checkInDate,
          params.checkOut || params.checkOutDate,
          params.guestNationality || 'IN',
          params.rooms || 1,
          JSON.stringify(this._normalizeRoomOccupancy(params)),
          hotelIds.length,
          source,
          ttlExpiresAt
        ]
      );

      // Insert individual result mappings
      for (const [rank, hotelId] of hotelIds.entries()) {
        await db.query(
          `INSERT INTO public.hotel_search_cache_results
           (search_hash, tbo_hotel_code, result_rank)
           VALUES ($1, $2, $3)
           ON CONFLICT DO NOTHING`,
          [searchHash, hotelId, rank + 1]
        );
      }

      console.log(`✅ Cached search: ${searchHash} with ${hotelIds.length} hotels`);
      return true;
    } catch (error) {
      console.error('❌ Error caching search results:', error.message);
      return false;
    }
  }

  /**
   * Fetch cached hotels from DB for a search
   */
  async getCachedHotels(searchHash) {
    try {
      const result = await db.query(
        `SELECT h.*, cr.result_rank, cr.price_offered_per_night, cr.price_published_per_night
         FROM public.tbo_hotels_normalized h
         JOIN public.hotel_search_cache_results cr ON h.tbo_hotel_code = cr.tbo_hotel_code
         WHERE cr.search_hash = $1
         ORDER BY cr.result_rank ASC`,
        [searchHash]
      );
      return result.rows;
    } catch (error) {
      console.error('❌ Error fetching cached hotels:', error.message);
      return [];
    }
  }

  /**
   * Store normalized hotel data from TBO response
   */
  async storeNormalizedHotel(hotelData) {
    try {
      const {
        tboHotelCode,
        cityId,
        cityName,
        countryCode,
        name,
        description,
        address,
        latitude,
        longitude,
        starRating,
        checkInTime,
        checkOutTime,
        amenities,
        facilities,
        images,
        mainImageUrl,
        phone,
        email,
        website,
        totalRooms,
        tboResponseBlob
      } = hotelData;

      await db.query(
        `INSERT INTO public.tbo_hotels_normalized
         (tbo_hotel_code, city_id, city_name, country_code, name, description,
          address, latitude, longitude, star_rating, check_in_time, check_out_time,
          amenities, facilities, images, main_image_url, phone, email, website,
          total_rooms, tbo_response_blob, last_synced_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, NOW())
         ON CONFLICT (tbo_hotel_code) DO UPDATE SET
           last_synced_at = NOW(),
           tbo_response_blob = $21,
           amenities = COALESCE($13, amenities),
           images = COALESCE($15, images)`,
        [
          tboHotelCode,
          cityId,
          cityName,
          countryCode,
          name,
          description,
          address,
          latitude,
          longitude,
          starRating,
          checkInTime,
          checkOutTime,
          JSON.stringify(amenities || []),
          JSON.stringify(facilities || []),
          JSON.stringify(images || []),
          mainImageUrl,
          phone,
          email,
          website,
          totalRooms,
          JSON.stringify(tboResponseBlob)
        ]
      );

      return true;
    } catch (error) {
      console.error('❌ Error storing normalized hotel:', error.message);
      return false;
    }
  }

  /**
   * Store normalized room data from TBO response
   */
  async storeNormalizedRoom(roomData) {
    try {
      const {
        tboHotelCode,
        roomTypeId,
        roomTypeName,
        roomDescription,
        maxOccupancy,
        adultsMax,
        childrenMax,
        roomSizeSqm,
        bedTypes,
        roomFeatures,
        amenities,
        images,
        basePrice,
        currency,
        cancellationPolicy,
        mealPlan,
        breakfastIncluded,
        tboResponseBlob
      } = roomData;

      await db.query(
        `INSERT INTO public.tbo_rooms_normalized
         (tbo_hotel_code, room_type_id, room_type_name, room_description, max_occupancy,
          adults_max, children_max, room_size_sqm, bed_types, room_features, amenities,
          images, base_price_per_night, currency, cancellation_policy, meal_plan,
          breakfast_included, tbo_response_blob, last_synced_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, NOW())
         ON CONFLICT (tbo_hotel_code, room_type_id) DO UPDATE SET
           last_synced_at = NOW(),
           tbo_response_blob = $18`,
        [
          tboHotelCode,
          roomTypeId,
          roomTypeName,
          roomDescription,
          maxOccupancy,
          adultsMax,
          childrenMax,
          roomSizeSqm,
          JSON.stringify(bedTypes || []),
          JSON.stringify(roomFeatures || []),
          JSON.stringify(amenities || []),
          JSON.stringify(images || []),
          basePrice,
          currency,
          JSON.stringify(cancellationPolicy || {}),
          mealPlan,
          breakfastIncluded || false,
          JSON.stringify(tboResponseBlob)
        ]
      );

      return true;
    } catch (error) {
      console.error('❌ Error storing normalized room:', error.message);
      return false;
    }
  }

  /**
   * Get room details for a hotel
   */
  async getHotelRooms(tboHotelCode) {
    try {
      const result = await db.query(
        `SELECT * FROM public.tbo_rooms_normalized
         WHERE tbo_hotel_code = $1
         ORDER BY created_at ASC`,
        [tboHotelCode]
      );
      return result.rows;
    } catch (error) {
      console.error('❌ Error fetching hotel rooms:', error.message);
      return [];
    }
  }

  /**
   * Mark search as stale (force refresh on next access)
   */
  async invalidateSearch(searchHash) {
    try {
      await db.query(
        `UPDATE public.hotel_search_cache SET is_fresh = false WHERE search_hash = $1`,
        [searchHash]
      );
      console.log(`⚠️ Invalidated search cache: ${searchHash}`);
      return true;
    } catch (error) {
      console.error('❌ Error invalidating search:', error.message);
      return false;
    }
  }

  /**
   * Clean up stale cache entries (run periodically)
   */
  async cleanupStaleCache() {
    try {
      const result = await db.query(
        `DELETE FROM public.hotel_search_cache
         WHERE ttl_expires_at < NOW()
         OR (is_fresh = false AND updated_at < NOW() - INTERVAL '7 days')`
      );
      console.log(`🧹 Cleaned up ${result.rowCount} stale cache entries`);
      return result.rowCount;
    } catch (error) {
      console.error('❌ Error cleaning cache:', error.message);
      return 0;
    }
  }

  /**
   * Get cache statistics
   */
  async getCacheStats() {
    try {
      const stats = await db.query(
        `SELECT
           COUNT(*) as total_searches,
           SUM(CASE WHEN is_fresh = true THEN 1 ELSE 0 END) as fresh_searches,
           SUM(CASE WHEN is_fresh = true THEN 1 ELSE 0 END)::float / COUNT(*) * 100 as hit_rate,
           SUM(hotel_count) as total_hotels_cached,
           MAX(cached_at) as last_search,
           AVG(hotel_count) as avg_hotels_per_search
         FROM public.hotel_search_cache
         WHERE cached_at > NOW() - INTERVAL '24 hours'`
      );
      return result.rows[0] || {};
    } catch (error) {
      console.error('❌ Error getting cache stats:', error.message);
      return {};
    }
  }
}

module.exports = new HotelCacheService();
