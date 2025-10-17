/**
 * Hotel Normalization Service
 * Converts supplier-specific hotel and room offer payloads to TBO-based canonical schema
 */

const { v4: uuidv4 } = require("uuid");
const db = require("../../database/connection");

class HotelNormalizer {
  /**
   * Get field mapping for a supplier from database
   */
  static async getFieldMappingForSupplier(supplierCode) {
    try {
      const result = await db.query(
        `SELECT tbo_field, supplier_field, transform_rule 
         FROM supplier_field_mapping 
         WHERE supplier_code = $1 AND is_active = true`,
        [supplierCode],
      );

      const mapping = {};
      result.rows.forEach((row) => {
        mapping[row.supplier_field] = {
          tbo_field: row.tbo_field,
          transform: row.transform_rule,
        };
      });

      return mapping;
    } catch (error) {
      console.error("Error fetching field mapping", {
        supplier: supplierCode,
        error: error.message,
      });
      return {};
    }
  }

  /**
   * Normalize a single hotel from RateHawk format to TBO base schema
   * Returns { hotel_master_data, supplier_map_data }
   */
  static normalizeRateHawkHotel(rawHotel, supplierCode = "RATEHAWK") {
    try {
      const propertyId = uuidv4();

      const hotelMasterData = {
        property_id: propertyId,
        hotel_name: rawHotel.name || "",
        address: rawHotel.address || null,
        city: rawHotel.city || rawHotel.region?.name || null,
        country: rawHotel.country_code || null,
        postal_code: rawHotel.postal_code || null,
        lat: parseFloat(rawHotel.location?.coordinates?.lat) || null,
        lng: parseFloat(rawHotel.location?.coordinates?.lon) || null,
        star_rating: parseFloat(rawHotel.star_rating) || null,
        review_score: parseFloat(rawHotel.review_score) || null,
        review_count: parseInt(rawHotel.review_count) || null,
        chain_code: rawHotel.chain_code || null,
        brand_code: rawHotel.brand_code || null,
        giata_id: rawHotel.giata_id || null,
        thumbnail_url: rawHotel.image_url || null,
        district: rawHotel.district || null,
        zone: rawHotel.zone || null,
        neighborhood: rawHotel.neighborhood || null,
        amenities_json: rawHotel.amenities || null,
        checkin_from: rawHotel.checkin_from || null,
        checkout_until: rawHotel.checkout_until || null,
      };

      const supplierMapData = {
        property_id: propertyId,
        supplier_code: supplierCode,
        supplier_hotel_id: rawHotel.id || rawHotel.hotel_id,
        confidence_score: 1.0,
        matched_on: "raw_insertion",
      };

      return { hotelMasterData, supplierMapData };
    } catch (error) {
      console.error("Error normalizing RateHawk hotel", {
        hotel: rawHotel,
        error: error.message,
      });
      return null;
    }
  }

  /**
   * Normalize a room offer from RateHawk format to TBO base schema
   * searchContext = { checkin, checkout, adults, children, currency }
   */
  static normalizeRateHawkRoomOffer(
    rawOffer,
    propertyId,
    supplierCode = "RATEHAWK",
    searchContext = {},
  ) {
    try {
      const offerId = uuidv4();

      const roomOfferData = {
        offer_id: offerId,
        property_id: propertyId,
        supplier_code: supplierCode,
        room_name: rawOffer.room_name || rawOffer.room || "",
        board_basis: rawOffer.board_basis || rawOffer.board || "RO",
        bed_type: rawOffer.bed_type || null,
        refundable: rawOffer.refundable === true,
        cancellable_until: rawOffer.cancellable_until || null,
        free_cancellation: rawOffer.free_cancellation === true,
        occupancy_adults:
          rawOffer.occupancy?.adults || searchContext.adults || 0,
        occupancy_children:
          rawOffer.occupancy?.children?.length || searchContext.children || 0,
        inclusions_json: rawOffer.inclusions || null,
        currency: rawOffer.currency || searchContext.currency || "USD",
        price_base:
          parseFloat(rawOffer.price?.base) ||
          parseFloat(rawOffer.price_base) ||
          null,
        price_taxes:
          parseFloat(rawOffer.price?.taxes) ||
          parseFloat(rawOffer.price_taxes) ||
          null,
        price_total:
          parseFloat(rawOffer.price?.total) ||
          parseFloat(rawOffer.total_price) ||
          parseFloat(rawOffer.price) ||
          0,
        price_per_night:
          parseFloat(rawOffer.price?.per_night) ||
          parseFloat(rawOffer.price_per_night) ||
          null,
        rate_key_or_token: rawOffer.rate_key || rawOffer.token || null,
        availability_count: parseInt(rawOffer.availability_count) || null,
        search_checkin: searchContext.checkin || null,
        search_checkout: searchContext.checkout || null,
      };

      return roomOfferData;
    } catch (error) {
      console.error("Error normalizing RateHawk room offer", {
        offer: rawOffer,
        error: error.message,
      });
      return null;
    }
  }

