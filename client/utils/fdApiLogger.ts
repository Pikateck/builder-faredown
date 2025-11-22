/**
 * Faredown API Logger - Diagnostic utility for tracking cache vs live API calls
 * This helps diagnose cache-first implementation and API response sources
 */

export type ApiSource = "cache" | "live" | "unknown" | "error";

export interface ApiMeta {
  source?: ApiSource;
  traceId?: string;
  searchId?: string;
  requestedAt?: string;
  processedAt?: string;
  hitRate?: number;
  ttlExpiresAt?: string;
  cachedAt?: string;
  cacheHit?: boolean;
}

export interface ApiLogContext {
  label: string;
  meta?: ApiMeta;
  extra?: Record<string, unknown>;
  timestamp?: string;
  responseTime?: number;
}

/**
 * Log API metadata with source tracking
 * Outputs color-coded console groups for easy identification
 */
export function logApiMeta(
  label: string,
  meta?: ApiMeta,
  extra: Record<string, unknown> = {},
): void {
  const src: ApiSource = meta?.source ?? "unknown";
  const timestamp = new Date().toLocaleTimeString("en-US", {
    hour12: false,
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    fractionalSecondDigits: 3,
  });

  const colors: Record<ApiSource, string> = {
    cache: "color: #1e90ff; font-weight: bold;", // Dodger blue for cache
    live: "color: #28a745; font-weight: bold;", // Green for live
    unknown: "color: #ff9800; font-weight: bold;", // Orange for unknown
    error: "color: #dc3545; font-weight: bold;", // Red for error
  };

  const groupLabel = `[FD][${label}] ${src.toUpperCase()} response @ ${timestamp}`;

  console.groupCollapsed(`%c${groupLabel}`, colors[src]);

  // Log core metadata
  console.log("📍 Source:", meta?.source || "unknown");
  if (meta?.traceId) {
    console.log("🔍 Trace ID:", meta.traceId);
  }
  if (meta?.searchId) {
    console.log("🔎 Search ID:", meta.searchId);
  }

  // Log timing information
  if (meta?.requestedAt) {
    console.log("⏱️ Requested at:", meta.requestedAt);
  }
  if (meta?.processedAt) {
    console.log("⏱️ Processed at:", meta.processedAt);
  }

  // Log cache-specific information
  if (meta?.cacheHit !== undefined) {
    console.log(`${meta.cacheHit ? "✅" : "❌"} Cache Hit:`, meta.cacheHit);
  }
  if (meta?.cachedAt) {
    console.log("💾 Cached at:", meta.cachedAt);
  }
  if (meta?.ttlExpiresAt) {
    console.log("⏳ Expires at:", meta.ttlExpiresAt);
  }
  if (meta?.hitRate !== undefined) {
    console.log("📊 Hit Rate:", `${(meta.hitRate * 100).toFixed(1)}%`);
  }

  // Log extra context if provided
  if (Object.keys(extra).length > 0) {
    console.log("📦 Context:", extra);
  }

  console.groupEnd();
}

/**
 * Log hotel search results with source and count
 */
export function logHotelSearchResponse(
  count: number,
  meta?: ApiMeta,
  prices?: { min: number; max: number },
): void {
  logApiMeta("hotel-search", meta, {
    hotelCount: count,
    minPrice: prices?.min,
    maxPrice: prices?.max,
    priceRange: prices
      ? `${prices.min.toFixed(0)} - ${prices.max.toFixed(0)}`
      : "N/A",
  });
}

/**
 * Log hotel details response with image and room counts
 */
export function logHotelDetailsResponse(
  hotelId: string,
  meta?: ApiMeta,
  details?: {
    roomCount?: number;
    imageCount?: number;
    hasCoords?: boolean;
    hasAmenities?: boolean;
  },
): void {
  logApiMeta("hotel-details", meta, {
    hotelId,
    roomCount: details?.roomCount ?? 0,
    imageCount: details?.imageCount ?? 0,
    hasCoordinates: details?.hasCoords ?? false,
    hasAmenities: details?.hasAmenities ?? false,
  });
}

/**
 * Log location search response
 */
export function logLocationSearchResponse(
  query: string,
  results: number,
  meta?: ApiMeta,
): void {
  logApiMeta("location-search", meta, {
    query,
    resultCount: results,
    source: meta?.source,
  });
}

/**
 * Log error with context
 */
export function logApiError(
  label: string,
  error: Error | string,
  context?: Record<string, unknown>,
): void {
  const errorMessage =
    typeof error === "string" ? error : error?.message || "Unknown error";

  console.error(
    `%c[FD][${label}] ERROR`,
    "color: #dc3545; font-weight: bold;",
    errorMessage,
    context || "",
  );
}

/**
 * Create a performance marker for measuring API response times
 */
export class ApiPerformanceMarker {
  private label: string;
  private startTime: number;

  constructor(label: string) {
    this.label = label;
    this.startTime = performance.now();
  }

  end(meta?: ApiMeta): number {
    const endTime = performance.now();
    const duration = endTime - this.startTime;

    const src: ApiSource = meta?.source ?? "unknown";
    const colorMap: Record<ApiSource, string> = {
      cache: "#1e90ff",
      live: "#28a745",
      unknown: "#ff9800",
      error: "#dc3545",
    };

    console.log(
      `%c⏱️ [${this.label}] ${src.toUpperCase()} took ${duration.toFixed(1)}ms`,
      `color: ${colorMap[src]}; font-weight: bold;`,
    );

    return duration;
  }
}
