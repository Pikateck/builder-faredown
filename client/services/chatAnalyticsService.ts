import { v4 as uuidv4 } from "uuid";

// Generate unique request ID for tracking
const generateRequestId = (): string => {
  return `req_${Date.now()}_${uuidv4().slice(0, 8)}`;
};

// Get or create session ID
const getSessionId = (): string => {
  let sessionId = sessionStorage.getItem("chat_session_id");
  if (!sessionId) {
    sessionId = `session_${Date.now()}_${uuidv4().slice(0, 8)}`;
    sessionStorage.setItem("chat_session_id", sessionId);
  }
  return sessionId;
};

// Get user ID or anonymous ID
const getUserId = (): string => {
  const user = localStorage.getItem("user");
  if (user) {
    try {
      const userData = JSON.parse(user);
      return userData.id || userData.userId || `anon_${getSessionId()}`;
    } catch {
      return `anon_${getSessionId()}`;
    }
  }
  return `anon_${getSessionId()}`;
};

// Check if analytics should be enabled based on feature flags
const shouldTrackEvents = async (): Promise<boolean> => {
  try {
    // Always track events in shadow/canary mode as requested
    // This respects the feature flag while ensuring analytics work
    const response = await fetch("/api/feature-flags");
    if (response.ok) {
      const flags = await response.json();
      // Track if AI_TRAFFIC > 0 OR AI_SHADOW is true (shadow/canary mode)
      return flags.AI_TRAFFIC > 0 || flags.AI_SHADOW === true;
    }
  } catch (error) {
    console.warn("Could not check feature flags for analytics:", error);
  }
  // Default to tracking for development
  return true;
};

// Base event payload interface
interface BaseEventPayload {
  module: "flights" | "hotels" | "sightseeing" | "transfers";
  entityId: string;
  sessionId: string;
  userId?: string;
  anonId?: string;
  xRequestId: string;
  timestamp: number;
}

// Specific event payload interfaces
interface ChatOpenPayload extends BaseEventPayload {
  rateKey: string;
  currency: string;
  base_total: number;
}

interface MessageSendPayload extends BaseEventPayload {
  round: number;
  offer_value: number;
}

interface CounterOfferPayload extends BaseEventPayload {
  round: number;
  counter_value: number;
}

interface RoundPayload extends BaseEventPayload {
  round: number;
  base_total: number;
  current_offer: number;
}

interface AcceptedPayload extends BaseEventPayload {
  final_total: number;
  savings: number;
}

interface DeclinedPayload extends BaseEventPayload {
  last_offer: number;
  reason?: string;
}

interface ClosedPayload extends BaseEventPayload {
  round: number;
  close_reason: string;
}

interface ChatErrorPayload extends BaseEventPayload {
  error_code: string;
  message: string;
}

// Union type for all event payloads
type EventPayload =
  | ChatOpenPayload
  | MessageSendPayload
  | CounterOfferPayload
  | RoundPayload
  | AcceptedPayload
  | DeclinedPayload
  | ClosedPayload
  | ChatErrorPayload;

// Event name type
type EventName =
  | "chat_open"
  | "message_send"
  | "counter_offer"
  | "round_n"
  | "accepted"
  | "declined"
  | "closed"
  | "chat_error";

/**
 * Main tracking function - logs events to console and sends to analytics endpoint
 */
export const trackEvent = async (
  eventName: EventName,
  payload: Partial<EventPayload>,
): Promise<void> => {
  try {
    // Check if tracking is enabled
    const shouldTrack = await shouldTrackEvents();
    if (!shouldTrack) {
      console.log(
        `[Analytics] Tracking disabled by feature flags, skipping: ${eventName}`,
      );
      return;
    }

    // Build complete payload with required fields
    const sessionId = getSessionId();
    const userId = getUserId();
    const xRequestId = generateRequestId();

    const completePayload = {
      ...payload,
      sessionId,
      ...(userId.startsWith("anon_") ? { anonId: userId } : { userId }),
      xRequestId,
      timestamp: Date.now(),
    };

    // Log to console for debugging
    console.log(`[Chat Analytics] ${eventName}:`, completePayload);

    // Send to analytics endpoint (non-blocking)
    try {
      await fetch("/api/analytics/chat-events", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Request-ID": xRequestId,
        },
        body: JSON.stringify({
          event: eventName,
          payload: completePayload,
          timestamp: completePayload.timestamp,
        }),
      });
    } catch (apiError) {
      // Don't block on analytics API failures
      console.warn(`[Analytics] Failed to send ${eventName} event:`, apiError);
    }
  } catch (error) {
    console.error(`[Analytics] Error tracking ${eventName}:`, error);
  }
};

/**
 * Helper functions for specific events
 */
export const trackChatOpen = (
  module: "flights" | "hotels" | "sightseeing" | "transfers",
  entityId: string,
  rateKey: string,
  currency: string,
  baseTotal: number,
) => {
  return trackEvent("chat_open", {
    module,
    entityId,
    rateKey,
    currency,
    base_total: baseTotal,
  });
};

export const trackMessageSend = (
  module: "flights" | "hotels" | "sightseeing" | "transfers",
  entityId: string,
  round: number,
  offerValue: number,
) => {
  return trackEvent("message_send", {
    module,
    entityId,
    round,
    offer_value: offerValue,
  });
};

export const trackCounterOffer = (
  module: "flights" | "hotels" | "sightseeing" | "transfers",
  entityId: string,
  round: number,
  counterValue: number,
) => {
  return trackEvent("counter_offer", {
    module,
    entityId,
    round,
    counter_value: counterValue,
  });
};

export const trackRound = (
  module: "flights" | "hotels" | "sightseeing" | "transfers",
  entityId: string,
  round: number,
  baseTotal: number,
  currentOffer: number,
) => {
  return trackEvent("round_n", {
    module,
    entityId,
    round,
    base_total: baseTotal,
    current_offer: currentOffer,
  });
};

export const trackAccepted = (
  module: "flights" | "hotels" | "sightseeing" | "transfers",
  entityId: string,
  finalTotal: number,
  savings: number,
) => {
  return trackEvent("accepted", {
    module,
    entityId,
    final_total: finalTotal,
    savings,
  });
};

export const trackDeclined = (
  module: "flights" | "hotels" | "sightseeing" | "transfers",
  entityId: string,
  lastOffer: number,
  reason?: string,
) => {
  return trackEvent("declined", {
    module,
    entityId,
    last_offer: lastOffer,
    reason,
  });
};

export const trackClosed = (
  module: "flights" | "hotels" | "sightseeing" | "transfers",
  entityId: string,
  round: number,
  closeReason: string,
) => {
  return trackEvent("closed", {
    module,
    entityId,
    round,
    close_reason: closeReason,
  });
};

export const trackChatError = (
  module: "flights" | "hotels" | "sightseeing" | "transfers",
  entityId: string,
  errorCode: string,
  message: string,
) => {
  return trackEvent("chat_error", {
    module,
    entityId,
    error_code: errorCode,
    message,
  });
};

// Export service object for easier imports
export const chatAnalyticsService = {
  trackEvent,
  trackChatOpen,
  trackMessageSend,
  trackCounterOffer,
  trackRound,
  trackAccepted,
  trackDeclined,
  trackClosed,
  trackChatError,
};

export default chatAnalyticsService;
