/**
 * Generic Hotel Booking Endpoints
 * Supplier-agnostic interface for PreBook → BlockRoom → BookRoom chain
 * 
 * Wraps supplier-specific adapters but provides unified response structure
 * Reads from cached session (hotel_search_cache) and logs all requests
 * 
 * Endpoints:
 * - POST /api/hotels/prebook - Get room details + validate prices
 * - POST /api/hotels/block    - Block room + detect price/policy changes  
 * - POST /api/hotels/book     - Confirm booking + store full response
 */

const express = require('express');
const router = express.Router();
const db = require('../lib/db');
const { v4: uuidv4 } = require('uuid');
const hotelCacheService = require('../services/hotelCacheService');
const supplierAdapterManager = require('../services/adapters/supplierAdapterManager');

/**
 * LOGGING HELPER: Write trace log for all TBO requests
 */
async function logTboTrace(traceInfo) {
  try {
    const {
      traceId,
      requestType,
      endpointName,
      requestPayload,
      responsePayload,
      httpStatusCode,
      tboResponseStatus,
      errorMessage,
      errorCode,
      hotelCode,
      searchHash,
      bookingId,
      responseTimeMs,
    } = traceInfo;

    await db.query(
      `INSERT INTO public.tbo_trace_logs 
       (trace_id, request_type, endpoint_name, request_payload, response_payload,
        http_status_code, tbo_response_status, error_message, error_code,
        hotel_code, search_hash, booking_id, response_time_ms, response_timestamp,
        supplier, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, NOW(), 'TBO', NOW())`,
      [
        traceId,
        requestType,
        endpointName,
        JSON.stringify(requestPayload || {}),
        JSON.stringify(responsePayload || {}),
        httpStatusCode,
        tboResponseStatus,
        errorMessage,
        errorCode,
        hotelCode,
        searchHash,
        bookingId,
        responseTimeMs,
      ]
    );
  } catch (err) {
    console.error('❌ Failed to log TBO trace:', err.message);
    // Don't throw - logging should never break the flow
  }
}

/**
 * POST /api/hotels/prebook
 * Get room details + validate pricing for selected hotel
 * 
 * Called after user selects hotel on results page
 * Returns room options with prices + cancellation policies
 */
router.post('/prebook', async (req, res) => {
  const traceId = uuidv4();
  const startTime = Date.now();

  try {
    const {
      searchHash,      // From search results
      hotelId,         // Canonical hotel ID
      supplier = 'TBO', // Default to TBO
      checkIn,
      checkOut,
      roomConfig,      // Room configuration from search
    } = req.body;

    console.log(`🏨 [${traceId}] PreBook Request:`, {
      searchHash,
      hotelId,
      supplier,
      checkIn,
      checkOut,
    });

    // =========================================================================
    // Step 1: Validate and retrieve cached search session
    // =========================================================================
    if (!searchHash) {
      return res.status(400).json({
        success: false,
        error: 'searchHash is required',
        traceId,
      });
    }

    const cachedSearch = await hotelCacheService.getCachedSearch(searchHash);
    if (!cachedSearch) {
      console.warn(`⚠️ [${traceId}] Search cache not found:`, searchHash);
      return res.status(404).json({
        success: false,
        error: 'Search session expired or not found',
        traceId,
      });
    }

    console.log(`✅ [${traceId}] Cached session found:`, {
      supplier: cachedSearch.supplier,
      tboSessionId: cachedSearch.tbo_token_id ? cachedSearch.tbo_token_id.substring(0, 8) + '...' : 'missing',
      sessionStatus: cachedSearch.session_status,
    });

    // =========================================================================
    // Step 2: Route to appropriate adapter
    // =========================================================================
    let prebookResult;
    const responseTimeMs = Date.now() - startTime;

    if (supplier === 'TBO' || cachedSearch.supplier === 'TBO') {
      const tboAdapter = supplierAdapterManager.getAdapter('TBO');
      if (!tboAdapter) {
        throw new Error('TBO adapter not initialized');
      }

      // Use cached session data
      prebookResult = await tboAdapter.getHotelRoom({
        traceId,
        resultIndex: 0,
        hotelCode: hotelId,
      });
    } else {
      throw new Error(`Supplier ${supplier} not yet supported in generic endpoint`);
    }

    // =========================================================================
    // Step 3: Log and return normalized response
    // =========================================================================
    await logTboTrace({
      traceId,
      requestType: 'prebook',
      endpointName: '/api/hotels/prebook',
      requestPayload: {
        searchHash,
        hotelId,
        supplier,
        checkIn,
        checkOut,
      },
      responsePayload: prebookResult,
      httpStatusCode: 200,
      tboResponseStatus: prebookResult?.responseStatus || 0,
      hotelCode: hotelId,
      searchHash,
      responseTimeMs,
    });

    // Normalize response
    const normalizedRooms = (prebookResult.rooms || []).map((room) => ({
      roomId: room.roomTypeCode || room.rateKey,
      roomName: room.roomTypeName,
      boardType: room.boardType || 'All Inclusive',
      occupancy: room.occupancy || { adults: 2, children: 0 },
      price: {
        offered: room.price?.offeredPrice || 0,
        published: room.price?.publishedPrice || 0,
        currency: room.price?.currencyCode || 'INR',
      },
      cancellationPolicy: room.cancellationPolicy,
      cancellationPolicies: room.cancellationPolicies || [],
      lastCancellationDate: room.lastCancellationDate,
      amenities: room.amenities || [],
      inclusions: room.inclusions || [],
    }));

    return res.json({
      success: true,
      traceId,
      rooms: normalizedRooms,
      sessionStatus: 'active',
      supplier,
      responseTime: `${responseTimeMs}ms`,
    });
  } catch (error) {
    const responseTimeMs = Date.now() - startTime;

    console.error(`❌ [${traceId}] PreBook Error:`, error.message);

    await logTboTrace({
      traceId,
      requestType: 'prebook',
      endpointName: '/api/hotels/prebook',
      requestPayload: req.body,
      httpStatusCode: 500,
      tboResponseStatus: 0,
      errorMessage: error.message,
      errorCode: error.code,
      responseTimeMs,
    });

    return res.status(500).json({
      success: false,
      error: error.message,
      traceId,
    });
  }
});

