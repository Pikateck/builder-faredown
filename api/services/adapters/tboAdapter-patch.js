/**
 * PATCH FILE FOR api/services/adapters/tboAdapter.js
 * 
 * This file contains the code changes needed for the searchHotels method
 * to return session metadata along with hotels.
 * 
 * Apply these changes manually to api/services/adapters/tboAdapter.js
 */

// ============================================================
// CHANGE 1: Update empty results return (around line 588-591)
// ============================================================

// BEFORE:
//   if (hotels.length === 0) {
//     this.logger.info("ℹ️ TBO returned 0 hotels for this search");
//     return [];
//   }

// AFTER:
if (hotels.length === 0) {
  this.logger.info("ℹ️ TBO returned 0 hotels for this search");
  return {
    hotels: [],
    sessionMetadata: {
      traceId: searchResult?.TraceId || null,
      tokenId: tokenId,
      destinationId: cityId,
      supplierResponseFull: searchResult,
    },
  };
}

// ============================================================
// CHANGE 2: Update successful results return (around line 593-596)
// ============================================================

// BEFORE:
//   this.logger.info(`✅ TBO Search SUCCESS - ${hotels.length} hotels found`);
//
//   // Transform to our format
//   return this.transformHotelResults(hotels, searchParams);

// AFTER:
this.logger.info(`✅ TBO Search SUCCESS - ${hotels.length} hotels found`, {
  traceId: searchResult?.TraceId,
});

// Transform to our format
const transformedHotels = this.transformHotelResults(hotels, searchParams);

// Return hotels with session metadata
return {
  hotels: transformedHotels,
  sessionMetadata: {
    traceId: searchResult?.TraceId || null,
    tokenId: tokenId,
    destinationId: cityId,
    supplierResponseFull: searchResult,
  },
};

// ============================================================
// CHANGE 3: Update error handler return (around line 597-606)
// ============================================================

// BEFORE:
//   } catch (error) {
//     this.logger.error("❌ TBO Hotel Search FAILED", {
//       message: error.message,
//       httpStatus: error.response?.status,
//       statusText: error.response?.statusText,
//       responseData: error.response?.data,
//       url: searchUrl,
//     });
//     return [];
//   }

// AFTER:
} catch (error) {
  this.logger.error("❌ TBO Hotel Search FAILED", {
    message: error.message,
    httpStatus: error.response?.status,
    statusText: error.response?.statusText,
    responseData: error.response?.data,
    url: searchUrl,
  });
  return {
    hotels: [],
    sessionMetadata: {
      traceId: null,
      tokenId: tokenId,
      destinationId: cityId,
      supplierResponseFull: null,
    },
  };
}