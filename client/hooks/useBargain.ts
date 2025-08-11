/**
 * useBargain Hook - Live AI Bargaining Platform Integration
 * Connects existing bargain UI to live API endpoints
 */

import { useState, useCallback } from "react";
import { authService } from "@/services/authService";

// Types matching the live API
export interface BargainUser {
  id: string;
  tier: "standard" | "premium" | "vip";
  device_type: "mobile" | "desktop";
  location?: string;
  user_agent?: string;
}

export interface BargainProductCPO {
  type: "flight" | "hotel" | "sightseeing";
  supplier: string;
  product_id: string;
  route?: string;
  city?: string;
  activity_type?: string;
  check_in?: string;
  check_out?: string;
  guest_count?: number;
  class_of_service?: string;
}

export interface BargainSessionStartResponse {
  session_id: string;
  initial_offer: {
    price: number;
    explanation: string;
  };
  min_floor: number;
  explain: string;
  safety_capsule: {
    signature: string;
    timestamp: string;
    offer_data: any;
  };
}

export interface BargainOfferResponse {
  decision: "accept" | "counter" | "reject";
  accept_prob?: number;
  counter_offer?: number;
  min_floor: number;
  explain: string;
  safety_capsule: {
    signature: string;
    timestamp: string;
    offer_data: any;
  };
}

export interface BargainAcceptResponse {
  payment_payload: {
    session_id: string;
    final_price: number;
    currency: string;
    product_details: any;
    booking_reference: string;
  };
}

export interface BargainSignals {
  time_on_page: number;
  scroll_depth: number;
  previous_searches: number;
  device_type: "mobile" | "desktop";
  user_agent: string;
}

// Helper to capture user signals
const captureSignals = (): BargainSignals => {
  return {
    time_on_page: Math.round(performance.now() / 1000),
    scroll_depth: Math.round((window.scrollY / (document.body.scrollHeight - window.innerHeight)) * 100),
    previous_searches: parseInt(localStorage.getItem("search_count") || "0"),
    device_type: window.innerWidth < 768 ? "mobile" : "desktop",
    user_agent: navigator.userAgent.substring(0, 100)
  };
};

// Start bargain session on first interaction
export async function startBargain(
  user: BargainUser, 
  productCPO: BargainProductCPO, 
  promo?: string
): Promise<BargainSessionStartResponse> {
  const token = authService.getToken();
  
  const res = await fetch('/api/bargain/v1/session/start', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': token ? `Bearer ${token}` : ''
    },
    body: JSON.stringify({ 
      user, 
      productCPO, 
      promo_code: promo 
    })
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: 'Network error' }));
    throw error;
  }

  return res.json();
}

// Send user offer / get counter
export async function sendOffer(
  sessionId: string, 
  userOffer?: number
): Promise<BargainOfferResponse> {
  const token = authService.getToken();
  
  const res = await fetch('/api/bargain/v1/session/offer', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': token ? `Bearer ${token}` : ''
    },
    body: JSON.stringify({ 
      session_id: sessionId, 
      user_offer: userOffer, 
      signals: captureSignals() 
    })
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: 'Network error' }));
    throw error;
  }

  return res.json();
}

// Accept flow (with inventory reprice handling)
export async function acceptOffer(sessionId: string): Promise<BargainAcceptResponse> {
  const token = authService.getToken();
  
  const res = await fetch('/api/bargain/v1/session/accept', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': token ? `Bearer ${token}` : ''
    },
    body: JSON.stringify({ session_id: sessionId })
  });

  if (res.status === 409) {
    // CONSTRAINT_VIOLATION - inventory changed
    throw { code: 'INVENTORY_CHANGED', message: 'Price has changed due to inventory update' };
  }

  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: 'Network error' }));
    throw error;
  }

  return res.json();
}

// Hook for UI integration
export function useBargain() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [session, setSession] = useState<BargainSessionStartResponse | null>(null);
  const [lastOffer, setLastOffer] = useState<BargainOfferResponse | null>(null);

  const startBargainSession = useCallback(async (
    productCPO: BargainProductCPO,
    promo?: string
  ) => {
    try {
      setIsLoading(true);
      setError(null);

      // Create user object from current context
      const user: BargainUser = {
        id: authService.getCurrentUser()?.id || 'anonymous',
        tier: 'standard', // TODO: Get from user profile
        device_type: window.innerWidth < 768 ? 'mobile' : 'desktop',
        location: 'IN', // TODO: Get from user location
        user_agent: navigator.userAgent
      };

      const response = await startBargain(user, productCPO, promo);
      setSession(response);
      return response;
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to start bargain session';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const submitOffer = useCallback(async (userOffer?: number) => {
    if (!session) throw new Error('No active session');

    try {
      setIsLoading(true);
      setError(null);

      const response = await sendOffer(session.session_id, userOffer);
      setLastOffer(response);
      return response;
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to submit offer';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [session]);

  const acceptCurrentOffer = useCallback(async () => {
    if (!session) throw new Error('No active session');

    try {
      setIsLoading(true);
      setError(null);

      const response = await acceptOffer(session.session_id);
      return response;
    } catch (err: any) {
      if (err.code === 'INVENTORY_CHANGED') {
        setError('Price has changed - please refresh and try again');
      } else {
        setError(err.message || 'Failed to accept offer');
      }
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [session]);

  const resetSession = useCallback(() => {
    setSession(null);
    setLastOffer(null);
    setError(null);
  }, []);

  // Helper to show error messages in UI
  const getErrorMessage = useCallback((error: any) => {
    if (error?.code === 'RATE_STALE') {
      return 'Refreshing best price…';
    }
    if (error?.code === 'INVENTORY_CHANGED') {
      return 'Price has changed due to inventory update';
    }
    return error?.message || 'Something went wrong';
  }, []);

  return {
    // State
    isLoading,
    error,
    session,
    lastOffer,

    // Actions
    startBargainSession,
    submitOffer,
    acceptCurrentOffer,
    resetSession,
    getErrorMessage,

    // Computed values
    hasActiveSession: !!session,
    currentPrice: lastOffer?.counter_offer || session?.initial_offer?.price,
    minFloor: lastOffer?.min_floor || session?.min_floor,
    explanation: lastOffer?.explain || session?.explain || session?.initial_offer?.explanation
  };
}

export default useBargain;
