import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { scrollToTop } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import {
  RefreshCw,
  Info,
  MapPin,
  Calendar,
  Users,
  Bed,
  Clock,
  Shield,
  CheckCircle,
  AlertCircle,
} from "lucide-react";
import { useCurrency } from "@/contexts/CurrencyContext";
import {
  calculateTotalPrice,
  formatLocalPrice,
  PriceCalculation,
} from "@/lib/pricing";
import { numberToWords, formatPriceInWords } from "@/lib/numberToWords";

interface RoomType {
  id: string;
  name: string;
  description: string;
  image: string;
  marketPrice: number;
  totalPrice: number;
  features: string[];
  maxOccupancy: number;
  bedType: string;
  size: string;
  cancellation: string;
}

interface Hotel {
  id: number;
  name: string;
  location: string;
  checkIn: string;
  checkOut: string;
}

interface BargainState {
  phase: "initial" | "negotiating" | "counter_offer" | "accepted" | "rejected";
  userOffers: number[];
  currentCounterOffer?: number;
  timeRemaining: number;
  isTimerActive: boolean;
  negotiationProgress: number;
}

interface FlightStyleBargainModalProps {
  roomType: RoomType | null;
  hotel: Hotel | null;
  isOpen: boolean;
  onClose: () => void;
  checkInDate: Date;
  checkOutDate: Date;
  roomsCount: number;
  onBookingSuccess?: (finalPrice: number) => void;
}

// Helper function to get currency word form
const getCurrencyWordForm = (currencyCode: string): string => {
  switch (currencyCode) {
    case "INR":
      return "rupees";
    case "USD":
      return "dollars";
    case "EUR":
      return "euros";
    case "GBP":
      return "pounds";
    case "CAD":
      return "canadian dollars";
    case "AUD":
      return "australian dollars";
    default:
      return "units";
  }
};

// Format number with commas
const formatNumberWithCommas = (num: string | number): string => {
  const numStr = typeof num === "string" ? num : num.toString();
  return parseInt(numStr).toLocaleString("en-IN");
};