  /**
   * Normalize Hotelbeds hotel (placeholder for Phase 2)
   */
  static normalizeHotelbedsHotel(rawHotel, supplierCode = "HOTELBEDS") {
    try {
      const propertyId = uuidv4();

      const hotelMasterData = {
        property_id: propertyId,
        hotel_name: rawHotel.name || "",
        address: rawHotel.address?.street || null,
        city: rawHotel.address?.city || null,
        country: rawHotel.address?.country || null,
        postal_code: rawHotel.address?.postalCode || null,
        lat: parseFloat(rawHotel.coordinates?.latitude) || null,
        lng: parseFloat(rawHotel.coordinates?.longitude) || null,
        star_rating: parseFloat(rawHotel.category?.code) || null,
        review_score: parseFloat(rawHotel.review?.score) || null,
        review_count: parseInt(rawHotel.review?.reviewCount) || null,
        chain_code: rawHotel.chainCode || null,
        brand_code: rawHotel.brandCode || null,
        giata_id: rawHotel.giataCode || null,
        thumbnail_url: rawHotel.image?.url || null,
      };

      const supplierMapData = {
        property_id: propertyId,
        supplier_code: supplierCode,
        supplier_hotel_id: String(rawHotel.id || rawHotel.code),
        confidence_score: 1.0,
        matched_on: "raw_insertion",
      };

      return { hotelMasterData, supplierMapData };
    } catch (error) {
      console.error("Error normalizing Hotelbeds hotel", {
        hotel: rawHotel,
        error: error.message,
      });
      return null;
    }
  }

  /**
   * Normalize Hotelbeds room offer (placeholder for Phase 2)
   */
  static normalizeHotelbedsRoomOffer(
    rawOffer,
    propertyId,
    supplierCode = "HOTELBEDS",
    searchContext = {},
  ) {
    try {
      const offerId = uuidv4();

      const roomOfferData = {
        offer_id: offerId,
        property_id: propertyId,
        supplier_code: supplierCode,
        room_name: rawOffer.roomName || rawOffer.room?.name || "",
        board_basis: rawOffer.boardName || "RO",
        bed_type: rawOffer.room?.type || null,
        refundable: rawOffer.cancellationPolicies?.[0]?.refundable === true,
        free_cancellation:
          rawOffer.cancellationPolicies?.[0]?.refundable === true,
        occupancy_adults: rawOffer.pax?.adults || searchContext.adults || 0,
        occupancy_children:
          rawOffer.pax?.children?.length || searchContext.children || 0,
        inclusions_json: rawOffer.inclusions || null,
        currency: rawOffer.currency || searchContext.currency || "USD",
        price_base: parseFloat(rawOffer.net) || null,
        price_taxes: parseFloat(rawOffer.taxes) || null,
        price_total:
          parseFloat(rawOffer.allotment?.price) ||
          parseFloat(rawOffer.price) ||
          0,
        price_per_night: parseFloat(rawOffer.pricePerNight) || null,
        rate_key_or_token: rawOffer.rateKey || null,
        availability_count: parseInt(rawOffer.avail) || null,
        search_checkin: searchContext.checkin || null,
        search_checkout: searchContext.checkout || null,
      };

      return roomOfferData;
    } catch (error) {
      console.error("Error normalizing Hotelbeds room offer", {
        offer: rawOffer,
        error: error.message,
      });
      return null;
    }
  }

  /**
   * Normalize TBO hotel (placeholder for Phase 2)
   */
  static normalizeTBOHotel(rawHotel, supplierCode = "TBO") {
    try {
      const propertyId = uuidv4();

      const lat = parseFloat(rawHotel.Latitude || rawHotel.lat || rawHotel.Geo?.Lat);
      const lng = parseFloat(rawHotel.Longitude || rawHotel.lng || rawHotel.Geo?.Long);

      const amenities = rawHotel.Amenities || rawHotel.Facilities || rawHotel.HotelFacilities || null;
      const thumb = rawHotel.ImageUrl || rawHotel.ThumbnailUrl || (Array.isArray(rawHotel.Images) && rawHotel.Images[0]?.Url) || null;

      const hotelMasterData = {
        property_id: propertyId,
        hotel_name: rawHotel.HotelName || rawHotel.Name || "",
        address: rawHotel.Address || rawHotel.Location || null,
        city: rawHotel.CityName || rawHotel.City || null,
        country: rawHotel.CountryCode || rawHotel.Country || null,
        postal_code: rawHotel.PostalCode || null,
        lat: isNaN(lat) ? null : lat,
        lng: isNaN(lng) ? null : lng,
        star_rating: parseFloat(rawHotel.StarRating || rawHotel.Category) || null,
        review_score: parseFloat(rawHotel.ReviewScore) || null,
        review_count: parseInt(rawHotel.ReviewCount) || null,
        chain_code: rawHotel.ChainCode || null,
        brand_code: rawHotel.BrandCode || null,
        giata_id: rawHotel.GiataId || rawHotel.GIATA || null,
        thumbnail_url: thumb,
        district: rawHotel.District || null,
        zone: rawHotel.Zone || null,
        neighborhood: rawHotel.Neighborhood || null,
        amenities_json: amenities || null,
        checkin_from: rawHotel.CheckInTime || rawHotel.CheckIn || null,
        checkout_until: rawHotel.CheckOutTime || rawHotel.CheckOut || null,
      };

      const supplierMapData = {
        property_id: propertyId,
        supplier_code: supplierCode,
        supplier_hotel_id: String(rawHotel.HotelCode || rawHotel.HotelId || rawHotel.Id || ""),
        confidence_score: 1.0,
        matched_on: "raw_insertion",
      };

      return { hotelMasterData, supplierMapData };
    } catch (error) {
      console.error("Error normalizing TBO hotel", {
        hotel: rawHotel,
        error: error.message,
      });
      return null;
    }
  }

