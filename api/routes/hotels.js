const express = require("express");
const router = express.Router();
const hotelbedsService = require('../services/hotelbedsService');
const giataService = require('../services/giataService');
const markupService = require('../services/markupService');

/**
 * Search hotels with Hotelbeds integration
 * GET /api/hotels/search
 */
router.get('/search', async (req, res) => {
  try {
    const {
      destination,
      checkIn,
      checkOut,
      rooms = 1,
      adults = 2,
      children = 0,
      currency = 'INR',
      destinationCode
    } = req.query;

    // Validate required parameters
    if (!checkIn || !checkOut) {
      return res.status(400).json({
        success: false,
        error: 'Check-in and check-out dates are required'
      });
    }

    // Search for destinations if destinationCode not provided
    let destCode = destinationCode;
    if (!destCode && destination) {
      const destinations = await hotelbedsService.searchDestinations(destination);
      if (destinations.length > 0) {
        destCode = destinations[0].code;
      }
    }

    if (!destCode) {
      return res.status(400).json({
        success: false,
        error: 'Valid destination required'
      });
    }

    // Search for hotel availability
    const searchParams = {
      destinationCode: destCode,
      checkIn,
      checkOut,
      rooms: parseInt(rooms),
      adults: parseInt(adults),
      children: parseInt(children)
    };

    const hotelResults = await hotelbedsService.searchAvailability(searchParams);

    if (hotelResults.length === 0) {
      return res.json({
        success: true,
        data: [],
        message: 'No hotels found for the specified criteria'
      });
    }

    // Process each hotel with GIATA mapping and markup
    const processedHotels = await Promise.all(
      hotelResults.map(async (hotel) => {
        try {
          // Get cached hotel content
          const hotelContent = hotelbedsService.getCachedHotel(hotel.code) || hotel;

          // Transform to our format
          const transformedHotel = hotelbedsService.transformHotelData(hotelContent, hotel);

          // Apply GIATA room mapping if rooms available
          if (hotel.rooms && hotel.rooms.length > 0) {
            const roomsData = hotel.rooms.map(room => ({
              name: room.name || 'Standard Room',
              description: room.description || '',
              code: room.code || '',
              maxOccupancy: room.maxOccupancy || parseInt(adults),
              amenities: room.amenities || []
            }));

            const mappedRooms = await giataService.batchMapRooms(roomsData);

            // Transform rooms with mapped data
            transformedHotel.roomTypes = hotel.rooms.map((room, index) => {
              const mappedRoom = mappedRooms[index] || mappedRooms[0];
              return giataService.transformMappedRoom(room, mappedRoom, room.rates);
            });

            // Apply markup to rates
            const markupResult = markupService.applyMarkup(transformedHotel, transformedHotel.roomTypes);
            transformedHotel.roomTypes = markupResult.markedUpRates;
            transformedHotel.markupSummary = markupResult.markupSummary;
          }

          return transformedHotel;
        } catch (error) {
          console.error(`Error processing hotel ${hotel.code}:`, error);
          return hotelbedsService.transformHotelData(hotel);
        }
      })
    );

    res.json({
      success: true,
      data: processedHotels,
      totalResults: processedHotels.length,
      searchParams: {
        destination: destination || destCode,
        checkIn,
        checkOut,
        rooms: parseInt(rooms),
        adults: parseInt(adults),
        children: parseInt(children)
      }
    });

  } catch (error) {
    console.error('Hotel search error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to search hotels',
      details: error.message
    });
  }
});

/**
 * Get hotel details with availability
 * GET /api/hotels/:hotelCode
 */
router.get('/:hotelCode', async (req, res) => {
  try {
    const { hotelCode } = req.params;
    const {
      checkIn,
      checkOut,
      rooms = 1,
      adults = 2,
      children = 0
    } = req.query;

    // Get hotel content from cache or API
    let hotelContent = hotelbedsService.getCachedHotel(hotelCode);

    if (!hotelContent) {
      const hotelDetails = await hotelbedsService.getHotelDetails([hotelCode]);
      hotelContent = hotelDetails[0];
    }

    if (!hotelContent) {
      return res.status(404).json({
        success: false,
        error: 'Hotel not found'
      });
    }

    // Get availability if dates provided
    let availability = null;
    if (checkIn && checkOut) {
      availability = await hotelbedsService.getHotelAvailability(
        hotelCode,
        checkIn,
        checkOut,
        parseInt(rooms),
        parseInt(adults),
        parseInt(children)
      );
    }

    // Transform hotel data
    const transformedHotel = hotelbedsService.transformHotelData(hotelContent, availability);

    // Apply GIATA mapping and markup if availability exists
    if (availability && availability.rooms) {
      const roomsData = availability.rooms.map(room => ({
        name: room.name || 'Standard Room',
        description: room.description || '',
        code: room.code || '',
        maxOccupancy: room.maxOccupancy || parseInt(adults),
        amenities: room.amenities || []
      }));

      const mappedRooms = await giataService.batchMapRooms(roomsData);

      transformedHotel.roomTypes = availability.rooms.map((room, index) => {
        const mappedRoom = mappedRooms[index] || mappedRooms[0];
        return giataService.transformMappedRoom(room, mappedRoom, room.rates);
      });

      // Apply markup
      const markupResult = markupService.applyMarkup(transformedHotel, transformedHotel.roomTypes);
      transformedHotel.roomTypes = markupResult.markedUpRates;
      transformedHotel.markupSummary = markupResult.markupSummary;
    }

    res.json({
      success: true,
      data: transformedHotel
    });

  } catch (error) {
    console.error('Hotel details error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get hotel details',
      details: error.message
    });
  }
});

