import React, { useState, useEffect, useCallback, useRef } from "react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  X,
  Plane,
  Building,
  MapPin,
  Car,
  Clock,
  Shield,
  Target,
  Zap,
  Star,
  TrendingUp,
  CheckCircle,
  Sparkles,
  Crown,
  ArrowLeft,
  Users,
  Handshake,
} from "lucide-react";
import { useCurrency } from "@/contexts/CurrencyContext";
import { useAuth } from "@/contexts/AuthContext";
import {
  numberToWords,
  formatNumberWithCommas,
  formatPriceInWords,
  formatPriceInWordsShort,
} from "@/lib/numberToWords";
import {
  isMobileDevice,
  hapticFeedback,
  preventZoomOnInput,
  addMobileTouchOptimizations,
  isIOS,
  isAndroid,
} from "@/lib/mobileUtils";
import { chatAnalyticsService } from "@/services/chatAnalyticsService";
import RoundFooter from "./RoundFooter";

// TypeScript Interfaces
interface ChatMessage {
  id: string;
  speaker: "supplier" | "agent" | "user";
  message: string;
  timestamp: number;
  isTyping?: boolean;
  price?: number;
}

interface Flight {
  id: string;
  airline: string;
  flightNumber: string;
  from: string;
  to: string;
  departureTime: string;
  arrivalTime: string;
  price: number;
  duration: string;
}

interface Hotel {
  id: string;
  name: string;
  location: string;
  checkIn: string;
  checkOut: string;
  price: number;
  rating: number;
}

interface FareType {
  type: string;
  price: number;
  features: string[];
}

interface Props {
  isOpen: boolean;
  flight?: Flight | null;
  hotel?: Hotel | null;
  selectedFareType?: FareType | null;
  onClose: () => void;
  onAccept: (finalPrice: number, orderRef: string, holdData?: HoldData) => void;
  onHold: (orderRef: string) => void;
  userName?: string;
  module?: "flights" | "hotels" | "sightseeing" | "transfers" | "packages";
  onBackToResults?: () => void;
  basePrice: number;
  productRef: string;
}

