/**
 * Hotel Adapter Caching Integration
 * Wraps adapter methods to add caching, coalescing, and logging
 * This can be applied to any hotel supplier adapter
 */

const hotelApiCachingService = require("./hotelApiCachingService");
const winston = require("winston");

const logger = winston.createLogger({
  level: "info",
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.printf(({ timestamp, level, message, ...meta }) => {
      return `${timestamp} [${level.toUpperCase()}] [HOTEL_CACHE_INT] ${message} ${Object.keys(meta).length ? JSON.stringify(meta) : ""}`;
    }),
  ),
  transports: [new winston.transports.Console()],
});

/**
 * Wrap an adapter's searchHotels method with caching
 * Usage:
 *   const TBOAdapter = require('./adapters/tboAdapter');
 *   const adapter = new TBOAdapter();
 *   wrapAdapterSearchWithCaching(adapter);
 */
function wrapAdapterSearchWithCaching(adapter, supplierCode = null) {
  const supplier = supplierCode || adapter.supplierCode;
  const originalSearchHotels = adapter.searchHotels.bind(adapter);

  adapter.searchHotels = async function (searchParams) {
    return await hotelApiCachingService.executeHotelSearch({
      supplierCode: supplier,
      endpoint: adapter.config?.hotelSearchUrl || "hotel-search",
      searchParams,
      searchFunction: () => originalSearchHotels(searchParams),
      requestPayload: {
        ...searchParams,
        // Sanitize sensitive data
        tokenId: undefined,
      },
    });
  };

  logger.info(`Wrapped ${supplier} adapter searchHotels with caching`);
  return adapter;
}

/**
 * Wrap an adapter's getHotelDetails method with caching
 */
function wrapAdapterRoomDetailsWithCaching(adapter, supplierCode = null) {
  const supplier = supplierCode || adapter.supplierCode;

  if (!adapter.getHotelDetails) {
    logger.warn(`${supplier} adapter does not have getHotelDetails method`);
    return adapter;
  }

  const originalGetHotelDetails = adapter.getHotelDetails.bind(adapter);

  adapter.getHotelDetails = async function (hotelCode, searchParams) {
    const { checkIn, checkOut } = searchParams;

    return await hotelApiCachingService.executeRoomDetailsCall({
      supplierCode: supplier,
      endpoint: adapter.config?.hotelDetailsUrl || "hotel-details",
      hotelCode,
      roomKey: hotelCode, // Simplified for now
      checkInDate: checkIn,
      checkOutDate: checkOut,
      roomFunction: () => originalGetHotelDetails(hotelCode, searchParams),
      requestPayload: {
        hotelCode,
        checkIn,
        checkOut,
      },
    });
  };

  logger.info(`Wrapped ${supplier} adapter getHotelDetails with caching`);
  return adapter;
}

/**
 * Apply caching to multiple adapter methods
 */
function applyCompleteCaching(adapter) {
  wrapAdapterSearchWithCaching(adapter);
  wrapAdapterRoomDetailsWithCaching(adapter);
  return adapter;
}

module.exports = {
  wrapAdapterSearchWithCaching,
  wrapAdapterRoomDetailsWithCaching,
  applyCompleteCaching,
};
