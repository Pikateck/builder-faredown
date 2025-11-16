import { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  MapPin,
  Calendar,
  Users,
  Star,
  Wifi,
  Car,
  Coffee,
  Dumbbell,
  Waves,
  ChevronDown,
  ArrowLeft,
  Menu,
  User,
  BookOpen,
  Award,
  LogOut,
  CreditCard,
  CheckCircle,
  Info,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useEnhancedBooking } from "@/contexts/EnhancedBookingContext";
import { usePriceContext } from "@/contexts/PriceContext";
import {
  verifyPriceIntegrity,
  logPricePipeline,
} from "@/services/priceCalculationService";

export default function HotelBooking() {
  // ✅ Scroll to top on route change (instant for better mobile UX)
  useScrollToTop("auto");

  const navigate = useNavigate();
  const location = useLocation();
  const { booking: enhancedBooking, loadCompleteSearchObject } =
    useEnhancedBooking();
  const { priceSnapshot } = usePriceContext();

  // Load search parameters from location state if available
  useEffect(() => {
    if (location.state?.searchParams) {
      console.log(
        "🏨 Loading hotel search params from location state:",
        location.state.searchParams,
      );
      loadCompleteSearchObject(location.state.searchParams);
    }
  }, [location.state, loadCompleteSearchObject]);

  // Get booking data from enhanced booking context and navigation state
  const selectedHotel = location.state?.selectedHotel;
  const searchParams = enhancedBooking.searchParams;

  // Get return URL to go back to results page with all filters preserved
  const returnUrl =
    location.state?.returnUrl || `/hotels/results?destination=DXB`;

  // ✅ CRITICAL: Use LOCKED dates from location.state (from search), not defaults
  // These dates come from HotelDetails where user made their final selection
  const checkIn =
    location.state?.checkIn ||
    searchParams.checkIn ||
    new Date().toISOString().split("T")[0];
  const checkOut =
    location.state?.checkOut ||
    searchParams.checkOut ||
    new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split("T")[0];

  // ✅ Lock guests from the selection, not defaults
  const guests = {
    adults: location.state?.guests?.adults ?? searchParams.guests?.adults ?? 2,
    children:
      location.state?.guests?.children ?? searchParams.guests?.children ?? 0,
    rooms: location.state?.guests?.rooms ?? searchParams.rooms ?? 1,
  };

  // ✅ Use locked price snapshot if available, otherwise use negotiated price
  const negotiatedPrice =
    location.state?.priceSnapshot?.grandTotal ||
    location.state?.negotiatedPrice ||
    selectedHotel?.price ||
    0;

  // ✅ Calculate nights from locked dates
  const nights =
    location.state?.nights ||
    Math.ceil(
      (new Date(checkOut).getTime() - new Date(checkIn).getTime()) /
        (1000 * 60 * 60 * 24),
    ) ||
    3;

  console.log("🏨 Hotel booking using exact search dates:", {
    checkIn,
    checkOut,
    nights,
    guests,
  });

  // UI States
  const [currentStep, setCurrentStep] = useState(1);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userName, setUserName] = useState("");
  const [showPolicyDetails, setShowPolicyDetails] = useState(false);
  const [showTaxBreakdown, setShowTaxBreakdown] = useState(false);

  // Guest Details State
  const [guestDetails, setGuestDetails] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    country: "India",
    panCard: "",
    specialRequests: "",
  });

  // Payment State
  const [paymentMethod, setPaymentMethod] = useState("card");
  const [cardDetails, setCardDetails] = useState({
    number: "4111 1111 1111 1111",
    expiry: "12/30",
    cvv: "123",
    name: "Test User",
  });

  // Detect card brand from BIN (first 6 digits)
  const detectCardBrand = (cardNumber: string) => {
    const cleaned = cardNumber.replace(/\s/g, "");
    if (/^4/.test(cleaned)) return "Visa";
    if (/^5[1-5]/.test(cleaned)) return "Mastercard";
    if (/^3[47]/.test(cleaned)) return "American Express";
    if (/^6(?:011|5)/.test(cleaned)) return "Discover";
    if (/^35/.test(cleaned)) return "JCB";
    return "Card";
  };

  // Generate mock auth code
  const generateAuthCode = () => {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    return Array.from(
      { length: 6 },
      () => chars[Math.floor(Math.random() * chars.length)],
    ).join("");
  };

  // Extras State
  const [selectedExtras, setSelectedExtras] = useState<string[]>([]);

  // Preferences State
  const [preferences, setPreferences] = useState({
    bedType: "king",
    smokingPreference: "non-smoking",
    floorPreference: "high",
    earlyCheckIn: false,
    lateCheckOut: false,
    dailyHousekeeping: false,
  });

  // Redirect if no hotel data
  useEffect(() => {
    if (!selectedHotel) {
      navigate("/hotels");
    }
  }, [selectedHotel, navigate]);

  // Format currency
  const formatCurrency = (amount: number) => {
    return `₹${amount.toLocaleString("en-IN")}`;
  };

  // Calculate dates
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      weekday: "short",
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  // Available extras
  const availableExtras = [
    {
      id: "early-checkin",
      name: "Early Check-in (12:00 PM)",
      price: 2000,
      description: "Check in 3 hours early",
    },
    {
      id: "late-checkout",
      name: "Late Check-out (3:00 PM)",
      price: 1500,
      description: "Check out 3 hours late",
    },
    {
      id: "airport-transfer",
      name: "Airport Transfer",
      price: 3500,
      description: "Round-trip airport pickup",
    },
    {
      id: "spa-access",
      name: "Spa Access",
      price: 5000,
      description: "Full day spa and wellness center access",
    },
    {
      id: "room-upgrade",
      name: "Room Upgrade",
      price: 8000,
      description: "Upgrade to next room category",
    },
  ];

  // Calculate extras total
  const calculateExtrasTotal = () => {
    return selectedExtras.reduce((total, extraId) => {
      const extra = availableExtras.find((e) => e.id === extraId);
      return total + (extra?.price || 0);
    }, 0);
  };

  // Calculate detailed tax breakdown
  const calculateTaxBreakdown = () => {
    // ✅ negotiatedPrice is already the TOTAL for all nights (from bargain modal)
    // DO NOT multiply by nights again
    const roomSubtotal = negotiatedPrice;
    const extrasTotal = calculateExtrasTotal();
    const subtotalBeforeTax = roomSubtotal + extrasTotal;

    // Detailed tax breakdown (18% total)
    const gstVat = Math.round(subtotalBeforeTax * 0.12); // 12% GST/VAT
    const municipalTax = Math.round(subtotalBeforeTax * 0.04); // 4% Municipal
    const serviceFee = Math.round(subtotalBeforeTax * 0.02); // 2% Service Fee
    const totalTaxes = gstVat + municipalTax + serviceFee;

    // ✅ bargainDiscount is already the total discount (not per-night)
    const bargainDiscount =
      location.state?.originalPrice && location.state?.bargainedPrice
        ? location.state.originalPrice - location.state.bargainedPrice
        : 0;

    const grandTotal = subtotalBeforeTax + totalTaxes;

    return {
      roomSubtotal,
      extrasTotal,
      gstVat,
      municipalTax,
      serviceFee,
      totalTaxes,
      bargainDiscount,
      grandTotal,
    };
  };

  // Calculate total price
  const calculateTotal = () => {
    return calculateTaxBreakdown().grandTotal;
  };

  // Handle extra selection
  const toggleExtra = (extraId: string) => {
    setSelectedExtras((prev) =>
      prev.includes(extraId)
        ? prev.filter((id) => id !== extraId)
        : [...prev, extraId],
    );
  };

  // Step validation
  const validateStep = (step: number) => {
    switch (step) {
      case 1:
        return (
          guestDetails.firstName &&
          guestDetails.lastName &&
          guestDetails.email &&
          guestDetails.phone &&
          guestDetails.panCard
        );
      case 2:
        return true; // Preferences are optional
      case 3:
        return true; // Extras are optional
      case 4:
        return paymentMethod === "card"
          ? cardDetails.number &&
              cardDetails.expiry &&
              cardDetails.cvv &&
              cardDetails.name
          : true;
      default:
        return false;
    }
  };

  // Navigation functions
  const nextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep((prev) => Math.min(prev + 1, 3));
    }
  };

  const previousStep = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  };

  // Handle booking completion
  const completeBooking = async () => {
    try {
      const bookingId = `HB${Date.now()}`;
      const finalPrice = calculateTotal();
      // ✅ For bargained bookings, use the bargained amount as-is
      // originalPrice and bargainedPrice are already totals from the bargain flow
      const originalPrice = location.state?.originalPrice || negotiatedPrice;
      const bargainedPrice = location.state?.bargainedPrice || negotiatedPrice;
      const discountAmount = originalPrice - bargainedPrice;
      const discountPercentage =
        originalPrice > 0
          ? ((discountAmount / originalPrice) * 100).toFixed(2)
          : "0";

      // ✅ PRICE CONSISTENCY: Verify price snapshot before booking
      if (priceSnapshot) {
        const { isValid, drift } = verifyPriceIntegrity(
          priceSnapshot,
          finalPrice,
        );
        if (!isValid) {
          console.error("[PRICE_PIPELINE] Price drift detected at checkout:", {
            originalTotal: priceSnapshot.grandTotal,
            calculated: finalPrice,
            drift,
          });
          alert(
            `Price has changed by ₹${drift.toFixed(2)}. Please review and try again.`,
          );
          logPricePipeline("BOOK_FAILED_CHECKSUM", priceSnapshot);
          return;
        }
        logPricePipeline("BOOK", priceSnapshot);
      } else {
        console.warn(
          "[PRICE_PIPELINE] No price snapshot available at checkout",
        );
      }

      // Calculate detailed amounts breakdown
      const taxBreakdown = calculateTaxBreakdown();
      const amounts = {
        room_subtotal: taxBreakdown.roomSubtotal,
        taxes_and_fees: {
          gst_vat: taxBreakdown.gstVat,
          municipal_tax: taxBreakdown.municipalTax,
          service_fee: taxBreakdown.serviceFee,
        },
        bargain_discount: taxBreakdown.bargainDiscount,
        promo_discount: 0, // TODO: Add promo code support
        payment_surcharge: 0, // TODO: Add payment gateway surcharge if applicable
        grand_total: taxBreakdown.grandTotal,
      };

      // Prepare payment details with card brand and auth code
      const cardBrand =
        paymentMethod === "card" ? detectCardBrand(cardDetails.number) : null;
      const last4 =
        paymentMethod === "card"
          ? cardDetails.number.replace(/\s/g, "").slice(-4)
          : null;
      const [expMonth, expYear] =
        paymentMethod === "card" ? cardDetails.expiry.split("/") : [null, null];
      const authCode = paymentMethod === "card" ? generateAuthCode() : null;

      const payment = {
        method: paymentMethod,
        brand: cardBrand,
        last4: last4,
        exp_month: expMonth,
        exp_year: expYear ? `20${expYear}` : null,
        auth_code: authCode,
        status: "Confirmed",
      };

      // Full cancellation policy text
      const cancellationPolicyFull = `Free cancellation until ${new Date(
        new Date(checkIn).getTime() - 24 * 60 * 60 * 1000,
      ).toLocaleDateString("en-US", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        timeZoneName: "short",
      })}. After this deadline: Cancellation within 24 hours of check-in incurs 100% charge (1 night's rate). No-show: 100% charge for entire booking. Policy ID: ${selectedHotel?.cancellationPolicyId || "POL_" + selectedHotel?.id || "STANDARD_001"}`;

      // ✅ Prepare complete booking data for localStorage (used by voucher page)\n      const bookingDataForStorage = {\n        id: bookingId,\n        confirmationCode:\n          \"CONF-\" + Math.random().toString(36).substr(2, 9).toUpperCase(),\n        status: \"Confirmed\",\n        issueDate: new Date().toISOString(),\n        validUntil: new Date(\n          new Date().getTime() + 90 * 24 * 60 * 60 * 1000\n        ).toLocaleDateString(\"en-CA\"),\n        checkIn,\n        checkOut,\n        nights,\n        guests,\n        finalPrice,\n        originalPrice,\n        bargainedPrice,\n        discountAmount,\n        discountPercentage,\n        hotel: selectedHotel,\n        guestDetails,\n        preferences,\n        specialRequests: guestDetails.specialRequests,\n        panCard: guestDetails.panCard,\n        paymentMethod,\n        paymentStatus: \"Paid\",\n        paymentDetails: payment,\n        reservation: {\n          checkIn,\n          checkOut,\n          nights,\n          rooms: guests.rooms,\n          adults: guests.adults,\n          children: guests.children,\n        },\n        pricing: {\n          roomRate: Math.round(finalPrice / nights),\n          totalRoomCharges: finalPrice,\n          taxes: Math.round(amounts.taxes_and_fees.gst_vat),\n          serviceFees: Math.round(amounts.taxes_and_fees.service_fee),\n          cityTax: Math.round(amounts.taxes_and_fees.municipal_tax),\n          total: finalPrice,\n          currency: \"INR\",\n          paymentStatus: \"Paid\",\n          paymentMethod: paymentMethod === \"card\" ? `${detectCardBrand(cardDetails.number)} **** ${cardDetails.number.replace(/\\s/g, \"\").slice(-4)}` : \"Pay at Hotel\",\n          paymentDate: new Date().toISOString(),\n        },\n        bargainSummary: originalPrice && bargainedPrice ? {\n          originalPrice,\n          bargainedPrice,\n          discountAmount,\n          discountPercentage: parseFloat(discountPercentage),\n          rounds: location.state?.bargainRounds || 1,\n        } : null,\n        amounts,\n        cancellationPolicy: cancellationPolicyFull,\n      };\n\n      // ✅ Save booking data to localStorage for voucher page\n      try {\n        localStorage.setItem(\n          \"latestHotelBooking\",\n          JSON.stringify(bookingDataForStorage)\n        );\n        console.log(\n          \"[BOOKING] Booking data saved to localStorage:\",\n          bookingDataForStorage\n        );\n      } catch (error) {\n        console.warn(\n          \"[BOOKING] Error saving to localStorage:\",\n          error\n        );\n      }\n\n      // For now, we'll pass the bargain data to confirmation page\n      // In a real scenario, you'd submit this to the backend booking endpoint\n      // which would then call the rewards API\n\n      navigate(\"/hotels/confirmation\", {\n        state: {\n          selectedHotel,\n          checkIn,\n          checkOut,\n          guests,\n          guestDetails,\n          selectedExtras,\n          preferences, // ✅ Pass preferences to confirmation page\n          finalPrice,\n          bookingId,\n          originalPrice,\n          bargainedPrice,\n          discountAmount,\n          discountPercentage,\n          panCard: guestDetails.panCard,\n          specialRequests: guestDetails.specialRequests,\n          paymentMethod,\n          paymentStatus: \"completed\",\n          priceSnapshot, // ✅ Pass price snapshot to confirmation page\n          amounts, // ✅ Detailed amounts breakdown\n          payment, // ✅ Payment details with masked card info\n          cancellationPolicyFull, // ✅ Full cancellation policy text\n        },\n      });
    } catch (error) {
      console.error("Error completing booking:", error);
      alert("Error completing booking. Please try again.");
    }
  };

  const handleSignOut = () => {
    setIsLoggedIn(false);
    setUserName("");
  };

  // Don't render if no hotel data
  if (!selectedHotel) {
    return null;
  }

  const steps = [
    { id: 1, title: "Guest Details", icon: User },
    { id: 2, title: "Preferences", icon: Star },
    { id: 3, title: "Extras", icon: Star },
    { id: 4, title: "Payment", icon: CreditCard },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-blue-700 text-white sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 py-2 sm:py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <button
                onClick={() => navigate(returnUrl)}
                className="text-white hover:text-blue-200 p-1"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <Link to="/" className="flex items-center space-x-2">
                <img
                  src="https://cdn.builder.io/api/v1/image/assets%2F4235b10530ff469795aa00c0333d773c%2F6610cbb1369a49b6a98ce99413f8d9ae?format=webp&width=800"
                  alt="Faredown Logo"
                  className="h-6 w-auto object-contain"
                  style={{
                    background: "none",
                    border: "none",
                    boxShadow: "none",
                  }}
                />
                <span className="text-lg font-medium text-white">
                  faredown.com
                </span>
              </Link>
              <div className="text-xs sm:text-sm text-blue-200 hidden sm:block">
                / Hotel Booking
              </div>
            </div>

            <div className="flex items-center space-x-2 md:space-x-6">
              <button
                onClick={() => setShowMobileMenu(!showMobileMenu)}
                className="md:hidden text-white p-2 touch-manipulation"
              >
                <Menu className="w-6 h-6" />
              </button>

              <div className="flex items-center space-x-3">
                {isLoggedIn ? (
                  <DropdownMenu>
                    <DropdownMenuTrigger className="flex items-center space-x-2 bg-blue-600 rounded-full px-2 md:px-3 py-2 hover:bg-blue-800">
                      <div className="w-6 h-6 bg-yellow-500 rounded-full flex items-center justify-center">
                        <span className="text-xs font-bold text-black">
                          {userName.charAt(0)}
                        </span>
                      </div>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48">
                      <DropdownMenuItem onClick={handleSignOut}>
                        <LogOut className="w-4 h-4 mr-2" />
                        Sign out
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                ) : (
                  <>
                    <Button
                      size="sm"
                      variant="outline"
                      className="bg-white text-blue-700"
                    >
                      Sign in
                    </Button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            {/* Progress Steps */}
            <div className="bg-white rounded-lg border p-6 mb-6">
              <div className="flex items-center justify-between mb-6">
                {steps.map((step, index) => (
                  <div key={step.id} className="flex items-center">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium ${
                        currentStep >= step.id
                          ? "bg-blue-600 text-white"
                          : "bg-gray-200 text-gray-500"
                      }`}
                    >
                      {currentStep > step.id ? (
                        <CheckCircle className="w-5 h-5" />
                      ) : (
                        <step.icon className="w-5 h-5" />
                      )}
                    </div>
                    <span
                      className={`ml-3 text-sm font-medium ${
                        currentStep >= step.id
                          ? "text-gray-900"
                          : "text-gray-500"
                      }`}
                    >
                      {step.title}
                    </span>
                    {index < steps.length - 1 && (
                      <div
                        className={`w-16 h-1 mx-4 ${
                          currentStep > step.id ? "bg-blue-600" : "bg-gray-200"
                        }`}
                      />
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Step Content */}
            <div className="bg-white rounded-lg border p-6">
              {currentStep === 1 && (
                <div>
                  <h3 className="text-xl font-semibold mb-6">Guest Details</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        First Name *
                      </label>
                      <Input
                        value={guestDetails.firstName}
                        onChange={(e) =>
                          setGuestDetails((prev) => ({
                            ...prev,
                            firstName: e.target.value,
                          }))
                        }
                        placeholder="Enter first name"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Last Name *
                      </label>
                      <Input
                        value={guestDetails.lastName}
                        onChange={(e) =>
                          setGuestDetails((prev) => ({
                            ...prev,
                            lastName: e.target.value,
                          }))
                        }
                        placeholder="Enter last name"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Email Address *
                      </label>
                      <Input
                        type="email"
                        value={guestDetails.email}
                        onChange={(e) =>
                          setGuestDetails((prev) => ({
                            ...prev,
                            email: e.target.value,
                          }))
                        }
                        placeholder="Enter email address"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Phone Number *
                      </label>
                      <Input
                        type="tel"
                        value={guestDetails.phone}
                        onChange={(e) =>
                          setGuestDetails((prev) => ({
                            ...prev,
                            phone: e.target.value,
                          }))
                        }
                        placeholder="Enter phone number"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Country
                      </label>
                      <Select
                        value={guestDetails.country}
                        onValueChange={(value) =>
                          setGuestDetails((prev) => ({
                            ...prev,
                            country: value,
                          }))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="India">India</SelectItem>
                          <SelectItem value="UAE">UAE</SelectItem>
                          <SelectItem value="USA">USA</SelectItem>
                          <SelectItem value="UK">UK</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        PAN Card Number *
                        <span className="text-xs text-gray-500 ml-2">
                          (Required for Indian customers)
                        </span>
                      </label>
                      <Input
                        value={guestDetails.panCard}
                        onChange={(e) =>
                          setGuestDetails((prev) => ({
                            ...prev,
                            panCard: e.target.value.toUpperCase(),
                          }))
                        }
                        placeholder="E.g., ABCDE1234F"
                        maxLength={20}
                      />
                      {guestDetails.panCard &&
                        !/^[A-Z]{5}[0-9]{4}[A-Z]$/.test(
                          guestDetails.panCard,
                        ) && (
                          <p className="text-xs text-red-500 mt-1">
                            Invalid PAN format. Expected format: ABCDE1234F
                          </p>
                        )}
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Special Requests (Optional)
                      </label>
                      <textarea
                        value={guestDetails.specialRequests}
                        onChange={(e) =>
                          setGuestDetails((prev) => ({
                            ...prev,
                            specialRequests: e.target.value,
                          }))
                        }
                        placeholder="Any special requests or preferences..."
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
                        rows={3}
                      />
                    </div>
                  </div>
                </div>
              )}

              {currentStep === 2 && (
                <div>
                  <h3 className="text-xl font-semibold mb-6">
                    Room Preferences
                  </h3>
                  <div className="space-y-6">
                    {/* Bed Type Preference */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-3">
                        Bed Type Preference
                      </label>
                      <div className="space-y-2">
                        {[
                          { value: "king", label: "King Bed" },
                          { value: "queen", label: "Queen Bed" },
                          { value: "twin", label: "Twin Beds" },
                        ].map((option) => (
                          <label
                            key={option.value}
                            className="flex items-center p-3 border border-gray-200 rounded-lg cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-all"
                          >
                            <input
                              type="radio"
                              name="bedType"
                              value={option.value}
                              checked={preferences.bedType === option.value}
                              onChange={(e) =>
                                setPreferences((prev) => ({
                                  ...prev,
                                  bedType: e.target.value,
                                }))
                              }
                              className="w-4 h-4 cursor-pointer"
                            />
                            <span className="ml-3 text-gray-700">
                              {option.label}
                            </span>
                          </label>
                        ))}
                      </div>
                    </div>

                    {/* Smoking Preference */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-3">
                        Smoking Preference
                      </label>
                      <div className="space-y-2">
                        {[
                          { value: "non-smoking", label: "Non-Smoking" },
                          { value: "smoking", label: "Smoking" },
                        ].map((option) => (
                          <label
                            key={option.value}
                            className="flex items-center p-3 border border-gray-200 rounded-lg cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-all"
                          >
                            <input
                              type="radio"
                              name="smokingPreference"
                              value={option.value}
                              checked={
                                preferences.smokingPreference === option.value
                              }
                              onChange={(e) =>
                                setPreferences((prev) => ({
                                  ...prev,
                                  smokingPreference: e.target.value,
                                }))
                              }
                              className="w-4 h-4 cursor-pointer"
                            />
                            <span className="ml-3 text-gray-700">
                              {option.label}
                            </span>
                          </label>
                        ))}
                      </div>
                    </div>

                    {/* Floor Preference */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-3">
                        Floor Preference
                      </label>
                      <div className="space-y-2">
                        {[
                          { value: "high", label: "High Floor" },
                          { value: "mid", label: "Mid Floor" },
                          { value: "low", label: "Low Floor" },
                          { value: "quiet", label: "Quiet Area" },
                        ].map((option) => (
                          <label
                            key={option.value}
                            className="flex items-center p-3 border border-gray-200 rounded-lg cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-all"
                          >
                            <input
                              type="radio"
                              name="floorPreference"
                              value={option.value}
                              checked={
                                preferences.floorPreference === option.value
                              }
                              onChange={(e) => {
                                setPreferences((prev) => ({
                                  ...prev,
                                  floorPreference: e.target.value,
                                }));
                              }}
                              className="w-4 h-4 cursor-pointer"
                              style={{ accentColor: "#2563eb" }}
                            />
                            <span className="ml-3 text-gray-700">
                              {option.label}
                            </span>
                          </label>
                        ))}
                      </div>
                    </div>

                    {/* Guest Requests Checkboxes */}
                    <div className="border-t border-gray-200 pt-6">
                      <label className="block text-sm font-medium text-gray-700 mb-3">
                        Guest Requests
                      </label>
                      <div className="space-y-2">
                        {[
                          {
                            id: "earlyCheckIn",
                            label: "Early Check-in (before 3:00 PM)",
                          },
                          {
                            id: "lateCheckOut",
                            label: "Late Check-out (after 12:00 PM)",
                          },
                          {
                            id: "dailyHousekeeping",
                            label: "Daily Housekeeping",
                          },
                        ].map((request) => (
                          <label
                            key={request.id}
                            className="flex items-center p-3 border border-gray-200 rounded-lg cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-all"
                          >
                            <input
                              type="checkbox"
                              checked={
                                preferences[
                                  request.id as keyof typeof preferences
                                ] as boolean
                              }
                              onChange={(e) => {
                                setPreferences((prev) => ({
                                  ...prev,
                                  [request.id]: e.target.checked,
                                }));
                              }}
                              className="w-4 h-4 cursor-pointer"
                              style={{ accentColor: "#2563eb" }}
                            />
                            <span className="ml-3 text-gray-700">
                              {request.label}
                            </span>
                          </label>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {currentStep === 3 && (
                <div>
                  <h3 className="text-xl font-semibold mb-6">
                    Enhance Your Stay
                  </h3>
                  <div className="space-y-4">
                    {availableExtras.map((extra) => (
                      <label
                        key={extra.id}
                        className="border border-gray-200 rounded-lg p-4 hover:border-blue-400 hover:bg-blue-50 transition-all cursor-pointer flex items-center justify-between"
                      >
                        <div className="flex items-start space-x-3 flex-1">
                          <input
                            type="checkbox"
                            checked={selectedExtras.includes(extra.id)}
                            onChange={() => toggleExtra(extra.id)}
                            className="w-4 h-4 mt-1 cursor-pointer"
                          />
                          <div>
                            <div className="font-medium text-gray-900">
                              {extra.name}
                            </div>
                            <div className="text-sm text-gray-600">
                              {extra.description}
                            </div>
                          </div>
                        </div>
                        <div className="text-right ml-4 flex-shrink-0">
                          <div className="font-semibold text-gray-900">
                            {formatCurrency(extra.price)}
                          </div>
                          <div className="text-xs text-gray-500">per stay</div>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {currentStep === 4 && (
                <div>
                  <h3 className="text-xl font-semibold mb-6">
                    Payment Details
                  </h3>
                  <div className="space-y-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-3">
                        Payment Method
                      </label>
                      <div className="space-y-2">
                        {[
                          { value: "card", label: "Credit/Debit Card" },
                          { value: "upi", label: "UPI" },
                          { value: "wallet", label: "Digital Wallet" },
                        ].map((method) => (
                          <div
                            key={method.value}
                            className="flex items-center p-3 border border-gray-200 rounded-lg cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-all"
                            onClick={(e) => {
                              // Allow direct input clicks
                              if (
                                (e.target as HTMLElement).tagName !== "INPUT"
                              ) {
                                setPaymentMethod(method.value);
                              }
                            }}
                          >
                            <input
                              type="radio"
                              name="payment"
                              value={method.value}
                              checked={paymentMethod === method.value}
                              onChange={(e) => {
                                e.stopPropagation();
                                setPaymentMethod(e.target.value);
                              }}
                              className="w-4 h-4 cursor-pointer"
                              style={{ accentColor: "#2563eb" }}
                            />
                            <span className="ml-3 text-gray-700">
                              {method.label}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {paymentMethod === "card" && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="md:col-span-2">
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Card Number
                          </label>
                          <Input
                            value={cardDetails.number}
                            onChange={(e) =>
                              setCardDetails((prev) => ({
                                ...prev,
                                number: e.target.value,
                              }))
                            }
                            placeholder="1234 5678 9012 3456"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Expiry Date
                          </label>
                          <Input
                            value={cardDetails.expiry}
                            onChange={(e) =>
                              setCardDetails((prev) => ({
                                ...prev,
                                expiry: e.target.value,
                              }))
                            }
                            placeholder="MM/YY"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            CVV
                          </label>
                          <Input
                            value={cardDetails.cvv}
                            onChange={(e) =>
                              setCardDetails((prev) => ({
                                ...prev,
                                cvv: e.target.value,
                              }))
                            }
                            placeholder="123"
                          />
                        </div>
                        <div className="md:col-span-2">
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Cardholder Name
                          </label>
                          <Input
                            value={cardDetails.name}
                            onChange={(e) =>
                              setCardDetails((prev) => ({
                                ...prev,
                                name: e.target.value,
                              }))
                            }
                            placeholder="Enter cardholder name"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Navigation Buttons */}
              <div className="flex justify-between mt-8">
                <Button
                  onClick={previousStep}
                  variant="outline"
                  disabled={currentStep === 1}
                >
                  Previous
                </Button>
                {currentStep < 3 ? (
                  <Button
                    onClick={nextStep}
                    disabled={!validateStep(currentStep)}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    Next
                  </Button>
                ) : (
                  <Button
                    onClick={completeBooking}
                    disabled={!validateStep(currentStep)}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    Complete Booking
                  </Button>
                )}
              </div>
            </div>
          </div>

          {/* Booking Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg border p-6 sticky top-24">
              <h3 className="text-lg font-semibold mb-4">Booking Summary</h3>

              {/* Hotel Details */}
              <div className="mb-6">
                <div className="flex items-start space-x-3">
                  <img
                    src={selectedHotel.image}
                    alt={selectedHotel.name}
                    className="w-16 h-16 object-cover rounded-lg"
                  />
                  <div>
                    <h4 className="font-medium text-gray-900">
                      {selectedHotel.name}
                    </h4>
                    <div className="flex items-center text-sm text-gray-600 mt-1">
                      <MapPin className="w-4 h-4 mr-1" />
                      {selectedHotel.location}
                    </div>
                    <div className="flex items-center mt-1">
                      {Array.from({ length: 5 }, (_, i) => (
                        <Star
                          key={i}
                          className={`w-4 h-4 ${
                            i < Math.floor(selectedHotel.rating)
                              ? "fill-yellow-400 text-yellow-400"
                              : "text-gray-300"
                          }`}
                        />
                      ))}
                      <span className="ml-1 text-sm text-gray-600">
                        {selectedHotel.rating}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Stay Details */}
              <div className="space-y-3 mb-6">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Check-in</span>
                  <span className="font-medium">{formatDate(checkIn)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Check-out</span>
                  <span className="font-medium">{formatDate(checkOut)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Nights</span>
                  <span className="font-medium">{nights}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Guests</span>
                  <span className="font-medium">
                    {guests.adults + guests.children} guests, {guests.rooms}{" "}
                    room
                    {guests.rooms > 1 ? "s" : ""}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Room Type</span>
                  <span className="font-medium">{selectedHotel.roomType}</span>
                </div>
                {selectedHotel.breakfastIncluded !== undefined && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Breakfast</span>
                    <span className="font-medium">
                      {selectedHotel.breakfastIncluded ? (
                        <span className="text-green-700 font-semibold">
                          ✓ Included
                        </span>
                      ) : (
                        <span className="text-orange-700">Not Included</span>
                      )}
                    </span>
                  </div>
                )}
              </div>

              {/* Cancellation Policy */}
              <div className="border-t pt-4">
                <button
                  onClick={() => setShowPolicyDetails(!showPolicyDetails)}
                  className="flex justify-between items-center w-full text-sm font-medium hover:text-blue-600 transition-colors"
                >
                  <span>Cancellation Policy</span>
                  <ChevronDown
                    className={`w-4 h-4 transition-transform ${showPolicyDetails ? "rotate-180" : ""}`}
                  />
                </button>

                {showPolicyDetails && (
                  <div className="mt-3 p-3 bg-gray-50 rounded-lg text-xs text-gray-700 space-y-2">
                    <div>
                      <strong>Free Cancellation Until:</strong>
                      <br />
                      {new Date(
                        new Date(checkIn).getTime() - 24 * 60 * 60 * 1000,
                      ).toLocaleDateString("en-US", {
                        weekday: "long",
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                        timeZoneName: "short",
                      })}
                    </div>
                    <div>
                      <strong>After Free Cancellation Deadline:</strong>
                      <br />
                      • Cancellation within 24 hours of check-in: 100% charge (1
                      night's rate)
                      <br />• No-show: 100% charge for entire booking
                    </div>
                    <div className="text-xs text-gray-500">
                      Policy ID:{" "}
                      {selectedHotel?.cancellationPolicyId ||
                        "POL_" + selectedHotel?.id ||
                        "STANDARD_001"}
                    </div>
                  </div>
                )}
              </div>

              {/* Price Breakdown */}
              <div className="border-t pt-4 space-y-2">
                {location.state?.originalPrice &&
                location.state?.bargainedPrice ? (
                  <>
                    <div className="flex justify-between text-sm">
                      <span className="line-through text-gray-500">
                        Original Price
                      </span>
                      <span className="line-through text-gray-500">
                        {/* ✅ originalPrice is TOTAL, not per-night */}
                        {formatCurrency(location.state.originalPrice)}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm font-semibold text-blue-900">
                      <span>Bargained Price</span>
                      <span>
                        {/* ✅ bargainedPrice is TOTAL, not per-night */}
                        {formatCurrency(location.state.bargainedPrice)}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm text-green-700 font-semibold">
                      <span>Your Savings</span>
                      <span>
                        -₹
                        {Math.round(
                          location.state.originalPrice -
                            location.state.bargainedPrice,
                        )}{" "}
                        (
                        {(
                          ((location.state.originalPrice -
                            location.state.bargainedPrice) /
                            location.state.originalPrice) *
                          100
                        ).toFixed(0)}
                        %)
                      </span>
                    </div>
                  </>
                ) : (
                  <div className="flex justify-between text-sm">
                    <span>Room Subtotal</span>
                    <span>
                      {/* ✅ negotiatedPrice is TOTAL, not per-night */}
                      {formatCurrency(negotiatedPrice)}
                    </span>
                  </div>
                )}
                {selectedExtras.length > 0 && (
                  <div className="flex justify-between text-sm">
                    <span>Extras</span>
                    <span>{formatCurrency(calculateExtrasTotal())}</span>
                  </div>
                )}

                {/* Tax Breakdown - Expandable */}
                <div className="border-t pt-2 mt-2">
                  <button
                    onClick={() => setShowTaxBreakdown(!showTaxBreakdown)}
                    className="flex justify-between items-center w-full text-sm hover:text-blue-600 transition-colors"
                  >
                    <span>Taxes & Fees</span>
                    <div className="flex items-center gap-2">
                      <span>
                        {formatCurrency(calculateTaxBreakdown().totalTaxes)}
                      </span>
                      <ChevronDown
                        className={`w-4 h-4 transition-transform ${showTaxBreakdown ? "rotate-180" : ""}`}
                      />
                    </div>
                  </button>

                  {showTaxBreakdown && (
                    <div className="mt-2 pl-4 space-y-1 text-xs text-gray-600">
                      <div className="flex justify-between">
                        <span>GST/VAT (12%)</span>
                        <span>
                          {formatCurrency(calculateTaxBreakdown().gstVat)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Municipal Tax (4%)</span>
                        <span>
                          {formatCurrency(calculateTaxBreakdown().municipalTax)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Service Fee (2%)</span>
                        <span>
                          {formatCurrency(calculateTaxBreakdown().serviceFee)}
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                {location.state?.bargainedPrice &&
                  location.state?.originalPrice && (
                    <div className="flex justify-between text-sm text-green-700">
                      <span>Bargain Discount Applied</span>
                      <span>
                        -
                        {formatCurrency(
                          calculateTaxBreakdown().bargainDiscount,
                        )}
                      </span>
                    </div>
                  )}

                <div className="border-t pt-2 flex justify-between font-semibold">
                  <span>Grand Total</span>
                  <span>{formatCurrency(calculateTotal())}</span>
                </div>
              </div>

              {/* Bargain Savings Display */}
              {location.state?.bargainedPrice &&
                location.state?.originalPrice && (
                  <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <h4 className="font-semibold text-blue-900 mb-3 flex items-center">
                      <Award className="w-4 h-4 mr-2" />
                      {location.state?.bargainMetadata?.bargainAttempts === 2
                        ? "Your 2-Attempt Bargain"
                        : "Your Bargain Savings"}
                    </h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-700">
                          Original Price (Total Stay)
                        </span>
                        <span className="text-gray-600 line-through">
                          {/* ✅ originalPrice is TOTAL for entire stay */}
                          {formatCurrency(location.state.originalPrice)}
                        </span>
                      </div>

                      {/* ✅ Show Safe Deal if from 2-attempt bargain */}
                      {location.state?.bargainMetadata?.bargainAttempts ===
                        2 && (
                        <div className="flex justify-between">
                          <span className="text-emerald-700">
                            Safe Deal (Round 1)
                          </span>
                          <span
                            className={`font-semibold ${
                              location.state?.bargainMetadata?.selectedPrice ===
                              "Safe Deal"
                                ? "text-emerald-900 underline"
                                : "text-gray-600"
                            }`}
                          >
                            {formatCurrency(
                              location.state.bargainMetadata.safeDealPrice,
                            )}
                          </span>
                        </div>
                      )}

                      {/* ✅ Show Final Offer if from 2-attempt bargain */}
                      {location.state?.bargainMetadata?.bargainAttempts ===
                        2 && (
                        <div className="flex justify-between">
                          <span className="text-orange-700">
                            Final Offer (Round 2)
                          </span>
                          <span
                            className={`font-semibold ${
                              location.state?.bargainMetadata?.selectedPrice ===
                              "Final Bargain Offer"
                                ? "text-orange-900 underline"
                                : "text-gray-600"
                            }`}
                          >
                            {formatCurrency(
                              location.state.bargainMetadata.finalOfferPrice,
                            )}
                          </span>
                        </div>
                      )}

                      <div className="flex justify-between">
                        <span className="text-gray-700">
                          {location.state?.bargainMetadata?.bargainAttempts ===
                          2
                            ? `Your Selected Price (${location.state?.bargainMetadata?.selectedPrice})`
                            : "Your Bargained Price"}
                        </span>
                        <span className="font-semibold text-blue-900">
                          {formatCurrency(location.state.bargainedPrice)}
                        </span>
                      </div>
                      <div className="border-t pt-2 flex justify-between font-semibold text-green-700">
                        <span>You Saved</span>
                        <span>
                          {formatCurrency(
                            location.state.originalPrice -
                              location.state.bargainedPrice,
                          )}{" "}
                          (
                          {(
                            ((location.state.originalPrice -
                              location.state.bargainedPrice) /
                              location.state.originalPrice) *
                            100
                          ).toFixed(1)}
                          %)
                        </span>
                      </div>
                    </div>
                  </div>
                )}

              {/* Rewards Earned Display */}
              {location.state?.rewardsEarned && (
                <div className="mt-4 p-4 bg-amber-50 rounded-lg border border-amber-200">
                  <h4 className="font-semibold text-amber-900 mb-3 flex items-center">
                    <Star className="w-4 h-4 mr-2 fill-amber-500 text-amber-500" />
                    Rewards Earned
                  </h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-700">Faredown Points</span>
                      <span className="font-semibold text-amber-900">
                        +{location.state.rewardsEarned.points_earned}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-700">Monetary Value</span>
                      <span className="font-semibold text-green-700">
                        ₹{location.state.rewardsEarned.monetary_value}
                      </span>
                    </div>
                    <div className="text-xs text-gray-600 mt-2">
                      Your tier:{" "}
                      <span className="font-semibold">
                        {location.state.rewardsEarned.tier_category}
                      </span>{" "}
                      • Redeem on your next booking!
                    </div>
                  </div>
                </div>
              )}

              {/* Cancellation Policy */}
              <div className="mt-6 p-3 bg-green-50 rounded-lg">
                <div className="flex items-start space-x-2">
                  <CheckCircle className="w-4 h-4 text-green-600 mt-0.5" />
                  <div className="text-sm">
                    <div className="font-medium text-green-800">
                      {selectedHotel.cancellation}
                    </div>
                    <div className="text-green-700">
                      Cancel up to 24 hours before check-in
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
