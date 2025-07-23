import express from "express";
import cors from "cors";
import { handleDemo } from "./routes/demo";
import { MASTER_DESTINATIONS, searchDestinations } from "../shared/destinations";

export function createServer() {
  const app = express();

  // Middleware
  app.use(cors());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Example API routes
  app.get("/api/ping", (_req, res) => {
    res.json({ message: "Hello from Express server v2!" });
  });

  app.get("/api/demo", handleDemo);

  // Mock hotel endpoints for production testing
  app.get("/api/hotels/destinations/search", (_req, res) => {
    const query = _req.query.q as string || '';
    const destinations = query ? searchDestinations(query) : MASTER_DESTINATIONS.filter(d => d.popular);

    // Transform to expected format
    const formattedDestinations = destinations.map(dest => ({
      id: dest.code,
      code: dest.code,
      name: dest.name,
      type: dest.type,
      country: dest.country,
      countryCode: dest.countryCode
    }));

    res.json({
      success: true,
      data: formattedDestinations,
      isLiveData: false,
      source: 'Master Destinations Database'
    });
  });

  app.get("/api/hotels/search", (_req, res) => {
    const destination = _req.query.destination as string || 'Dubai';
    const destinationData = MASTER_DESTINATIONS.find(d =>
      d.name.toLowerCase() === destination.toLowerCase() ||
      d.code.toLowerCase() === destination.toLowerCase()
    ) || MASTER_DESTINATIONS.find(d => d.code === 'DXB'); // Default to Dubai

    // Generate realistic hotels for the destination
    const hotelNames = [
      `Grand ${destinationData!.name} Hotel`,
      `${destinationData!.name} Luxury Resort`,
      `Premium Inn ${destinationData!.name}`,
      `${destinationData!.name} Business Hotel`,
      `Boutique Hotel ${destinationData!.name}`,
      `${destinationData!.name} City Center`,
    ];

    const hotels = hotelNames.map((name, index) => ({
      id: `hotel-${destinationData!.code}-${index + 1}`,
      code: `HTL${destinationData!.code}${(index + 1).toString().padStart(3, '0')}`,
      name,
      description: `Experience luxury and comfort at ${name}, located in the heart of ${destinationData!.name}.`,
      currentPrice: 120 + (index * 30) + Math.floor(Math.random() * 50),
      originalPrice: 150 + (index * 35) + Math.floor(Math.random() * 60),
      currency: destinationData!.countryCode === 'IN' ? 'INR' :
                destinationData!.countryCode === 'US' ? 'USD' : 'EUR',
      rating: 3 + Math.floor(Math.random() * 3), // 3-5 stars
      reviewScore: 7.5 + Math.random() * 2, // 7.5-9.5
      reviewCount: 150 + Math.floor(Math.random() * 500),
      address: {
        street: `${index + 1} Hotel Street`,
        city: destinationData!.name,
        country: destinationData!.country,
        zipCode: `${destinationData!.countryCode}${(12345 + index)}`
      },
      location: {
        latitude: 25.2048 + (Math.random() - 0.5) * 0.1,
        longitude: 55.2708 + (Math.random() - 0.5) * 0.1
      },
      images: [
        `https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&h=600&q=80`,
        `https://images.unsplash.com/photo-1564501049412-61c2a3083791?w=800&h=600&q=80`,
        `https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=800&h=600&q=80`
      ],
      amenities: [
        'Free WiFi', 'Swimming Pool', 'Fitness Center', 'Restaurant',
        'Room Service', 'Concierge', 'Spa', 'Business Center'
      ].slice(0, 4 + Math.floor(Math.random() * 4)),
      rooms: [{
        name: 'Standard Room',
        size: '25 sqm',
        bedType: 'Double',
        maxOccupancy: 2,
        price: 120 + (index * 30),
        currency: destinationData!.countryCode === 'IN' ? 'INR' :
                  destinationData!.countryCode === 'US' ? 'USD' : 'EUR'
      }],
      cancellationPolicy: 'Free cancellation until 24 hours before check-in',
      isLiveData: false,
      supplier: 'mock-hotelbeds',
      supplierHotelId: `mock-${destinationData!.code}-${index + 1}`
    }));

    res.json({
      success: true,
      data: hotels.slice(0, 4), // Return 4 hotels
      totalResults: hotels.length,
      isLiveData: false,
      source: 'Master Destinations Database',
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

  app.get("/api/hotels-live/search", (_req, res) => {
    const destination = _req.query.destination as string || 'Unknown';
    res.json({
      success: true,
      data: [
        {
          id: 'mock-hotel-001',
          name: `Mock Hotel ${destination}`,
          currentPrice: 125,
          currency: 'EUR',
          rating: 4,
          address: { city: destination, country: 'Mock Country' },
          isLiveData: false,
          supplier: 'mock-hotelbeds',
          images: ['https://images.unsplash.com/photo-1566073771259-6a8506099945?w=400'],
          amenities: ['WiFi', 'Pool', 'Restaurant', 'Spa']
        },
        {
          id: 'mock-hotel-002',
          name: `Premium Hotel ${destination}`,
          currentPrice: 185,
          currency: 'EUR',
          rating: 5,
          address: { city: destination, country: 'Mock Country' },
          isLiveData: false,
          supplier: 'mock-hotelbeds',
          images: ['https://images.unsplash.com/photo-1564501049412-61c2a3083791?w=400'],
          amenities: ['WiFi', 'Pool', 'Restaurant', 'Spa', 'Gym', 'Concierge']
        }
      ],
      totalResults: 2,
      isLiveData: false,
      source: 'Production Mock Data (Hotelbeds Simulation)',
      searchParams: _req.query
    });
  });

  app.get("/api/hotels-live/destinations/search", (_req, res) => {
    const query = _req.query.q as string || '';
    const destinations = query ? searchDestinations(query) : MASTER_DESTINATIONS.filter(d => d.popular);

    // Transform to Hotelbeds format
    const formattedDestinations = destinations.map(dest => ({
      code: dest.code,
      name: dest.name,
      countryName: dest.country,
      type: 'destination',
      popular: dest.popular
    }));

    res.json({
      success: true,
      data: formattedDestinations,
      isLiveData: false,
      source: 'Master Destinations Database (Hotelbeds Format)'
    });
  });

  // Proxy health check to main API server or provide fallback
  app.get("/health", async (_req, res) => {
    try {
      // Try to proxy to main API server
      const response = await fetch('http://localhost:3001/health');
      if (response.ok) {
        const data = await response.json();
        res.json(data);
      } else {
        throw new Error('Main API server not responding');
      }
    } catch (error) {
      // Fallback response when main API server is not available
      res.json({
        status: "fallback",
        timestamp: new Date().toISOString(),
        version: "1.0.0",
        environment: "development",
        services: {
          database: "offline",
          cache: "connected",
          external_apis: "fallback",
        },
        message: "Main API server not available, using development fallback"
      });
    }
  });

  return app;
}