export function FlightStyleBargainModal({
  roomType,
  hotel,
  isOpen,
  onClose,
  checkInDate,
  checkOutDate,
  roomsCount,
  onBookingSuccess,
}: FlightStyleBargainModalProps) {
  const { selectedCurrency } = useCurrency();
  const navigate = useNavigate();
  const [bargainPrice, setBargainPrice] = useState("");
  const [bargainState, setBargainState] = useState<BargainState>({
    phase: "initial",
    userOffers: [],
    timeRemaining: 30,
    isTimerActive: false,
    negotiationProgress: 0,
  });
  const [usedPrices, setUsedPrices] = useState<Set<string>>(new Set());

  const [priceCalculation, setPriceCalculation] =
    useState<PriceCalculation | null>(null);

  // Calculate pricing when modal opens or currency changes
  useEffect(() => {
    if (roomType && checkInDate && checkOutDate) {
      const nights = Math.max(
        1,
        Math.ceil(
          (checkOutDate.getTime() - checkInDate.getTime()) /
            (1000 * 60 * 60 * 24),
        ),
      );
      const basePricePerNight =
        roomType.totalPrice || roomType.marketPrice || 129;
      const rooms = roomsCount || 1;
      const breakdown = calculateTotalPrice(basePricePerNight, nights, rooms);

      const calculation: PriceCalculation = {
        perNightPrice: basePricePerNight,
        totalNights: nights,
        roomsCount: rooms,
        subtotal: breakdown.basePrice,
        taxes: breakdown.taxes,
        fees: breakdown.fees,
        total: breakdown.total,
      };
      setPriceCalculation(calculation);
    }
  }, [roomType, checkInDate, checkOutDate, roomsCount, selectedCurrency]);

  // Timer effect
  useEffect(() => {
    if (bargainState.isTimerActive && bargainState.timeRemaining > 0) {
      console.log("⏰ Timer tick:", bargainState.timeRemaining);
      const timer = setTimeout(() => {
        setBargainState((prev) => ({
          ...prev,
          timeRemaining: prev.timeRemaining - 1,
        }));
      }, 1000);
      return () => clearTimeout(timer);
    } else if (bargainState.isTimerActive && bargainState.timeRemaining === 0) {
      console.log("⏰ Timer expired");
      if (bargainState.phase === "counter_offer") {
        setBargainState((prev) => ({
          ...prev,
          phase: "rejected",
          isTimerActive: false,
        }));
      } else if (bargainState.phase === "accepted") {
        // In accepted phase, timer expiry just stops the timer but stays in accepted phase
        setBargainState((prev) => ({
          ...prev,
          isTimerActive: false,
        }));
      }
    }
  }, [
    bargainState.isTimerActive,
    bargainState.timeRemaining,
    bargainState.phase,
  ]);

  // Reset state when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setBargainState({
        phase: "initial",
        userOffers: [],
        timeRemaining: 30,
        isTimerActive: false,
      });
      setBargainPrice("");
      setUsedPrices(new Set());
    }
  }, [isOpen]);

  const startBargaining = async () => {
    if (!bargainPrice || !priceCalculation) return;

    const proposedPrice = parseInt(bargainPrice);
    const priceKey = `${priceCalculation.total}-${proposedPrice}`;

    // Check if price was already used
    if (usedPrices.has(priceKey)) {
      return;
    }

    // Add to used prices
    setUsedPrices((prev) => new Set([...prev, priceKey]));

    setBargainState((prev) => ({
      ...prev,
      phase: "negotiating",
      userOffers: [...prev.userOffers, proposedPrice],
      negotiationProgress: 0,
    }));

    // Simulate negotiation with progress animation
    const progressInterval = setInterval(() => {
      setBargainState((prev) => {
        const newProgress = prev.negotiationProgress + 10;
        if (newProgress >= 100) {
          clearInterval(progressInterval);
          return { ...prev, negotiationProgress: 100 };
        }
        return { ...prev, negotiationProgress: newProgress };
      });
    }, 300); // 300ms * 10 = 3000ms total

    await new Promise((resolve) => setTimeout(resolve, 3000));

    // Negotiation logic
    const originalTotalPrice = priceCalculation.total;
    const minAcceptablePrice = originalTotalPrice * 0.65;
    const goodPrice = originalTotalPrice * 0.95;

    // Force counter offer for testing - 80% chance of counter offer
    const shouldCounter = Math.random() > 0.2;

    if (proposedPrice >= goodPrice && !shouldCounter) {
      setBargainState((prev) => ({
        ...prev,
        phase: "accepted",
        isTimerActive: false,
      }));
    } else if (proposedPrice >= minAcceptablePrice) {
      const counterOffer = Math.round(
        originalTotalPrice * (0.8 + Math.random() * 0.1),
      );
      console.log("🕒 TIMER STARTING - Counter offer phase triggered", {
        proposedPrice,
        originalTotalPrice,
        counterOffer,
        timeRemaining: 30,
        isTimerActive: true,
      });
      setBargainState((prev) => {
        const newState = {
          ...prev,
          phase: "counter_offer",
          currentCounterOffer: counterOffer,
          timeRemaining: 30,
          isTimerActive: true,
        };
        console.log("🔄 NEW BARGAIN STATE:", newState);
        return newState;
      });
    } else {
      setBargainState((prev) => ({
        ...prev,
        phase: "rejected",
        isTimerActive: false,
      }));
    }

    setBargainPrice("");
  };

  const handleAcceptCounterOffer = () => {
    const finalPrice = bargainState.currentCounterOffer || 0;

    // Close modal immediately to prevent double-click issues
    onClose();

    if (onBookingSuccess) {
      // For sightseeing: call the booking success callback
      onBookingSuccess(finalPrice);
    } else {
      // For hotels: navigate to reservation page
      setBargainState((prev) => ({
        ...prev,
        phase: "accepted",
        isTimerActive: true,
        timeRemaining: 28, // Reset timer for booking urgency
      }));
    }
  };

  const handleBookOriginal = () => {
    if (!priceCalculation || !roomType || !hotel) return;

    // Navigate to reservation page with original pricing
    const searchParams = new URLSearchParams({
      hotelId: hotel?.id.toString() || "",
      roomId: roomType?.id || "",
      checkIn: checkInDate.toISOString().split("T")[0],
      checkOut: checkOutDate.toISOString().split("T")[0],
      rooms: roomsCount.toString(),
      totalPrice: priceCalculation.total.toString(), // Use original calculated total
      pricePerNight: roomType?.totalPrice.toString() || "", // Original per-night price
      currency: selectedCurrency.code,
      bargained: "false", // This is original pricing, not bargained
      hotelName: encodeURIComponent(hotel?.name || ""),
      location: encodeURIComponent(hotel?.location || ""),
    });
    navigate(`/reserve?${searchParams.toString()}`);

    // Call the booking success callback if provided
    if (onBookingSuccess) {
      onBookingSuccess(priceCalculation.total);
    }

    // Close the modal
    onClose();
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
    });
  };

  if (!roomType || !hotel || !priceCalculation) return null;

  const renderContent = () => {
    switch (bargainState.phase) {
      case "initial":
        return (
          <>
            {/* Hotel Info - Exact flight layout */}
            <div className="bg-white rounded-xl p-3 md:p-6 border border-[#003580]/10 shadow-sm">
              <div className="flex items-center justify-between mb-3 md:mb-4">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-[#003580]/10 rounded-lg flex items-center justify-center">
                    <Bed className="w-6 h-6 text-[#003580]" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg text-gray-900">
                      {hotel.name}
                    </h3>
                    <p className="text-sm text-gray-600">
                      {roomType.name} • {hotel.name}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-2xl md:text-3xl font-bold text-[#003580] mb-1">
                    {formatLocalPrice(
                      priceCalculation.total,
                      selectedCurrency.code,
                    )}
                  </p>
                  <p className="text-xs text-gray-500">(All Inclusive Price)</p>
                </div>
              </div>
            </div>

            {/* AI Interface - Exact flight layout */}
            <div className="space-y-3 md:space-y-4">
              <div className="flex items-center space-x-3 md:space-x-4 p-3 md:p-4 bg-gradient-to-r from-[#003580]/5 to-[#0071c2]/5 rounded-xl border border-[#003580]/10">
                <div className="w-12 h-12 bg-gradient-to-r from-[#003580] to-[#0071c2] rounded-full flex items-center justify-center">
                  <span className="text-white font-bold text-sm">AI</span>
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-gray-900">
                    AI Assistant
                  </p>
                  <p className="text-sm text-gray-600">
                    Tell me your target price and I'll negotiate with the hotel!
                  </p>
                </div>
              </div>

              <div>
                <label className="block text-sm md:text-base font-semibold mb-3 text-gray-900 text-center">
                  What price would you like to pay? ({selectedCurrency.symbol})
                </label>

                <div className="relative">
                  <Input
                    type="text"
                    value={
                      bargainPrice ? formatNumberWithCommas(bargainPrice) : ""
                    }
                    onChange={(e) => {
                      const numericValue = e.target.value.replace(
                        /[^0-9]/g,
                        "",
                      );
                      // Allow empty input or validate that price doesn't exceed total price
                      const totalPrice = priceCalculation?.total || 0;
                      const enteredPrice = parseInt(numericValue) || 0;

                      if (numericValue === "" || enteredPrice <= totalPrice) {
                        setBargainPrice(numericValue);
                      }
                    }}
                    placeholder="Enter your target price"
                    className="text-lg md:text-xl font-bold text-center py-4 md:py-6 border-2 focus:border-[#003580] placeholder:text-gray-400 placeholder:font-normal rounded-xl bg-white shadow-sm transition-colors border-[#003580]/20"
                  />
                  <div className="absolute inset-y-0 left-3 md:left-4 flex items-center">
                    <span className="text-[#003580] text-lg md:text-xl font-semibold">
                      {selectedCurrency.symbol}
                    </span>
                  </div>
                </div>
                {bargainPrice && (
                  <p className="text-center text-sm text-gray-600 mt-2 font-medium">
                    {formatPriceInWords(parseInt(bargainPrice))}
                  </p>
                )}
                <p className="text-center text-xs text-gray-500 mt-2">
                  Enter between {selectedCurrency.symbol}1 and {selectedCurrency.symbol}{formatNumberWithCommas(priceCalculation?.total.toString() || "0")}
                </p>
              </div>

              <Button
                onClick={startBargaining}
                disabled={!bargainPrice || parseInt(bargainPrice) <= 0 || parseInt(bargainPrice) > (priceCalculation?.total || 0)}
                className="w-full bg-gradient-to-r from-[#003580] to-[#0071c2] hover:from-[#002d6b] hover:to-[#005a9f] text-white py-4 md:py-6 text-base md:text-lg font-semibold rounded-xl disabled:bg-gray-400 shadow-lg touch-manipulation"
              >
                Start AI Negotiation
              </Button>
            </div>
          </>
        );

      case "negotiating":
        return (
          <div className="text-center space-y-6 py-8">
            <div className="relative">
              <div className="w-24 h-24 mx-auto bg-gradient-to-r from-[#003580] to-[#0071c2] rounded-full flex items-center justify-center animate-pulse shadow-lg">
                <RefreshCw className="w-12 h-12 text-white animate-spin" />
              </div>
            </div>
            <div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">
                AI Negotiating with {hotel.name}
              </h3>
              <p className="text-sm text-gray-600 mb-4">
                Analyzing market rates and finding the best deal for you...
              </p>
              <Progress
                value={bargainState.negotiationProgress}
                className="w-full h-4 bg-gray-200"
              />
              <p className="text-sm text-[#003580] font-semibold mt-2">
                {bargainState.negotiationProgress}% Complete
              </p>
            </div>
          </div>
        );

      case "counter_offer":
        console.log("🎯 RENDERING COUNTER OFFER PHASE WITH TIMER", {
          timeRemaining: bargainState.timeRemaining,
          isTimerActive: bargainState.isTimerActive,
          currentCounterOffer: bargainState.currentCounterOffer,
        });
        const savings =
          priceCalculation.total - (bargainState.currentCounterOffer || 0);
        return (
          <>
            <div className="text-center">
              <h3 className="text-2xl font-bold text-[#003580] mb-2">
                AI Counter Offer!
              </h3>
              <p className="text-gray-600 mb-1 text-lg">
                The hotel couldn't match your price, but here's their best
                offer!
              </p>
            </div>

            <div className="bg-white border-2 border-[#003580]/20 rounded-xl p-8 shadow-lg">
              <div className="text-4xl font-bold text-[#003580] mb-2">
                {selectedCurrency.symbol}
                {(bargainState.currentCounterOffer || 0).toLocaleString()}
              </div>
              <p className="text-sm text-[#003580] font-medium mb-3">
                {formatPriceInWords(bargainState.currentCounterOffer || 0)}
              </p>
              <div className="text-center">
                <span className="text-sm font-semibold text-[#003580] bg-[#003580]/10 px-4 py-2 rounded-full">
                  You save {selectedCurrency.symbol}
                  {savings.toLocaleString()}!
                </span>
              </div>
            </div>

            <div className="bg-white border-2 border-[#febb02] rounded-xl p-4 shadow-lg">
              <div className="flex items-center justify-center space-x-3">
                <span className="font-bold text-[#003580] text-xl">
                  Offer expires in: {bargainState.timeRemaining}s
                </span>
              </div>
            </div>

            <div className="space-y-4">
              <Button
                onClick={handleAcceptCounterOffer}
                disabled={bargainState.timeRemaining === 0}
                className="w-full bg-gradient-to-r from-[#003580] to-[#0071c2] hover:from-[#002d6b] hover:to-[#005a9f] text-white py-5 text-xl font-bold rounded-xl shadow-lg"
              >
                Book This Deal - {selectedCurrency.symbol}
                {(bargainState.currentCounterOffer || 0).toLocaleString()}
              </Button>

              <Button
                onClick={() =>
                  setBargainState((prev) => ({ ...prev, phase: "initial" }))
                }
                variant="outline"
                className="w-full border-2 border-[#003580] text-[#003580] hover:bg-[#003580] hover:text-white py-4 text-lg font-semibold rounded-xl"
              >
                Try Different Price
              </Button>
            </div>
          </>
        );

      case "accepted":
        const finalPrice =
          bargainState.currentCounterOffer ||
          bargainState.userOffers[bargainState.userOffers.length - 1] ||
          0;
        return (
          <div className="text-center space-y-6">
            <div className="text-center">
              <h3 className="text-2xl font-bold text-[#003580] mb-2">
                Perfect Match!
              </h3>
              <p className="text-gray-600 mb-1 text-lg">
                The hotel accepted your exact price!
              </p>
            </div>

            <div className="bg-white border-2 border-[#003580]/20 rounded-xl p-8 shadow-lg">
              <div className="text-4xl font-bold text-[#003580] mb-2">
                {selectedCurrency.symbol}
                {finalPrice.toLocaleString()}
              </div>
              <p className="text-sm text-[#003580] font-medium">
                {formatPriceInWords(finalPrice)}
              </p>
            </div>

            <div className="bg-white border-2 border-[#febb02] rounded-xl p-4 shadow-lg">
              <div className="flex items-center justify-center space-x-3">
                <span className="font-bold text-[#003580] text-xl">
                  Offer expires in: {bargainState.timeRemaining}s
                </span>
              </div>
            </div>

            <Button
              onClick={() => {
                // Close modal immediately to prevent double-click issues
                onClose();

                if (onBookingSuccess) {
                  onBookingSuccess(finalPrice);
                } else {
                  const searchParams = new URLSearchParams({
                    hotelId: hotel?.id.toString() || "",
                    roomId: roomType?.id || "",
                    checkIn: checkInDate.toISOString().split("T")[0],
                    checkOut: checkOutDate.toISOString().split("T")[0],
                    rooms: roomsCount.toString(),
                    totalPrice: finalPrice.toString(),
                    pricePerNight: roomType?.totalPrice.toString() || "",
                    currency: selectedCurrency.code,
                    bargained: "true",
                    hotelName: encodeURIComponent(hotel?.name || ""),
                    location: encodeURIComponent(hotel?.location || ""),
                  });
                  navigate(`/reserve?${searchParams.toString()}`);
                  scrollToTop();
                }
              }}
              className="w-full bg-gradient-to-r from-[#003580] to-[#0071c2] hover:from-[#002d6b] hover:to-[#005a9f] text-white py-5 text-xl font-bold rounded-xl shadow-lg"
            >
              Book This Deal - {selectedCurrency.symbol}
              {finalPrice.toLocaleString()}
            </Button>

            <Button
              onClick={() =>
                setBargainState({
                  phase: "initial",
                  userOffers: [],
                  timeRemaining: 30,
                  isTimerActive: false,
                })
              }
              variant="outline"
              className="w-full border-2 border-[#003580] text-[#003580] hover:bg-[#003580] hover:text-white py-4 text-lg font-semibold rounded-xl"
            >
              Try Different Price
            </Button>
          </div>
        );

      case "rejected":
        return (
          <div className="text-center space-y-6">
            <div className="text-center">
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Offer Not Accepted
              </h3>
              <p className="text-gray-600 text-sm">
                {bargainState.timeRemaining === 0
                  ? "Time expired! The offer is no longer available."
                  : "Your offer was too low. Try a higher amount."}
              </p>
            </div>

            {bargainState.timeRemaining === 0 && (
              <div className="bg-white border-2 border-[#003580]/20 rounded-xl p-4 shadow-lg">
                <p className="text-[#003580] font-medium">Offer has expired</p>
              </div>
            )}

            <div className="space-y-4">
              <Button
                onClick={() =>
                  setBargainState({
                    phase: "initial",
                    userOffers: [],
                    timeRemaining: 30,
                    isTimerActive: false,
                  })
                }
                className="w-full bg-gradient-to-r from-[#003580] to-[#0071c2] hover:from-[#002d6b] hover:to-[#005a9f] text-white py-4 text-lg font-semibold rounded-xl"
              >
                Start New Negotiation
              </Button>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-full h-full max-w-none m-0 rounded-none md:max-w-2xl md:h-auto md:rounded-lg bg-gradient-to-br from-blue-50 to-white overflow-y-auto">
        <DialogHeader className="border-b border-[#003580]/20 pb-4 bg-gradient-to-r from-[#003580] to-[#0071c2] text-white rounded-t-lg -m-6 mb-0 p-6">
          <DialogTitle className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-white/20 backdrop-blur rounded-full flex items-center justify-center">
              <span className="text-white text-sm font-bold">AI</span>
            </div>
            <span className="text-xl font-semibold">AI Price Negotiator</span>
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 md:space-y-6 p-3 md:p-6">
          {renderContent()}
        </div>
      </DialogContent>
    </Dialog>
  );
}
