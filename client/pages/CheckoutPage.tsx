import React, { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import RequireAuth from "@/components/RequireAuth";
import { getResumeContext, clearResumeContext, preflightCheckout } from "@/utils/authGuards";
import { useBookingAuthGuard } from "@/utils/enhancedAuthGuards";
import BookingSignInBanner from "@/components/ui/BookingSignInBanner";
import type { Offer } from "@/utils/authGuards";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2, AlertCircle, ShoppingCart } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useCurrency } from "@/contexts/CurrencyContext";

export default function CheckoutPage() {
  return (
    <RequireAuth>
      <CheckoutPageContent />
    </RequireAuth>
  );
}

function CheckoutPageContent() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user, isLoggedIn } = useAuth();
  const { formatPrice } = useCurrency();
  const { showInlineAuth, hideInlineAuth } = useBookingAuthGuard();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [offer, setOffer] = useState<Offer | null>(null);

  useEffect(() => {
    const initializeCheckoutFlow = async () => {
      try {
        const contextId = searchParams.get('ctx');
        
        if (!contextId) {
          setError('No checkout context found. Please start a new booking.');
          return;
        }

        // Get the resume context
        const resumeContext = getResumeContext<Offer>(contextId);
        
        if (!resumeContext) {
          setError('Checkout session expired. Please start a new booking.');
          return;
        }

        if (resumeContext.type !== 'CHECKOUT') {
          setError('Invalid checkout session. Please start a new booking.');
          return;
        }

        // Preflight check - validate offer is still available
        const isValid = await preflightCheckout(resumeContext.payload);
        if (!isValid) {
          setError('This offer is no longer available. Please search again.');
          return;
        }

        // Clear the context since we're now using it
        clearResumeContext(contextId);

        // Set the offer for checkout
        setOffer(resumeContext.payload);

        // Track successful resume
        if (typeof window !== 'undefined' && (window as any).gtag) {
          (window as any).gtag('event', 'checkout_resume_success', {
            event_category: 'checkout',
            event_label: resumeContext.payload.module,
            value: resumeContext.payload.price.amount
          });
        }

      } catch (error) {
        console.error('Failed to initialize checkout flow:', error);
        setError('Failed to initialize checkout session. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    initializeCheckoutFlow();
  }, [searchParams]);

  const handleProceedToBooking = () => {
    if (!offer) return;

    // Navigate to the actual booking flow with the validated offer
    const bookingParams = new URLSearchParams({
      module: offer.module,
      offerId: offer.offerId,
      price: offer.price.amount.toString(),
      currency: offer.price.currency,
      supplier: offer.supplier
    });

    // Add module-specific parameters
    Object.keys(offer).forEach(key => {
      if (!['offerId', 'module', 'supplier', 'price'].includes(key)) {
        const value = (offer as any)[key];
        if (typeof value === 'string' || typeof value === 'number') {
          bookingParams.set(key, value.toString());
        }
      }
    });

    // Navigate to appropriate booking flow
    switch (offer.module) {
      case 'flights':
        navigate(`/booking-flow?${bookingParams.toString()}`);
        break;
      case 'hotels':
        navigate(`/hotels/booking?${bookingParams.toString()}`);
        break;
      case 'sightseeing':
        navigate(`/sightseeing/booking?${bookingParams.toString()}`);
        break;
      case 'transfers':
        navigate(`/transfer-booking?${bookingParams.toString()}`);
        break;
      default:
        navigate(`/booking?${bookingParams.toString()}`);
    }
  };

  const navigateToResults = () => {
    if (!offer) {
      navigate('/');
      return;
    }

    // Navigate back to appropriate results page
    switch (offer.module) {
      case 'flights':
        navigate('/flights');
        break;
      case 'hotels':
        navigate('/hotels');
        break;
      case 'sightseeing':
        navigate('/sightseeing');
        break;
      case 'transfers':
        navigate('/transfers');
        break;
      default:
        navigate('/');
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="text-center">
            <Loader2 className="w-12 h-12 animate-spin mx-auto mb-4 text-blue-600" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Preparing Your Booking
            </h2>
            <p className="text-gray-600">
              Validating availability and pricing...
            </p>
          </div>
        </div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
          <Card className="max-w-md w-full">
            <CardContent className="p-6 text-center">
              <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                Checkout Error
              </h2>
              <p className="text-gray-600 mb-6">
                {error}
              </p>
              <div className="flex flex-col gap-3">
                <Button onClick={() => navigate('/')} className="w-full">
                  Start New Search
                </Button>
                <Button variant="outline" onClick={() => navigate(-1)} className="w-full">
                  Go Back
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </Layout>
    );
  }

  if (!offer) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
          <Card className="max-w-md w-full">
            <CardContent className="p-6 text-center">
              <ShoppingCart className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                No Booking Found
              </h2>
              <p className="text-gray-600 mb-6">
                No booking information available. Please start a new search.
              </p>
              <Button onClick={() => navigate('/')} className="w-full">
                Start New Search
              </Button>
            </CardContent>
          </Card>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-2xl mx-auto px-4">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Ready to Book
            </h1>
            <p className="text-gray-600">
              Your booking is confirmed and ready to proceed
            </p>
          </div>

          {/* Inline Authentication Banner */}
          {!isLoggedIn && (
            <BookingSignInBanner
              onSignInSuccess={() => {
                console.log('User signed in successfully');
                // Optionally refresh the page or update UI
              }}
              dismissible={true}
              onDismiss={hideInlineAuth}
            />
          )}

          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="capitalize">{offer.module} Booking</span>
                <Badge variant="secondary" className="text-xs">
                  {offer.supplier}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Offer Details */}
                <div className="border rounded-lg p-4 bg-gray-50">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <p className="font-medium text-gray-900">
                        {(offer as any).itemName || `${offer.module} booking`}
                      </p>
                      <p className="text-sm text-gray-600">
                        Offer ID: {offer.offerId}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-green-600">
                        {formatPrice(offer.price.amount)}
                      </p>
                      <p className="text-xs text-gray-500">
                        Total price
                      </p>
                    </div>
                  </div>
                  
                  {/* Module-specific details */}
                  {offer.module === 'flights' && (
                    <div className="text-sm text-gray-600 space-y-1">
                      <p>✈️ {(offer as any).from} → {(offer as any).to}</p>
                      <p>🛫 {(offer as any).departureTime} - {(offer as any).arrivalTime}</p>
                      <p>⏱️ Duration: {(offer as any).duration}</p>
                    </div>
                  )}
                  
                  {offer.module === 'hotels' && (
                    <div className="text-sm text-gray-600 space-y-1">
                      <p>🏨 {(offer as any).name}</p>
                      <p>📍 {(offer as any).location}</p>
                      <p>📅 {(offer as any).checkIn} - {(offer as any).checkOut}</p>
                    </div>
                  )}
                  
                  {offer.module === 'sightseeing' && (
                    <div className="text-sm text-gray-600 space-y-1">
                      <p>🎯 {(offer as any).name}</p>
                      <p>📍 {(offer as any).location}</p>
                      <p>📅 {(offer as any).date}</p>
                    </div>
                  )}
                  
                  {offer.module === 'transfers' && (
                    <div className="text-sm text-gray-600 space-y-1">
                      <p>🚗 {(offer as any).pickup} → {(offer as any).dropoff}</p>
                      <p>📅 {(offer as any).date} at {(offer as any).time}</p>
                      <p>👥 {(offer as any).passengers} passengers</p>
                    </div>
                  )}
                </div>

                {/* Price Breakdown */}
                <div className="border rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 mb-3">Price Breakdown</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Base Price</span>
                      <span>{formatPrice(offer.price.base || offer.price.amount)}</span>
                    </div>
                    {offer.price.taxes && (
                      <div className="flex justify-between">
                        <span>Taxes & Fees</span>
                        <span>{formatPrice(offer.price.taxes)}</span>
                      </div>
                    )}
                    <div className="border-t pt-2 flex justify-between font-semibold">
                      <span>Total</span>
                      <span>{formatPrice(offer.price.amount)}</span>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col gap-3 pt-4">
                  <Button 
                    onClick={handleProceedToBooking}
                    className="w-full bg-green-600 hover:bg-green-700 text-white py-3"
                    size="lg"
                  >
                    <ShoppingCart className="w-5 h-5 mr-2" />
                    Proceed to Booking
                  </Button>
                  
                  <Button 
                    variant="outline"
                    onClick={navigateToResults}
                    className="w-full"
                  >
                    Back to Results
                  </Button>
                </div>

                <div className="text-xs text-gray-500 text-center pt-4">
                  🔒 Secure booking protected by SSL encryption
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
}
