import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useState, useCallback } from "react";
import type { SearchContext, Offer, PostAuthIntent } from "./authGuards";
import { createContextId, storeResumeContext } from "./authGuards";

export type AuthFlowType = "modal" | "inline" | "redirect";

export interface AuthGuardOptions {
  /** Type of auth flow to use */
  flowType?: AuthFlowType;
  /** Called when auth modal should be shown */
  onShowAuthModal?: () => void;
  /** Called when auth is required (for inline flows) */
  onAuthRequired?: () => void;
  /** Called after successful authentication */
  onAuthSuccess?: () => void;
  /** Custom fallback path for redirects */
  fallbackPath?: string;
}

// Enhanced hook for authentication guards with UX flexibility
export const useEnhancedAuthGuard = () => {
  const { isLoggedIn, user } = useAuth();
  const navigate = useNavigate();
  const [showBargainAuthModal, setShowBargainAuthModal] = useState(false);
  const [showBookingAuthBanner, setShowBookingAuthBanner] = useState(false);

  const requireAuth = useCallback((
    intent: PostAuthIntent, 
    payload: any, 
    options: AuthGuardOptions = {}
  ) => {
    if (isLoggedIn && user) {
      return true; // User is authenticated
    }

    const {
      flowType = "redirect",
      onShowAuthModal,
      onAuthRequired,
      fallbackPath = '/'
    } = options;

    // User not authenticated - handle based on flow type
    const contextId = createContextId();
    storeResumeContext(contextId, intent, payload);
    
    switch (flowType) {
      case "modal":
        // Show authentication modal (for bargain flow)
        if (intent === 'BARGAIN') {
          setShowBargainAuthModal(true);
          onShowAuthModal?.();
        } else {
          // Fallback to redirect for non-bargain flows
          redirectToLogin(intent, contextId, fallbackPath);
        }
        break;
        
      case "inline":
        // Show inline authentication (for booking flow)
        if (intent === 'CHECKOUT') {
          setShowBookingAuthBanner(true);
          onAuthRequired?.();
        } else {
          // Fallback to redirect for non-checkout flows
          redirectToLogin(intent, contextId, fallbackPath);
        }
        break;
        
      case "redirect":
      default:
        // Traditional redirect flow
        redirectToLogin(intent, contextId, fallbackPath);
        break;
    }

    // Track analytics
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', `auth_required_${intent.toLowerCase()}`, {
        event_category: 'authentication',
        event_label: `${intent}_${flowType}`,
        flow_type: flowType
      });
    }
    
    return false;
  }, [isLoggedIn, user, navigate]);

  const redirectToLogin = (intent: PostAuthIntent, contextId: string, fallbackPath: string) => {
    const nextPath = intent === 'BARGAIN' 
      ? `/bargain?ctx=${encodeURIComponent(contextId)}`
      : `/checkout?ctx=${encodeURIComponent(contextId)}`;
    
    const loginUrl = `/login?next=${encodeURIComponent(nextPath)}&intent=${intent}`;
    navigate(loginUrl);
  };

  // Bargain-specific guard with modal support
  const requireAuthForBargain = useCallback((
    searchContext: SearchContext,
    options: Omit<AuthGuardOptions, 'flowType'> & { useModal?: boolean } = {}
  ) => {
    const { useModal = true, ...restOptions } = options;
    
    return requireAuth('BARGAIN', searchContext, {
      ...restOptions,
      flowType: useModal ? "modal" : "redirect"
    });
  }, [requireAuth]);

  // Checkout-specific guard with inline support
  const requireAuthForCheckout = useCallback((
    offer: Offer,
    options: Omit<AuthGuardOptions, 'flowType'> & { useInline?: boolean } = {}
  ) => {
    const { useInline = true, ...restOptions } = options;
    
    return requireAuth('CHECKOUT', offer, {
      ...restOptions,
      flowType: useInline ? "inline" : "redirect"
    });
  }, [requireAuth]);

  // Handle successful authentication in modal/inline flows
  const handleAuthSuccess = useCallback((intent: PostAuthIntent, contextId?: string) => {
    if (intent === 'BARGAIN') {
      setShowBargainAuthModal(false);
    } else if (intent === 'CHECKOUT') {
      setShowBookingAuthBanner(false);
    }

    // Track analytics
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', `auth_success_${intent.toLowerCase()}`, {
        event_category: 'authentication',
        event_label: intent,
        context_id: contextId
      });
    }
  }, []);

  return {
    isAuthenticated: isLoggedIn && !!user,
    user,
    requireAuth,
    requireAuthForBargain,
    requireAuthForCheckout,
    handleAuthSuccess,
    
    // Modal/Banner states
    showBargainAuthModal,
    setShowBargainAuthModal,
    showBookingAuthBanner,
    setShowBookingAuthBanner,
    
    // Manual controls
    showBargainAuth: () => setShowBargainAuthModal(true),
    hideBargainAuth: () => setShowBargainAuthModal(false),
    showBookingAuth: () => setShowBookingAuthBanner(true),
    hideBookingAuth: () => setShowBookingAuthBanner(false)
  };
};

// Hook specifically for booking flows with inline auth
export const useBookingAuthGuard = () => {
  const enhancedGuard = useEnhancedAuthGuard();
  
  const requireBookingAuth = useCallback((offer: Offer, options: AuthGuardOptions = {}) => {
    return enhancedGuard.requireAuthForCheckout(offer, {
      useInline: true,
      ...options
    });
  }, [enhancedGuard]);

  return {
    ...enhancedGuard,
    requireBookingAuth,
    showInlineAuth: enhancedGuard.showBookingAuthBanner,
    hideInlineAuth: enhancedGuard.hideBookingAuth
  };
};

// Hook specifically for bargain flows with modal auth
export const useBargainAuthGuard = () => {
  const enhancedGuard = useEnhancedAuthGuard();
  
  const requireBargainAuth = useCallback((searchContext: SearchContext, options: AuthGuardOptions = {}) => {
    return enhancedGuard.requireAuthForBargain(searchContext, {
      useModal: true,
      ...options
    });
  }, [enhancedGuard]);

  return {
    ...enhancedGuard,
    requireBargainAuth,
    showModalAuth: enhancedGuard.showBargainAuthModal,
    hideModalAuth: enhancedGuard.hideBargainAuth
  };
};

// Utility function to check if current page needs auth banner
export const useAuthBannerVisibility = () => {
  const { isLoggedIn } = useAuth();
  const [dismissed, setDismissed] = useState(false);

  const shouldShowBanner = !isLoggedIn && !dismissed;
  
  const dismissBanner = useCallback(() => {
    setDismissed(true);
    
    // Track dismissal
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', 'booking_banner_dismiss', {
        event_category: 'authentication',
        event_label: 'banner_interaction'
      });
    }
  }, []);

  const resetBanner = useCallback(() => {
    setDismissed(false);
  }, []);

  return {
    shouldShowBanner,
    dismissBanner,
    resetBanner
  };
};

export default useEnhancedAuthGuard;
