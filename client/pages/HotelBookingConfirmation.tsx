import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  CheckCircle,
  Download,
  Calendar,
  MapPin,
  Users,
  Clock,
  Mail,
  Phone,
  Star,
  Share2,
  Printer,
  CreditCard,
  Hotel,
  Plane,
  Car,
  Shield,
  Gift,
  MessageCircle,
} from "lucide-react";
import { useCurrency } from "@/contexts/CurrencyContext";
import { formatPriceWithSymbol } from "@/lib/pricing";
import { useEnhancedBooking } from "@/contexts/EnhancedBookingContext";
import { useLocation } from "react-router-dom";

export default function HotelBookingConfirmation() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const { selectedCurrency } = useCurrency();
  const { booking: enhancedBooking, loadCompleteSearchObject } =
    useEnhancedBooking();
  const [isLoading, setIsLoading] = useState(false);
  const [savedBookingData, setSavedBookingData] = useState(null);

  // Load search parameters from location state if available
  useEffect(() => {
    if (location.state?.searchParams) {
      console.log(
        "🏨 Loading hotel confirmation search params from location state:",
        location.state.searchParams,
      );
      loadCompleteSearchObject(location.state.searchParams);
    }
  }, [location.state, loadCompleteSearchObject]);

  // Load actual booking data from localStorage
  useEffect(() => {
    const saved = localStorage.getItem("latestHotelBooking");
    if (saved) {
      try {
        setSavedBookingData(JSON.parse(saved));
      } catch (error) {
        console.error("Error parsing booking data:", error);
      }
    }
  }, []);

  const bookingId = searchParams.get("bookingId") || "HTL" + Date.now();
  const hotelId = searchParams.get("hotelId") || "1";
  const hotelName = searchParams.get("hotelName");

  console.log("🏨 Hotel confirmation using exact search dates:", {
    checkIn: enhancedBooking.searchParams.checkIn,
    checkOut: enhancedBooking.searchParams.checkOut,
    nights: enhancedBooking.searchParams.nights,
    guests: enhancedBooking.searchParams.guests,
    rooms: enhancedBooking.searchParams.rooms,
  });

  // ✅ CRITICAL: Use LOCKED data from location.state (passed from HotelBooking)
  // Prefer location.state for locked data, then fallback to enhanced booking context
  const lockedCheckIn =
    location.state?.checkIn ||
    enhancedBooking.searchParams.checkIn ||
    searchParams.get("checkIn");
  const lockedCheckOut =
    location.state?.checkOut ||
    enhancedBooking.searchParams.checkOut ||
    searchParams.get("checkOut");
  const lockedNights =
    location.state?.nights ||
    enhancedBooking.searchParams.nights ||
    (() => {
      if (lockedCheckIn && lockedCheckOut) {
        const checkIn = new Date(lockedCheckIn);
        const checkOut = new Date(lockedCheckOut);
        return Math.ceil(
          (checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24),
        );
      }
      return 3;
    })();

  // Merge saved booking data with defaults and LOCKED location state
  const bookingData = savedBookingData || {
    id: location.state?.bookingId || bookingId,
    status: "Confirmed",
    createdAt: new Date().toISOString(),
    hotel: location.state?.selectedHotel || {
      id: hotelId,
      name: hotelName ? decodeURIComponent(hotelName) : "Grand Plaza Hotel",
      location: "Downtown Dubai, United Arab Emirates",
      address: "123 Sheikh Zayed Road, Downtown Dubai, Dubai, UAE",
      image:
        "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=600",
      rating: 4.8,
      reviews: 1234,
      phone: "+971 4 123 4567",
      email: "reservations@grandplazadubai.com",
      amenities: [
        "Free WiFi",
        "Swimming Pool",
        "Fitness Center",
        "Spa & Wellness",
        "Restaurant",
        "24/7 Room Service",
        "Business Center",
        "Parking",
      ],
    },
    guest: {
      firstName: location.state?.guestDetails?.firstName || "John",
      lastName: location.state?.guestDetails?.lastName || "Doe",
      email: location.state?.guestDetails?.email || "john.doe@example.com",
      phone: location.state?.guestDetails?.phone || "+1 234 567 8900",
      panCard:
        location.state?.panCard || location.state?.guestDetails?.panCard || "",
    },
    room: {
      type: "Deluxe Suite",
      bedType: "King Bed",
      smokingPreference: "Non-Smoking",
      features: ["City View", "Separate Living Area", "Minibar", "Balcony"],
      size: "55 sqm",
      maxGuests: 3,
    },
    stay: {
      // ✅ Use LOCKED dates passed from HotelBooking.tsx
      checkIn: lockedCheckIn,
      checkOut: lockedCheckOut,
      nights: lockedNights,
      guests:
        location.state?.guests?.adults ||
        enhancedBooking.searchParams.guests?.adults ||
        2,
      rooms:
        location.state?.guests?.rooms ||
        enhancedBooking.searchParams.rooms ||
        1,
    },
    pricing: {
      roomRate: location.state?.finalPrice
        ? Math.round(location.state.finalPrice / lockedNights)
        : 259,
      nights: lockedNights,
      subtotal: location.state?.finalPrice || 777,
      taxes: location.state?.finalPrice
        ? Math.round(location.state.finalPrice * 0.18)
        : 93.24,
      fees: 50,
      addOns: location.state?.selectedExtras?.length ? 200 : 0,
      total: location.state?.finalPrice || 920.24,
      // ✅ CRITICAL: Include 2-attempt bargain details
      ...(location.state?.bargainMetadata && {
        bargainAttempts: location.state.bargainMetadata.bargainAttempts,
        originalPrice: location.state.bargainMetadata.originalPrice,
        safeDealPrice: location.state.bargainMetadata.safeDealPrice,
        finalOfferPrice: location.state.bargainMetadata.finalOfferPrice,
        selectedPrice: location.state.bargainMetadata.selectedPrice,
      }),
    },
    addOns: location.state?.selectedExtras || [],
    preferences: location.state?.preferences || null,
    specialRequests:
      location.state?.guestDetails?.specialRequests ||
      location.state?.preferences?.specialRequests ||
      "None",
    paymentMethod: "•••• •••• •••• 1234",
    confirmationCode:
      "CONF-" + Math.random().toString(36).substr(2, 9).toUpperCase(),
  };

  const handleDownloadVoucher = () => {
    setIsLoading(true);
    // Simulate download
    setTimeout(() => {
      setIsLoading(false);
      navigate(`/booking-voucher?bookingId=${bookingId}`);
    }, 1000);
  };

  const handlePrintConfirmation = () => {
    window.print();
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: "Hotel Booking Confirmation",
        text: `Booking confirmed at ${bookingData.hotel.name}`,
        url: window.location.href,
      });
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(window.location.href);
    }
  };

  const quickActions = [
    {
      icon: Download,
      label: "Download Voucher",
      action: handleDownloadVoucher,
      color: "bg-blue-600 hover:bg-blue-700",
    },
    {
      icon: Printer,
      label: "Print Confirmation",
      action: handlePrintConfirmation,
      color: "bg-gray-600 hover:bg-gray-700",
    },
    {
      icon: Share2,
      label: "Share Booking",
      action: handleShare,
      color: "bg-green-600 hover:bg-green-700",
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <div className="max-w-4xl mx-auto px-3 sm:px-4 lg:px-8 py-6">
        {/* Success Header */}
        <div className="bg-gradient-to-br from-green-500 via-emerald-500 to-green-600 text-white p-8 rounded-lg mb-6 relative overflow-hidden">
          <div className="relative z-10">
            <div className="flex items-center justify-center mb-4">
              <div className="bg-white bg-opacity-20 rounded-full p-3">
                <CheckCircle className="w-12 h-12 text-white" />
              </div>
            </div>
            <div className="text-center">
              <h1 className="text-3xl font-bold mb-2">Booking Confirmed!</h1>
              <p className="text-green-100 text-lg mb-4">
                Your reservation has been successfully confirmed
              </p>
              <div className="bg-white bg-opacity-20 rounded-lg p-4 inline-block">
                <div className="text-sm text-green-100 mb-1">
                  Booking Reference
                </div>
                <div className="text-2xl font-bold tracking-wider">
                  {bookingData.confirmationCode}
                </div>
              </div>
            </div>
          </div>
          <div className="absolute top-0 right-0 w-32 h-32 bg-white bg-opacity-10 rounded-full transform translate-x-16 -translate-y-16" />
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-white bg-opacity-10 rounded-full transform -translate-x-12 translate-y-12" />
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          {quickActions.map((action, index) => (
            <Button
              key={index}
              onClick={action.action}
              className={`${action.color} text-white p-4 h-auto flex flex-col items-center space-y-2`}
              disabled={action.label === "Download Voucher" && isLoading}
            >
              {action.label === "Download Voucher" && isLoading ? (
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white" />
              ) : (
                <action.icon className="w-6 h-6" />
              )}
              <span className="text-sm font-medium">{action.label}</span>
            </Button>
          ))}
        </div>

        {/* Booking Details */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Booking Info */}
          <div className="lg:col-span-2 space-y-6">
            {/* Hotel Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Hotel className="w-5 h-5 mr-2" />
                  Hotel Information
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex space-x-4">
                  <img
                    src={bookingData.hotel.image}
                    alt={bookingData.hotel.name}
                    className="w-24 h-24 object-cover rounded-lg"
                  />
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold mb-2">
                      {bookingData.hotel.name}
                    </h3>
                    <div className="flex items-center text-gray-600 mb-2">
                      <MapPin className="w-4 h-4 mr-1" />
                      <span className="text-sm">
                        {bookingData.hotel.location}
                      </span>
                    </div>
                    <div className="flex items-center mb-3">
                      <div className="flex items-center">
                        {Array.from({ length: 5 }, (_, i) => (
                          <Star
                            key={i}
                            className={`w-4 h-4 ${
                              i < Math.floor(bookingData.hotel.rating)
                                ? "text-yellow-400 fill-current"
                                : "text-gray-300"
                            }`}
                          />
                        ))}
                      </div>
                      <span className="ml-2 text-sm font-medium">
                        {bookingData.hotel.rating}
                      </span>
                      <span className="ml-1 text-sm text-gray-600">
                        ({bookingData.hotel.reviews} reviews)
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {bookingData.hotel.amenities
                        .slice(0, 4)
                        .map((amenity, index) => (
                          <Badge
                            key={index}
                            variant="secondary"
                            className="text-xs"
                          >
                            {amenity}
                          </Badge>
                        ))}
                      {bookingData.hotel.amenities.length > 4 && (
                        <Badge variant="outline" className="text-xs">
                          +{bookingData.hotel.amenities.length - 4} more
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-gray-200 grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center">
                    <Phone className="w-4 h-4 mr-2 text-gray-500" />
                    <span className="text-sm">{bookingData.hotel.phone}</span>
                  </div>
                  <div className="flex items-center">
                    <Mail className="w-4 h-4 mr-2 text-gray-500" />
                    <span className="text-sm">{bookingData.hotel.email}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Stay Details */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Calendar className="w-5 h-5 mr-2" />
                  Stay Details
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-semibold mb-3">Check-in</h4>
                    <div className="space-y-2">
                      <div className="text-lg font-medium">
                        {new Date(bookingData.stay.checkIn).toLocaleDateString(
                          "en-US",
                          {
                            weekday: "long",
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                          },
                        )}
                      </div>
                      <div className="flex items-center text-gray-600">
                        <Clock className="w-4 h-4 mr-1" />
                        <span className="text-sm">After 3:00 PM</span>
                      </div>
                    </div>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-3">Check-out</h4>
                    <div className="space-y-2">
                      <div className="text-lg font-medium">
                        {new Date(bookingData.stay.checkOut).toLocaleDateString(
                          "en-US",
                          {
                            weekday: "long",
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                          },
                        )}
                      </div>
                      <div className="flex items-center text-gray-600">
                        <Clock className="w-4 h-4 mr-1" />
                        <span className="text-sm">Before 12:00 PM</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-gray-200 grid grid-cols-3 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">
                      {bookingData.stay.nights}
                    </div>
                    <div className="text-sm text-gray-600">
                      {bookingData.stay.nights === 1 ? "Night" : "Nights"}
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">
                      {bookingData.stay.guests}
                    </div>
                    <div className="text-sm text-gray-600">
                      {bookingData.stay.guests === 1 ? "Guest" : "Guests"}
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">
                      {bookingData.stay.rooms}
                    </div>
                    <div className="text-sm text-gray-600">
                      {bookingData.stay.rooms === 1 ? "Room" : "Rooms"}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Room Details */}
            <Card>
              <CardHeader>
                <CardTitle>Room Details</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h4 className="font-semibold text-lg">
                      {bookingData.room.type}
                    </h4>
                    <div className="text-gray-600 mt-1">
                      {bookingData.room.size} • {bookingData.room.bedType} •{" "}
                      {bookingData.room.smokingPreference}
                    </div>
                    <div className="text-gray-600">
                      Max occupancy: {bookingData.room.maxGuests} guests
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {bookingData.room.features.map((feature, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {feature}
                      </Badge>
                    ))}
                  </div>
                  {bookingData.specialRequests && (
                    <div className="bg-blue-50 p-3 rounded-lg">
                      <h5 className="font-medium text-blue-900 mb-1">
                        Special Requests
                      </h5>
                      <p className="text-blue-800 text-sm">
                        {bookingData.specialRequests}
                      </p>
                    </div>
                  )}

                  {bookingData.preferences && (
                    <div className="border border-blue-200 p-3 rounded-lg">
                      <h5 className="font-medium text-gray-900 mb-3">
                        Room Preferences & Guest Requests
                      </h5>
                      <div className="space-y-2 text-sm">
                        {bookingData.preferences.bedType && (
                          <div className="flex justify-between">
                            <span className="text-gray-600">Bed Type:</span>
                            <span className="font-medium">
                              {bookingData.preferences.bedType === "king"
                                ? "King Bed"
                                : bookingData.preferences.bedType === "queen"
                                  ? "Queen Bed"
                                  : "Twin Beds"}
                            </span>
                          </div>
                        )}
                        {bookingData.preferences.smokingPreference && (
                          <div className="flex justify-between">
                            <span className="text-gray-600">
                              Smoking Preference:
                            </span>
                            <span className="font-medium">
                              {bookingData.preferences.smokingPreference ===
                              "non-smoking"
                                ? "Non-Smoking"
                                : "Smoking"}
                            </span>
                          </div>
                        )}
                        {bookingData.preferences.floorPreference && (
                          <div className="flex justify-between">
                            <span className="text-gray-600">
                              Floor Preference:
                            </span>
                            <span className="font-medium">
                              {bookingData.preferences.floorPreference ===
                              "high"
                                ? "High Floor"
                                : bookingData.preferences.floorPreference ===
                                    "low"
                                  ? "Low Floor"
                                  : bookingData.preferences.floorPreference ===
                                      "mid"
                                    ? "Mid Floor"
                                    : "Quiet Area"}
                            </span>
                          </div>
                        )}
                        {(bookingData.preferences.earlyCheckIn ||
                          bookingData.preferences.lateCheckOut ||
                          bookingData.preferences.dailyHousekeeping) && (
                          <div className="border-t pt-2 mt-2">
                            <div className="text-gray-600 font-medium mb-1">
                              Guest Requests:
                            </div>
                            <div className="space-y-1">
                              {bookingData.preferences.earlyCheckIn && (
                                <div className="flex items-center text-gray-700">
                                  <span className="text-blue-600 mr-2">✓</span>
                                  Early Check-in (before 3:00 PM)
                                </div>
                              )}
                              {bookingData.preferences.lateCheckOut && (
                                <div className="flex items-center text-gray-700">
                                  <span className="text-blue-600 mr-2">✓</span>
                                  Late Check-out (after 12:00 PM)
                                </div>
                              )}
                              {bookingData.preferences.dailyHousekeeping && (
                                <div className="flex items-center text-gray-700">
                                  <span className="text-blue-600 mr-2">✓</span>
                                  Daily Housekeeping
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Guest Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Users className="w-5 h-5 mr-2" />
                  Guest Information
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div>
                    <div className="font-semibold">
                      {bookingData.guest.firstName} {bookingData.guest.lastName}
                    </div>
                    <div className="text-gray-600">Primary Guest</div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                    <div className="flex items-center">
                      <Mail className="w-4 h-4 mr-2 text-gray-500" />
                      <span className="text-sm">{bookingData.guest.email}</span>
                    </div>
                    <div className="flex items-center">
                      <Phone className="w-4 h-4 mr-2 text-gray-500" />
                      <span className="text-sm">{bookingData.guest.phone}</span>
                    </div>
                  </div>
                  {bookingData.guest.panCard && (
                    <div className="pt-3 border-t border-gray-200">
                      <h5 className="font-semibold text-sm mb-2">
                        Tax Information
                      </h5>
                      <div className="bg-gray-50 p-3 rounded-lg">
                        <div className="text-xs text-gray-600 mb-1">
                          PAN Card Number
                        </div>
                        <div className="font-semibold text-sm">
                          {bookingData.guest.panCard}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            {/* Price Summary */}
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <CreditCard className="w-5 h-5 mr-2" />
                  Price Summary
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {/* Base Price */}
                {bookingData.pricing.basePrice && (
                  <div className="flex justify-between text-sm">
                    <span>
                      Base Room Rate (
                      {bookingData.pricing.nights ||
                        bookingData.stay?.nights ||
                        3}{" "}
                      nights)
                    </span>
                    <span>
                      {formatPriceWithSymbol(
                        bookingData.pricing.basePrice,
                        selectedCurrency.code,
                      )}
                    </span>
                  </div>
                )}

                {/* Fallback to old structure if new pricing not available */}
                {!bookingData.pricing.basePrice && (
                  <div className="flex justify-between text-sm">
                    <span>Room Rate ({bookingData.pricing.nights} nights)</span>
                    <span>
                      {formatPriceWithSymbol(
                        bookingData.pricing.subtotal,
                        selectedCurrency.code,
                      )}
                    </span>
                  </div>
                )}

                {/* ✅ 2-Attempt Bargain Details */}
                {bookingData.pricing.bargainAttempts === 2 && (
                  <>
                    <div className="flex justify-between text-sm text-emerald-700">
                      <span>Original Price</span>
                      <span className="line-through">
                        {formatPriceWithSymbol(
                          bookingData.pricing.originalPrice,
                          selectedCurrency.code,
                        )}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-emerald-700">
                        Safe Deal (Round 1)
                        {bookingData.pricing.selectedPrice === "Safe Deal"
                          ? " ���"
                          : ""}
                      </span>
                      <span
                        className={
                          bookingData.pricing.selectedPrice === "Safe Deal"
                            ? "font-semibold text-emerald-900"
                            : "text-gray-600"
                        }
                      >
                        {formatPriceWithSymbol(
                          bookingData.pricing.safeDealPrice,
                          selectedCurrency.code,
                        )}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-orange-700">
                        Final Offer (Round 2)
                        {bookingData.pricing.selectedPrice ===
                        "Final Bargain Offer"
                          ? " ✓"
                          : ""}
                      </span>
                      <span
                        className={
                          bookingData.pricing.selectedPrice ===
                          "Final Bargain Offer"
                            ? "font-semibold text-orange-900"
                            : "text-gray-600"
                        }
                      >
                        {formatPriceWithSymbol(
                          bookingData.pricing.finalOfferPrice,
                          selectedCurrency.code,
                        )}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm font-semibold border-t pt-2">
                      <span>
                        Your Selected Price ({bookingData.pricing.selectedPrice}
                        )
                      </span>
                      <span className="text-blue-900">
                        {formatPriceWithSymbol(
                          bookingData.pricing.subtotal,
                          selectedCurrency.code,
                        )}
                      </span>
                    </div>
                  </>
                )}

                {/* Detailed Tax Breakdown */}
                {(bookingData.amounts || bookingData.pricing.taxes || bookingData.pricing.fees) && (
                  <div className="space-y-1">
                    {bookingData.amounts?.taxes_and_fees ? (
                      <>
                        <div className="flex justify-between text-sm font-medium">
                          <span>Taxes & Fees</span>
                          <span>
                            {formatPriceWithSymbol(
                              bookingData.amounts.taxes_and_fees.gst_vat +
                              bookingData.amounts.taxes_and_fees.municipal_tax +
                              bookingData.amounts.taxes_and_fees.service_fee,
                              selectedCurrency.code,
                            )}
                          </span>
                        </div>
                        <div className="pl-4 space-y-1 text-xs text-gray-600">
                          <div className="flex justify-between">
                            <span>GST/VAT (12%)</span>
                            <span>{formatPriceWithSymbol(bookingData.amounts.taxes_and_fees.gst_vat, selectedCurrency.code)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Municipal Tax (4%)</span>
                            <span>{formatPriceWithSymbol(bookingData.amounts.taxes_and_fees.municipal_tax, selectedCurrency.code)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Service Fee (2%)</span>
                            <span>{formatPriceWithSymbol(bookingData.amounts.taxes_and_fees.service_fee, selectedCurrency.code)}</span>
                          </div>
                        </div>
                      </>
                    ) : (
                      <div className="flex justify-between text-sm">
                        <span>Taxes & Fees</span>
                        <span>
                          {formatPriceWithSymbol(
                            (bookingData.pricing.taxes || 0) +
                              (bookingData.pricing.fees || 0),
                            selectedCurrency.code,
                          )}
                        </span>
                      </div>
                    )}
                  </div>
                )}

                {/* Bargain Discount */}
                {bookingData.amounts?.bargain_discount > 0 && (
                  <div className="flex justify-between text-sm text-green-700">
                    <span>Bargain Discount Applied</span>
                    <span>-{formatPriceWithSymbol(bookingData.amounts.bargain_discount, selectedCurrency.code)}</span>
                  </div>
                )}

                {/* Discounts */}
                {bookingData.pricing.discount > 0 && (
                  <div className="flex justify-between text-sm text-green-600">
                    <span>Discount</span>
                    <span>
                      -
                      {formatPriceWithSymbol(
                        bookingData.pricing.discount,
                        selectedCurrency.code,
                      )}
                    </span>
                  </div>
                )}

                {/* Add-on Services */}
                {bookingData.pricing.addOns > 0 && (
                  <div className="flex justify-between text-sm">
                    <span>Add-on Services</span>
                    <span>
                      {formatPriceWithSymbol(
                        bookingData.pricing.addOns,
                        selectedCurrency.code,
                      )}
                    </span>
                  </div>
                )}

                {/* Divider */}
                <div className="border-t border-gray-200 pt-3">
                  {/* Net Payable */}
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-semibold">Net Payable</span>
                    <span className="text-xl font-bold text-green-600">
                      {formatPriceWithSymbol(
                        bookingData.pricing.total || bookingData.total,
                        selectedCurrency.code,
                      )}
                    </span>
                  </div>

                  {/* Payment Method */}
                  <div className="text-xs text-gray-600">
                    Payment Mode: {bookingData.paymentMethod}
                  </div>
                  {bookingData.paymentStatus && (
                    <div className="text-xs text-green-600 font-medium mt-1">
                      {bookingData.paymentStatus}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Important Information */}
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Shield className="w-5 h-5 mr-2" />
                  Important Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-green-50 p-3 rounded-lg border border-green-200">
                  <div className="flex items-center text-green-800 text-sm">
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Free cancellation until 24 hours before check-in
                  </div>
                </div>
                <div className="space-y-2 text-sm text-gray-600">
                  <div>• Valid photo ID required at check-in</div>
                  <div>• Credit card required for incidentals</div>
                  <div>• Non-smoking room as requested</div>
                  <div>• Complimentary WiFi included</div>
                </div>
              </CardContent>
            </Card>

            {/* Support */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <MessageCircle className="w-5 h-5 mr-2" />
                  Need Help?
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button variant="outline" className="w-full justify-start">
                  <Phone className="w-4 h-4 mr-2" />
                  Contact Hotel
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <Mail className="w-4 h-4 mr-2" />
                  Email Support
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <MessageCircle className="w-4 h-4 mr-2" />
                  Live Chat
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Additional Actions */}
        <div className="mt-8 text-center space-y-4">
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              onClick={() => navigate("/hotels")}
              variant="outline"
              className="sm:w-auto"
            >
              Book Another Hotel
            </Button>
            <Button
              onClick={() => navigate("/account/bookings")}
              className="sm:w-auto"
            >
              View All Bookings
            </Button>
          </div>
          <p className="text-gray-600 text-sm">
            A confirmation email has been sent to {bookingData.guest.email}
          </p>
        </div>
      </div>
    </div>
  );
}
