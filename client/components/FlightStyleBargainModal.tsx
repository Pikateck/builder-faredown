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
import { numberToWords } from "@/lib/numberToWords";

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
      const timer = setTimeout(() => {
        setBargainState((prev) => ({
          ...prev,
          timeRemaining: prev.timeRemaining - 1,
        }));
      }, 1000);
      return () => clearTimeout(timer);
    } else if (bargainState.isTimerActive && bargainState.timeRemaining === 0) {
      setBargainState((prev) => ({
        ...prev,
        phase: "rejected",
        isTimerActive: false,
      }));
    }
  }, [bargainState.isTimerActive, bargainState.timeRemaining]);

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
    const minAcceptablePrice = originalTotalPrice * 0.75;
    const goodPrice = originalTotalPrice * 0.85;

    if (proposedPrice >= goodPrice) {
      setBargainState((prev) => ({
        ...prev,
        phase: "accepted",
        isTimerActive: false,
      }));
    } else if (proposedPrice >= minAcceptablePrice) {
      const counterOffer = Math.round(
        originalTotalPrice * (0.8 + Math.random() * 0.1),
      );
      setBargainState((prev) => ({
        ...prev,
        phase: "counter_offer",
        currentCounterOffer: counterOffer,
        timeRemaining: 30,
        isTimerActive: true,
      }));
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
    setBargainState((prev) => ({
      ...prev,
      phase: "accepted",
      isTimerActive: false,
    }));
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
          <div className="space-y-6">
            {/* Hotel Info - Matching flight layout exactly */}
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-4 border border-blue-200">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h3 className="font-bold text-lg text-gray-900">
                    {hotel.name}
                  </h3>
                  <p className="text-sm text-gray-600">
                    {roomType.name} • {hotel.name}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-600">
                    Total Price (incl. taxes)
                  </p>
                  <p className="text-2xl font-bold text-gray-900">
                    {formatLocalPrice(
                      priceCalculation.total,
                      selectedCurrency.code,
                    )}
                  </p>
                  <p className="text-xs text-gray-500">
                    {formatLocalPrice(roomType.totalPrice, selectedCurrency.code)} per night × {Math.ceil((new Date(hotel.checkOut).getTime() - new Date(hotel.checkIn).getTime()) / (1000 * 60 * 60 * 24))} nights
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    Taxes, fees & charges included
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-2 text-xs text-gray-600">
                <Bed className="w-3 h-3" />
                <span>Room included</span>
                <span>•</span>
                <Shield className="w-3 h-3" />
                <span>Flexible booking</span>
              </div>
            </div>

            {/* AI Negotiation Interface - Exact flight layout */}
            <div className="space-y-4">
              <div className="flex items-center space-x-3 p-4 bg-gradient-to-r from-purple-50 via-blue-50 to-indigo-50 rounded-xl border border-purple-200 shadow-sm">
                <div className="relative">
                  <div className="w-12 h-12 bg-gradient-to-br from-purple-600 via-blue-600 to-indigo-600 rounded-full flex items-center justify-center shadow-lg">
                    <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center">
                      <span className="text-transparent bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text font-bold text-sm">AI</span>
                    </div>
                  </div>
                  <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
                    <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                  </div>
                </div>
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-1">
                    <p className="text-sm font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                      AI Price Negotiator
                    </p>
                    <div className="px-2 py-0.5 bg-gradient-to-r from-green-500 to-emerald-500 text-white text-xs font-medium rounded-full">
                      LIVE
                    </div>
                  </div>
                  <p className="text-xs text-gray-600">
                    Tell me your target price and I'll negotiate with the hotel in real-time!
                  </p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-3 text-gray-900">
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
                      // Check if this price was already tried
                      const priceKey = `${priceCalculation.total}-${parseInt(numericValue)}`;
                      if (numericValue && usedPrices.has(priceKey)) {
                        // Don't update if price already tried
                        return;
                      }
                      setBargainPrice(numericValue);
                    }}
                    placeholder={usedPrices.size > 0 ? `Already tried: ${Array.from(usedPrices).map(p => formatNumberWithCommas(p.split("-")[1])).join(", ")} - Try different price` : "Enter the total price you want to pay for your stay"}
                    className={`text-xl font-bold text-center py-6 border-2 focus:border-purple-500 placeholder:text-gray-400 placeholder:font-normal ${
                      usedPrices.size > 0 && bargainPrice && usedPrices.has(`${priceCalculation.total}-${parseInt(bargainPrice)}`)
                        ? "border-red-300 bg-red-50"
                        : "border-purple-200"
                    }`}
                  />
                  <div className="absolute inset-y-0 left-3 flex items-center">
                    <span className="text-gray-500 text-xl">
                      {selectedCurrency.symbol}
                    </span>
                  </div>
                </div>
                {bargainPrice && parseInt(bargainPrice) > 0 && (
                  <div className="mt-3">
                    {/* Price in words */}
                    <div className="text-xs text-gray-600 text-center mb-3">
                      {numberToWords(parseInt(bargainPrice))}{" "}
                      {getCurrencyWordForm(selectedCurrency.code)} only
                    </div>

                    {/* Validation popup */}
                    <div className="bg-gradient-to-r from-green-50 to-blue-50 border border-green-200 rounded-xl p-4 shadow-sm">
                      <div className="flex items-center justify-center space-x-2 mb-2">
                        <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                          <span className="text-white text-sm font-bold">
                            ✓
                          </span>
                        </div>
                        <span className="text-green-700 font-semibold">
                          Price Ready!
                        </span>
                      </div>
                      <p className="text-sm text-gray-700 text-center">
                        Your offer of{" "}
                        <span className="font-bold text-green-600">
                          {selectedCurrency.symbol}
                          {formatNumberWithCommas(bargainPrice)}
                        </span>{" "}
                        is ready for AI negotiation.
                      </p>
                      {parseInt(bargainPrice) <
                        priceCalculation.total * 0.7 && (
                        <p className="text-xs text-amber-600 text-center mt-2">
                          Very aggressive pricing - success rate may be lower
                        </p>
                      )}
                      {parseInt(bargainPrice) >= priceCalculation.total * 0.7 &&
                        parseInt(bargainPrice) <=
                          priceCalculation.total * 0.9 && (
                          <p className="text-xs text-green-600 text-center mt-2">
                            Good negotiation range - higher success probability
                          </p>
                        )}
                    </div>
                  </div>
                )}
              </div>

              {/* Used Prices Warning */}
              {usedPrices.size > 0 && (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                  <div className="flex items-center space-x-2">
                    <Info className="w-4 h-4 text-amber-600" />
                    <span className="text-sm font-medium text-amber-800">
                      Already tried:{" "}
                      {Array.from(usedPrices)
                        .map((p) => formatNumberWithCommas(p.split("-")[1]))
                        .join(", ")}
                    </span>
                  </div>
                  <p className="text-xs text-amber-700 mt-1">
                    Choose a different price to negotiate again
                  </p>
                </div>
              )}

              {/* AI Tips */}
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-xl p-4 shadow-sm">
                <div className="flex items-start space-x-3">
                  <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full flex items-center justify-center flex-shrink-0 shadow-md">
                    <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-bold text-blue-900 mb-2 flex items-center">
                      💡 Smart Pricing Tips
                    </p>
                    <div className="space-y-2 text-xs text-blue-800">
                      <p className="flex items-center space-x-1">
                        <span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span>
                        <span><strong>20-30% below</strong> current price = Higher success rate</span>
                      </p>
                      <p className="flex items-center space-x-1">
                        <span className="w-1.5 h-1.5 bg-blue-500 rounded-full"></span>
                        <span><strong>Total Price Inclusive</strong> - taxes, fees & charges included</span>
                      </p>
                      <p className="flex items-center space-x-1">
                        <span className="w-1.5 h-1.5 bg-purple-500 rounded-full"></span>
                        <span>AI matches your budget or offers the closest possible deal!</span>
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <Button
                onClick={startBargaining}
                disabled={
                  !bargainPrice ||
                  parseInt(bargainPrice) <= 0 ||
                  usedPrices.has(
                    `${priceCalculation.total}-${parseInt(bargainPrice)}`,
                  )
                }
                className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white py-6 text-lg font-semibold rounded-xl disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                Start AI Negotiation
              </Button>
            </div>
          </div>
        );

      case "negotiating":
        return (
          <div className="text-center space-y-6 py-8">
            <div className="relative">
              <div className="w-20 h-20 mx-auto bg-gradient-to-r from-purple-500 to-blue-500 rounded-full flex items-center justify-center animate-pulse">
                <RefreshCw className="w-10 h-10 text-white animate-spin" />
              </div>
              <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                <span className="text-white text-xs">✓</span>
              </div>
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                AI Negotiating with {hotel.name}
              </h3>
              <p className="text-sm text-gray-600 mb-4">
                Analyzing market rates and finding the best deal for you...
              </p>
              <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
                <div
                  className="bg-gradient-to-r from-purple-500 to-blue-500 h-2 rounded-full transition-all duration-300 ease-out"
                  style={{ width: `${bargainState.negotiationProgress}%` }}
                ></div>
              </div>
              <p className="text-xs text-gray-500">
                {bargainState.negotiationProgress}% Complete
              </p>
            </div>
          </div>
        );

      case "counter_offer":
        const savings =
          priceCalculation.total - (bargainState.currentCounterOffer || 0);
        return (
          <div className="space-y-6">
            <div className="text-center">
              <div className="relative w-20 h-20 mx-auto mb-4">
                <div className="w-20 h-20 bg-gradient-to-br from-orange-400 via-red-500 to-pink-500 rounded-full flex items-center justify-center shadow-xl">
                  <div className="w-14 h-14 bg-white rounded-full flex items-center justify-center">
                    <svg className="w-8 h-8 text-orange-500" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-8.293l-3-3a1 1 0 00-1.414 1.414L10.586 9H7a1 1 0 100 2h3.586l-1.293 1.293a1 1 0 101.414 1.414l3-3a1 1 0 000-1.414z" clipRule="evenodd" />
                    </svg>
                  </div>
                </div>
                <div className="absolute -top-2 -right-2 w-8 h-8 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full flex items-center justify-center shadow-lg">
                  <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
              </div>
              <h3 className="font-bold text-xl bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent mb-2">
                ✨ AI Counter Offer!
              </h3>
              <p className="text-gray-600 font-medium">
                The hotel found your price, but here's their best offer!
              </p>
            </div>

            <div className="bg-orange-50 border border-orange-200 p-4 rounded-lg">
              <div className="flex items-center justify-center mb-2">
                <Clock className="w-5 h-5 text-orange-600 mr-2" />
                <span className="text-orange-600 font-medium">
                  ⚡ Offer expires in {formatTime(bargainState.timeRemaining)}
                </span>
              </div>
              <Progress
                value={(bargainState.timeRemaining / 30) * 100}
                className="h-2 mb-3"
              />
            </div>

            <div className="bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 border-2 border-blue-300 shadow-xl p-6 rounded-2xl text-center relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500"></div>

              <div className="relative z-10">
                <div className="flex items-center justify-center mb-3">
                  <div className="w-6 h-6 bg-gray-400 rounded-full flex items-center justify-center mr-2">
                    <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z" />
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <span className="text-sm text-gray-600 font-medium">Your Offer</span>
                </div>
                <div className="text-lg text-gray-700 mb-4 font-semibold">
                  {selectedCurrency.symbol}
                  {(
                    bargainState.userOffers[bargainState.userOffers.length - 1] ||
                    0
                  ).toLocaleString()}
                </div>

                <div className="flex items-center justify-center mb-3">
                  <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center mr-2 shadow-lg">
                    <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <span className="text-sm font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">AI Negotiated Price</span>
                </div>
                <div className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
                  {selectedCurrency.symbol}
                  {(bargainState.currentCounterOffer || 0).toLocaleString()}
                </div>
                <div className="flex items-center justify-center">
                  <div className="w-6 h-6 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full flex items-center justify-center mr-2">
                    <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <span className="text-sm text-green-600 font-bold">
                    You save {selectedCurrency.symbol}
                    {savings.toLocaleString()}!
                  </span>
                </div>
              </div>
            </div>

            <div className="flex space-x-3">
              <Button
                variant="outline"
                onClick={() =>
                  setBargainState((prev) => ({ ...prev, phase: "initial" }))
                }
                className="flex-1 border-2 border-purple-300 text-purple-600 hover:bg-purple-50 font-semibold"
                disabled={bargainState.timeRemaining === 0}
              >
                <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M7.707 14.707a1 1 0 01-1.414 0L2.586 11H9a1 1 0 100-2H2.586l3.707-3.707a1 1 0 00-1.414-1.414l-5.657 5.657a1 1 0 000 1.414l5.657 5.657a1 1 0 001.414 0z" clipRule="evenodd" />
                </svg>
                Try Different Price
              </Button>
              <Button
                onClick={handleAcceptCounterOffer}
                className="flex-1 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-bold shadow-lg"
                disabled={bargainState.timeRemaining === 0}
              >
                <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                Book This Deal
              </Button>
            </div>
          </div>
        );

      case "accepted":
        const finalPrice =
          bargainState.currentCounterOffer ||
          bargainState.userOffers[bargainState.userOffers.length - 1] ||
          0;
        const finalSavings = Math.max(0, priceCalculation.total - finalPrice);
        const savingsPercentage =
          priceCalculation.total > 0
            ? Math.round((finalSavings / priceCalculation.total) * 100)
            : 0;

        return (
          <div className="text-center space-y-6">
            <div className="w-20 h-20 mx-auto bg-green-100 rounded-full flex items-center justify-center mb-4">
              <CheckCircle className="w-12 h-12 text-green-500" />
            </div>
            <div>
              <h3 className="text-2xl font-bold text-green-600 mb-2">
                Perfect Match!
              </h3>
              <p className="text-gray-600 mb-4">
                The airline accepted your exact price!
              </p>
              <p className="text-sm text-gray-600 mb-6">
                This is your final all-inclusive price - includes all taxes,
                fees & payment gateway charges. Only airline will be contacted!
              </p>
            </div>

            <div className="bg-gradient-to-r from-green-50 to-blue-50 border border-green-200 p-6 rounded-xl">
              <div className="flex justify-between text-sm text-gray-600 mb-2">
                <span>Your Offer:</span>
                <span className="font-semibold">
                  {selectedCurrency.symbol}
                  {(
                    bargainState.userOffers[
                      bargainState.userOffers.length - 1
                    ] || 0
                  ).toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between text-sm text-gray-600 mb-4">
                <span>Original Price:</span>
                <span className="font-semibold">
                  {formatLocalPrice(
                    priceCalculation.total,
                    selectedCurrency.code,
                  )}
                </span>
              </div>
              <div className="border-t pt-4">
                <div className="flex justify-between text-lg font-bold text-green-600 mb-2">
                  <span>Final Price:</span>
                  <span>
                    {selectedCurrency.symbol}
                    {finalPrice.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
              <div className="flex items-center space-x-2">
                <span className="text-amber-600">⏰</span>
                <span className="text-sm font-medium text-amber-800">
                  Offer expires in 28h
                </span>
              </div>
              <p className="text-xs text-amber-700 mt-1">
                This saved price is only valid for a limited time!
              </p>
            </div>

            <p className="text-xs text-gray-500">
              ℹ️ Book! Choose your seat, meals or extras before final payment
            </p>

            <Button
              onClick={() => {
                if (onBookingSuccess) {
                  onBookingSuccess(finalPrice);
                } else {
                  onClose();
                  const searchParams = new URLSearchParams({
                    hotelId: hotel?.id.toString() || "",
                    roomId: roomType?.id || "",
                    checkIn: checkInDate.toISOString().split("T")[0],
                    checkOut: checkOutDate.toISOString().split("T")[0],
                    rooms: roomsCount.toString(),
                    totalPrice: finalPrice.toString(), // Use totalPrice instead of price
                    pricePerNight: roomType?.totalPrice.toString() || "", // Original per-night price
                    currency: selectedCurrency.code,
                    bargained: "true",
                    hotelName: encodeURIComponent(hotel?.name || ""),
                    location: encodeURIComponent(hotel?.location || ""),
                  });
                  navigate(`/reserve?${searchParams.toString()}`);
                  scrollToTop();
                }
              }}
              className="w-full bg-green-500 hover:bg-green-600 text-white py-4 text-lg font-semibold rounded-xl"
            >
              Book This Deal - {selectedCurrency.symbol}
              {finalPrice.toLocaleString()}
            </Button>
          </div>
        );

      case "rejected":
        return (
          <div className="text-center space-y-6">
            <div className="relative w-20 h-20 mx-auto mb-4">
              <div className="w-20 h-20 bg-gradient-to-br from-red-400 via-orange-500 to-amber-500 rounded-full flex items-center justify-center shadow-xl">
                <div className="w-14 h-14 bg-white rounded-full flex items-center justify-center">
                  <svg className="w-8 h-8 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </div>
              </div>
              <div className="absolute -bottom-1 -right-1 w-8 h-8 bg-gradient-to-r from-amber-400 to-yellow-500 rounded-full flex items-center justify-center shadow-lg">
                <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
            </div>
            <div>
              <h3 className="text-xl font-bold bg-gradient-to-r from-red-600 to-orange-600 bg-clip-text text-transparent mb-2">
                Offer Not Accepted
              </h3>
              <p className="text-gray-600 mb-4 font-medium">
                {bargainState.timeRemaining === 0
                  ? "Time expired! The offer is no longer available."
                  : "Your offer was too low. Try a higher amount."}
              </p>
            </div>

            <div className="bg-red-50 border border-red-200 p-4 rounded-lg">
              <div className="text-sm text-red-700">
                Suggested minimum:{" "}
                {formatLocalPrice(
                  Math.round(priceCalculation.total * 0.75),
                  selectedCurrency.code,
                )}
              </div>
            </div>

            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <div className="flex items-center space-x-2">
                <span className="text-red-600">⚠️</span>
                <span className="text-sm font-medium text-red-800">
                  Offer Expired!
                </span>
              </div>
              <p className="text-xs text-red-700 mt-1">
                The special price has expired. Try negotiating again!
              </p>
            </div>

            <div className="flex space-x-3">
              <Button
                onClick={() =>
                  setBargainState({
                    phase: "initial",
                    userOffers: [],
                    timeRemaining: 30,
                    isTimerActive: false,
                  })
                }
                className="flex-1 bg-purple-500 hover:bg-purple-600 text-white"
              >
                Negotiate Again
              </Button>
              <Button
                variant="outline"
                onClick={handleBookOriginal}
                className="flex-1"
              >
                Book Original
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
      <DialogContent className="max-w-lg mx-2 sm:mx-auto max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full flex items-center justify-center">
              <span className="text-white text-sm font-bold">AI</span>
            </div>
            <span>AI Price Negotiator</span>
          </DialogTitle>
        </DialogHeader>
        {renderContent()}
      </DialogContent>
    </Dialog>
  );
}
