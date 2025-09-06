/**
 * FlightResults.tsx - PRICING INTEGRATION EXAMPLE
 * Shows how to replace hardcoded pricing with centralized pricing API
 */

import React, { useState, useEffect, useCallback } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useDateContext } from "@/contexts/DateContext";
import { useBooking } from "@/contexts/BookingContext";

// ✨ NEW: Import pricing utilities
import { 
  pricingApi, 
  startNewJourney, 
  createPricingParams,
  type PricingQuoteResult 
} from "@/utils/pricingApi";

// ... other existing imports ...

interface FlightPricing {
  [flightId: string]: PricingQuoteResult | null;
}

export default function FlightResults() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  // ✨ NEW: Pricing state management
  const [flightPricing, setFlightPricing] = useState<FlightPricing>({});
  const [pricingLoading, setPricingLoading] = useState<Record<string, boolean>>({});
  const [pricingErrors, setPricingErrors] = useState<Record<string, string>>({});

  // Existing state...
  const [flights, setFlights] = useState([]);
  const [loading, setLoading] = useState(true);

  // ✨ NEW: Initialize journey when component mounts
  useEffect(() => {
    console.log('🚀 Starting new pricing journey for flight search');
    startNewJourney();
  }, []);

  // ✨ NEW: Calculate pricing for a single flight
  const calculateFlightPricing = useCallback(async (flight: any) => {
    const flightId = flight.id;
    
    // Skip if already calculating
    if (pricingLoading[flightId]) return;
    
    setPricingLoading(prev => ({ ...prev, [flightId]: true }));
    setPricingErrors(prev => ({ ...prev, [flightId]: '' }));

    try {
      // Extract search parameters
      const origin = searchParams.get('from') || flight.from;
      const destination = searchParams.get('to') || flight.to;
      const cabinClass = searchParams.get('class') || flight.class || 'Y';
      
      // Create pricing parameters
      const pricingParams = createPricingParams('air', {
        origin,
        destination,
        class: cabinClass,
        airline: flight.airline,
        currency: 'INR'
      }, flight.basePrice || flight.price?.breakdown?.baseFare || 20000, {
        extras: {
          pax: parseInt(searchParams.get('adults') || '1'),
          promoCode: searchParams.get('promo') || undefined
        }
      });

      // 🎯 CALL NEW PRICING API
      const quote = await pricingApi.searchResults(pricingParams);
      
      console.log(`💰 Pricing calculated for flight ${flightId}:`, quote);
      
      setFlightPricing(prev => ({
        ...prev,
        [flightId]: quote
      }));
      
    } catch (error) {
      console.error(`❌ Pricing failed for flight ${flightId}:`, error);
      
      setPricingErrors(prev => ({
        ...prev,
        [flightId]: error.message || 'Pricing calculation failed'
      }));
      
      // 🛡️ FALLBACK: Use existing hardcoded pricing structure
      setFlightPricing(prev => ({
        ...prev,
        [flightId]: {
          baseFare: flight.basePrice || 20000,
          markup: (flight.basePrice || 20000) * 0.05,
          discount: 0,
          tax: (flight.basePrice || 20000) * 0.12,
          totalFare: (flight.basePrice || 20000) * 1.17,
          taxableAmount: flight.basePrice || 20000,
          currency: 'INR'
        }
      }));
      
    } finally {
      setPricingLoading(prev => ({ ...prev, [flightId]: false }));
    }
  }, [searchParams, pricingLoading]);

  // ✨ NEW: Batch calculate pricing for all flights
  const calculateAllFlightPricing = useCallback(async (flightList: any[]) => {
    console.log(`🔄 Calculating pricing for ${flightList.length} flights`);
    
    // Process in batches to avoid overwhelming the API
    const batchSize = 5;
    const batches = [];
    
    for (let i = 0; i < flightList.length; i += batchSize) {
      batches.push(flightList.slice(i, i + batchSize));
    }
    
    for (const batch of batches) {
      await Promise.all(
        batch.map(flight => calculateFlightPricing(flight))
      );
      
      // Small delay between batches
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    console.log('✅ All flight pricing calculations completed');
  }, [calculateFlightPricing]);

  // Modified flight loading logic
  useEffect(() => {
    const loadFlights = async () => {
      setLoading(true);
      
      try {
        // ... existing flight loading logic ...
        const flightData = await flightsService.searchFlights({
          from: searchParams.get('from'),
          to: searchParams.get('to'),
          // ... other params
        });
        
        setFlights(flightData);
        
        // ✨ NEW: Calculate pricing after flights are loaded
        await calculateAllFlightPricing(flightData);
        
      } catch (error) {
        console.error('Failed to load flights:', error);
      } finally {
        setLoading(false);
      }
    };
    
    loadFlights();
  }, [searchParams, calculateAllFlightPricing]);

  // ✨ NEW: Helper to get pricing for a flight
  const getFlightPricing = (flightId: string) => {
    const pricing = flightPricing[flightId];
    const loading = pricingLoading[flightId];
    const error = pricingErrors[flightId];
    
    return { pricing, loading, error };
  };

  // ✨ NEW: Handle bargain button click with pricing context
  const handleBargainClick = async (flight: any) => {
    const { pricing } = getFlightPricing(flight.id);
    
    if (!pricing) {
      console.warn('⚠️ No pricing data available for bargain');
      return;
    }
    
    // Pass current pricing to bargain modal
    setSelectedFlight({
      ...flight,
      currentPricing: pricing
    });
    
    setBargainModalOpen(true);
  };

  // ✨ NEW: Pricing display component
  const FlightPricingDisplay = ({ flight }: { flight: any }) => {
    const { pricing, loading, error } = getFlightPricing(flight.id);
    
    if (loading) {
      return (
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-20"></div>
        </div>
      );
    }
    
    if (error) {
      return (
        <div className="text-amber-600">
          <div className="text-lg font-bold">
            ₹{(flight.basePrice || 25000).toLocaleString()}
          </div>
          <div className="text-xs">Estimated price</div>
        </div>
      );
    }
    
    if (!pricing) {
      return (
        <div className="text-gray-500">
          <div className="text-lg font-bold">Price loading...</div>
        </div>
      );
    }
    
    return (
      <div className="space-y-1">
        <div className="text-lg font-bold text-gray-900">
          ₹{Math.round(pricing.totalFare).toLocaleString()}
        </div>
        
        {/* Show breakdown if available */}
        {pricing.breakdown && (
          <div className="text-xs text-gray-500">
            Base: ₹{Math.round(pricing.baseFare).toLocaleString()}
            {pricing.markup > 0 && ` + Markup: ₹${Math.round(pricing.markup)}`}
            {pricing.discount > 0 && ` - Discount: ₹${Math.round(pricing.discount)}`}
            {pricing.tax > 0 && ` + Tax: ₹${Math.round(pricing.tax)}`}
          </div>
        )}
        
        {/* Show if this is live pricing */}
        <div className="text-xs text-green-600">
          🔄 Live pricing
        </div>
      </div>
    );
  };

  // Rest of your existing component logic...
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      {/* Flight Results */}
      <div className="container mx-auto px-4 py-6">
        
        {/* Results List */}
        {flights.map((flight, index) => (
          <div key={flight.id} className="bg-white rounded-lg shadow-md p-6 mb-4">
            
            {/* Flight Info */}
            <div className="flex justify-between items-center">
              
              {/* Left side - Flight details */}
              <div className="flex-1">
                {/* Existing flight info display */}
                <div className="flex items-center space-x-4">
                  <img 
                    src={flight.airlineLogo} 
                    alt={flight.airline}
                    className="w-8 h-8"
                  />
                  <div>
                    <div className="font-semibold">{flight.airline}</div>
                    <div className="text-sm text-gray-500">{flight.flightNumber}</div>
                  </div>
                </div>
                
                {/* Route and timing */}
                <div className="mt-4 flex items-center space-x-6">
                  <div className="text-center">
                    <div className="font-bold text-lg">{flight.departureTime}</div>
                    <div className="text-sm text-gray-500">{flight.from}</div>
                  </div>
                  
                  <div className="flex-1 text-center">
                    <div className="text-sm text-gray-500">{flight.duration}</div>
                    <div className="border-b border-gray-300 my-1"></div>
                    <div className="text-xs text-gray-400">
                      {flight.stops === 0 ? 'Non-stop' : `${flight.stops} stop${flight.stops > 1 ? 's' : ''}`}
                    </div>
                  </div>
                  
                  <div className="text-center">
                    <div className="font-bold text-lg">{flight.arrivalTime}</div>
                    <div className="text-sm text-gray-500">{flight.to}</div>
                  </div>
                </div>
              </div>
              
              {/* Right side - Pricing and actions */}
              <div className="ml-8 text-right space-y-3">
                
                {/* ✨ NEW: Dynamic pricing display */}
                <FlightPricingDisplay flight={flight} />
                
                {/* Action buttons */}
                <div className="space-y-2">
                  <Button
                    onClick={() => handleBargainClick(flight)}
                    className="w-full bg-green-600 hover:bg-green-700"
                    disabled={pricingLoading[flight.id]}
                  >
                    {pricingLoading[flight.id] ? 'Loading...' : '🤝 Bargain'}
                  </Button>
                  
                  <Button
                    onClick={() => handleBookNow(flight)}
                    variant="outline"
                    className="w-full"
                    disabled={pricingLoading[flight.id]}
                  >
                    Book Now
                  </Button>
                </div>
              </div>
            </div>
          </div>
        ))}
        
        {/* Loading state */}
        {loading && (
          <div className="text-center py-8">
            <div className="text-lg">Finding best flights and calculating live pricing...</div>
            <div className="text-sm text-gray-500 mt-2">
              Using AI-powered pricing engine for accurate quotes
            </div>
          </div>
        )}
      </div>
      
      {/* Existing bargain modal */}
      {selectedFlight && (
        <ConversationalBargainModal
          isOpen={bargainModalOpen}
          onClose={() => setBargainModalOpen(false)}
          flight={selectedFlight}
          // ✨ NEW: Pass current pricing context
          currentPricing={selectedFlight.currentPricing}
        />
      )}
    </div>
  );
}
