import express from "express";
import cors from "cors";
import { handleDemo } from "./routes/demo";

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
    const mockDestinations = [
      { id: 'DXB', name: 'Dubai', type: 'city', country: 'United Arab Emirates', code: 'DXB' },
      { id: 'BCN', name: 'Barcelona', type: 'city', country: 'Spain', code: 'BCN' },
      { id: 'MAD', name: 'Madrid', type: 'city', country: 'Spain', code: 'MAD' },
      { id: 'NYC', name: 'New York', type: 'city', country: 'United States', code: 'NYC' },
      { id: 'LON', name: 'London', type: 'city', country: 'United Kingdom', code: 'LON' }
    ].filter(dest => dest.name.toLowerCase().includes(query.toLowerCase()));

    res.json({
      success: true,
      data: mockDestinations,
      isLiveData: false,
      source: 'Production Mock Data'
    });
  });

  app.get("/api/hotels/search", (_req, res) => {
    res.json({
      success: true,
      data: [
        {
          id: 'hotel-001',
          name: 'Mock Hotel Barcelona',
          currentPrice: 150,
          currency: 'EUR',
          rating: 4,
          address: { city: 'Barcelona', country: 'Spain' },
          isLiveData: false,
          supplier: 'mock'
        }
      ],
      totalResults: 1,
      isLiveData: false,
      source: 'Production Mock Data'
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
        deliveryRate: 98.5
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
    const mockDestinations = [
      { code: 'BCN', name: 'Barcelona', countryName: 'Spain', type: 'destination' },
      { code: 'MAD', name: 'Madrid', countryName: 'Spain', type: 'destination' },
      { code: 'PMI', name: 'Palma', countryName: 'Spain', type: 'destination' },
      { code: 'DXB', name: 'Dubai', countryName: 'UAE', type: 'destination' },
      { code: 'NYC', name: 'New York', countryName: 'USA', type: 'destination' }
    ].filter(dest => dest.name.toLowerCase().includes(query.toLowerCase()));

    res.json({
      success: true,
      data: mockDestinations,
      isLiveData: false,
      source: 'Production Mock Data'
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
