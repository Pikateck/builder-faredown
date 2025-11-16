/**
 * Markup Service
 * Handles all markup-related API operations for admin panel
 */

import { apiClient } from "@/lib/api";
import {
  CABIN_CLASS_LABELS,
  type CabinClassValue,
  normalizeCabinClass,
} from "@/lib/cabinClasses";
import { convertToInputDate, formatDateToDDMMMYYYY } from "@/lib/dateUtils";

export interface AirMarkup {
  id: string;
  name: string;
  description: string;
  airline: string;
  route: {
    from: string | null;
    to: string | null;
  };
  origin_iata: string | null;
  dest_iata: string | null;
  class: CabinClassValue;
  markupType: "percentage" | "fixed";
  markupValue: number;
  minAmount: number;
  maxAmount: number;
  // Current Fare Range (existing functionality)
  currentFareMin: number; // Min markup percentage for user-visible fare
  currentFareMax: number; // Max markup percentage for user-visible fare
  // New Bargain Fare Range fields
  bargainFareMin: number; // Min acceptable bargain percentage
  bargainFareMax: number; // Max acceptable bargain percentage
  validFrom: string;
  validTo: string;
  status: "active" | "inactive" | "expired";
  priority: number;
  userType: "all" | "b2c" | "b2b";
  specialConditions: string;
  createdAt: string;
  updatedAt: string;
}

export interface HotelMarkup {
  id: string;
  name: string;
  description: string;
  city: string;
  hotelName: string;
  hotelChain: string;
  starRating: string;
  roomCategory: string;
  markupType: "percentage" | "fixed";
  markupValue: number;
  minAmount: number;
  maxAmount: number;
  // Current Fare Range (for dynamic pricing display)
  currentFareMin: number; // Min markup percentage for user-visible hotel rates
  currentFareMax: number; // Max markup percentage for user-visible hotel rates
  // Bargain Fare Range (for user-entered price validation)
  bargainFareMin: number; // Min acceptable bargain percentage for hotels
  bargainFareMax: number; // Max acceptable bargain percentage for hotels
  validFrom: string;
  validTo: string;
  seasonType: "Peak Season" | "Off Season" | "Regular";
  applicableDays: string[];
  minStay: number;
  maxStay: number;
  status: "active" | "inactive" | "expired";
  priority: number;
  userType: "all" | "b2c" | "b2b";
  specialConditions: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateAirMarkupRequest {
  name: string;
  description: string;
  airline: string;
  route: {
    from: string | null;
    to: string | null;
  };
  origin_iata: string | null;
  dest_iata: string | null;
  class: CabinClassValue;
  markupType: "percentage" | "fixed";
  markupValue: number;
  minAmount: number;
  maxAmount: number;
  // Current Fare Range fields
  currentFareMin: number; // Min markup percentage for user-visible fare
  currentFareMax: number; // Max markup percentage for user-visible fare
  // Bargain Fare Range fields
  bargainFareMin: number; // Min acceptable bargain percentage
  bargainFareMax: number; // Max acceptable bargain percentage
  validFrom: string;
  validTo: string;
  status: "active" | "inactive";
  priority: number;
  userType: "all" | "b2c" | "b2b";
  specialConditions?: string;
}

export interface TransferMarkup {
  id: string;
  name: string;
  description: string;
  originCity: string;
  destinationCity: string;
  transferType: "Private" | "Shared" | "Luxury" | "Economy" | "ALL";
  vehicleType: "Sedan" | "SUV" | "Van" | "Bus" | "ALL";
  markupType: "percentage" | "fixed";
  markupValue: number;
  minAmount: number;
  maxAmount: number;
  // Current Fare Range (for dynamic pricing display)
  currentFareMin: number; // Min markup percentage for user-visible transfer rates
  currentFareMax: number; // Max markup percentage for user-visible transfer rates
  // Bargain Fare Range (for user-entered price validation)
  bargainFareMin: number; // Min acceptable bargain percentage for transfers
  bargainFareMax: number; // Max acceptable bargain percentage for transfers
  validFrom: string;
  validTo: string;
  status: "active" | "inactive" | "expired";
  priority: number;
  userType: "all" | "b2c" | "b2b";
  specialConditions: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateHotelMarkupRequest {
  name: string;
  description: string;
  city: string;
  hotelName: string;
  hotelChain: string;
  starRating: string;
  roomCategory: string;
  markupType: "percentage" | "fixed";
  markupValue: number;
  minAmount: number;
  maxAmount: number;
  // Current Fare Range fields
  currentFareMin: number; // Min markup percentage for user-visible hotel rates
  currentFareMax: number; // Max markup percentage for user-visible hotel rates
  // Bargain Fare Range fields
  bargainFareMin: number; // Min acceptable bargain percentage for hotels
  bargainFareMax: number; // Max acceptable bargain percentage for hotels
  validFrom: string;
  validTo: string;
  seasonType: "Peak Season" | "Off Season" | "Regular";
  applicableDays: string[];
  minStay: number;
  maxStay: number;
  status: "active" | "inactive";
  priority: number;
  userType: "all" | "b2c" | "b2b";
  specialConditions?: string;
}

export interface CreateTransferMarkupRequest {
  name: string;
  description: string;
  originCity: string;
  destinationCity: string;
  transferType: "Private" | "Shared" | "Luxury" | "Economy" | "ALL";
  vehicleType: "Sedan" | "SUV" | "Van" | "Bus" | "ALL";
  markupType: "percentage" | "fixed";
  markupValue: number;
  minAmount: number;
  maxAmount: number;
  // Current Fare Range fields
  currentFareMin: number; // Min markup percentage for user-visible transfer rates
  currentFareMax: number; // Max markup percentage for user-visible transfer rates
  // Bargain Fare Range fields
  bargainFareMin: number; // Min acceptable bargain percentage for transfers
  bargainFareMax: number; // Max acceptable bargain percentage for transfers
  validFrom: string;
  validTo: string;
  status: "active" | "inactive";
  priority: number;
  userType: "all" | "b2c" | "b2b";
  specialConditions?: string;
}

export interface MarkupFilters {
  search?: string;
  airline?: string;
  class?: CabinClassValue;
  status?: string;
  city?: string;
  starRating?: string;
  page?: number;
  limit?: number;
}

type MarkupModule = "air" | "hotel" | "transfer" | "packages" | "sightseeing";

class MarkupService {
  private baseUrl = "/api/markups";