export function ConversationalBargainModal({
  isOpen,
  flight,
  hotel,
  selectedFareType,
  onClose,
  onAccept,
  onHold,
  userName = "Guest",
  module = "flights",
  onBackToResults,
  basePrice,
  productRef,
}: Props) {
  // Get authenticated user's name with fallback
  const authContext = useAuth() || {};
  const { user, isLoggedIn } = authContext;
  const effectiveUserName = isLoggedIn && user?.name ? user.name : userName;

  // Constants
  const TOTAL_ROUNDS = 3;
  type RoundState =
    | "idle"
    | "submittingBid"
    | "timerRunning"
    | "receivedCounter"
    | "completed";

  // Lifecycle tracking to prevent state updates on unmounted component
  const isMountedRef = useRef(true);
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // Safe setState wrapper
  const safeSetState = <T,>(setter: React.Dispatch<React.SetStateAction<T>>) => {
    return (value: React.SetStateAction<T>) => {
      if (isMountedRef.current) {
        try {
          setter(value);
        } catch (error) {
          console.error("State update error:", error);
        }
      }
    };
  };

  // State Management
  const [currentPrice, setCurrentPrice] = useState<string>("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [round, setRound] = useState<number>(1);
  const [roundState, setRoundState] = useState<RoundState>("idle");
  const [isNegotiating, setIsNegotiating] = useState<boolean>(false);
  const [isTyping, setIsTyping] = useState<boolean>(false);
  const [finalOffer, setFinalOffer] = useState<number | null>(null);
  const [timerSeconds, setTimerSeconds] = useState<number>(30);
  const [timerActive, setTimerActive] = useState<boolean>(false);
  const [showOfferActions, setShowOfferActions] = useState<boolean>(false);
  const [isComplete, setIsComplete] = useState<boolean>(false);
  const [timerExpired, setTimerExpired] = useState<boolean>(false);
  const [isBooking, setIsBooking] = useState<boolean>(false);
  const [sessionId] = useState<string>(
    () => `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
  );
  const [lastTarget, setLastTarget] = useState<number | null>(null);
  const [previousOfferPrice, setPreviousOfferPrice] = useState<number | null>(
    null,
  );
  const [previousOfferSeconds, setPreviousOfferSeconds] = useState<
    number | null
  >(null);

  const { selectedCurrency, formatPrice } = useCurrency();
  const chatEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const prevOfferTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Module Configuration
  const moduleConfig = {
    flights: {
      icon: Plane,
      title: "Flight Price Negotiation",
      subtitle: flight
        ? `${flight.airline} ${flight.flightNumber}`
        : "Flight Booking",
      supplierName: flight?.airline || "Airline",
    },
    hotels: {
      icon: Building,
      title: "Hotel Price Negotiation",
      subtitle: hotel?.name || "Hotel Booking",
      supplierName: hotel?.name || "Hotel",
    },
    sightseeing: {
      icon: MapPin,
      title: "Activity Price Negotiation",
      subtitle: "Sightseeing Experience",
      supplierName: "Activity Provider",
    },
    transfers: {
      icon: Car,
      title: "Transfer Price Negotiation",
      subtitle: "Ground Transportation",
      supplierName: "Transfer Service",
    },
    packages: {
      icon: Star,
      title: "Package Price Negotiation",
      subtitle: "Travel Package",
      supplierName: "Travel Provider",
    },
  };

  const config = moduleConfig[module] || moduleConfig.sightseeing; // fallback to sightseeing
  const ModuleIcon = config.icon;

  // Initialize welcome message
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      const welcomeMessage: ChatMessage = {
        id: `msg_${Date.now()}`,
        speaker: "agent",
        message: `Hello ${effectiveUserName}. I’ll help you get the best available price. Current price is ${formatPrice(basePrice)}. What price would you like to pay?`,
        timestamp: Date.now(),
      };
      setMessages([welcomeMessage]);

      // Track chat open event
      const entityId = productRef || `${module}_${Date.now()}`;
      const rateKey = productRef || `rate_${Date.now()}`;
      chatAnalyticsService
        .trackChatOpen(
          module,
          entityId,
          rateKey,
          selectedCurrency.code,
          basePrice,
        )
        .catch((error) => {
          console.warn("Failed to track chat_open event:", error);
        });
    }
  }, [
    isOpen,
    effectiveUserName,
    module,
    basePrice,
    formatPrice,
    messages.length,
    productRef,
    selectedCurrency.code,
  ]);

  // Timer Effect
  useEffect(() => {
    if (timerActive && timerSeconds > 0) {
      timerRef.current = setTimeout(() => {
        setTimerSeconds((prev) => prev - 1);
      }, 1000);
    } else if (timerActive && timerSeconds === 0) {
      setTimerExpired(true);
      setTimerActive(false);
      // Keep showOfferActions true so offer buttons remain visible after expiry
      addMessage(
        "agent",
        `The offer expired. You can try again or book the original price ${formatPrice(basePrice)}.`,
      );
    }

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [timerActive, timerSeconds]);

  // Auto scroll to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Mobile optimizations and focus management
  useEffect(() => {
    if (inputRef.current && isMobileDevice()) {
      preventZoomOnInput(inputRef.current);
      addMobileTouchOptimizations(inputRef.current);
    }
  }, []);

  // Focus input when modal opens (only on initial open, not on state changes)
  useEffect(() => {
    // Only focus when modal first opens, not on every re-render
    const focusTimer = setTimeout(() => {
      if (
        isOpen &&
        inputRef.current &&
        !inputRef.current.disabled &&
        round === 1
      ) {
        inputRef.current.focus();
        // On mobile, ensure keyboard appears by clicking the input
        if (isMobileDevice()) {
          inputRef.current.click();
          // Scroll input into view
          inputRef.current.scrollIntoView({
            behavior: "smooth",
            block: "center",
          });
        }
      }
    }, 100);

    return () => clearTimeout(focusTimer);
  }, [isOpen]);

  // Freeze background scroll when bargain modal is open
  useEffect(() => {
    if (isOpen) {
      const originalOverflow = document.documentElement.style.overflow;
      document.documentElement.style.overflow = "hidden";
      document.body.style.overflow = "hidden";
      return () => {
        document.documentElement.style.overflow = originalOverflow;
        document.body.style.overflow = "";
      };
    }
  }, [isOpen]);

  // Helper Functions
  const addMessage = useCallback(
    (speaker: ChatMessage["speaker"], message: string, price?: number) => {
      const newMessage: ChatMessage = {
        id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        speaker,
        message,
        timestamp: Date.now(),
        price,
      };
      setMessages((prev) => [...prev, newMessage]);
    },
    [],
  );

  const calculateCounterOffer = useCallback(
    (userOffer: number, round: number): number => {
      const difference = basePrice - userOffer;
      const factors = [0.1, 0.05, 0.02]; // Round 1: 10%, Round 2: 5%, Round 3: 2%
      const factor = factors[round - 1] || 0.02;
      return Math.round(userOffer + difference * factor);
    },
    [basePrice],
  );

  const getAcceptanceChance = useCallback(
    (userOffer: number): number => {
      const discountPercentage = (basePrice - userOffer) / basePrice;
      if (discountPercentage <= 0.2) return 0.8; // 80% chance if asking for 20% or less discount
      if (discountPercentage <= 0.3) return 0.6; // 60% chance if asking for 30% or less discount
      return 0.4; // 40% chance for higher discounts
    },
    [basePrice],
  );

  // 🎯 ROUND-SPECIFIC LOGIC - Restore proper conversational flow
  const getRoundBehavior = useCallback((round: number) => {
    switch (round) {
      case 1:
        return {
          warningMessage: null, // No warning for Round 1
          checkingMessage: "Let me check with {supplier} about {price}…",
          supplierResponse: "Good news — we can offer {offer}.",
          agentResponse:
            "Note: the first offer is often the best. {offer}. You can book now or try Round 2.",
          acceptanceChance: 0.7, // 70% chance for Round 1 (best-tilt)
        };
      case 2:
        return {
          warningMessage:
            "Round 2. This may not be better than your last offer.",
          checkingMessage: "Rechecking at {price}…",
          supplierResponse: "Today’s offer is {offer}.",
          agentResponse:
            "Round 2 offer: {offer}. You can book now or try Round 3.",
          acceptanceChance: 0.5, // 50% chance for Round 2 (risk)
        };
      case 3:
        return {
          warningMessage:
            "Final round. The price could be higher, the same, or lower.",
          checkingMessage: "Final check…",
          supplierResponse: "Final offer: {offer}.",
          agentResponse:
            "Final offer: {offer}. This is your last chance to negotiate.",
          acceptanceChance: 0.4, // 40% chance for Round 3 (final)
        };
      default:
        return getRoundBehavior(3);
    }
  }, []);

  // Generate dynamic price suggestions based on negotiation context
  const getSuggestions = useCallback((): number[] => {
    // Need supplier offer and valid round to generate suggestions
    if (!previousOfferPrice || round < 1 || round > 3) {
      return [];
    }

    const supplierLast = previousOfferPrice;
    const userLast = lastTarget ?? supplierLast;
    const floor = basePrice; // Can't negotiate below original price
    const step = 10; // Currency step for rounding

    // Helper to round to nearest step and clamp
    const roundTo = (v: number) => {
      const rounded = Math.max(floor, Math.round(v / step) * step);
      return Math.min(rounded, supplierLast);
    };

    // Helper to deduplicate and filter
    const uniq = (arr: number[]) => [
      ...new Set(arr.filter((v) => v >= floor && v <= supplierLast)),
    ];

    if (round === 1) {
      return uniq([
        roundTo(supplierLast * 0.92),
        roundTo(supplierLast * 0.88),
        roundTo(supplierLast * 0.85),
      ]);
    } else if (round === 2) {
      return uniq([
        roundTo((userLast + supplierLast) / 2),
        roundTo(supplierLast * 0.94),
        roundTo(floor + 0.3 * (supplierLast - floor)),
      ]);
    } else {
      // Round 3
      return uniq([
        roundTo((Math.min(userLast, supplierLast) + floor) / 2),
        roundTo(supplierLast * 0.97),
      ]);
    }
  }, [previousOfferPrice, round, lastTarget, basePrice]);

  // Track when suggestions are shown
  useEffect(() => {
    if (showOfferActions || !isOpen) return; // Only track when input is visible

    const suggestions = getSuggestions();
    if (suggestions.length > 0) {
      chatAnalyticsService
        .trackCustomEvent("chips_shown", {
          round_index: round - 1,
          num_suggestions: suggestions.length,
          suggestions: suggestions,
          original_price: basePrice,
          supplier_offer: previousOfferPrice,
          module,
          product_ref: productRef,
        })
        .catch(console.warn);
    }
  }, [
    round,
    showOfferActions,
    isOpen,
    getSuggestions,
    basePrice,
    previousOfferPrice,
    module,
    productRef,
  ]);

  // Track telemetry for custom price entry
  useEffect(() => {
    if (currentPrice && round >= 1 && !showOfferActions) {
      // Check if this is a custom entry (not from a suggestion chip)
      const suggestions = getSuggestions();
      const enteredPrice = parseFloat(currentPrice);
      const isCustom = !suggestions.includes(enteredPrice) && enteredPrice > 0;

      if (isCustom) {
        chatAnalyticsService
          .trackCustomEvent("custom_entered", {
            round_index: round - 1,
            entered_price: enteredPrice,
            original_price: basePrice,
            supplier_offer: previousOfferPrice,
            module,
            product_ref: productRef,
          })
          .catch(console.warn);
      }
    }
  }, [
    currentPrice,
    round,
    showOfferActions,
    getSuggestions,
    basePrice,
    previousOfferPrice,
    module,
    productRef,
  ]);

  // Enhanced counter offer calculation with round-specific logic
  const calculateRoundSpecificOffer = useCallback(
    (userOffer: number, round: number): number => {
      const difference = basePrice - userOffer;

      // Round 1: Best offer (closest to user request)
      // Round 2: Risk (could be worse)
      // Round 3: Final (unpredictable)

      if (round === 1) {
        // Best-tilt: Give them close to what they want
        const factor = 0.3; // Only add 30% of difference back
        return Math.round(userOffer + difference * factor);
      } else if (round === 2) {
        // Risk: Could be worse than Round 1
        const factor = Math.random() > 0.5 ? 0.4 : 0.6; // 40% or 60% of difference
        return Math.round(userOffer + difference * factor);
      } else {
        // Final: Unpredictable - could be better or worse
        const factor = Math.random() > 0.3 ? 0.2 : 0.8; // 20% (great) or 80% (poor)
        return Math.round(userOffer + difference * factor);
      }
    },
    [basePrice],
  );

  // Main negotiation logic with proper conversational flow
  const handleSubmitOffer = useCallback(
    async (overridePrice?: number) => {
      const userOffer = overridePrice ?? parseFloat(currentPrice);

      if (!userOffer || userOffer <= 0) {
        addMessage("agent", "Please enter a valid price amount.");
        chatAnalyticsService
          .trackChatError(
            module,
            productRef || `${module}_${Date.now()}`,
            "INVALID_OFFER",
            "User entered invalid price amount",
          )
          .catch(console.warn);
        return;
      }

      if (userOffer >= basePrice) {
        addMessage(
          "agent",
          `That's actually higher than our current price of ${formatPrice(basePrice)}! You can book now at this great rate.`,
        );
        chatAnalyticsService
          .trackChatError(
            module,
            productRef || `${module}_${Date.now()}`,
            "OFFER_TOO_HIGH",
            "User offer higher than base price",
          )
          .catch(console.warn);
        return;
      }

      setLastTarget(userOffer);
      if (isMobileDevice()) {
        hapticFeedback("light");
      }

      setIsNegotiating(true);
      setCurrentPrice("");

      // Stop any existing timer when user enters new price
      setTimerActive(false);
      setShowOfferActions(false);
      setTimerSeconds(30);
      setTimerExpired(false);

      // Track message send and round
      const entityId = productRef || `${module}_${Date.now()}`;
      chatAnalyticsService
        .trackMessageSend(module, entityId, round, userOffer)
        .catch(console.warn);
      chatAnalyticsService
        .trackRound(module, entityId, round, basePrice, userOffer)
        .catch(console.warn);

      // Get round-specific behavior
      const roundBehavior = getRoundBehavior(round);

      // Add user message
      addMessage("user", `I'd like to pay ${formatPrice(userOffer)}`);

      // STEP 1: Show warning for R2/R3
      if (roundBehavior.warningMessage) {
        setTimeout(() => {
          addMessage("agent", roundBehavior.warningMessage);
        }, 500);
      }

      // STEP 2: Agent checking with supplier
      setTimeout(
        () => {
          setIsTyping(true);
          const checkingMsg = roundBehavior.checkingMessage
            .replace("{supplier}", config.supplierName)
            .replace("{price}", formatPrice(userOffer));
          addMessage("agent", checkingMsg);
        },
        roundBehavior.warningMessage ? 1500 : 800,
      );

      // STEP 3: Supplier response
      setTimeout(
        () => {
          setIsTyping(false);
          addMessage("supplier", "Processing your request…");
        },
        roundBehavior.warningMessage ? 2500 : 1800,
      );

      // STEP 4: Check if exact match or calculate counter-offer
      setTimeout(
        async () => {
          // Check for exact match (user got lucky)
          const isExactMatch = Math.random() < 0.1; // 10% chance of exact match

          if (isExactMatch) {
            // 🎉 MATCH CASE - User got their exact price
            setFinalOffer(userOffer);
            addMessage(
              "supplier",
              `🎉 Congratulations! Your price ${formatPrice(userOffer)} is matched!`,
            );

            setTimeout(() => {
              addMessage(
                "agent",
                `Your price ${formatPrice(userOffer)} is matched. 30 seconds to book.`,
              );
              setShowOfferActions(true);
              setTimerActive(true);
              setTimerSeconds(30);

              if (isMobileDevice()) {
                hapticFeedback("heavy");
              }
            }, 1000);

            // Track exact match
            chatAnalyticsService
              .trackAccepted(module, entityId, userOffer, basePrice - userOffer)
              .catch(console.warn);
          } else {
            // Counter offer based on round logic
            const counterOffer = calculateRoundSpecificOffer(userOffer, round);
            setFinalOffer(counterOffer);

            // Supplier response with offer
            const supplierMsg = roundBehavior.supplierResponse.replace(
              "{offer}",
              formatPrice(counterOffer),
            );
            addMessage("supplier", supplierMsg);

            // Track counter offer event
            chatAnalyticsService
              .trackCounterOffer(module, entityId, round, counterOffer)
              .catch(console.warn);

            setTimeout(() => {
              // Agent response with round-specific messaging
              const agentMsg = roundBehavior.agentResponse
                .replace("{offer}", formatPrice(counterOffer))
                .replace("{module}", module.slice(0, -1));
              addMessage("agent", agentMsg);

              // Final round completion check
              if (round >= 3) {
                setIsComplete(true);
              }

              setShowOfferActions(true);
              setTimerActive(true);
              setTimerSeconds(30);

              if (isMobileDevice()) {
                hapticFeedback("medium");
              }
            }, 1500);
          }

          setIsNegotiating(false);
        },
        roundBehavior.warningMessage ? 4000 : 3300,
      );
    },
    [
      currentPrice,
      basePrice,
      formatPrice,
      config.supplierName,
      effectiveUserName,
      module,
      round,
      addMessage,
      getRoundBehavior,
      calculateRoundSpecificOffer,
      productRef,
    ],
  );

  const handleAcceptOffer = useCallback(async () => {
    if (finalOffer) {
      setIsBooking(true);
      setTimerActive(false);

      // Generate order reference with timestamp for tracking
      const orderRef = `BRG_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      addMessage(
        "agent",
        `🎉 Excellent! Creating your booking hold at ${formatPrice(finalOffer)}...`,
      );

      try {
        // 📌 CREATE PRICE HOLD - Call backend to hold this price
        const holdResponse = await fetch("/api/bargain/create-hold", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            sessionId,
            module,
            productRef,
            originalPrice: basePrice,
            negotiatedPrice: finalOffer,
            currency: selectedCurrency.code,
            orderRef,
            holdDurationMinutes: 15, // Hold price for 15 minutes
            userData: {
              userName: effectiveUserName,
              round,
            },
          }),
        });

        // Additional safety check
        if (!holdResponse) {
          throw new Error("Network request failed");
        }

        // Read response once and handle based on status
        let responseData;
        let errorText = "";

        try {
          if (holdResponse.ok) {
            responseData = await holdResponse.json();
          } else {
            errorText = await holdResponse.text();
          }
        } catch (parseError) {
          console.warn("Failed to parse response:", parseError);
          errorText = "Invalid response format";
        }

        if (holdResponse.ok && responseData) {
          addMessage(
            "agent",
            `📌 Price locked for 15 minutes! Reference: ${orderRef}. Redirecting to booking...`,
          );

          // Track successful hold creation
          const entityId = productRef || `${module}_${Date.now()}`;
          const savings = basePrice - finalOffer;
          chatAnalyticsService
            .trackAccepted(module, entityId, finalOffer, savings)
            .catch(console.warn);

          if (isMobileDevice()) {
            hapticFeedback("heavy");
          }

          // Pass both the final price and the hold data
          // Log accepted value telemetry
          const suggestions = getSuggestions();
          chatAnalyticsService
            .trackCustomEvent("accepted_value", {
              round_index: round - 1,
              accepted_price: finalOffer,
              original_price: basePrice,
              savings: savings,
              was_suggested: suggestions.includes(finalOffer),
              module,
              product_ref: productRef,
            })
            .catch(console.warn);

          setTimeout(() => {
            setIsBooking(false);
            onAccept(finalOffer, orderRef, {
              isHeld: true,
              holdId: responseData.holdId,
              expiresAt: responseData.expiresAt,
              originalPrice: basePrice,
              savings: savings,
              module,
              productRef,
            });
          }, 1500);
        } else {
          // Check if it's a server unavailable error
          console.warn("Hold creation failed:", holdResponse.status, errorText);

          if (
            holdResponse.status === 503 ||
            errorText.includes("API server unavailable")
          ) {
            // Server is offline - proceed with graceful fallback
            addMessage(
              "agent",
              `✅ Great! Proceeding with your booking at ${formatPrice(finalOffer)}. Please complete your booking quickly to secure this price.`,
            );
          } else {
            addMessage(
              "agent",
              `⚠️ Unable to hold the price temporarily. You can still proceed at ${formatPrice(finalOffer)}, but please complete your booking quickly.`,
            );
          }

          // Proceed without hold but with success messaging
          const entityId = productRef || `${module}_${Date.now()}`;
          const savings = basePrice - finalOffer;
          chatAnalyticsService
            .trackAccepted(module, entityId, finalOffer, savings)
            .catch(console.warn);

          // Log accepted value telemetry
          const suggestions = getSuggestions();
          chatAnalyticsService
            .trackCustomEvent("accepted_value", {
              round_index: round - 1,
              accepted_price: finalOffer,
              original_price: basePrice,
              savings,
              was_suggested: suggestions.includes(finalOffer),
              module,
              product_ref: productRef,
            })
            .catch(console.warn);

          if (isMobileDevice()) {
            hapticFeedback("medium");
          }

          setTimeout(() => {
            setIsBooking(false);
            onAccept(finalOffer, orderRef, {
              isHeld: false,
              originalPrice: basePrice,
              savings: savings,
              module,
              productRef,
              warning:
                holdResponse.status === 503
                  ? "Service temporarily unavailable"
                  : "Price not held - complete booking quickly",
            });
          }, 1500);
          return; // Don't throw error, handle gracefully
        }
      } catch (error) {
        console.error("Hold creation failed:", error);

        // Check if it's a network/server error
        const isNetworkError =
          error instanceof Error &&
          (error.message.includes("ECONNREFUSED") ||
            error.message.includes("Failed to fetch") ||
            error.message.includes("API server unavailable"));

        if (isNetworkError) {
          addMessage(
            "agent",
            `✅ Great! Proceeding with your booking at ${formatPrice(finalOffer)}. Please complete your booking quickly to secure this price.`,
          );
        } else {
          addMessage(
            "agent",
            `⚠️ Unable to hold the price temporarily. You can still proceed at ${formatPrice(finalOffer)}, but please complete your booking quickly.`,
          );
        }

        // Track successful negotiation even without hold
        const entityId = productRef || `${module}_${Date.now()}`;
        const savings = basePrice - finalOffer;
        chatAnalyticsService
          .trackAccepted(module, entityId, finalOffer, savings)
          .catch(console.warn);

        if (isMobileDevice()) {
          hapticFeedback("medium");
        }

        // Fallback - proceed without hold but maintain positive UX
        setTimeout(() => {
          setIsBooking(false);
          onAccept(finalOffer, orderRef, {
            isHeld: false,
            originalPrice: basePrice,
            savings: savings,
            module,
            productRef,
            warning: isNetworkError
              ? "Service temporarily unavailable"
              : "Price not held - complete booking quickly",
          });
        }, 1500);
      }
    }
  }, [
    finalOffer,
    formatPrice,
    addMessage,
    onAccept,
    productRef,
    module,
    basePrice,
    sessionId,
    selectedCurrency.code,
    effectiveUserName,
    round,
  ]);

  const handleTryAgain = useCallback(() => {
    // Track decline of current offer
    const entityId = productRef || `${module}_${Date.now()}`;
    if (finalOffer) {
      chatAnalyticsService
        .trackDeclined(
          module,
          entityId,
          finalOffer,
          round >= 3 ? "max_rounds_reached" : "try_different_price",
        )
        .catch(console.warn);
      // Preserve previous offer with remaining TTL
      setPreviousOfferPrice(finalOffer);
      setPreviousOfferSeconds(timerSeconds);
      if (prevOfferTimerRef.current) clearInterval(prevOfferTimerRef.current);
      prevOfferTimerRef.current = setInterval(() => {
        setPreviousOfferSeconds((s) => {
          if (s == null) return s;
          if (s <= 1) {
            if (prevOfferTimerRef.current)
              clearInterval(prevOfferTimerRef.current);
            return 0;
          }
          return s - 1;
        });
      }, 1000);
    }

    if (round >= 3) {
      addMessage(
        "agent",
        "You've reached the maximum number of negotiation rounds (3/3). You can book at the original price or close this chat.",
      );
      setIsComplete(true);
      return;
    }

    // Reset for next round
    setRound((prev) => prev + 1);
    setShowOfferActions(false);
    setTimerActive(false);
    setTimerExpired(false);
    setFinalOffer(null);
    setTimerSeconds(30);

    // Round-specific prompt for next round
    const nextRound = round + 1;
    let nextRoundMessage = "";

    if (nextRound === 2) {
      nextRoundMessage = `Round 2. This may not be better than your last offer. What price would you like to try?`;
    } else if (nextRound === 3) {
      nextRoundMessage = `Final round. The price could be higher, the same, or lower. What's your final offer?`;
    }

    addMessage("agent", nextRoundMessage);

    if (isMobileDevice()) {
      hapticFeedback("light");
    }
  }, [round, addMessage, finalOffer, productRef, module, timerSeconds]);

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  // Handle modal close with analytics tracking
  const handleClose = useCallback(() => {
    const entityId = productRef || `${module}_${Date.now()}`;
    const closeReason = isComplete
      ? "max_rounds_reached"
      : timerExpired
        ? "timer_expired"
        : showOfferActions
          ? "offer_pending"
          : "user_closed";

    chatAnalyticsService
      .trackClosed(module, entityId, round, closeReason)
      .catch(console.warn);
    onClose();
  }, [
    productRef,
    module,
    isComplete,
    timerExpired,
    showOfferActions,
    round,
    onClose,
  ]);

  // Validation flags - no early returns to maintain hooks consistency
  const hasValidCallbacks = onClose && onAccept;
  const hasValidFlightData = module !== "flights" || flight;
  const hasValidHotelData = module !== "hotels" || hotel;
  const shouldRenderModal =
    isOpen && hasValidCallbacks && hasValidFlightData && hasValidHotelData;

  // Log validation errors only when modal is open
  if (isOpen) {
    if (!hasValidCallbacks) {
      console.error(
        "ConversationalBargainModal: Missing required callback props",
      );
    }
    if (module === "flights" && !flight) {
      console.error(
        "ConversationalBargainModal: Flight data required for flights module",
      );
    }
    if (module === "hotels" && !hotel) {
      console.error(
        "ConversationalBargainModal: Hotel data required for hotels module",
      );
    }
  }

  return shouldRenderModal ? (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        // Only allow closing via explicit user action (close button)
        // Prevent accidental closes from typing or other interactions
        if (!open && !isNegotiating) {
          handleClose();
        }
      }}
    >
      <DialogContent
        className={`
          mobile-bargain-modal max-w-md mx-auto sm:max-w-lg p-0
          ${isMobileDevice() ? "mobile-modal" : ""}
          flex flex-col
          ${isMobileDevice() ? "!top-0 !translate-y-0" : ""}
        `}
        style={{
          maxHeight: isMobileDevice() ? "100dvh" : "90vh",
          height: isMobileDevice() ? "100dvh" : "auto",
          borderRadius: isMobileDevice() ? "0" : "1rem",
          zIndex: 9999,
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          ...(isMobileDevice()
            ? { top: "0", transform: "translate(-50%, 0)" }
            : {}),
        }}
        onOpenAutoFocus={(e) => {
          e.preventDefault();
          setTimeout(() => {
            inputRef.current?.focus();
          }, 200);
        }}
        onPointerDownOutside={(e) => {
          // Always prevent closing when clicking outside
          e.preventDefault();
        }}
        onEscapeKeyDown={(e) => {
          // Prevent escape key from closing modal
          e.preventDefault();
        }}
        onInteractOutside={(e) => {
          // Prevent any outside interaction from closing modal
          e.preventDefault();
        }}
      >
        {/* Accessibility Title */}
        <DialogTitle className="sr-only">Hotel Price Negotiation</DialogTitle>
        {/* Header - Single close icon, round counter badge */}
        <div className="relative bg-gradient-to-r from-[#003580] to-[#0071c2] text-white p-4 sm:p-6 rounded-t-xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3 flex-1">
              <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
                <Sparkles className="w-6 h-6" />
              </div>
              <div className="flex-1 min-w-0">
                <DialogTitle className="text-lg font-bold mb-1">
                  {config.title}
                </DialogTitle>
                <p className="text-blue-100 text-sm">{config.subtitle}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 ml-3">
              <span className="inline-flex items-center rounded-full bg-white/20 px-3 py-1 text-xs font-semibold text-white whitespace-nowrap">
                {round}/{TOTAL_ROUNDS}
              </span>
              <button
                onClick={handleClose}
                aria-label="Close"
                className="p-2 hover:bg-white/20 rounded-full transition-colors flex-shrink-0"
                style={{ minWidth: "36px", minHeight: "36px" }}
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Chat Area - Scrollable */}
        <div
          className="flex-1 overflow-y-auto p-3 sm:p-4 mobile-chat-scroll bg-gray-50"
          style={{
            minHeight: isMobileDevice() ? "40vh" : "50vh",
            maxHeight: "100%",
            overflowY: "auto",
            overscrollBehavior: "contain",
          }}
        >
          <div className="space-y-3">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.speaker === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`flex max-w-[80%] ${message.speaker === "user" ? "flex-row-reverse" : "flex-row"} items-start space-x-2`}
                >
                  {/* Avatar */}
                  <div
                    className={`
                    w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-semibold
                    ${
                      message.speaker === "user"
                        ? "bg-gradient-to-r from-[#003580] to-[#0071c2] text-white"
                        : message.speaker === "supplier"
                          ? "bg-gradient-to-r from-blue-50 to-blue-100 text-blue-600"
                          : "bg-gradient-to-r from-emerald-50 to-emerald-100 text-emerald-600"
                    }
                  `}
                  >
                    {message.speaker === "user" ? (
                      effectiveUserName.charAt(0).toUpperCase()
                    ) : message.speaker === "supplier" ? (
                      <Crown className="w-4 h-4" />
                    ) : (
                      <Handshake className="w-4 h-4" />
                    )}
                  </div>

                  {/* Message Bubble */}
                  <div
                    className={`
                    px-3 py-2 rounded-lg text-sm
                    ${
                      message.speaker === "user"
                        ? "bg-gradient-to-r from-[#003580] to-[#0071c2] text-white"
                        : message.speaker === "supplier"
                          ? "bg-gradient-to-r from-blue-50 to-blue-100 text-blue-900"
                          : "bg-gradient-to-r from-emerald-50 to-emerald-100 text-emerald-900"
                    }
                  `}
                  >
                    {message.message}
                  </div>
                </div>
              </div>
            ))}

            {(isNegotiating || isTyping) && (
              <div className="flex justify-start">
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 bg-gradient-to-r from-gray-100 to-gray-200 rounded-full flex items-center justify-center">
                    <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
                  </div>
                  <div className="bg-gray-100 px-3 py-2 rounded-lg text-sm text-gray-600">
                    {isTyping ? "Typing..." : "Negotiating..."}
                  </div>
                </div>
              </div>
            )}
          </div>
          <div ref={chatEndRef} />
        </div>

        {/* Timer and Offer Actions - Keyboard Safe with aria-live for accessibility */}
        {showOfferActions && finalOffer && (
          <div
            className="bg-gradient-to-r from-emerald-50 to-green-50 border-t border-emerald-200 p-4 flex-shrink-0 w-full"
            style={{
              paddingBottom: isMobileDevice()
                ? "calc(1rem + env(safe-area-inset-bottom))"
                : "1rem",
              minHeight: "auto",
              overflow: "visible",
            }}
            aria-live="polite"
            aria-label="Negotiated offer details"
          >
            <div className="flex justify-between items-start mb-3">
              <div>
                <div className="text-sm text-emerald-700 mb-1">
                  Negotiated Price:
                </div>
                <div className="text-2xl font-bold text-emerald-800">
                  {formatPrice(finalOffer)}
                </div>
                <div className="text-xs text-emerald-600">
                  Save {formatPrice(basePrice - finalOffer)} (
                  {Math.round(((basePrice - finalOffer) / basePrice) * 100)}%
                  off)
                </div>
              </div>

              {timerActive && (
                <div
                  className={`
                  text-right font-mono font-bold
                  ${timerSeconds <= 10 ? "text-red-600 animate-pulse" : "text-emerald-600"}
                `}
                >
                  <Clock className="w-4 h-4 inline mr-1" />
                  {formatTime(timerSeconds)}
                </div>
              )}
            </div>

            <div className="flex flex-col gap-2">
              {/* Primary Book Button - Always visible while offer exists, enabled unless booking or at completion */}
              <Button
                onClick={handleAcceptOffer}
                disabled={isBooking || isComplete}
                className="w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-3 h-11 mobile-touch-target rounded-xl"
                aria-label="Book now button"
              >
                <CheckCircle className="w-4 h-4 mr-2" />
                <span className="hidden sm:inline">Book Now at</span>
                <span className="sm:hidden">Book</span>{" "}
                {formatPrice(finalOffer)}
              </Button>

              {/* Secondary: Book at original - visible after timer expires */}
              {timerExpired && !isComplete && (
                <Button
                  onClick={() => {
                    setIsBooking(true);

                    // Log accepted value for original price fallback
                    const suggestionsAtFallback = getSuggestions();
                    chatAnalyticsService
                      .trackCustomEvent("accepted_value", {
                        round_index: round - 1,
                        accepted_price: basePrice,
                        original_price: basePrice,
                        savings: 0,
                        was_suggested:
                          suggestionsAtFallback.includes(basePrice),
                        was_fallback_original: true,
                        module,
                        product_ref: productRef,
                      })
                      .catch(console.warn);

                    onAccept(basePrice, `BRG_${Date.now()}`);
                  }}
                  className="w-full bg-white border border-gray-300 text-gray-900 hover:bg-gray-50 font-medium py-3 h-11 mobile-touch-target rounded-xl"
                  aria-label="Book at original price"
                >
                  Book at Original {formatPrice(basePrice)}
                </Button>
              )}

              {/* Try another round - visible during timer AND after, but not at max rounds and not while submitting */}
              {!isComplete && round < TOTAL_ROUNDS && !isNegotiating && (
                <Button
                  onClick={handleTryAgain}
                  className="w-full bg-gray-100 text-gray-900 hover:bg-gray-200 font-medium py-3 h-11 mobile-touch-target rounded-xl"
                  aria-label="Try another negotiation round"
                >
                  <span className="hidden sm:inline">
                    {round === 1 ? "Try Round 2" : "Try Final Round"}
                  </span>
                  <span className="sm:hidden">Try Round {round + 1}</span>
                </Button>
              )}
            </div>
          </div>
        )}

        {/* Input Section - Keyboard Safe */}
        {!showOfferActions && !isComplete && (
          <div
            className="border-t border-gray-200 p-4 bg-white flex-shrink-0 w-full"
            style={{
              paddingBottom: isMobileDevice()
                ? "calc(1rem + env(safe-area-inset-bottom))"
                : "1rem",
              minHeight: "auto",
              overflow: "visible",
            }}
          >
            <div className="mb-3">
              <div className="text-sm text-gray-600 mb-1">Current Price:</div>
              <div className="text-lg font-semibold text-gray-900">
                {formatPrice(basePrice)}
              </div>
            </div>

            {/* Input section with responsive layout */}
            {round >= 2 ? (
              <RoundFooter
                currencySymbol={selectedCurrency.symbol}
                lastTarget={lastTarget ?? undefined}
                lastOffer={previousOfferPrice ?? undefined}
                lastOfferSecondsLeft={previousOfferSeconds ?? undefined}
                disabled={isNegotiating}
                onSend={(price) => handleSubmitOffer(price)}
                onAcceptPrevious={
                  previousOfferPrice
                    ? async () => {
                        await (async () => {
                          // accept previous offer directly
                          const price = previousOfferPrice;
                          const orderRef = `BRG_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
                          addMessage(
                            "agent",
                            `🎉 Excellent! Creating your booking hold at ${formatPrice(price)}...`,
                          );
                          try {
                            const holdResponse = await fetch(
                              "/api/bargain/create-hold",
                              {
                                method: "POST",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({
                                  sessionId,
                                  module,
                                  productRef,
                                  originalPrice: basePrice,
                                  negotiatedPrice: price,
                                  currency: selectedCurrency.code,
                                  orderRef,
                                  holdDurationMinutes: 15,
                                  userData: {
                                    userName: effectiveUserName,
                                    round,
                                  },
                                }),
                              },
                            );
                            if (holdResponse.ok) {
                              const holdData = await holdResponse.json();
                              const entityId =
                                productRef || `${module}_${Date.now()}`;
                              const savings = basePrice - price;
                              chatAnalyticsService
                                .trackAccepted(module, entityId, price, savings)
                                .catch(console.warn);

                              // Log accepted value for previous offer
                              const suggestionsAtAccept = getSuggestions();
                              chatAnalyticsService
                                .trackCustomEvent("accepted_value", {
                                  round_index: round - 1,
                                  accepted_price: price,
                                  original_price: basePrice,
                                  savings,
                                  was_suggested:
                                    suggestionsAtAccept.includes(price),
                                  was_previous_offer: true,
                                  module,
                                  product_ref: productRef,
                                })
                                .catch(console.warn);

                              onAccept(price, orderRef, {
                                isHeld: true,
                                holdId: holdData.holdId,
                                expiresAt: holdData.expiresAt,
                                originalPrice: basePrice,
                                savings,
                                module,
                                productRef,
                              });
                            } else {
                              // Handle API errors gracefully
                              const entityId =
                                productRef || `${module}_${Date.now()}`;
                              const savings = basePrice - price;
                              chatAnalyticsService
                                .trackAccepted(module, entityId, price, savings)
                                .catch(console.warn);

                              // Log accepted value for previous offer with error
                              const suggestionsAtError = getSuggestions();
                              chatAnalyticsService
                                .trackCustomEvent("accepted_value", {
                                  round_index: round - 1,
                                  accepted_price: price,
                                  original_price: basePrice,
                                  savings,
                                  was_suggested:
                                    suggestionsAtError.includes(price),
                                  was_previous_offer: true,
                                  had_hold_error: true,
                                  module,
                                  product_ref: productRef,
                                })
                                .catch(console.warn);

                              onAccept(price, orderRef, {
                                isHeld: false,
                                originalPrice: basePrice,
                                savings,
                                module,
                                productRef,
                                warning:
                                  "Service temporarily unavailable - complete booking quickly",
                              });
                            }
                          } catch (e) {
                            console.warn(
                              "Hold creation failed in onAcceptPrevious:",
                              e,
                            );
                            const entityId =
                              productRef || `${module}_${Date.now()}`;
                            const savings = basePrice - price;
                            chatAnalyticsService
                              .trackAccepted(module, entityId, price, savings)
                              .catch(console.warn);

                            // Log accepted value for previous offer with exception
                            const suggestionsAtException = getSuggestions();
                            chatAnalyticsService
                              .trackCustomEvent("accepted_value", {
                                round_index: round - 1,
                                accepted_price: price,
                                original_price: basePrice,
                                savings,
                                was_suggested:
                                  suggestionsAtException.includes(price),
                                was_previous_offer: true,
                                had_hold_exception: true,
                                module,
                                product_ref: productRef,
                              })
                              .catch(console.warn);

                            onAccept(price, orderRef, {
                              isHeld: false,
                              originalPrice: basePrice,
                              savings,
                              module,
                              productRef,
                              warning:
                                "Service temporarily unavailable - complete booking quickly",
                            });
                          }
                        })();
                      }
                    : undefined
                }
              />
            ) : (
              <div className="space-y-3">
                {/* Input field */}
                <div className="flex space-x-2">
                  <div className="flex-1 relative">
                    <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 font-medium pointer-events-none z-10">
                      {selectedCurrency.symbol}
                    </span>
                    <input
                      ref={inputRef}
                      type="number"
                      value={currentPrice}
                      onChange={(e) => {
                        e.stopPropagation();
                        const value = e.target.value;
                        if (isMountedRef.current) {
                          setCurrentPrice(value);
                        }
                      }}
                      onInput={(e) => {
                        e.stopPropagation();
                      }}
                      onFocus={(e) => {
                        e.stopPropagation();
                      }}
                      onBlur={(e) => {
                        e.stopPropagation();
                      }}
                      onClick={(e) => {
                        e.stopPropagation();
                      }}
                      placeholder="Enter your target price"
                      className="w-full pl-8 pr-12 py-3 text-base mobile-input border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      disabled={isNegotiating}
                      onKeyDown={(e) => {
                        e.stopPropagation();
                        if (e.key === "Enter") {
                          e.preventDefault();
                          handleSubmitOffer();
                        }
                        // Prevent any other navigation keys
                        if (e.key === "Escape" || e.key === "Tab") {
                          e.preventDefault();
                        }
                      }}
                      inputMode="decimal"
                      pattern="[0-9]*"
                      aria-label="Target price input"
                      autoComplete="off"
                    />
                    <button
                      onClick={() => handleSubmitOffer()}
                      disabled={isNegotiating || !currentPrice}
                      className="absolute right-2 top-1/2 transform -translate-y-1/2 w-8 h-8 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg flex items-center justify-center"
                    >
                      <Handshake className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Dynamic suggestions */}
                {(() => {
                  const suggestions = getSuggestions();
                  return suggestions.length > 0 ? (
                    <div className="space-y-2">
                      <div className="text-xs text-gray-500 font-medium">
                        Quick picks
                      </div>
                      <div className="flex gap-2 flex-wrap">
                        {suggestions.map((price) => (
                          <button
                            key={price}
                            onClick={() => {
                              const priceStr = String(price);
                              setCurrentPrice(priceStr);
                              inputRef.current?.focus();
                              // Log telemetry
                              chatAnalyticsService
                                .trackCustomEvent("chip_clicked", {
                                  round_index: round - 1,
                                  suggested_price: price,
                                  original_price: basePrice,
                                  supplier_offer: previousOfferPrice,
                                  module,
                                  product_ref: productRef,
                                })
                                .catch(console.warn);
                            }}
                            disabled={isNegotiating}
                            className="px-3 py-1.5 text-sm bg-blue-50 text-blue-700 border border-blue-200 rounded-lg hover:bg-blue-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            aria-label={`Suggest price ${formatPrice(price)}`}
                          >
                            {formatPrice(price)}
                          </button>
                        ))}
                      </div>
                    </div>
                  ) : null;
                })()}

                {/* Hint */}
                <div className="text-xs text-gray-500">
                  Or enter your own price
                </div>
              </div>
            )}
          </div>
        )}

        {/* Complete State - Keyboard Safe */}
        {isComplete && (
          <div
            className="border-t border-gray-200 p-4 text-center flex-shrink-0 w-full"
            style={{
              paddingBottom: isMobileDevice()
                ? "calc(1rem + env(safe-area-inset-bottom))"
                : "1rem",
              minHeight: "auto",
              overflow: "visible",
            }}
            aria-live="polite"
            aria-label="Negotiation complete"
          >
            <div className="text-gray-600 mb-3">
              Maximum negotiation rounds reached. Please select an offer to
              continue.
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
              {finalOffer && (
                <Button
                  onClick={() => handleAcceptOffer()}
                  disabled={isBooking}
                  className="flex-1 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-3"
                  aria-label="Book negotiated price"
                >
                  Book at {formatPrice(finalOffer)}
                </Button>
              )}
              <Button
                onClick={() =>
                  onAccept(basePrice, `ORD_ORIGINAL_${Date.now()}`)
                }
                variant="outline"
                className="flex-1 sm:flex-none mobile-touch-target"
                aria-label="Book original price"
              >
                Book at Original {formatPrice(basePrice)}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  ) : null;
}

export default ConversationalBargainModal;
