import React, { useState, useEffect, useCallback, useRef } from "react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  X, Plane, Building, MapPin, Car, Clock, Shield, Target, Zap, Star, 
  TrendingUp, CheckCircle, Sparkles, Crown, ArrowLeft, Users
} from "lucide-react";
import { useCurrency } from "@/contexts/CurrencyContext";
import { numberToWords, formatNumberWithCommas, formatPriceInWords, formatPriceInWordsShort } from "@/lib/numberToWords";
import { 
  isMobileDevice, hapticFeedback, preventZoomOnInput, addMobileTouchOptimizations,
  isIOS, isAndroid
} from "@/lib/mobileUtils";

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
  onAccept: (finalPrice: number, orderRef: string) => void;
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
  productRef
}: Props) {
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
  const [sessionId] = useState<string>(() => `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`);

  const { selectedCurrency, formatPrice } = useCurrency();
  const chatEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Module Configuration
  const moduleConfig = {
    flights: {
      icon: Plane,
      title: "Flight Price Negotiation",
      subtitle: flight ? `${flight.airline} ${flight.flightNumber}` : "Flight Booking",
      supplierName: flight?.airline || "Airline"
    },
    hotels: {
      icon: Building,
      title: "Hotel Price Negotiation", 
      subtitle: hotel?.name || "Hotel Booking",
      supplierName: hotel?.name || "Hotel"
    },
    sightseeing: {
      icon: MapPin,
      title: "Activity Price Negotiation",
      subtitle: "Sightseeing Experience",
      supplierName: "Activity Provider"
    },
    transfers: {
      icon: Car,
      title: "Transfer Price Negotiation",
      subtitle: "Ground Transportation",
      supplierName: "Transfer Service"
    }
  };

  const config = moduleConfig[module];
  const ModuleIcon = config.icon;

  // Initialize welcome message
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      const welcomeMessage: ChatMessage = {
        id: `msg_${Date.now()}`,
        speaker: "agent",
        message: `Hello ${userName}! I'm here to help you get the best price for your ${module.slice(0, -1)}. The current price is ${formatPrice(basePrice)}. What price would you like to pay?`,
        timestamp: Date.now()
      };
      setMessages([welcomeMessage]);
    }
  }, [isOpen, userName, module, basePrice, formatPrice, messages.length]);

  // Timer Effect
  useEffect(() => {
    if (timerActive && timerSeconds > 0) {
      timerRef.current = setTimeout(() => {
        setTimerSeconds(prev => prev - 1);
      }, 1000);
    } else if (timerActive && timerSeconds === 0) {
      setTimerExpired(true);
      setTimerActive(false);
      setShowOfferActions(false);
      addMessage("agent", "The offer has expired. You can try negotiating again or book at the original price.");
    }

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [timerActive, timerSeconds]);

  // Auto scroll to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Mobile optimizations
  useEffect(() => {
    if (inputRef.current && isMobileDevice()) {
      preventZoomOnInput(inputRef.current);
      addMobileTouchOptimizations(inputRef.current);
    }
  }, []);

  // Helper Functions
  const addMessage = useCallback((speaker: ChatMessage['speaker'], message: string, price?: number) => {
    const newMessage: ChatMessage = {
      id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      speaker,
      message,
      timestamp: Date.now(),
      price
    };
    setMessages(prev => [...prev, newMessage]);
  }, []);

  const calculateCounterOffer = useCallback((userOffer: number, round: number): number => {
    const difference = basePrice - userOffer;
    const factors = [0.10, 0.05, 0.02]; // Round 1: 10%, Round 2: 5%, Round 3: 2%
    const factor = factors[round - 1] || 0.02;
    return Math.round(userOffer + (difference * factor));
  }, [basePrice]);

  const getAcceptanceChance = useCallback((userOffer: number): number => {
    const discountPercentage = (basePrice - userOffer) / basePrice;
    if (discountPercentage <= 0.2) return 0.8; // 80% chance if asking for 20% or less discount
    if (discountPercentage <= 0.3) return 0.6; // 60% chance if asking for 30% or less discount
    return 0.4; // 40% chance for higher discounts
  }, [basePrice]);

  // Main negotiation logic
  const handleSubmitOffer = useCallback(async () => {
    const userOffer = parseFloat(currentPrice);
    
    if (!userOffer || userOffer <= 0) {
      addMessage("agent", "Please enter a valid price amount.");
      return;
    }

    if (userOffer >= basePrice) {
      addMessage("agent", `That's actually higher than our current price of ${formatPrice(basePrice)}! You can book now at this great rate.`);
      return;
    }

    if (isMobileDevice()) {
      hapticFeedback("light");
    }

    setIsNegotiating(true);
    setCurrentPrice("");

    // Add user message
    addMessage("user", `I'd like to pay ${formatPrice(userOffer)}`);

    // Simulate typing delay
    setTimeout(() => {
      setIsTyping(true);
      addMessage("agent", `Let me check with ${config.supplierName} about ${formatPrice(userOffer)}...`);
    }, 500);

    setTimeout(() => {
      setIsTyping(false);
      addMessage("supplier", `Checking availability at ${formatPrice(userOffer)}...`);
    }, 1500);

    // AI Decision Logic
    setTimeout(async () => {
      const acceptanceChance = getAcceptanceChance(userOffer);
      const isAccepted = Math.random() < acceptanceChance;

      if (isAccepted) {
        // Offer accepted
        setFinalOffer(userOffer);
        addMessage("supplier", `Great news! We can accept ${formatPrice(userOffer)} for this booking.`);
        
        setTimeout(() => {
          addMessage("agent", `Excellent news ${userName}! We've secured ${formatPrice(userOffer)} for you. You have 30 seconds to book this price.`);
          setShowOfferActions(true);
          setTimerActive(true);
          setTimerSeconds(30);
          
          if (isMobileDevice()) {
            hapticFeedback("medium");
          }
        }, 1000);
      } else {
        // Counter offer
        const counterOffer = calculateCounterOffer(userOffer, round);
        setFinalOffer(counterOffer);
        
        addMessage("supplier", `We can offer ${formatPrice(counterOffer)} as our best price for this ${module.slice(0, -1)}.`);
        
        setTimeout(() => {
          if (round >= 3) {
            addMessage("agent", `This is our final offer at ${formatPrice(counterOffer)}. You have 30 seconds to decide, or you can book at the original price of ${formatPrice(basePrice)}.`);
            setIsComplete(true);
          } else {
            addMessage("agent", `${config.supplierName} can do ${formatPrice(counterOffer)}. Would you like to accept this or try another price? (Round ${round}/3)`);
          }
          
          setShowOfferActions(true);
          setTimerActive(true);
          setTimerSeconds(30);
          
          if (isMobileDevice()) {
            hapticFeedback("medium");
          }
        }, 1000);
      }

      setIsNegotiating(false);
    }, 2500);

  }, [currentPrice, basePrice, formatPrice, config.supplierName, userName, module, round, addMessage, getAcceptanceChance, calculateCounterOffer, isMobileDevice]);

  const handleAcceptOffer = useCallback(() => {
    if (finalOffer) {
      const orderRef = `ORD_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      setTimerActive(false);
      addMessage("agent", `Booking confirmed at ${formatPrice(finalOffer)}! Reference: ${orderRef}`);
      
      if (isMobileDevice()) {
        hapticFeedback("heavy");
      }
      
      setTimeout(() => {
        onAccept(finalOffer, orderRef);
      }, 1000);
    }
  }, [finalOffer, formatPrice, addMessage, onAccept]);

  const handleTryAgain = useCallback(() => {
    if (round >= 3) {
      addMessage("agent", "You've reached the maximum number of negotiation rounds. You can book at the original price or try again later.");
      setIsComplete(true);
      return;
    }

    setRound(prev => prev + 1);
    setShowOfferActions(false);
    setTimerActive(false);
    setTimerExpired(false);
    setFinalOffer(null);
    setTimerSeconds(30);
    
    addMessage("agent", `Let's try again! What price would you like to offer? (Round ${round + 1}/3)`);
  }, [round, addMessage]);

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent 
        className={`
          mobile-bargain-modal max-w-md mx-auto sm:max-w-lg p-0 
          ${isMobileDevice() ? 'mobile-modal' : ''}
        `}
        style={{ 
          maxHeight: isMobileDevice() ? '95vh' : '90vh',
          borderRadius: isMobileDevice() ? '1.5rem 1.5rem 0 0' : '1rem'
        }}
      >
        {/* Header */}
        <div className="relative bg-gradient-to-r from-[#003580] to-[#0071c2] text-white p-4 sm:p-6 rounded-t-xl">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 hover:bg-white/20 rounded-lg transition-colors"
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
              <div key={message.id} className={`flex ${message.speaker === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`flex max-w-[80%] ${message.speaker === 'user' ? 'flex-row-reverse' : 'flex-row'} items-start space-x-2`}>
                  {/* Avatar */}
                  <div className={`
                    w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-semibold
                    ${message.speaker === 'user' 
                      ? 'bg-gradient-to-r from-[#003580] to-[#0071c2] text-white' 
                      : message.speaker === 'supplier'
                      ? 'bg-gradient-to-r from-blue-50 to-blue-100 text-blue-600'
                      : 'bg-gradient-to-r from-emerald-50 to-emerald-100 text-emerald-600'
                    }
                  `}>
                    {message.speaker === 'user' ? (
                      userName.charAt(0).toUpperCase()
                    ) : message.speaker === 'supplier' ? (
                      <Crown className="w-4 h-4" />
                    ) : (
                      <Star className="w-4 h-4" />
                    )}
                  </div>
                  
                  {/* Message Bubble */}
                  <div className={`
                    px-3 py-2 rounded-lg text-sm
                    ${message.speaker === 'user'
                      ? 'bg-gradient-to-r from-[#003580] to-[#0071c2] text-white'
                      : message.speaker === 'supplier'
                      ? 'bg-gradient-to-r from-blue-50 to-blue-100 text-blue-900'
                      : 'bg-gradient-to-r from-emerald-50 to-emerald-100 text-emerald-900'
                    }
                  `}>
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
                <div className="text-sm text-emerald-700 mb-1">Negotiated Price:</div>
                <div className="text-2xl font-bold text-emerald-800">
                  {formatPrice(finalOffer)}
                </div>
                <div className="text-xs text-emerald-600">
                  Save {formatPrice(basePrice - finalOffer)} ({Math.round(((basePrice - finalOffer) / basePrice) * 100)}% off)
                </div>
              </div>
              
              {timerActive && (
                <div className={`
                  text-right font-mono font-bold
                  ${timerSeconds <= 10 ? 'text-red-600 animate-pulse' : 'text-emerald-600'}
                `}>
                  <Clock className="w-4 h-4 inline mr-1" />
                  {formatTime(timerSeconds)}
                </div>
              )}
            </div>
            
            <div className="space-y-2">
              <Button
                onClick={handleAcceptOffer}
                disabled={timerExpired}
                className="w-full bg-gradient-to-r from-[#003580] to-[#0071c2] hover:from-[#002d66] hover:to-[#005ba8] text-white font-semibold py-3 mobile-touch-target"
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
                  Try Different Price (Round {round + 1}/3)
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
              <div className="text-lg font-semibold text-gray-900">{formatPrice(basePrice)}</div>
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
                    if (e.key === 'Enter') {
                      handleSubmitOffer();
                    }
                  }}
                />
                <button
                  onClick={handleSubmitOffer}
                  disabled={isNegotiating || !currentPrice}
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 w-8 h-8 bg-gradient-to-r from-[#003580] to-[#0071c2] hover:from-[#002d66] hover:to-[#005ba8] disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg flex items-center justify-center"
                >
                  <Sparkles className="w-4 h-4" />
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
              className="w-full bg-gradient-to-r from-[#003580] to-[#0071c2] hover:from-[#002d66] hover:to-[#005ba8] text-white font-semibold py-3"
            >
              Book at Original Price {formatPrice(basePrice)}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

export default ConversationalBargainModal;