  private toDisplayDate(value?: string | null): string {
    if (!value) {
      return "";
    }

    const formatted = formatDateToDDMMMYYYY(value);
    if (formatted) {
      return formatted;
    }

    return String(value);
  }

  private toApiDate(value?: string | null): string | null {
    if (!value) {
      return null;
    }

    const trimmed = value.trim();
    if (!trimmed) {
      return null;
    }

    const fromDisplay = convertToInputDate(trimmed);
    if (fromDisplay) {
      return fromDisplay;
    }

    const parsed = new Date(trimmed);
    if (!isNaN(parsed.getTime())) {
      return parsed.toISOString().split("T")[0];
    }

    return trimmed;
  }

  private mapAirRow(row: any): AirMarkup {
    const normalizedClass =
      normalizeCabinClass(row.booking_class || row.class) ?? "economy";

    return {
      id: String(row.id),
      name: row.rule_name || "",
      description: row.description || "",
      airline: row.airline_code || "ALL",
      route: {
        from: row.origin_iata || row.route_from || null,
        to: row.dest_iata || row.route_to || null,
      },
      origin_iata: row.origin_iata || null,
      dest_iata: row.dest_iata || null,
      class: normalizedClass,
      markupType:
        (row.m_type || "percentage").toLowerCase() === "flat"
          ? "fixed"
          : "percentage",
      markupValue: Number(row.m_value || 0),
      minAmount: 0,
      maxAmount: 999999,
      currentFareMin: Number(row.current_min_pct || 0),
      currentFareMax: Number(row.current_max_pct || 0),
      bargainFareMin: Number(row.bargain_min_pct || 0),
      bargainFareMax: Number(row.bargain_max_pct || 0),
      validFrom: this.toDisplayDate(row.valid_from),
      validTo: this.toDisplayDate(row.valid_to),
      status: row.is_active ? "active" : "inactive",
      priority: Number(row.priority || 0),
      userType: (row.user_type || "all").toLowerCase(),
      specialConditions: "",
      createdAt: row.created_at || new Date().toISOString(),
      updatedAt: row.updated_at || new Date().toISOString(),
    };
  }

  private mapHotelRow(row: any): HotelMarkup {
    return {
      id: String(row.id),
      name: row.rule_name || "",
      description: row.description || "",
      city: row.hotel_city || "",
      hotelName: row.hotel_name || "",
      hotelChain: row.hotel_chain || "",
      starRating: String(row.hotel_star_min || row.star_rating || "3"),
      roomCategory: row.room_category || "standard",
      markupType: (row.m_type || "percentage").toLowerCase(),
      markupValue: Number(row.m_value || 0),
      minAmount: 0,
      maxAmount: 999999,
      currentFareMin: Number(row.current_min_pct || 0),
      currentFareMax: Number(row.current_max_pct || 0),
      bargainFareMin: Number(row.bargain_min_pct || 0),
      bargainFareMax: Number(row.bargain_max_pct || 0),
      validFrom: this.toDisplayDate(row.valid_from),
      validTo: this.toDisplayDate(row.valid_to),
      seasonType: "Regular",
      applicableDays: [],
      minStay: 1,
      maxStay: 30,
      status: row.is_active ? "active" : "inactive",
      priority: Number(row.priority || 0),
      userType: (row.user_type || "all").toLowerCase(),
      specialConditions: "",
      createdAt: row.created_at || new Date().toISOString(),
      updatedAt: row.updated_at || new Date().toISOString(),
    };
  }