  /**
   * Normalize TBO room offer (placeholder for Phase 2)
   */
  static normalizeTBORoomOffer(
    rawOffer,
    propertyId,
    supplierCode = "TBO",
    searchContext = {},
  ) {
    try {
      const offerId = uuidv4();

      const meal = rawOffer.MealType || rawOffer.BoardType || rawOffer.Board || "RO";
      const bed = rawOffer.BedType || rawOffer.Bedding || null;
      const isNonRefundable = rawOffer.IsNonRefundable === true || (rawOffer.CancellationPolicy && rawOffer.CancellationPolicy.toString().toLowerCase().includes("non refundable"));
      const isRefundableFlag = rawOffer.IsRefundable === true || (!isNonRefundable);

      // Derive cancellable_until
      let cancellableUntil = null;
      const freeTill = rawOffer.FreeCancellationTill || rawOffer.FreeCancelTill || null;
      if (freeTill) {
        const dt = new Date(freeTill);
        if (!isNaN(dt.getTime())) cancellableUntil = dt.toISOString();
      } else if (Array.isArray(rawOffer.CancellationPolicies) && rawOffer.CancellationPolicies.length > 0) {
        // Pick the latest date with zero charge or earliest policy threshold
        const zeroCharge = rawOffer.CancellationPolicies.find((p) => parseFloat(p.CancellationCharge || p.Charge || 0) === 0 && p.FromDate);
        const dateStr = zeroCharge?.FromDate || rawOffer.CancellationPolicies[0]?.FromDate || null;
        if (dateStr) {
          const dt = new Date(dateStr);
          if (!isNaN(dt.getTime())) cancellableUntil = dt.toISOString();
        }
      }

      const currency = rawOffer.Currency || rawOffer.RateCurrency || searchContext.currency || "USD";
      const total = parseFloat(rawOffer.TotalPrice || rawOffer.PublishedPrice || rawOffer.Price || 0) || 0;
      const base = parseFloat(rawOffer.BasePrice || rawOffer.NetFare || rawOffer.Net || 0) || null;
      const taxes = parseFloat(rawOffer.Taxes || rawOffer.TotalTax || rawOffer.Tax || 0) || null;

      let pricePerNight = parseFloat(rawOffer.PricePerNight || rawOffer.PerNightPrice || 0);
      if ((!pricePerNight || isNaN(pricePerNight)) && searchContext.checkin && searchContext.checkout && total) {
        const inD = new Date(searchContext.checkin);
        const outD = new Date(searchContext.checkout);
        const diff = outD - inD;
        if (!isNaN(diff) && diff > 0) {
          const nights = Math.round(diff / (1000 * 60 * 60 * 24));
          if (nights > 0) pricePerNight = parseFloat((total / nights).toFixed(2));
        }
      }

      const availability = parseInt(rawOffer.Availability || rawOffer.RoomsLeft || rawOffer.RemainingRooms || 0) || null;
      const adults = rawOffer.Occupancy?.Adults || rawOffer.Adults || searchContext.adults || 0;
      const children = (rawOffer.Occupancy?.Children && rawOffer.Occupancy.Children.length) || rawOffer.Children || searchContext.children || 0;

      const inclusions = rawOffer.Inclusions || rawOffer.Included || rawOffer.Amenities || null;
      const rateKey = rawOffer.RateKey || rawOffer.RateKeyToken || rawOffer.Token || null;

      const roomOfferData = {
        offer_id: offerId,
        property_id: propertyId,
        supplier_code: supplierCode,
        room_name: rawOffer.RoomName || rawOffer.RoomTypeName || rawOffer.Room || "",
        board_basis: meal,
        bed_type: bed,
        refundable: !!isRefundableFlag,
        cancellable_until: cancellableUntil,
        free_cancellation: !!cancellableUntil,
        occupancy_adults: adults,
        occupancy_children: children,
        inclusions_json: inclusions || null,
        currency,
        price_base: base,
        price_taxes: taxes,
        price_total: total,
        price_per_night: pricePerNight || null,
        rate_key_or_token: rateKey,
        availability_count: availability,
        search_checkin: searchContext.checkin || null,
        search_checkout: searchContext.checkout || null,
      };

      return roomOfferData;
    } catch (error) {
      console.error("Error normalizing TBO room offer", {
        offer: rawOffer,
        error: error.message,
      });
      return null;
    }
  }
}

module.exports = HotelNormalizer;