/**
 * POST /api/hotels/block
 * Block room + detect price/policy changes
 * 
 * Called when user confirms room selection
 * Returns availability + price change warnings
 */
router.post('/block', async (req, res) => {
  const traceId = uuidv4();
  const startTime = Date.now();

  try {
    const {
      searchHash,
      hotelId,
      roomId,
      supplier = 'TBO',
      hotelRoomDetails,     // From prebook response
    } = req.body;

    console.log(`🔒 [${traceId}] Block Request:`, {
      searchHash,
      hotelId,
      roomId,
      supplier,
    });

    // =========================================================================
    // Step 1: Validate session + room details
    // =========================================================================
    if (!searchHash || !hotelId || !hotelRoomDetails) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: searchHash, hotelId, hotelRoomDetails',
        traceId,
      });
    }

    const cachedSearch = await hotelCacheService.getCachedSearch(searchHash);
    if (!cachedSearch) {
      return res.status(404).json({
        success: false,
        error: 'Search session expired',
        traceId,
      });
    }

    // =========================================================================
    // Step 2: Call adapter blockRoom
    // =========================================================================
    let blockResult;
    const responseTimeMs = Date.now() - startTime;

    if (supplier === 'TBO' || cachedSearch.supplier === 'TBO') {
      const tboAdapter = supplierAdapterManager.getAdapter('TBO');
      if (!tboAdapter) {
        throw new Error('TBO adapter not initialized');
      }

      blockResult = await tboAdapter.blockRoom({
        traceId,
        resultIndex: 0,
        hotelCode: hotelId,
        hotelRoomDetails,
      });
    } else {
      throw new Error(`Supplier ${supplier} not yet supported`);
    }

    // =========================================================================
    // Step 3: Detect changes + log
    // =========================================================================
    const isPriceChanged = blockResult.isPriceChanged || false;
    const isPolicyChanged = blockResult.isCancellationPolicyChanged || false;

    await logTboTrace({
      traceId,
      requestType: 'block',
      endpointName: '/api/hotels/block',
      requestPayload: {
        searchHash,
        hotelId,
        roomId,
        supplier,
      },
      responsePayload: blockResult,
      httpStatusCode: 200,
      tboResponseStatus: blockResult?.responseStatus || 0,
      hotelCode: hotelId,
      searchHash,
      responseTimeMs,
    });

    return res.json({
      success: true,
      traceId,
      isPriceChanged,
      isPolicyChanged,
      warningMessage: isPriceChanged
        ? 'Price has changed since search. Please confirm before proceeding.'
        : isPolicyChanged
        ? 'Cancellation policy has changed. Please review before booking.'
        : null,
      roomDetails: blockResult.hotelRoomDetails,
      supplier,
      responseTime: `${responseTimeMs}ms`,
    });
  } catch (error) {
    const responseTimeMs = Date.now() - startTime;

    console.error(`❌ [${traceId}] Block Error:`, error.message);

    await logTboTrace({
      traceId,
      requestType: 'block',
      endpointName: '/api/hotels/block',
      requestPayload: req.body,
      httpStatusCode: 500,
      tboResponseStatus: 0,
      errorMessage: error.message,
      errorCode: error.code,
      responseTimeMs,
    });

    return res.status(500).json({
      success: false,
      error: error.message,
      traceId,
    });
  }
});

