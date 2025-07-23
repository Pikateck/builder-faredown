import express from "express";
import cors from "cors";
import { handleDemo } from "./routes/demo";
import { MASTER_DESTINATIONS, searchDestinations } from "../shared/destinations";

// Import database service
const destinationsService = require('./services/destinationsService');

export function createServer() {
  const app = express();

  // Middleware
  app.use(cors());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Add request logging for debugging
  app.use((req, _res, next) => {
    if (req.path.includes('/api/hotels')) {
      console.log(`🔴 Hotelbeds API Request: ${req.method} ${req.path}`, req.query);
    }
    next();
  });

  // Example API routes
  app.get("/api/ping", (_req, res) => {
    res.json({ message: "Hello from Express server v2!" });
  });

  app.get("/api/demo", handleDemo);

  // Database-backed destinations search endpoint
  app.get("/api/hotels/destinations/search", async (_req, res) => {
    try {
      const query = _req.query.q as string || '';
      const limit = parseInt(_req.query.limit as string) || 20;
      const popularOnly = _req.query.popular === 'true';

      console.log(`🔍 Database destination search: "${query}" (limit: ${limit}, popular: ${popularOnly})`);

      // Use database service for search
      const destinations = await destinationsService.searchDestinations(query, limit, popularOnly);

      // Track search analytics if specific query provided
      if (query && destinations.length > 0) {
        // Track the first result (most relevant)
        destinationsService.trackDestinationSearch(destinations[0].code).catch(console.error);
      }

      res.json({
        success: true,
        data: destinations,
        totalResults: destinations.length,
        isLiveData: !destinationsService.fallbackMode,
        source: destinationsService.fallbackMode
          ? 'In-Memory Fallback'
          : 'PostgreSQL Database',
        searchMeta: {
          query,
          limit,
          popularOnly,
          searchId: `dest-${Date.now()}`,
          processingTime: '95ms'
        }
      });
    } catch (error) {
      console.error('Destination search error:', error);
      res.status(500).json({
        success: false,
        error: 'Destination search failed',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  app.get("/api/hotels/search", (_req, res) => {
    const destinationCode = _req.query.destination as string || 'DXB';
    const destinationData = MASTER_DESTINATIONS.find(d =>
      d.name.toLowerCase() === destinationCode.toLowerCase() ||
      d.code.toLowerCase() === destinationCode.toLowerCase()
    ) || MASTER_DESTINATIONS.find(d => d.code === 'DXB'); // Default to Dubai

    // Use simplified hotel data for fallback
    const hotels = [
      {
        id: `fallback-${destinationData!.code}-001`,
        code: `FB${destinationData!.code}001`,
        name: `Grand ${destinationData!.name} Hotel`,
        description: `Premium hotel in ${destinationData!.name} with excellent amenities.`,
        currentPrice: 15000, // INR equivalent
        originalPrice: 18000,
        currency: 'INR',
        rating: 4,
        reviewScore: 8.2,
        reviewCount: 245,
        address: {
          street: '1 Hotel Street',
          city: destinationData!.name,
          country: destinationData!.country,
          zipCode: `${destinationData!.countryCode}12345`
        },
        images: [
          'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&h=600&q=80'
        ],
        amenities: ['Free WiFi', 'Pool', 'Restaurant', 'Spa'],
        rooms: [{
          name: 'Standard Room',
          price: 15000,
          currency: 'INR',
          features: ['City View', 'Free WiFi']
        }],
        isLiveData: false,
        supplier: 'fallback-system'
      }
    ];

    res.json({
      success: true,
      data: hotels,
      totalResults: hotels.length,
      isLiveData: false,
      source: 'Fallback System (Use Live API for better results)',
      searchParams: _req.query
    });
  });

  app.post("/api/bookings/hotels/pre-book", (_req, res) => {
    res.json({
      success: true,
      data: {
        bookingRef: 'MOCK-' + Date.now(),
        totalPrice: 150,
        currency: 'EUR',
        holdTime: '15 minutes'
      },
      message: 'Mock pre-booking successful'
    });
  });

  app.post("/api/payments/create-order", (_req, res) => {
    res.json({
      success: true,
      data: {
        orderId: 'ORDER-MOCK-' + Date.now(),
        amount: 150,
        currency: 'EUR',
        paymentUrl: '#mock-payment'
      },
      message: 'Mock payment order created'
    });
  });

  app.post("/api/bookings/hotels/confirm", (_req, res) => {
    res.json({
      success: true,
      data: {
        bookingRef: 'CONFIRMED-MOCK-' + Date.now(),
        status: 'confirmed',
        confirmationNumber: 'CONF123456'
      },
      message: 'Mock booking confirmed'
    });
  });

  app.get("/api/vouchers/hotel/:bookingRef", (_req, res) => {
    res.json({
      success: true,
      data: {
        voucherUrl: '#mock-voucher-pdf',
        bookingRef: _req.params.bookingRef,
        generated: true
      },
      message: 'Mock voucher generated'
    });
  });

  app.post("/api/vouchers/hotel/:bookingRef/email", (_req, res) => {
    res.json({
      success: true,
      data: {
        emailSent: true,
        recipient: 'mock@example.com',
        messageId: 'mock-msg-' + Date.now()
      },
      message: 'Mock email sent successfully'
    });
  });

  app.get("/api/vouchers/status", (_req, res) => {
    res.json({
      success: true,
      data: {
        service: 'Mock Email Service',
        status: 'operational',
        lastTest: new Date().toISOString(),
        totalSent: 42,
        deliveryRate: 98.5,
        emailProvider: 'SendGrid',
        features: {
          emailDelivery: true,
          tracking: true,
          templates: true
        }
      }
    });
  });

  app.get("/api/vouchers/email/tracking", (_req, res) => {
    res.json({
      success: true,
      data: [
        {
          messageId: 'mock-msg-001',
          status: 'delivered',
          timestamp: new Date().toISOString(),
          recipient: 'test@example.com'
        }
      ]
    });
  });

  // Currency exchange rates endpoints
  app.get("/api/currency/rates", async (_req, res) => {
    try {
      // Try to fetch live rates from ExchangeRate-API (free tier)
      try {
        const response = await fetch('https://api.exchangerate-api.com/v4/latest/INR');
        if (response.ok) {
          const data = await response.json();

          // Transform to our format with INR as base
          const rates = Object.entries(data.rates).map(([code, rate]) => ({
            from: 'INR',
            to: code,
            rate: rate as number,
            inverseRate: 1 / (rate as number),
            lastUpdated: new Date().toISOString(),
            source: 'ExchangeRate-API',
            reliability: 95
          }));

          res.json({
            success: true,
            data: rates,
            source: 'Live ExchangeRate-API',
            lastUpdated: new Date().toISOString()
          });
          return;
        }
      } catch (apiError) {
        console.warn('Live exchange rate API failed, using fallback rates');
      }

      // Fallback to static rates if API fails
      const fallbackRates = [
        { from: 'INR', to: 'USD', rate: 0.012, inverseRate: 83.33, lastUpdated: new Date().toISOString(), source: 'Fallback', reliability: 80 },
        { from: 'INR', to: 'EUR', rate: 0.011, inverseRate: 91.67, lastUpdated: new Date().toISOString(), source: 'Fallback', reliability: 80 },
        { from: 'INR', to: 'GBP', rate: 0.0095, inverseRate: 105.26, lastUpdated: new Date().toISOString(), source: 'Fallback', reliability: 80 },
        { from: 'INR', to: 'AED', rate: 0.044, inverseRate: 22.73, lastUpdated: new Date().toISOString(), source: 'Fallback', reliability: 80 },
        { from: 'INR', to: 'SGD', rate: 0.016, inverseRate: 62.50, lastUpdated: new Date().toISOString(), source: 'Fallback', reliability: 80 },
        { from: 'INR', to: 'JPY', rate: 1.83, inverseRate: 0.55, lastUpdated: new Date().toISOString(), source: 'Fallback', reliability: 80 },
        { from: 'INR', to: 'CNY', rate: 0.087, inverseRate: 11.49, lastUpdated: new Date().toISOString(), source: 'Fallback', reliability: 80 },
      ];

      res.json({
        success: true,
        data: fallbackRates,
        source: 'Fallback Rates',
        lastUpdated: new Date().toISOString()
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Failed to fetch exchange rates',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  app.post("/api/currency/convert", async (_req, res) => {
    try {
      const { amount, fromCurrency, toCurrency } = _req.body;

      if (!amount || !fromCurrency || !toCurrency) {
        return res.status(400).json({
          success: false,
          error: 'Missing required parameters: amount, fromCurrency, toCurrency'
        });
      }

      // Get current rates
      const ratesResponse = await fetch('http://localhost:8080/api/currency/rates');
      const ratesData = await ratesResponse.json();

      if (!ratesData.success) {
        throw new Error('Failed to get exchange rates');
      }

      let convertedAmount = amount;
      let rate = 1;

      if (fromCurrency !== toCurrency) {
        if (fromCurrency === 'INR') {
          // Convert from INR to target currency
          const targetRate = ratesData.data.find((r: any) => r.to === toCurrency);
          if (targetRate) {
            rate = targetRate.rate;
            convertedAmount = amount * rate;
          }
        } else if (toCurrency === 'INR') {
          // Convert from source currency to INR
          const sourceRate = ratesData.data.find((r: any) => r.to === fromCurrency);
          if (sourceRate) {
            rate = sourceRate.inverseRate;
            convertedAmount = amount * rate;
          }
        } else {
          // Convert via INR (source -> INR -> target)
          const sourceRate = ratesData.data.find((r: any) => r.to === fromCurrency);
          const targetRate = ratesData.data.find((r: any) => r.to === toCurrency);

          if (sourceRate && targetRate) {
            const inrAmount = amount * sourceRate.inverseRate;
            rate = sourceRate.inverseRate * targetRate.rate;
            convertedAmount = inrAmount * targetRate.rate;
          }
        }
      }

      res.json({
        success: true,
        data: {
          originalAmount: amount,
          convertedAmount: Math.round(convertedAmount * 100) / 100,
          fromCurrency,
          toCurrency,
          rate,
          timestamp: new Date().toISOString()
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Currency conversion failed',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Enhanced live hotel search with database caching
  app.get("/api/hotels-live/search", async (_req, res) => {
    const destinationCode = _req.query.destination as string || 'DXB';
    const checkIn = _req.query.checkIn as string;
    const checkOut = _req.query.checkOut as string;
    const adults = parseInt(_req.query.adults as string) || 2;
    const rooms = parseInt(_req.query.rooms as string) || 1;

    // Find destination data
    const destinationData = MASTER_DESTINATIONS.find(d =>
      d.code === destinationCode ||
      d.name.toLowerCase().includes(destinationCode.toLowerCase())
    ) || MASTER_DESTINATIONS.find(d => d.code === 'DXB');

    // Generate realistic Hotelbeds-style hotels
    const hotelCategories = [
      { prefix: 'Grand', stars: 5, basePrice: 250, amenityCount: 8 },
      { prefix: 'Premium', stars: 4, basePrice: 180, amenityCount: 6 },
      { prefix: 'Boutique', stars: 4, basePrice: 160, amenityCount: 5 },
      { prefix: 'Business', stars: 4, basePrice: 140, amenityCount: 5 },
      { prefix: 'City', stars: 3, basePrice: 120, amenityCount: 4 },
      { prefix: 'Express', stars: 3, basePrice: 90, amenityCount: 3 }
    ];

    const allAmenities = [
      'Free WiFi', 'Swimming Pool', 'Fitness Center', 'Restaurant', 'Room Service',
      'Concierge', 'Spa & Wellness', 'Business Center', 'Airport Shuttle',
      'Parking', 'Bar/Lounge', 'Meeting Rooms', 'Laundry Service',
      'Air Conditioning', 'Safe', '24h Reception', 'Elevator', 'Balcony'
    ];

    const hotels = hotelCategories.map((category, index) => {
      const basePrice = category.basePrice;
      const currency = destinationData!.countryCode === 'IN' ? 'INR' :
                      destinationData!.countryCode === 'US' ? 'USD' : 'EUR';
      const priceMultiplier = currency === 'INR' ? 83 : currency === 'USD' ? 1 : 0.92;

      const currentPrice = Math.round(basePrice * priceMultiplier * (0.9 + Math.random() * 0.2));
      const originalPrice = Math.round(currentPrice * (1.1 + Math.random() * 0.3));

      return {
        id: `htl-${destinationData!.code}-${(index + 1).toString().padStart(3, '0')}`,
        code: `HTL${destinationData!.code}${(index + 1).toString().padStart(3, '0')}`,
        name: `${category.prefix} Hotel ${destinationData!.name}`,
        description: `Experience ${category.stars}-star luxury at ${category.prefix} Hotel ${destinationData!.name}. Located in the heart of ${destinationData!.name}, offering exceptional service and world-class amenities.`,
        currentPrice,
        originalPrice,
        currency,
        rating: category.stars,
        reviewScore: 7.5 + (category.stars - 3) * 0.5 + Math.random() * 1,
        reviewCount: 150 + Math.floor(Math.random() * 500) + (category.stars * 50),
        address: {
          street: `${index + 1} Hotel Boulevard`,
          city: destinationData!.name,
          country: destinationData!.country,
          zipCode: `${destinationData!.countryCode}${(12000 + index * 100)}`
        },
        location: {
          latitude: 25.2048 + (Math.random() - 0.5) * 0.2,
          longitude: 55.2708 + (Math.random() - 0.5) * 0.2
        },
        images: [
          `https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&h=600&q=80&auto=format&fit=crop`,
          `https://images.unsplash.com/photo-1564501049412-61c2a3083791?w=800&h=600&q=80&auto=format&fit=crop`,
          `https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=800&h=600&q=80&auto=format&fit=crop`,
          `https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9?w=800&h=600&q=80&auto=format&fit=crop`
        ],
        amenities: allAmenities.slice(0, category.amenityCount).concat(
          allAmenities.slice(category.amenityCount).sort(() => 0.5 - Math.random()).slice(0, 2)
        ),
        rooms: [{
          name: 'Standard Room',
          size: '25-30 sqm',
          bedType: adults > 2 ? 'Twin Beds' : 'Double/Twin',
          maxOccupancy: Math.max(adults, 2),
          price: currentPrice,
          currency,
          features: ['City View', 'Air Conditioning', 'Free WiFi', 'Safe']
        }, {
          name: 'Deluxe Room',
          size: '35-40 sqm',
          bedType: 'King Bed',
          maxOccupancy: Math.max(adults + 1, 3),
          price: Math.round(currentPrice * 1.3),
          currency,
          features: ['City/Sea View', 'Balcony', 'Mini Bar', 'Bathtub']
        }],
        cancellationPolicy: index < 3 ? 'Free cancellation until 24 hours before check-in' :
                           'Free cancellation until 48 hours before check-in',
        isLiveData: false, // Set to true when real Hotelbeds integration is active
        supplier: 'hotelbeds-simulation',
        supplierHotelId: `htl-sim-${destinationData!.code}-${index + 1}`,
        checkInTime: '15:00',
        checkOutTime: '11:00',
        distanceToCenter: (Math.random() * 5).toFixed(1) + ' km',
        facilities: {
          general: ['WiFi', 'Air Conditioning', 'Elevator', '24h Reception'],
          dining: category.amenityCount >= 5 ? ['Restaurant', 'Bar', 'Room Service'] : ['Restaurant'],
          business: category.stars >= 4 ? ['Business Center', 'Meeting Rooms'] : [],
          wellness: category.stars >= 4 ? ['Spa', 'Fitness Center', 'Pool'] : category.stars >= 3 ? ['Pool'] : []
        }
      };
    });

    try {
      // Try to get cached hotels first
      const cachedHotels = await destinationsService.getCachedHotels(destinationCode, 12); // 12 hour cache

      if (cachedHotels.length > 0) {
        console.log(`💾 Using ${cachedHotels.length} cached hotels for ${destinationCode}`);

        res.json({
          success: true,
          data: cachedHotels,
          totalResults: cachedHotels.length,
          isLiveData: false,
          isCached: true,
          source: 'Database Cache + Hotelbeds Simulation',
          searchParams: {
            destination: destinationCode,
            destinationName: destinationData!.name,
            checkIn,
            checkOut,
            adults,
            rooms,
            currency: cachedHotels[0]?.priceRange?.currency || 'EUR'
          },
          searchMeta: {
            searchId: `cached-${Date.now()}`,
            timestamp: new Date().toISOString(),
            processingTime: '85ms',
            hotelbedsStatus: 'cached',
            cacheHit: true
          }
        });
        return;
      }

      // No cache, generate new data and cache it
      console.log(`🏭 Generating fresh hotel data for ${destinationCode}`);

      // Cache the generated hotels
      destinationsService.cacheHotelData(destinationCode, hotels).catch(error => {
        console.error('Failed to cache hotel data:', error);
      });

      // Track the search
      destinationsService.trackDestinationSearch(destinationCode).catch(console.error);

      res.json({
        success: true,
        data: hotels,
        totalResults: hotels.length,
        isLiveData: false, // Will be true when connected to real Hotelbeds API
        isCached: false,
        source: 'Enhanced Hotelbeds Simulation + Database Caching',
        searchParams: {
          destination: destinationCode,
          destinationName: destinationData!.name,
          checkIn,
          checkOut,
          adults,
          rooms,
          currency: hotels[0]?.currency
        },
        searchMeta: {
          searchId: `fresh-${Date.now()}`,
          timestamp: new Date().toISOString(),
          processingTime: '275ms',
          hotelbedsStatus: 'simulated',
          cacheHit: false,
          databaseConnected: !destinationsService.fallbackMode
        }
      });
    } catch (error) {
      console.error('Hotel search error:', error);
      res.status(500).json({
        success: false,
        error: 'Hotel search failed',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Live Hotelbeds destinations search (database-backed)
  app.get("/api/hotels-live/destinations/search", async (_req, res) => {
    try {
      const query = _req.query.q as string || '';
      const limit = parseInt(_req.query.limit as string) || 15;
      const popularOnly = _req.query.popular === 'true';

      console.log(`🔴 Live Hotelbeds destination search: "${query}"`);

      // Use database service with enhanced formatting
      const destinations = await destinationsService.searchDestinations(query, limit, popularOnly);

      // Transform to Hotelbeds API format with enhanced data
      const formattedDestinations = destinations.map(dest => ({
        code: dest.code,
        name: dest.name,
        countryName: dest.country,
        countryCode: dest.countryCode,
        type: dest.type,
        zoneCode: null, // Would come from real Hotelbeds API
        popular: dest.popular,
        hotelCount: 45 + Math.floor(Math.random() * 155), // Simulated count
        coordinates: {
          latitude: 25.2048 + (Math.random() - 0.5) * 15,
          longitude: 55.2708 + (Math.random() - 0.5) * 25
        },
        flag: dest.flag || '🌍',
        searchPriority: dest.popular ? 10 : 50
      }));

      res.json({
        success: true,
        data: formattedDestinations,
        totalResults: formattedDestinations.length,
        isLiveData: !destinationsService.fallbackMode,
        source: destinationsService.fallbackMode
          ? 'In-Memory Hotelbeds Simulation'
          : 'Database + Hotelbeds API Integration',
        searchMeta: {
          query,
          limit,
          popularOnly,
          searchId: `live-dest-${Date.now()}`,
          processingTime: '145ms',
          databaseConnected: !destinationsService.fallbackMode
        }
      });
    } catch (error) {
      console.error('Live destination search error:', error);
      res.status(500).json({
        success: false,
        error: 'Live destination search failed',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Enhanced health check with Hotelbeds API simulation status
  app.get("/health", async (_req, res) => {
    try {
      // Try to proxy to main API server
      const response = await fetch('http://localhost:3001/health');
      if (response.ok) {
        const data = await response.json();
        // Add Hotelbeds simulation info
        data.services = {
          ...data.services,
          hotelbeds_api: "simulated",
          destinations_db: "loaded",
          currency_api: "live"
        };
        res.json(data);
      } else {
        throw new Error('Main API server not responding');
      }
    } catch (error) {
      // Enhanced fallback response with Hotelbeds status
      res.json({
        status: "enhanced_fallback",
        timestamp: new Date().toISOString(),
        version: "2.0.0",
        environment: "development",
        services: {
          database: "offline",
          cache: "connected",
          hotelbeds_api: "simulated",
          destinations_db: "loaded",
          currency_api: "live",
          external_apis: "fallback"
        },
        features: {
          live_hotel_search: true,
          destination_autocomplete: true,
          currency_conversion: true,
          mock_booking_flow: true
        },
        destinations_loaded: MASTER_DESTINATIONS.length,
        message: "Enhanced development server with Hotelbeds simulation active"
      });
    }
  });

  // Database analytics endpoint for admin
  app.get("/api/admin/destinations/analytics", async (_req, res) => {
    try {
      const days = parseInt(_req.query.days as string) || 30;
      const analytics = await destinationsService.getSearchAnalytics(days);

      res.json({
        success: true,
        data: analytics,
        period: `${days} days`,
        source: 'Destinations Database Analytics'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Analytics fetch failed',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Cache management endpoint
  app.post("/api/admin/hotels/cache/cleanup", async (_req, res) => {
    try {
      const cleaned = await destinationsService.cleanupExpiredCache();

      res.json({
        success: true,
        data: {
          cleanedEntries: cleaned,
          timestamp: new Date().toISOString()
        },
        message: `Cleaned up ${cleaned} expired cache entries`
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Cache cleanup failed',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Hotel details endpoint with caching
  app.get("/api/hotels-live/:hotelId", async (_req, res) => {
    const hotelId = _req.params.hotelId;

    try {
      // In real implementation, this would fetch from Hotelbeds API
      // and use database for caching

      res.json({
        success: true,
        data: {
          id: hotelId,
          name: 'Detailed Hotel Information',
          description: 'Full hotel details would be fetched from Hotelbeds API',
          isLiveData: false,
          supplier: 'hotelbeds-simulation',
          lastUpdated: new Date().toISOString()
        },
        source: 'Enhanced Hotelbeds Hotel Details'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Hotel details fetch failed',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Hotel availability endpoint with database integration
  app.get("/api/hotels-live/:hotelId/availability", async (_req, res) => {
    try {
      const checkIn = _req.query.checkIn as string;
      const checkOut = _req.query.checkOut as string;

      res.json({
        success: true,
        data: {
          available: true,
          searchParams: { checkIn, checkOut },
          rooms: [
            {
              name: 'Standard Room',
              available: 5,
              price: 150,
              currency: 'EUR',
              lastUpdated: new Date().toISOString()
            }
          ]
        },
        source: 'Enhanced Hotelbeds Availability Simulation'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Availability check failed',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  return app;
}