/**
 * Get room availability for specific hotel
 * GET /api/hotels/:hotelCode/availability
 */
router.get('/:hotelCode/availability', async (req, res) => {
  try {
    const { hotelCode } = req.params;
    const {
      checkIn,
      checkOut,
      rooms = 1,
      adults = 2,
      children = 0
    } = req.query;

    if (!checkIn || !checkOut) {
      return res.status(400).json({
        success: false,
        error: 'Check-in and check-out dates are required'
      });
    }

    const availability = await hotelbedsService.getHotelAvailability(
      hotelCode,
      checkIn,
      checkOut,
      parseInt(rooms),
      parseInt(adults),
      parseInt(children)
    );

    if (!availability || !availability.rooms) {
      return res.json({
        success: true,
        data: [],
        message: 'No rooms available for the specified dates'
      });
    }

    // Get hotel content for markup calculation
    const hotelContent = hotelbedsService.getCachedHotel(hotelCode) || {
      code: hotelCode,
      supplierId: 'hotelbeds'
    };

    // Apply GIATA mapping
    const roomsData = availability.rooms.map(room => ({
      name: room.name || 'Standard Room',
      description: room.description || '',
      code: room.code || '',
      maxOccupancy: room.maxOccupancy || parseInt(adults),
      amenities: room.amenities || []
    }));

    const mappedRooms = await giataService.batchMapRooms(roomsData);

    const transformedRooms = availability.rooms.map((room, index) => {
      const mappedRoom = mappedRooms[index] || mappedRooms[0];
      return giataService.transformMappedRoom(room, mappedRoom, room.rates);
    });

    // Apply markup
    const markupResult = markupService.applyMarkup(hotelContent, transformedRooms);

    res.json({
      success: true,
      data: markupResult.markedUpRates,
      markupSummary: markupResult.markupSummary,
      searchParams: {
        hotelCode,
        checkIn,
        checkOut,
        rooms: parseInt(rooms),
        adults: parseInt(adults),
        children: parseInt(children)
      }
    });

  } catch (error) {
    console.error('Room availability error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get room availability',
      details: error.message
    });
  }
});

/**
 * Search destinations
 * GET /api/hotels/destinations/search
 */
router.get('/destinations/search', async (req, res) => {
  try {
    const { q: query } = req.query;

    if (!query || query.length < 2) {
      return res.status(400).json({
        success: false,
        error: 'Query must be at least 2 characters long'
      });
    }

    const destinations = await hotelbedsService.searchDestinations(query);

    const formattedDestinations = destinations.map(dest => ({
      id: dest.code,
      name: dest.name?.content || dest.name,
      type: dest.type || 'city',
      country: dest.countryName?.content || dest.country,
      code: dest.code
    }));

    res.json({
      success: true,
      data: formattedDestinations
    });

  } catch (error) {
    console.error('Destination search error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to search destinations',
      details: error.message
    });
  }
});

/**
 * Sync hotel content for destinations
 * POST /api/hotels/sync
 */
router.post('/sync', async (req, res) => {
  try {
    const { destinationCodes = [], forceSync = false } = req.body;

    if (destinationCodes.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'At least one destination code is required'
      });
    }

    const syncResult = await hotelbedsService.syncHotelContent(destinationCodes, forceSync);

    res.json({
      success: syncResult.success,
      data: syncResult,
      message: syncResult.message || 'Sync completed'
    });

  } catch (error) {
    console.error('Hotel sync error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to sync hotel content',
      details: error.message
    });
  }
});

/**
 * Get cache statistics
 * GET /api/hotels/cache/stats
 */
router.get('/cache/stats', (req, res) => {
  try {
    const hotelbedsStats = hotelbedsService.getCacheStats();
    const giataStats = giataService.getCacheStats();
    const markupStats = markupService.getMarkupStats();

    res.json({
      success: true,
      data: {
        hotelbeds: hotelbedsStats,
        giata: giataStats,
        markup: markupStats
      }
    });

  } catch (error) {
    console.error('Cache stats error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get cache statistics',
      details: error.message
    });
  }
});

/**
 * Clear cache
 * DELETE /api/hotels/cache
 */
router.delete('/cache', (req, res) => {
  try {
    hotelbedsService.clearCache();
    giataService.clearCache();

    res.json({
      success: true,
      message: 'Cache cleared successfully'
    });

  } catch (error) {
    console.error('Clear cache error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to clear cache',
      details: error.message
    });
  }
});

module.exports = router;
