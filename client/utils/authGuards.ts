import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

// Types for the redirect flow
export type PostAuthIntent = "BARGAIN" | "CHECKOUT";
export type ModuleType =
  | "flights"
  | "hotels"
  | "sightseeing"
  | "transfers"
  | "packages";

export interface SearchContext {
  module: ModuleType;
  [key: string]: any; // Flexible for module-specific search params
}

export interface Offer {
  offerId: string;
  module: ModuleType;
  supplier: string;
  price: {
    currency: string;
    amount: number;
    base?: number;
    taxes?: number;
  };
  [key: string]: any; // Module-specific offer data
}

export interface ResumeContext<T = unknown> {
  ctx: string;
  type: PostAuthIntent;
  payload: T;
  ts: number;
}

// Generate unique context ID
export const createContextId = (): string => {
  return `ctx_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

// Store context in sessionStorage
export const storeResumeContext = <T>(
  contextId: string,
  type: PostAuthIntent,
  payload: T,
): void => {
  const context: ResumeContext<T> = {
    ctx: contextId,
    type,
    payload,
    ts: Date.now(),
  };

  try {
    sessionStorage.setItem(`ctx:${contextId}`, JSON.stringify(context));
  } catch (error) {
    console.error("Failed to store resume context:", error);
  }
};

// Retrieve context from sessionStorage
export const getResumeContext = <T>(
  contextId: string,
): ResumeContext<T> | null => {
  try {
    const raw = sessionStorage.getItem(`ctx:${contextId}`);
    if (!raw) return null;

    const context = JSON.parse(raw) as ResumeContext<T>;

    // Check if context is not too old (30 minutes)
    const maxAge = 30 * 60 * 1000; // 30 minutes
    if (Date.now() - context.ts > maxAge) {
      sessionStorage.removeItem(`ctx:${contextId}`);
      return null;
    }

    return context;
  } catch (error) {
    console.error("Failed to retrieve resume context:", error);
    return null;
  }
};

// Clear context after use
export const clearResumeContext = (contextId: string): void => {
  try {
    sessionStorage.removeItem(`ctx:${contextId}`);
  } catch (error) {
    console.error("Failed to clear resume context:", error);
  }
};

// Hook for authentication guards
export const useAuthGuard = () => {
  const { isLoggedIn, user } = useAuth();
  const navigate = useNavigate();

  const requireAuth = (
    intent: PostAuthIntent,
    payload: any,
    fallbackPath = "/",
  ) => {
    if (isLoggedIn && user) {
      return true; // User is authenticated
    }

    // User not authenticated - redirect to login
    const contextId = createContextId();
    storeResumeContext(contextId, intent, payload);

    const nextPath =
      intent === "BARGAIN"
        ? `/bargain?ctx=${encodeURIComponent(contextId)}`
        : `/checkout?ctx=${encodeURIComponent(contextId)}`;

    const loginUrl = `/login?next=${encodeURIComponent(nextPath)}&intent=${intent}`;

    // Track analytics
    if (typeof window !== "undefined" && (window as any).gtag) {
      (window as any).gtag("event", `redirect_login_${intent.toLowerCase()}`, {
        event_category: "authentication",
        event_label: intent,
      });
    }

    navigate(loginUrl);
    return false;
  };

  const requireAuthForBargain = (searchContext: SearchContext) => {
    return requireAuth("BARGAIN", searchContext);
  };

  const requireAuthForCheckout = (offer: Offer) => {
    return requireAuth("CHECKOUT", offer);
  };

  return {
    isAuthenticated: isLoggedIn && !!user,
    user,
    requireAuth,
    requireAuthForBargain,
    requireAuthForCheckout,
  };
};

// Resume flow after successful authentication
export const resumePostAuth = async (
  nextPath: string,
  intent: PostAuthIntent,
) => {
  try {
    const url = new URL(nextPath, window.location.origin);
    const contextId = url.searchParams.get("ctx");

    if (!contextId) {
      console.warn("No context ID found in resume path");
      return false;
    }

    const context = getResumeContext(contextId);
    if (!context) {
      console.warn("Resume context not found or expired");
      return false;
    }

    // Validate context type matches intent
    if (context.type !== intent) {
      console.warn("Context type mismatch", {
        expected: intent,
        actual: context.type,
      });
      return false;
    }

    // Clear the context since we're resuming
    clearResumeContext(contextId);

    // Track successful resume
    if (typeof window !== "undefined" && (window as any).gtag) {
      (window as any).gtag("event", `resume_${intent.toLowerCase()}_success`, {
        event_category: "authentication",
        event_label: intent,
      });
    }

    return true;
  } catch (error) {
    console.error("Failed to resume post-auth flow:", error);
    return false;
  }
};

// Preflight checks before resuming
export const preflightBargain = async (
  searchContext: SearchContext,
): Promise<boolean> => {
  try {
    // Re-validate search context and check if prices are still available
    console.log("Preflight check for bargain:", searchContext);

    // TODO: Add actual API calls to re-validate pricing/availability
    // For now, we'll assume the context is still valid

    return true;
  } catch (error) {
    console.error("Preflight bargain check failed:", error);
    return false;
  }
};

export const preflightCheckout = async (offer: Offer): Promise<boolean> => {
  try {
    // Re-price the offer and verify it's still available
    console.log("Preflight check for checkout:", offer);

    // TODO: Add actual API calls to re-validate offer pricing
    // For now, we'll assume the offer is still valid

    return true;
  } catch (error) {
    console.error("Preflight checkout check failed:", error);
    return false;
  }
};
