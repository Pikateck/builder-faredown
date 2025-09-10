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
  module?: "flights" | "hotels" | "sightseeing" | "transfers";
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
  const { user, isLoggedIn } = useAuth();
  const effectiveUserName = isLoggedIn && user?.name ? user.name : userName;

  // State Management
  const [currentPrice, setCurrentPrice] = useState<string>("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [round, setRound] = useState<number>(1);
  const [isNegotiating, setIsNegotiating] = useState<boolean>(false);
  const [isTyping, setIsTyping] = useState<boolean>(false);
  const [finalOffer, setFinalOffer] = useState<number | null>(null);
  const [timerSeconds, setTimerSeconds] = useState<number>(30);
  const [timerActive, setTimerActive] = useState<boolean>(false);
  const [showOfferActions, setShowOfferActions] = useState<boolean>(false);
  const [isComplete, setIsComplete] = useState<boolean>(false);
  const [timerExpired, setTimerExpired] = useState<boolean>(false);
  const [sessionId] = useState<string>(
    () => `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
  );

  const { selectedCurrency, formatPrice } = useCurrency();
  const chatEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

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
  };

  const config = moduleConfig[module];
  const ModuleIcon = config.icon;

  // Initialize welcome message
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      const welcomeMessage: ChatMessage = {
        id: `msg_${Date.now()}`,
        speaker: "agent",
        message: `Hello ${effectiveUserName}! I'm here to help you get the best price for your ${module.slice(0, -1)}. The current price is ${formatPrice(basePrice)}. What price would you like to pay?`,
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
      setShowOfferActions(false);
      addMessage(
        "agent",
        "The offer has expired. You can try negotiating again or book at the original price.",
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

  // Mobile optimizations
  useEffect(() => {
    if (inputRef.current && isMobileDevice()) {
      preventZoomOnInput(inputRef.current);
      addMobileTouchOptimizations(inputRef.current);
    }
  }, []);

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
          checkingMessage: "Let me check with {supplier} about {price}...",
          supplierResponse: "We can offer {offer}.",
          agentResponse:
            "This is a special price! {offer} for your {module}. 30 seconds to book.",
          acceptanceChance: 0.7, // 70% chance for Round 1 (best-tilt)
        };
      case 2:
        return {
          warningMessage: "⚠️ This may not be better than our previous offer.",
          checkingMessage: "Checking...",
          supplierResponse: "We can offer {offer}.",
          agentResponse: "Round 2 offer: {offer}. 30 seconds to decide.",
          acceptanceChance: 0.5, // 50% chance for Round 2 (risk)
        };
      case 3:
        return {
          warningMessage:
            "⚠️ Last round - price could be higher or lower than previous offers.",
          checkingMessage: "Final check...",
          supplierResponse: "Final offer {offer}.",
          agentResponse:
            "FINAL OFFER: {offer}. **30 seconds** to book or return to original price.",
          acceptanceChance: 0.4, // 40% chance for Round 3 (final)
        };
      default:
        return getRoundBehavior(3);
    }
  }, []);

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
  const handleSubmitOffer = useCallback(async () => {
    const userOffer = parseFloat(currentPrice);

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

    if (isMobileDevice()) {
      hapticFeedback("light");
    }

    setIsNegotiating(true);
    setCurrentPrice("");

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
        addMessage("supplier", "Processing your request...");
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
              `🎉 Amazing news ${effectiveUserName}! We've matched your exact price of ${formatPrice(userOffer)}. **30 seconds** to book this incredible deal!`,
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
  }, [
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
  ]);

  const handleAcceptOffer = useCallback(async () => {
    if (finalOffer) {
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

        if (holdResponse.ok) {
          const holdData = await holdResponse.json();

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
          setTimeout(() => {
            onAccept(finalOffer, orderRef, {
              isHeld: true,
              holdId: holdData.holdId,
              expiresAt: holdData.expiresAt,
              originalPrice: basePrice,
              savings: savings,
              module,
              productRef,
            });
          }, 1500);
        } else {
          throw new Error("Failed to create price hold");
        }
      } catch (error) {
        console.error("Hold creation failed:", error);

        addMessage(
          "agent",
          `⚠️ Unable to hold the price. You can still proceed at ${formatPrice(finalOffer)}, but the price may change.`,
        );

        // Fallback - proceed without hold
        setTimeout(() => {
          onAccept(finalOffer, orderRef, {
            isHeld: false,
            warning: "Price not held - may change during booking",
          });
        }, 1000);
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
      nextRoundMessage = `Let's try Round 2! ⚠️ Remember: the next offer may not be better. What price would you like to try?`;
    } else if (nextRound === 3) {
      nextRoundMessage = `Final Round 3! ⚠️ This is your last chance - the price could be higher or lower. What's your final offer?`;
    }

    addMessage("agent", nextRoundMessage);

    if (isMobileDevice()) {
      hapticFeedback("light");
    }
  }, [round, addMessage, finalOffer, productRef, module]);

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
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent
        className={`
          mobile-bargain-modal max-w-md mx-auto sm:max-w-lg p-0 
          ${isMobileDevice() ? "mobile-modal" : ""}
        `}
        style={{
          maxHeight: isMobileDevice() ? "95vh" : "90vh",
          borderRadius: isMobileDevice() ? "1.5rem 1.5rem 0 0" : "1rem",
        }}
      >
        {/* Header */}
        <div className="relative bg-gradient-to-r from-[#003580] to-[#0071c2] text-white p-4 sm:p-6 rounded-t-xl">
          <button
            onClick={handleClose}
            className="absolute top-4 right-4 p-2 hover:bg-white/20 rounded-full transition-colors z-10"
            style={{ minWidth: "36px", minHeight: "36px" }}
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
              <Sparkles className="w-6 h-6" />
            </div>
            <div className="flex-1">
              <DialogTitle className="text-lg font-bold mb-1">
                {config.title}
              </DialogTitle>
              <p className="text-blue-100 text-sm">{config.subtitle}</p>
            </div>
            <div className="text-right">
              <div className="text-xs text-blue-200">Round</div>
              <div className="text-lg font-bold">{round}/3</div>
            </div>
          </div>
        </div>

        {/* Chat Area */}
        <div className="flex-1 max-h-96 overflow-y-auto p-3 sm:p-4 mobile-chat-scroll">
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

        {/* Timer and Offer Actions */}
        {showOfferActions && finalOffer && (
          <div className="bg-gradient-to-r from-emerald-50 to-green-50 border-t border-emerald-200 p-4">
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

            <div className="space-y-2">
              <Button
                onClick={handleAcceptOffer}
                disabled={timerExpired}
                className="w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-semibold py-3 mobile-touch-target"
              >
                <CheckCircle className="w-4 h-4 mr-2" />
                Book Now at {formatPrice(finalOffer)}
              </Button>

              {!isComplete && round < 3 && (
                <Button
                  onClick={handleTryAgain}
                  variant="outline"
                  className="w-full mobile-touch-target"
                >
                  {round === 1
                    ? "Try Round 2 (⚠️ May not be better)"
                    : "Try Final Round 3 (⚠️ Unpredictable)"}
                </Button>
              )}
            </div>
          </div>
        )}

        {/* Input Section */}
        {!showOfferActions && !isComplete && (
          <div className="border-t border-gray-200 p-4">
            <div className="mb-3">
              <div className="text-sm text-gray-600 mb-1">Current Price:</div>
              <div className="text-lg font-semibold text-gray-900">
                {formatPrice(basePrice)}
              </div>
            </div>

            <div className="flex space-x-2">
              <div className="flex-1 relative">
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 font-medium">
                  {selectedCurrency.symbol}
                </span>
                <Input
                  ref={inputRef}
                  type="number"
                  value={currentPrice}
                  onChange={(e) => setCurrentPrice(e.target.value)}
                  placeholder="Enter your target price"
                  className="pl-8 pr-12 py-3 text-base mobile-input"
                  disabled={isNegotiating}
                  onKeyPress={(e) => {
                    if (e.key === "Enter") {
                      handleSubmitOffer();
                    }
                  }}
                />
                <button
                  onClick={handleSubmitOffer}
                  disabled={isNegotiating || !currentPrice}
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 w-8 h-8 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg flex items-center justify-center"
                >
                  <Handshake className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Complete State */}
        {isComplete && (
          <div className="border-t border-gray-200 p-4 text-center">
            <div className="text-gray-600 mb-3">
              Maximum negotiation rounds reached
            </div>
            <Button
              onClick={() => onAccept(basePrice, `ORD_ORIGINAL_${Date.now()}`)}
              className="w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-semibold py-3"
            >
              Book at Original Price {formatPrice(basePrice)}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  ) : null;
}

export default ConversationalBargainModal;