  /**
   * Get all air markups with optional filters
   */
  async getAirMarkups(filters: MarkupFilters = {}): Promise<{
    markups: AirMarkup[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    try {
      const params: Record<string, any> = { module: "air" };
      if (filters.search) params.search = filters.search;
      if (filters.airline && filters.airline !== "all")
        params.airline_code = filters.airline;
      if (filters.class && filters.class !== "all")
        params.booking_class = filters.class;
      if (filters.status && filters.status !== "all")
        params.status = filters.status;
      if (filters.page) params.page = filters.page;
      if (filters.limit) params.limit = filters.limit;

      const response: any = await apiClient.get(`${this.baseUrl}`, params);
      if (response && (response.success || response.items)) {
        const items = response.items || [];
        const total = response.total || 0;
        const page = response.page || 1;
        const pageSize = response.pageSize || items.length || 20;
        return {
          markups: items.map((r: any) => this.mapAirRow(r)),
          total,
          page,
          totalPages: Math.max(1, Math.ceil(total / pageSize)),
        };
      }
      throw new Error(response?.error || "Failed to fetch air markups");
    } catch (error) {
      console.error("Error fetching air markups:", error);
      throw error;
    }
  }

  /**
   * Get all hotel markups with optional filters
   */
  async getHotelMarkups(filters: MarkupFilters = {}): Promise<{
    markups: HotelMarkup[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    try {
      const params: Record<string, any> = { module: "hotel" };
      if (filters.search) params.search = filters.search;
      if (filters.city && filters.city !== "all")
        params.hotel_city = filters.city;
      if (filters.status && filters.status !== "all")
        params.status = filters.status;
      if (filters.page) params.page = filters.page;
      if (filters.limit) params.limit = filters.limit;

      const response: any = await apiClient.get(`${this.baseUrl}`, params);
      if (response && (response.success || response.items)) {
        const items = response.items || [];
        const total = response.total || 0;
        const page = response.page || 1;
        const pageSize = response.pageSize || items.length || 20;
        return {
          markups: items.map((r: any) => this.mapHotelRow(r)),
          total,
          page,
          totalPages: Math.max(1, Math.ceil(total / pageSize)),
        };
      }
      throw new Error(response?.error || "Failed to fetch hotel markups");
    } catch (error) {
      console.error("Error fetching hotel markups:", error);
      throw error;
    }
  }

  async exportMarkups(
    module: MarkupModule,
    filters: MarkupFilters = {},
  ): Promise<string> {
    try {
      const params: Record<string, any> = { module, format: "csv" };

      if (filters.search) params.search = filters.search;
      if (filters.airline && filters.airline !== "all")
        params.airline_code = filters.airline;
      if (filters.class && filters.class !== "all")
        params.booking_class = filters.class;
      if (filters.status && filters.status !== "all")
        params.status = filters.status;
      if (filters.city && filters.city !== "all")
        params.hotel_city = filters.city;
      if (filters.starRating && filters.starRating !== "all") {
        const ratingNumber = Number(filters.starRating);
        if (!Number.isNaN(ratingNumber)) {
          params.hotel_star_min = ratingNumber;
        }
      }

      const response = await apiClient.get<string>(
        `${this.baseUrl}/export`,
        params,
      );

      if (typeof response !== "string") {
        throw new Error("Invalid export response received from server");
      }

      return response;
    } catch (error) {
      console.error(`Error exporting ${module} markups:`, error);
      throw error;
    }
  }

  exportAirMarkups(filters: MarkupFilters = {}): Promise<string> {
    return this.exportMarkups("air", filters);
  }

  exportHotelMarkups(filters: MarkupFilters = {}): Promise<string> {
    return this.exportMarkups("hotel", filters);
  }

  /**
   * Create a new air markup
   */
  async createAirMarkup(
    markupData: CreateAirMarkupRequest,
  ): Promise<AirMarkup> {
    try {
      // Map to module_markups table schema
      const payload = {
        module: "AIR",
        airline_code: markupData.airline === "ALL" ? null : markupData.airline,
        cabin: markupData.class ? String(markupData.class).toUpperCase() : null,
        markup_type: markupData.markupType === "percentage" ? "PERCENT" : "FIXED",
        markup_value: markupData.markupValue,
        bargain_min_pct: markupData.bargainFareMin,
        bargain_max_pct: markupData.bargainFareMax,
        valid_from: this.toApiDate(markupData.validFrom),
        valid_to: this.toApiDate(markupData.validTo),
        status: markupData.status === "active",
        created_by: "admin",
        updated_by: "admin",
        supplier_id: null,
        is_domestic: null,
        city_code: null,
        star_rating: null,
        hotel_chain: null,
        hotel_id: null,
        room_type: null,
        origin_city: null,
        dest_city: null,
        transfer_type: null,
        vehicle_type: null,
        experience_type: null,
        attraction_id: null,
        fixed_currency: "USD",
      };
      const response: any = await apiClient.post(`${this.baseUrl}`, payload);
      if (response && response.success && response.data) {
        return this.mapAirRow(response.data);
      }
      throw new Error(response?.error || "Failed to create air markup");
    } catch (error) {
      console.error("Error creating air markup:", error);
      throw error;
    }
  }

  /**
   * Create a new hotel markup
   */
  async createHotelMarkup(
    markupData: CreateHotelMarkupRequest,
  ): Promise<HotelMarkup> {
    try {
      const payload = {
        module: "hotel",
        rule_name: markupData.name,
        description: markupData.description,
        hotel_city: markupData.city,
        hotel_star_min: parseInt(String(markupData.starRating || "3"), 10),
        hotel_star_max: parseInt(String(markupData.starRating || "3"), 10),
        m_type: markupData.markupType,
        m_value: markupData.markupValue,
        current_min_pct: markupData.currentFareMin,
        current_max_pct: markupData.currentFareMax,
        bargain_min_pct: markupData.bargainFareMin,
        bargain_max_pct: markupData.bargainFareMax,
        valid_from: this.toApiDate(markupData.validFrom),
        valid_to: this.toApiDate(markupData.validTo),
        priority: markupData.priority,
        user_type: markupData.userType,
        is_active: markupData.status === "active",
      };
      const response: any = await apiClient.post(`${this.baseUrl}`, payload);
      if (response && response.success) {
        return this.mapHotelRow(response.item);
      }
      throw new Error(response?.error || "Failed to create hotel markup");
    } catch (error) {
      console.error("Error creating hotel markup:", error);
      throw error;
    }
  }

  /**
   * Update an existing air markup
   */
  async updateAirMarkup(
    markupId: string,
    markupData: Partial<CreateAirMarkupRequest>,
  ): Promise<AirMarkup> {
    try {
      const payload: any = {};
      if (markupData.name !== undefined) payload.rule_name = markupData.name;
      if (markupData.description !== undefined)
        payload.description = markupData.description;
      if (markupData.airline !== undefined)
        payload.airline_code = markupData.airline;
      if (markupData.origin_iata !== undefined)
        payload.origin_iata = markupData.origin_iata;
      if (markupData.dest_iata !== undefined)
        payload.dest_iata = markupData.dest_iata;
      if (markupData.route?.from !== undefined)
        payload.route_from = markupData.route.from;
      if (markupData.route?.to !== undefined)
        payload.route_to = markupData.route.to;
      if (markupData.class !== undefined)
        payload.booking_class = markupData.class;
      if (markupData.markupType !== undefined)
        payload.m_type = markupData.markupType;
      if (markupData.markupValue !== undefined)
        payload.m_value = markupData.markupValue;
      if (markupData.currentFareMin !== undefined)
        payload.current_min_pct = markupData.currentFareMin;
      if (markupData.currentFareMax !== undefined)
        payload.current_max_pct = markupData.currentFareMax;
      if (markupData.bargainFareMin !== undefined)
        payload.bargain_min_pct = markupData.bargainFareMin;
      if (markupData.bargainFareMax !== undefined)
        payload.bargain_max_pct = markupData.bargainFareMax;
      if (markupData.validFrom !== undefined)
        payload.valid_from = this.toApiDate(markupData.validFrom);
      if (markupData.validTo !== undefined)
        payload.valid_to = this.toApiDate(markupData.validTo);
      if (markupData.priority !== undefined)
        payload.priority = markupData.priority;
      if (markupData.userType !== undefined)
        payload.user_type = markupData.userType;
      if (markupData.status !== undefined)
        payload.is_active = markupData.status === "active";

      const response: any = await apiClient.put(
        `${this.baseUrl}/${markupId}`,
        payload,
      );
      if (response && response.success) {
        return this.mapAirRow(response.item);
      }
      throw new Error(response?.error || "Failed to update air markup");
    } catch (error) {
      console.error("Error updating air markup:", error);
      throw error;
    }
  }

  /**
   * Update an existing hotel markup
   */
  async updateHotelMarkup(
    markupId: string,
    markupData: Partial<CreateHotelMarkupRequest>,
  ): Promise<HotelMarkup> {
    try {
      const payload: any = {};
      if (markupData.name !== undefined) payload.rule_name = markupData.name;
      if (markupData.description !== undefined)
        payload.description = markupData.description;
      if (markupData.city !== undefined) payload.hotel_city = markupData.city;
      if (markupData.starRating !== undefined) {
        const sr = parseInt(String(markupData.starRating), 10);
        payload.hotel_star_min = sr;
        payload.hotel_star_max = sr;
      }
      if (markupData.markupType !== undefined)
        payload.m_type = markupData.markupType;
      if (markupData.markupValue !== undefined)
        payload.m_value = markupData.markupValue;
      if (markupData.currentFareMin !== undefined)
        payload.current_min_pct = markupData.currentFareMin;
      if (markupData.currentFareMax !== undefined)
        payload.current_max_pct = markupData.currentFareMax;
      if (markupData.bargainFareMin !== undefined)
        payload.bargain_min_pct = markupData.bargainFareMin;
      if (markupData.bargainFareMax !== undefined)
        payload.bargain_max_pct = markupData.bargainFareMax;
      if (markupData.validFrom !== undefined)
        payload.valid_from = this.toApiDate(markupData.validFrom);
      if (markupData.validTo !== undefined)
        payload.valid_to = this.toApiDate(markupData.validTo);
      if (markupData.priority !== undefined)
        payload.priority = markupData.priority;
      if (markupData.userType !== undefined)
        payload.user_type = markupData.userType;
      if (markupData.status !== undefined)
        payload.is_active = markupData.status === "active";

      const response: any = await apiClient.put(
        `${this.baseUrl}/${markupId}`,
        payload,
      );
      if (response && response.success) {
        return this.mapHotelRow(response.item);
      }
      throw new Error(response?.error || "Failed to update hotel markup");
    } catch (error) {
      console.error("Error updating hotel markup:", error);
      throw error;
    }
  }

  /**
   * Delete an air markup
   */
  async deleteAirMarkup(markupId: string): Promise<void> {
    try {
      const response: any = await apiClient.delete(
        `${this.baseUrl}/${markupId}`,
      );
      if (response && response.success === false) {
        throw new Error(response.error || "Failed to delete air markup");
      }
    } catch (error) {
      console.error("Error deleting air markup:", error);
      throw error;
    }
  }

  /**
   * Delete a hotel markup
   */
  async deleteHotelMarkup(markupId: string): Promise<void> {
    try {
      const response: any = await apiClient.delete(
        `${this.baseUrl}/${markupId}`,
      );
      if (response && response.success === false) {
        throw new Error(response.error || "Failed to delete hotel markup");
      }
    } catch (error) {
      console.error("Error deleting hotel markup:", error);
      throw error;
    }
  }

  /**
   * Toggle markup status (active/inactive)
   */
  async toggleAirMarkupStatus(markupId: string): Promise<AirMarkup> {
    try {
      const response: any = await apiClient.post(
        `${this.baseUrl}/${markupId}/status`,
      );
      if (response && response.success) {
        return this.mapAirRow(response.item);
      }
      throw new Error(response?.error || "Failed to toggle air markup status");
    } catch (error) {
      console.error("Error toggling air markup status:", error);
      throw error;
    }
  }

  /**
   * Toggle hotel markup status (active/inactive)
   */
  async toggleHotelMarkupStatus(markupId: string): Promise<HotelMarkup> {
    try {
      const response: any = await apiClient.post(
        `${this.baseUrl}/${markupId}/status`,
      );
      if (response && response.success) {
        return this.mapHotelRow(response.item);
      }
      throw new Error(
        response?.error || "Failed to toggle hotel markup status",
      );
    } catch (error) {
      console.error("Error toggling hotel markup status:", error);
      throw error;
    }
  }

  /**
   * Calculate markup for a specific booking (used in bargain engine)
   */
  async calculateMarkup(bookingDetails: {
    type: "air" | "hotel" | "sightseeing";
    basePrice: number;
    // Air-specific
    airline?: string;
    route?: { from: string; to: string };
    class?: string;
    // Hotel-specific
    city?: string;
    hotelName?: string;
    starRating?: string;
    userType?: "b2c" | "b2b";
    // Sightseeing-specific
    location?: string;
    category?: string;
    duration?: string;
  }): Promise<{
    applicableMarkups: (AirMarkup | HotelMarkup)[];
    selectedMarkup: AirMarkup | HotelMarkup;
    markupAmount: number;
    finalPrice: number;
    markupRange: { min: number; max: number };
  }> {
    try {
      console.log("🔍 Attempting to calculate markup via API...");

      const payload: any = {
        module:
          bookingDetails.type === "air"
            ? "air"
            : bookingDetails.type === "hotel"
              ? "hotel"
              : "sightseeing",
        base_amount: bookingDetails.basePrice,
      };
      const normalizedBookingClass = normalizeCabinClass(bookingDetails.class);
      if (bookingDetails.type === "air") {
        if (bookingDetails.airline)
          payload.airline_code = bookingDetails.airline;
        if (bookingDetails.route?.from)
          payload.route_from = bookingDetails.route.from;
        if (bookingDetails.route?.to)
          payload.route_to = bookingDetails.route.to;
        if (normalizedBookingClass)
          payload.booking_class = normalizedBookingClass;
      } else if (bookingDetails.type === "hotel") {
        if (bookingDetails.city) payload.hotel_city = bookingDetails.city;
        if (bookingDetails.starRating)
          payload.hotel_star_min = parseInt(bookingDetails.starRating, 10);
      }

      const response: any = await apiClient.post(
        `${this.baseUrl}/test-apply`,
        payload,
      );

      if (response && response.success) {
        const markupAmount =
          Number(response.final_amount) - Number(response.base_amount);
        const selectedMarkup = {
          id: String(response.matched_rule_id || ""),
          name: "Applied Markup",
          description: "",
          airline: bookingDetails.airline || "",
          route: bookingDetails.route || { from: "", to: "" },
          class: normalizedBookingClass ?? "economy",
          markupType:
            String(response.markup_type).toLowerCase() === "flat"
              ? "fixed"
              : "percentage",
          markupValue: Number(response.markup_value || 0),
          minAmount: 0,
          maxAmount: 999999,
          currentFareMin: 0,
          currentFareMax: 0,
          bargainFareMin: 0,
          bargainFareMax: 0,
          validFrom: this.toDisplayDate(
            response.valid_from || new Date().toISOString(),
          ),
          validTo: this.toDisplayDate(
            response.valid_to ||
              new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
          ),
          status: "active" as const,
          priority: 0,
          userType: "all" as const,
          specialConditions: "",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        } as AirMarkup | HotelMarkup;

        return {
          applicableMarkups: [selectedMarkup],
          selectedMarkup,
          markupAmount,
          finalPrice: Number(response.final_amount),
          markupRange: { min: 0, max: 0 },
        };
      } else {
        console.warn("⚠️ API markup calculation failed, using fallback");
        return this.getFallbackMarkupCalculation(bookingDetails);
      }
    } catch (error) {
      console.warn(
        "⚠️ API server unavailable, using fallback markup calculation:",
        error instanceof Error ? error.message : "Unknown error",
      );
      return this.getFallbackMarkupCalculation(bookingDetails);
    }
  }

  /**
   * Fallback markup calculation when API is unavailable
   */
  private getFallbackMarkupCalculation(bookingDetails: {
    type: "air" | "hotel" | "sightseeing";
    basePrice: number;
    airline?: string;
    route?: { from: string; to: string };
    class?: string;
    city?: string;
    hotelName?: string;
    starRating?: string;
    userType?: "b2c" | "b2b";
    location?: string;
    category?: string;
    duration?: string;
  }) {
    console.log("🔄 Using fallback markup calculation");

    const normalizedClass = normalizeCabinClass(bookingDetails.class);

    // Define default markup ranges based on type and other factors
    let baseMarkupMin = 10;
    let baseMarkupMax = 25;
    let selectedMarkupPercentage = 15;

    if (bookingDetails.type === "air") {
      // Flight markup logic
      if (normalizedClass === "business" || normalizedClass === "first") {
        baseMarkupMin = 8;
        baseMarkupMax = 18;
        selectedMarkupPercentage = 12;
      } else {
        baseMarkupMin = 12;
        baseMarkupMax = 22;
        selectedMarkupPercentage = 16;
      }

      // Premium airlines get lower markup
      const premiumAirlines = ["EK", "QR", "EY", "LH", "BA", "AF", "SQ"];
      if (premiumAirlines.includes(bookingDetails.airline || "")) {
        selectedMarkupPercentage = Math.max(
          selectedMarkupPercentage - 3,
          baseMarkupMin,
        );
      }
    } else if (bookingDetails.type === "hotel") {
      // Hotel markup logic
      const starRating = parseInt(bookingDetails.starRating || "3");
      if (starRating >= 5) {
        baseMarkupMin = 15;
        baseMarkupMax = 25;
        selectedMarkupPercentage = 18;
      } else if (starRating >= 4) {
        baseMarkupMin = 18;
        baseMarkupMax = 28;
        selectedMarkupPercentage = 22;
      } else {
        baseMarkupMin = 20;
        baseMarkupMax = 30;
        selectedMarkupPercentage = 25;
      }
    } else if (bookingDetails.type === "sightseeing") {
      // Sightseeing markup logic
      baseMarkupMin = 20;
      baseMarkupMax = 35;
      selectedMarkupPercentage = 25;

      // Premium categories get higher markup
      const premiumCategories = ["luxury", "premium", "vip"];
      if (
        premiumCategories.some((cat) =>
          bookingDetails.category?.toLowerCase().includes(cat),
        )
      ) {
        selectedMarkupPercentage = 30;
      }
    }

    const markupAmount =
      bookingDetails.basePrice * (selectedMarkupPercentage / 100);
    const finalPrice = bookingDetails.basePrice + markupAmount;

    // Create a fallback markup object
    const fallbackMarkup = {
      id: `fallback_${bookingDetails.type}_${Date.now()}`,
      name: `Fallback ${bookingDetails.type.charAt(0).toUpperCase() + bookingDetails.type.slice(1)} Markup`,
      description: "Default markup used when API is unavailable",
      airline: bookingDetails.airline || "",
      origin_iata: bookingDetails.route?.from ?? null,
      dest_iata: bookingDetails.route?.to ?? null,
      route: {
        from: bookingDetails.route?.from ?? null,
        to: bookingDetails.route?.to ?? null,
      },
      class: normalizedClass ?? "economy",
      markupType: "percentage" as const,
      markupValue: selectedMarkupPercentage,
      minAmount: 0,
      maxAmount: 999999,
      currentFareMin: baseMarkupMin,
      currentFareMax: baseMarkupMax,
      bargainFareMin: Math.max(baseMarkupMin - 5, 5),
      bargainFareMax: baseMarkupMax + 5,
      validFrom: this.toDisplayDate(new Date().toISOString()),
      validTo: this.toDisplayDate(
        new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
      ),
      status: "active" as const,
      priority: 1,
      userType: "all" as const,
      specialConditions: "Fallback markup",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    return {
      applicableMarkups: [fallbackMarkup],
      selectedMarkup: fallbackMarkup,
      markupAmount,
      finalPrice,
      markupRange: { min: baseMarkupMin, max: baseMarkupMax },
    };
  }

  /**
   * Get all transfer markups with optional filters
   */
  async getTransferMarkups(filters: MarkupFilters = {}): Promise<{
    markups: TransferMarkup[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    try {
      const queryParams = new URLSearchParams();

      if (filters.search) queryParams.set("search", filters.search);
      if (filters.status)
        queryParams.set(
          "is_active",
          filters.status === "active" ? "true" : "false",
        );
      if (filters.page) queryParams.set("page", filters.page.toString());
      if (filters.limit) queryParams.set("limit", filters.limit.toString());

      const response = await apiClient.get(
        `/api/admin/transfers-markup?${queryParams}`,
      );

      if (response.ok) {
        // Transform API response to match expected format
        const data = response.data;
        return {
          markups: data.data.map((markup: any) => ({
            id: markup.id.toString(),
            name: markup.rule_name,
            description: markup.rule_name,
            originCity: markup.origin_city,
            destinationCity: markup.destination_city,
            transferType: "ALL",
            vehicleType: markup.vehicle_type,
            markupType: markup.markup_type,
            markupValue: markup.markup_value,
            minAmount: markup.min_fare_range || 0,
            maxAmount: markup.max_fare_range || 999999,
            currentFareMin: markup.markup_value - 5,
            currentFareMax: markup.markup_value + 5,
            bargainFareMin: Math.max(markup.markup_value - 10, 5),
            bargainFareMax: markup.markup_value + 10,
            validFrom: new Date().toISOString(),
            validTo: new Date(
              Date.now() + 365 * 24 * 60 * 60 * 1000,
            ).toISOString(),
            status: markup.is_active ? "active" : "inactive",
            priority: markup.priority || 50,
            userType: "all",
            specialConditions: "",
            createdAt: markup.created_at,
            updatedAt: markup.updated_at,
          })),
          total: data.pagination.total_items,
          page: data.pagination.current_page,
          totalPages: data.pagination.total_pages,
        };
      } else {
        throw new Error(response.error || "Failed to fetch transfer markups");
      }
    } catch (error) {
      console.error("Error fetching transfer markups:", error);
      throw error;
    }
  }

  /**
   * Create a new transfer markup
   */
  async createTransferMarkup(
    markupData: CreateTransferMarkupRequest,
  ): Promise<TransferMarkup> {
    try {
      const requestData = {
        rule_name: markupData.name,
        origin_city: markupData.originCity,
        destination_city: markupData.destinationCity,
        vehicle_type: markupData.vehicleType.toLowerCase(),
        markup_type: markupData.markupType,
        markup_value: markupData.markupValue,
        min_fare_range: markupData.minAmount,
        max_fare_range: markupData.maxAmount,
        is_active: markupData.status === "active",
        priority: markupData.priority,
      };

      const response = await apiClient.post(
        `/api/admin/transfers-markup`,
        requestData,
      );

      if (response.ok) {
        const data = response.data.data;
        return {
          id: data.id.toString(),
          name: data.rule_name,
          description: data.rule_name,
          originCity: data.origin_city,
          destinationCity: data.destination_city,
          transferType: "ALL",
          vehicleType: data.vehicle_type,
          markupType: data.markup_type,
          markupValue: data.markup_value,
          minAmount: data.min_fare_range || 0,
          maxAmount: data.max_fare_range || 999999,
          currentFareMin: data.markup_value - 5,
          currentFareMax: data.markup_value + 5,
          bargainFareMin: Math.max(data.markup_value - 10, 5),
          bargainFareMax: data.markup_value + 10,
          validFrom: new Date().toISOString(),
          validTo: new Date(
            Date.now() + 365 * 24 * 60 * 60 * 1000,
          ).toISOString(),
          status: data.is_active ? "active" : "inactive",
          priority: data.priority || 50,
          userType: "all",
          specialConditions: "",
          createdAt: data.created_at,
          updatedAt: data.updated_at,
        };
      } else {
        throw new Error(response.error || "Failed to create transfer markup");
      }
    } catch (error) {
      console.error("Error creating transfer markup:", error);
      throw error;
    }
  }

  /**
   * Update an existing transfer markup
   */
  async updateTransferMarkup(
    markupId: string,
    markupData: Partial<CreateTransferMarkupRequest>,
  ): Promise<TransferMarkup> {
    try {
      const requestData = {
        rule_name: markupData.name,
        origin_city: markupData.originCity,
        destination_city: markupData.destinationCity,
        vehicle_type: markupData.vehicleType?.toLowerCase(),
        markup_type: markupData.markupType,
        markup_value: markupData.markupValue,
        min_fare_range: markupData.minAmount,
        max_fare_range: markupData.maxAmount,
        is_active: markupData.status === "active",
        priority: markupData.priority,
      };

      const response = await apiClient.put(
        `/api/admin/transfers-markup/${markupId}`,
        requestData,
      );

      if (response.ok) {
        const data = response.data.data;
        return {
          id: data.id.toString(),
          name: data.rule_name,
          description: data.rule_name,
          originCity: data.origin_city,
          destinationCity: data.destination_city,
          transferType: "ALL",
          vehicleType: data.vehicle_type,
          markupType: data.markup_type,
          markupValue: data.markup_value,
          minAmount: data.min_fare_range || 0,
          maxAmount: data.max_fare_range || 999999,
          currentFareMin: data.markup_value - 5,
          currentFareMax: data.markup_value + 5,
          bargainFareMin: Math.max(data.markup_value - 10, 5),
          bargainFareMax: data.markup_value + 10,
          validFrom: new Date().toISOString(),
          validTo: new Date(
            Date.now() + 365 * 24 * 60 * 60 * 1000,
          ).toISOString(),
          status: data.is_active ? "active" : "inactive",
          priority: data.priority || 50,
          userType: "all",
          specialConditions: "",
          createdAt: data.created_at,
          updatedAt: data.updated_at,
        };
      } else {
        throw new Error(response.error || "Failed to update transfer markup");
      }
    } catch (error) {
      console.error("Error updating transfer markup:", error);
      throw error;
    }
  }

  /**
   * Delete a transfer markup
   */
  async deleteTransferMarkup(markupId: string): Promise<void> {
    try {
      const response = await apiClient.delete(
        `/api/admin/transfers-markup/${markupId}`,
      );

      if (!response.ok) {
        throw new Error(response.error || "Failed to delete transfer markup");
      }
    } catch (error) {
      console.error("Error deleting transfer markup:", error);
      throw error;
    }
  }

  /**
   * Toggle transfer markup status (active/inactive)
   */
  async toggleTransferMarkupStatus(markupId: string): Promise<TransferMarkup> {
    try {
      const response = await apiClient.patch(
        `/api/admin/transfers-markup/${markupId}/toggle`,
      );

      if (response.ok) {
        const data = response.data.data;
        return {
          id: data.id.toString(),
          name: data.rule_name,
          description: data.rule_name,
          originCity: "",
          destinationCity: "",
          transferType: "ALL",
          vehicleType: "economy",
          markupType: "percentage",
          markupValue: 0,
          minAmount: 0,
          maxAmount: 999999,
          currentFareMin: 0,
          currentFareMax: 0,
          bargainFareMin: 0,
          bargainFareMax: 0,
          validFrom: this.toDisplayDate(
            data.valid_from || data.validFrom || new Date().toISOString(),
          ),
          validTo: this.toDisplayDate(
            data.valid_to ||
              data.validTo ||
              new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
          ),
          status: data.is_active ? "active" : "inactive",
          priority: 50,
          userType: "all",
          specialConditions: "",
          createdAt: data.created_at || new Date().toISOString(),
          updatedAt: data.updated_at,
        };
      } else {
        throw new Error(
          response.error || "Failed to toggle transfer markup status",
        );
      }
    } catch (error) {
      console.error("Error toggling transfer markup status:", error);
      throw error;
    }
  }
}

export const markupService = new MarkupService();
