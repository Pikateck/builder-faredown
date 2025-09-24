import React, { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import RequireAuth from "@/components/RequireAuth";
import ConversationalBargainModal from "@/components/ConversationalBargainModal";
import { getResumeContext, clearResumeContext, preflightBargain } from "@/utils/authGuards";
import type { SearchContext } from "@/utils/authGuards";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2, AlertCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function BargainPage() {
  return (
    <RequireAuth>
      <BargainPageContent />
    </RequireAuth>
  );
}

function BargainPageContent() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchContext, setSearchContext] = useState<SearchContext | null>(null);
  const [isBargainModalOpen, setIsBargainModalOpen] = useState(false);

  useEffect(() => {
    const initializeBargainFlow = async () => {
      try {
        const contextId = searchParams.get('ctx');
        
        if (!contextId) {
          setError('No bargain context found. Please start a new search.');
          return;
        }

        // Get the resume context
        const resumeContext = getResumeContext<SearchContext>(contextId);
        
        if (!resumeContext) {
          setError('Bargain session expired. Please start a new search.');
          return;
        }

        if (resumeContext.type !== 'BARGAIN') {
          setError('Invalid bargain session. Please start a new search.');
          return;
        }

        // Preflight check - validate search context is still valid
        const isValid = await preflightBargain(resumeContext.payload);
        if (!isValid) {
          setError('Search results are no longer available. Please start a new search.');
          return;
        }

        // Clear the context since we're now using it
        clearResumeContext(contextId);

        // Set the search context and open bargain modal
        setSearchContext(resumeContext.payload);
        setIsBargainModalOpen(true);

        // Track successful resume
        if (typeof window !== 'undefined' && (window as any).gtag) {
          (window as any).gtag('event', 'bargain_resume_success', {
            event_category: 'bargain',
            event_label: resumeContext.payload.module
          });
        }

      } catch (error) {
        console.error('Failed to initialize bargain flow:', error);
        setError('Failed to initialize bargain session. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    initializeBargainFlow();
  }, [searchParams]);

  const handleBargainClose = () => {
    setIsBargainModalOpen(false);
    // Navigate back to search results
    navigateToResults();
  };

  const handleBargainSuccess = (finalPrice: number, orderRef: string) => {
    setIsBargainModalOpen(false);
    
    // Track bargain success
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', 'bargain_success', {
        event_category: 'bargain',
        event_label: searchContext?.module,
        value: finalPrice
      });
    }

    // Navigate to booking with bargained price
    const bookingParams = new URLSearchParams({
      module: searchContext?.module || 'flights',
      bargainApplied: 'true',
      bargainPrice: finalPrice.toString(),
      orderRef
    });

    navigate(`/booking?${bookingParams.toString()}`);
  };

  const navigateToResults = () => {
    if (!searchContext) {
      navigate('/');
      return;
    }

    // Navigate back to appropriate results page
    switch (searchContext.module) {
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
              Initializing AI Bargain Engine
            </h2>
            <p className="text-gray-600">
              Preparing your personalized bargaining session...
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
                Bargain Session Error
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

  return (
    <Layout>
      <div className="min-h-screen bg-gray-50">
        {/* Bargain Modal */}
        {searchContext && (
          <ConversationalBargainModal
            isOpen={isBargainModalOpen}
            onClose={handleBargainClose}
            onAccept={handleBargainSuccess}
            onHold={(orderRef) => {
              console.log('Bargain held:', orderRef);
              setIsBargainModalOpen(false);
              navigateToResults();
            }}
            module={searchContext.module}
            userName={user?.name || 'Guest'}
            basePrice={(searchContext as any).basePrice || 0}
            productRef={(searchContext as any).productRef || 'Product'}
            // Module-specific props based on context
            flight={searchContext.module === 'flights' ? {
              id: (searchContext as any).itemId || '1',
              airline: (searchContext as any).airline || 'Airline',
              flightNumber: (searchContext as any).flightNumber || 'FL001',
              from: (searchContext as any).from || 'Origin',
              to: (searchContext as any).to || 'Destination',
              departureTime: (searchContext as any).departureTime || '10:00',
              arrivalTime: (searchContext as any).arrivalTime || '12:00',
              price: (searchContext as any).basePrice || 0,
              duration: (searchContext as any).duration || '2h'
            } : undefined}
            hotel={searchContext.module === 'hotels' ? {
              id: (searchContext as any).itemId || '1',
              name: (searchContext as any).itemName || 'Hotel',
              location: (searchContext as any).location || 'City',
              checkIn: (searchContext as any).checkIn || '2025-01-01',
              checkOut: (searchContext as any).checkOut || '2025-01-02',
              price: (searchContext as any).basePrice || 0,
              rating: (searchContext as any).rating || 4
            } : undefined}
          />
        )}
        
        {/* Fallback content if modal is closed */}
        {!isBargainModalOpen && (
          <div className="flex items-center justify-center min-h-screen">
            <Card className="max-w-md w-full mx-4">
              <CardContent className="p-6 text-center">
                <h2 className="text-xl font-semibold text-gray-900 mb-2">
                  Bargain Session Ready
                </h2>
                <p className="text-gray-600 mb-6">
                  Your AI bargaining session is ready to start.
                </p>
                <div className="flex flex-col gap-3">
                  <Button 
                    onClick={() => setIsBargainModalOpen(true)} 
                    className="w-full"
                  >
                    Start Bargaining
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={navigateToResults} 
                    className="w-full"
                  >
                    Back to Results
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </Layout>
  );
}