/**
 * POST /api/hotels/book
 * Confirm booking + store complete response
 * 
 * Called when user confirms after block validation
 * Returns booking reference + confirmation details
 */
router.post('/book', async (req, res) => {
  const traceId = uuidv4();
  const startTime = Date.now();

  try {
    const {
      searchHash,
      hotelId,
      roomId,
      supplier = 'TBO',
      hotelRoomDetails,     // From block response
      guestDetails,         // Passenger information
      contactEmail,
      contactPhone,
    } = req.body;

    console.log(`📖 [${traceId}] Book Request:`, {
      searchHash,
      hotelId,
      roomId,
      supplier,
      hasGuestDetails: !!guestDetails,
    });

    // =========================================================================
    // Step 1: Validate all required fields
    // =========================================================================
    if (!searchHash || !hotelId || !guestDetails) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: searchHash, hotelId, guestDetails',
        traceId,
      });
    }

    const cachedSearch = await hotelCacheService.getCachedSearch(searchHash);
    if (!cachedSearch) {
      return res.status(404).json({
        success: false,
        error: 'Search session expired',
        traceId,
      });
    }

    // =========================================================================
    // Step 2: Call adapter bookHotel
    // =========================================================================
    let bookResult;
    const responseTimeMs = Date.now() - startTime;

    if (supplier === 'TBO' || cachedSearch.supplier === 'TBO') {
      const tboAdapter = supplierAdapterManager.getAdapter('TBO');
      if (!tboAdapter) {
        throw new Error('TBO adapter not initialized');
      }

      bookResult = await tboAdapter.bookHotel({
        traceId,
        resultIndex: 0,
        hotelCode: hotelId,
        hotelRoomDetails,
        hotelPassenger: guestDetails,
      });
    } else {
      throw new Error(`Supplier ${supplier} not yet supported`);
    }

    // =========================================================================
    // Step 3: Persist booking + full response to database
    // =========================================================================
    let bookingRecord = null;
    try {
      const bookingId = uuidv4();
      await db.query(
        `INSERT INTO public.bookings 
         (id, tbo_trace_id, tbo_booking_reference, tbo_full_response, 
          tbo_session_id, book_response, supplier, status, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())`,
        [
          bookingId,
          traceId,
          bookResult.bookingRefNo || bookResult.confirmationNo,
          JSON.stringify(bookResult),
          cachedSearch.search_hash,
          JSON.stringify(bookResult),
          'TBO',
          'confirmed',
        ]
      );

      bookingRecord = { id: bookingId, ...bookResult };
      console.log(`✅ [${traceId}] Booking persisted:`, {
        bookingId,
        reference: bookResult.bookingRefNo,
      });
    } catch (dbErr) {
      console.error(`⚠️ [${traceId}] Booking DB error:`, dbErr.message);
      // Continue - booking was confirmed at TBO even if DB save fails
    }

    // =========================================================================
    // Step 4: Log and return
    // =========================================================================
    await logTboTrace({
      traceId,
      requestType: 'book',
      endpointName: '/api/hotels/book',
      requestPayload: {
        searchHash,
        hotelId,
        roomId,
        supplier,
        hasGuestDetails: true,
      },
      responsePayload: bookResult,
      httpStatusCode: 200,
      tboResponseStatus: bookResult?.responseStatus || 0,
      hotelCode: hotelId,
      searchHash,
      bookingId: bookResult.bookingRefNo,
      responseTimeMs,
    });

    return res.json({
      success: true,
      traceId,
      bookingReference: bookResult.bookingRefNo || bookResult.confirmationNo,
      hotelConfirmationNo: bookResult.hotelConfirmationNo,
      bookingStatus: 'confirmed',
      bookingDetails: {
        hotelName: bookResult.hotelName,
        checkIn: bookResult.checkInDate,
        checkOut: bookResult.checkOutDate,
        roomDetails: bookResult.hotelRoomDetails,
        totalPrice: bookResult.totalPrice,
        currency: bookResult.currency || 'INR',
      },
      supplier,
      responseTime: `${responseTimeMs}ms`,
      voucherUrl: null, // Will be generated in next endpoint
    });
  } catch (error) {
    const responseTimeMs = Date.now() - startTime;

    console.error(`❌ [${traceId}] Book Error:`, error.message);

    await logTboTrace({
      traceId,
      requestType: 'book',
      endpointName: '/api/hotels/book',
      requestPayload: req.body,
      httpStatusCode: 500,
      tboResponseStatus: 0,
      errorMessage: error.message,
      errorCode: error.code,
      responseTimeMs,
    });

    return res.status(500).json({
      success: false,
      error: error.message,
      traceId,
    });
  }
});

module.exports = router;
