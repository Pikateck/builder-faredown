import React, { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Download,
  Printer,
  Share2,
  Calendar,
  MapPin,
  Users,
  Clock,
  Mail,
  Phone,
  Star,
  CheckCircle,
  Hotel,
  Plane,
  Car,
  QrCode,
  Wifi,
  Coffee,
  Utensils,
  Dumbbell,
  Shield,
  TrendingDown,
  MessageCircle,
  Building,
} from "lucide-react";
import { useCurrency } from "@/contexts/CurrencyContext";
import { formatPriceWithSymbol } from "@/lib/pricing";

export default function BookingVoucher() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { selectedCurrency } = useCurrency();
  const [isLoading, setIsLoading] = useState(false);
  const [savedBookingData, setSavedBookingData] = useState(null);

  const bookingId = searchParams.get("bookingId") || "HTL" + Date.now();

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

  // Merge saved booking data with defaults for voucher
  const voucherData = savedBookingData || {
    id: bookingId,
    confirmationCode:
      "CONF-" + Math.random().toString(36).substr(2, 9).toUpperCase(),
    status: "Confirmed",
    issueDate: new Date().toISOString(),
    validUntil: "2024-12-31",

    hotel: {
      name: "Grand Plaza Hotel",
      address: "123 Sheikh Zayed Road, Downtown Dubai, Dubai, UAE",
      location: "Downtown Dubai, United Arab Emirates",
      phone: "+971 4 123 4567",
      email: "reservations@grandplazadubai.com",
      website: "www.grandplazadubai.com",
      image:
        "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=600",
      rating: 4.8,
      reviews: 1234,
      license: "DTCM License: 123456789",
      amenities: [
        { icon: Wifi, name: "Free WiFi" },
        { icon: Coffee, name: "Coffee/Tea" },
        { icon: Utensils, name: "Restaurant" },
        { icon: Dumbbell, name: "Fitness Center" },
        { icon: Car, name: "Parking" },
        { icon: Shield, name: "24/7 Security" },
      ],
    },

    guest: {
      title: "Mr.",
      firstName: "John",
      lastName: "Doe",
      email: "john.doe@example.com",
      phone: "+1 234 567 8900",
      nationality: "United States",
      panCard: "ABCDE1234F",
    },

    reservation: {
      checkIn: "2024-07-25",
      checkOut: "2024-07-28",
      checkInTime: "15:00",
      checkOutTime: "12:00",
      nights: 3,
      adults: 2,
      children: 0,
      rooms: 1,
      roomType: "Deluxe Suite",
      bedType: "King Bed",
      smokingPreference: "Non-Smoking",
      viewType: "City View",
      floor: "High Floor Preferred",
    },

    pricing: {
      roomRate: 259,
      totalRoomCharges: 777,
      taxes: 93,
      serviceFees: 50,
      cityTax: 15,
      total: 935,
      currency: "USD",
      paymentStatus: "Paid",
      paymentMethod: "Credit Card (**** 1234)",
      paymentDate: new Date().toISOString(),
    },

    policies: {
      cancellation: "Free cancellation until 24 hours before check-in",
      checkIn: "Check-in time: 3:00 PM - 12:00 AM",
      checkOut: "Check-out time: 6:00 AM - 12:00 PM",
      pets: "Pets not allowed",
      smoking: "Smoking is not permitted",
      children: "Children of all ages are welcome",
      extraBed: "Extra beds available upon request (charges may apply)",
      internet: "Free WiFi available throughout the property",
    },

    specialRequests:
      "High floor room with city view preferred. Late check-out if possible.",

    bargainSummary: {
      originalPrice: 1000,
      bargainedPrice: 935,
      discountAmount: 65,
      discountPercentage: 6.5,
      rounds: 2,
    },

    faredownOffice: {
      address: "309 Auto Commerce House, Gamdevi, Nana Chowk, Mumbai-400007, India",
      phone: "+91 22 6680 1800",
      email: "support@faredown.com",
      website: "www.faredown.com",
      hours: "24/7 Customer Support",
    },

    preferences: {
      bedType: "King",
      smokingPreference: "Non-Smoking",
      floorPreference: "High Floor",
      earlyCheckIn: false,
      lateCheckOut: true,
      dailyHousekeeping: true,
    },

    emergencyContacts: {
      hotel: "+971 4 123 4567",
      police: "999",
      ambulance: "998",
      fire: "997",
    },

    qrCode:
      "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==", // Placeholder QR code
  };

  const handleDownload = async () => {
    setIsLoading(true);
    try {
      // Simulate download process
      await new Promise((resolve) => setTimeout(resolve, 1500));

      // Create a downloadable PDF (in production, this would generate actual PDF)
      const element = document.getElementById("voucher-content");
      if (element) {
        // Generate a simple text-based voucher for download
        const voucherContent = `
HOTEL BOOKING VOUCHER
faredown.com

Booking ID: HV${Date.now()}
Date: ${new Date().toLocaleDateString()}

Hotel Details:
- Name: Grand Hyatt Dubai
- Location: Dubai, United Arab Emirates
- Check-in: ${new Date().toLocaleDateString()}
- Check-out: ${new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toLocaleDateString()}
- Guests: 2 Adults
- Room: Superior King Room

This voucher confirms your hotel booking.
Please present this at the hotel during check-in.
        `;

        // Create and download the file
        const blob = new Blob([voucherContent], { type: "text/plain" });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `hotel-voucher-${Date.now()}.txt`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error("Download failed:", error);
      alert("Download failed. Please try again or use the print option.");
    } finally {
      setIsLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: "Hotel Booking Voucher",
          text: `Booking voucher for ${voucherData.hotel.name}`,
          url: window.location.href,
        });
      } catch (error) {
        console.log("Error sharing:", error);
      }
    } else {
      // Fallback: copy URL to clipboard
      await navigator.clipboard.writeText(window.location.href);
      alert("Voucher link copied to clipboard!");
    }
  };

  useEffect(() => {
    // Add print styles
    const style = document.createElement("style");
    style.textContent = `
      @media print {
        .no-print { display: none !important; }
        .print-full-width { width: 100% !important; max-width: none !important; }
        body { font-size: 12px; }
        .voucher-container { box-shadow: none !important; border: 1px solid #000 !important; }
      }
    `;
    document.head.appendChild(style);

    return () => {
      document.head.removeChild(style);
    };
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="no-print">
        <Header />
      </div>

      <div className="max-w-4xl mx-auto px-3 sm:px-4 lg:px-8 py-6 print-full-width">
        {/* Action Buttons */}
        <div className="no-print mb-6 flex flex-wrap gap-3 justify-center">
          <Button
            onClick={handleDownload}
            disabled={isLoading}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {isLoading ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
            ) : (
              <Download className="w-4 h-4 mr-2" />
            )}
            Download PDF
          </Button>
          <Button onClick={handlePrint} variant="outline">
            <Printer className="w-4 h-4 mr-2" />
            Print Voucher
          </Button>
          <Button onClick={handleShare} variant="outline">
            <Share2 className="w-4 h-4 mr-2" />
            Share
          </Button>
        </div>

        {/* Voucher Content */}
        <Card
          id="voucher-content"
          className="voucher-container bg-white shadow-lg"
        >
          <CardContent className="p-8">
            {/* Header */}
            <div className="border-b-2 border-blue-600 pb-6 mb-6">
              <div className="flex justify-between items-start">
                <div>
                  <div className="flex items-center space-x-3 mb-2">
                    <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center">
                      <span className="text-lg font-bold text-white">F</span>
                    </div>
                    <div>
                      <h1 className="text-3xl font-bold text-blue-600">
                        FAREDOWN
                      </h1>
                      <p className="text-xs text-gray-600">
                        Travel Booking Platform
                      </p>
                    </div>
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900 mt-3 mb-2">
                    HOTEL BOOKING VOUCHER
                  </h2>
                  <p className="text-gray-600">
                    Please present this voucher at the hotel reception
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-sm text-gray-600">Issue Date</div>
                  <div className="font-semibold">
                    {new Date(voucherData.issueDate).toLocaleDateString()}
                  </div>
                  <div className="text-sm text-gray-600 mt-2">Valid Until</div>
                  <div className="font-semibold">{voucherData.validUntil}</div>
                </div>
              </div>
            </div>

            {/* Confirmation Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <div className="bg-blue-50 p-4 rounded-lg">
                <h3 className="font-semibold text-blue-900 mb-2">
                  Booking Reference
                </h3>
                <div className="text-2xl font-bold text-blue-600 tracking-wider">
                  {voucherData.confirmationCode}
                </div>
                <div className="text-sm text-blue-700 mt-1">
                  Booking ID: {voucherData.id}
                </div>
              </div>
              <div className="bg-green-50 p-4 rounded-lg">
                <h3 className="font-semibold text-green-900 mb-2">Status</h3>
                <div className="flex items-center">
                  <CheckCircle className="w-5 h-5 text-green-600 mr-2" />
                  <span className="text-green-600 font-semibold">
                    {voucherData.status}
                  </span>
                </div>
                <div className="text-sm text-green-700 mt-1">
                  Payment: {voucherData.pricing.paymentStatus}
                </div>
              </div>
            </div>

            {/* Hotel Information */}
            <div className="mb-8">
              <h2 className="text-xl font-bold mb-4 flex items-center">
                <Hotel className="w-5 h-5 mr-2" />
                Hotel Information
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-2">
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">
                    {voucherData.hotel.name}
                  </h3>
                  <div className="space-y-2 text-gray-700">
                    <div className="flex items-start">
                      <MapPin className="w-4 h-4 mr-2 mt-1 text-gray-500" />
                      <span>{voucherData.hotel.address}</span>
                    </div>
                    <div className="flex items-center">
                      <Phone className="w-4 h-4 mr-2 text-gray-500" />
                      <span>{voucherData.hotel.phone}</span>
                    </div>
                    <div className="flex items-center">
                      <Mail className="w-4 h-4 mr-2 text-gray-500" />
                      <span>{voucherData.hotel.email}</span>
                    </div>
                  </div>
                  <div className="flex items-center mt-3">
                    <div className="flex items-center">
                      {Array.from({ length: 5 }, (_, i) => (
                        <Star
                          key={i}
                          className={`w-4 h-4 ${
                            i < Math.floor(voucherData.hotel.rating)
                              ? "text-yellow-400 fill-current"
                              : "text-gray-300"
                          }`}
                        />
                      ))}
                    </div>
                    <span className="ml-2 font-medium">
                      {voucherData.hotel.rating}
                    </span>
                    <span className="ml-1 text-gray-600">
                      ({voucherData.hotel.reviews} reviews)
                    </span>
                  </div>
                </div>
                <div className="flex justify-center items-center">
                  <div className="bg-gray-100 p-4 rounded-lg">
                    <QrCode className="w-24 h-24 text-gray-600" />
                    <div className="text-xs text-center text-gray-600 mt-2">
                      Scan for quick check-in
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Guest Information */}
            <div className="mb-8">
              <h2 className="text-xl font-bold mb-4 flex items-center">
                <Users className="w-5 h-5 mr-2" />
                Guest Information
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">
                    Primary Guest
                  </h3>
                  <div className="space-y-1 text-gray-700">
                    <div className="text-lg font-medium">
                      {voucherData.guest.title} {voucherData.guest.firstName}{" "}
                      {voucherData.guest.lastName}
                    </div>
                    <div>{voucherData.guest.email}</div>
                    <div>{voucherData.guest.phone}</div>
                    <div>Nationality: {voucherData.guest.nationality}</div>
                    {voucherData.guest.panCard && (
                      <div className="pt-3 border-t border-gray-300 mt-3">
                        <div className="text-xs text-gray-600">Tax Information (PAN)</div>
                        <div className="font-semibold font-mono">
                          {voucherData.guest.panCard}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">
                    Occupancy
                  </h3>
                  <div className="space-y-1 text-gray-700">
                    <div>Adults: {voucherData.reservation.adults}</div>
                    <div>Children: {voucherData.reservation.children}</div>
                    <div>
                      Total Guests:{" "}
                      {voucherData.reservation.adults +
                        voucherData.reservation.children}
                    </div>
                    <div>Rooms: {voucherData.reservation.rooms}</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Reservation Details */}
            <div className="mb-8">
              <h2 className="text-xl font-bold mb-4 flex items-center">
                <Calendar className="w-5 h-5 mr-2" />
                Reservation Details
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-blue-50 p-4 rounded-lg text-center">
                  <h4 className="font-semibold text-blue-900 mb-2">Check-in</h4>
                  <div className="text-lg font-bold">
                    {new Date(
                      voucherData.reservation.checkIn,
                    ).toLocaleDateString()}
                  </div>
                  <div className="text-sm text-blue-700">
                    After {voucherData.reservation.checkInTime}
                  </div>
                </div>
                <div className="bg-red-50 p-4 rounded-lg text-center">
                  <h4 className="font-semibold text-red-900 mb-2">Check-out</h4>
                  <div className="text-lg font-bold">
                    {new Date(
                      voucherData.reservation.checkOut,
                    ).toLocaleDateString()}
                  </div>
                  <div className="text-sm text-red-700">
                    Before {voucherData.reservation.checkOutTime}
                  </div>
                </div>
                <div className="bg-green-50 p-4 rounded-lg text-center">
                  <h4 className="font-semibold text-green-900 mb-2">
                    Duration
                  </h4>
                  <div className="text-2xl font-bold text-green-600">
                    {voucherData.reservation.nights}
                  </div>
                  <div className="text-sm text-green-700">
                    {voucherData.reservation.nights === 1 ? "Night" : "Nights"}
                  </div>
                </div>
                <div className="bg-purple-50 p-4 rounded-lg text-center">
                  <h4 className="font-semibold text-purple-900 mb-2">
                    Room Type
                  </h4>
                  <div className="text-sm font-bold text-purple-600">
                    {voucherData.reservation.roomType}
                  </div>
                  <div className="text-xs text-purple-700">
                    {voucherData.reservation.bedType}
                  </div>
                </div>
              </div>

              <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-semibold mb-2">Room Details</h4>
                  <ul className="text-sm text-gray-700 space-y-1">
                    <li>• {voucherData.reservation.smokingPreference}</li>
                    <li>• {voucherData.reservation.viewType}</li>
                    <li>• {voucherData.reservation.floor}</li>
                    {voucherData.reservation.breakfastIncluded !== undefined && (
                      <li className="font-medium">
                        • Breakfast:{" "}
                        <span
                          className={
                            voucherData.reservation.breakfastIncluded
                              ? "text-green-700"
                              : "text-orange-700"
                          }
                        >
                          {voucherData.reservation.breakfastIncluded
                            ? "✓ Included"
                            : "Not Included"}
                        </span>
                      </li>
                    )}
                  </ul>
                </div>
                {voucherData.specialRequests && (
                  <div>
                    <h4 className="font-semibold mb-2">Special Requests</h4>
                    <p className="text-sm text-gray-700">
                      {voucherData.specialRequests}
                    </p>
                  </div>
                )}

                {voucherData.preferences && (
                  <div className="border-t pt-4 mt-4">
                    <h4 className="font-semibold mb-2">
                      Room Preferences & Guest Requests
                    </h4>
                    <div className="space-y-1 text-sm text-gray-700">
                      {voucherData.preferences.bedType && (
                        <div className="flex justify-between">
                          <span>Bed Type:</span>
                          <span>{voucherData.preferences.bedType}</span>
                        </div>
                      )}
                      {voucherData.preferences.smokingPreference && (
                        <div className="flex justify-between">
                          <span>Smoking Preference:</span>
                          <span>
                            {voucherData.preferences.smokingPreference}
                          </span>
                        </div>
                      )}
                      {voucherData.preferences.floorPreference && (
                        <div className="flex justify-between">
                          <span>Floor Preference:</span>
                          <span>{voucherData.preferences.floorPreference}</span>
                        </div>
                      )}
                      {(voucherData.preferences.earlyCheckIn ||
                        voucherData.preferences.lateCheckOut ||
                        voucherData.preferences.dailyHousekeeping) && (
                        <div className="pt-2 border-t">
                          <div className="font-medium mb-1">
                            Guest Requests:
                          </div>
                          <ul className="space-y-0.5 pl-4">
                            {voucherData.preferences.earlyCheckIn && (
                              <li className="text-gray-700">
                                ✓ Early Check-in (before 3:00 PM)
                              </li>
                            )}
                            {voucherData.preferences.lateCheckOut && (
                              <li className="text-gray-700">
                                ✓ Late Check-out (after 12:00 PM)
                              </li>
                            )}
                            {voucherData.preferences.dailyHousekeeping && (
                              <li className="text-gray-700">
                                ✓ Daily Housekeeping
                              </li>
                            )}
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Special Requests */}
            {voucherData.specialRequests && (
              <div className="mb-8">
                <h2 className="text-xl font-bold mb-4 flex items-center">
                  <MessageCircle className="w-5 h-5 mr-2" />
                  Special Requests
                </h2>
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                  <p className="text-gray-800">{voucherData.specialRequests}</p>
                  <p className="text-xs text-gray-600 mt-2">
                    Please note: Special requests are made on a best-effort
                    basis and subject to availability at the hotel.
                  </p>
                </div>
              </div>
            )}

            {/* Pricing Information */}
            <div className="mb-8">
              <h2 className="text-xl font-bold mb-4">Pricing Information</h2>
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="space-y-2">
                  {/* New structure pricing */}
                  {voucherData.pricing.basePrice ? (
                    <>
                      <div className="flex justify-between">
                        <span>
                          Base Room Rate (
                          {voucherData.reservation.nights ||
                            voucherData.nights ||
                            3}{" "}
                          nights)
                        </span>
                        <span>
                          {formatPriceWithSymbol(
                            voucherData.pricing.basePrice,
                            selectedCurrency.code,
                          )}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Taxes & Fees</span>
                        <span>
                          {formatPriceWithSymbol(
                            voucherData.pricing.taxes || 0,
                            selectedCurrency.code,
                          )}
                        </span>
                      </div>
                      {voucherData.pricing.discount > 0 && (
                        <div className="flex justify-between text-green-600">
                          <span>Discount</span>
                          <span>
                            -
                            {formatPriceWithSymbol(
                              voucherData.pricing.discount,
                              selectedCurrency.code,
                            )}
                          </span>
                        </div>
                      )}
                    </>
                  ) : (
                    <>
                      {/* Legacy structure pricing */}
                      <div className="flex justify-between">
                        <span>
                          Room Rate ({voucherData.reservation.nights} nights)
                        </span>
                        <span>
                          {formatPriceWithSymbol(
                            voucherData.pricing.totalRoomCharges,
                            selectedCurrency.code,
                          )}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Taxes</span>
                        <span>
                          {formatPriceWithSymbol(
                            voucherData.pricing.taxes,
                            selectedCurrency.code,
                          )}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Service Fees</span>
                        <span>
                          {formatPriceWithSymbol(
                            voucherData.pricing.serviceFees,
                            selectedCurrency.code,
                          )}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>City Tax</span>
                        <span>
                          {formatPriceWithSymbol(
                            voucherData.pricing.cityTax,
                            selectedCurrency.code,
                          )}
                        </span>
                      </div>
                    </>
                  )}

                  <div className="border-t border-gray-300 pt-2 flex justify-between font-bold text-lg">
                    <span>Total Payable</span>
                    <span className="text-green-600">
                      {formatPriceWithSymbol(
                        voucherData.pricing.total || voucherData.total,
                        selectedCurrency.code,
                      )}
                    </span>
                  </div>
                </div>
                <div className="mt-3 text-sm text-gray-600">
                  <div>
                    Payment Status:{" "}
                    <span className="font-medium">
                      {voucherData.pricing.paymentStatus ||
                        voucherData.paymentStatus ||
                        "Confirmed"}
                    </span>
                  </div>
                  <div>
                    Payment Method:{" "}
                    <span className="font-medium">
                      {voucherData.pricing.paymentMethod ||
                        voucherData.paymentMethod ||
                        "Not specified"}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Bargain Summary - If bargain applied */}
            {voucherData.bargainSummary && voucherData.bargainSummary.rounds > 0 && (
              <div className="mb-8">
                <h2 className="text-xl font-bold mb-4 flex items-center">
                  <TrendingDown className="w-5 h-5 mr-2 text-orange-600" />
                  Bargain Summary
                </h2>
                <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-700">Original Price</span>
                      <span className="font-semibold">
                        {formatPriceWithSymbol(
                          voucherData.bargainSummary.originalPrice,
                          selectedCurrency.code,
                        )}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-700">Bargain Discount</span>
                      <span className="font-semibold text-orange-600">
                        -
                        {formatPriceWithSymbol(
                          voucherData.bargainSummary.discountAmount,
                          selectedCurrency.code,
                        )}{" "}
                        ({voucherData.bargainSummary.discountPercentage}%)
                      </span>
                    </div>
                    <div className="border-t border-orange-300 pt-3 flex justify-between">
                      <span className="font-bold text-lg">Final Price</span>
                      <span className="font-bold text-lg text-orange-600">
                        {formatPriceWithSymbol(
                          voucherData.bargainSummary.bargainedPrice,
                          selectedCurrency.code,
                        )}
                      </span>
                    </div>
                    <p className="text-xs text-gray-600 mt-2">
                      You successfully negotiated the price through {voucherData.bargainSummary.rounds} bargain round(s).
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Hotel Amenities */}
            <div className="mb-8">
              <h2 className="text-xl font-bold mb-4">Hotel Amenities</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {voucherData.hotel.amenities.map((amenity, index) => (
                  <div key={index} className="flex items-center text-sm">
                    <amenity.icon className="w-4 h-4 mr-2 text-gray-600" />
                    <span>{amenity.name}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Important Policies */}
            <div className="mb-8">
              <h2 className="text-xl font-bold mb-4">Important Policies</h2>
              <div className="space-y-3 text-sm">
                <div className="bg-yellow-50 p-3 rounded border border-yellow-200">
                  <strong>Cancellation Policy:</strong>{" "}
                  {voucherData.policies.cancellation}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <strong>Check-in:</strong> {voucherData.policies.checkIn}
                  </div>
                  <div>
                    <strong>Check-out:</strong> {voucherData.policies.checkOut}
                  </div>
                  <div>
                    <strong>Pets:</strong> {voucherData.policies.pets}
                  </div>
                  <div>
                    <strong>Smoking:</strong> {voucherData.policies.smoking}
                  </div>
                  <div>
                    <strong>Children:</strong> {voucherData.policies.children}
                  </div>
                  <div>
                    <strong>Internet:</strong> {voucherData.policies.internet}
                  </div>
                </div>
              </div>
            </div>

            {/* Faredown Office & Support Information */}
            {voucherData.faredownOffice && (
              <div className="mb-8">
                <h2 className="text-xl font-bold mb-4 flex items-center">
                  <Building className="w-5 h-5 mr-2" />
                  Faredown Office & Support
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                    <h4 className="font-bold text-blue-900 mb-3">Faredown Office</h4>
                    <div className="space-y-2 text-sm text-gray-700">
                      <div className="flex items-start">
                        <MapPin className="w-4 h-4 mr-2 text-blue-600 mt-0.5 flex-shrink-0" />
                        <span>{voucherData.faredownOffice.address}</span>
                      </div>
                      <div className="flex items-center">
                        <Phone className="w-4 h-4 mr-2 text-blue-600" />
                        <span>{voucherData.faredownOffice.phone}</span>
                      </div>
                      <div className="flex items-center">
                        <Mail className="w-4 h-4 mr-2 text-blue-600" />
                        <span>{voucherData.faredownOffice.email}</span>
                      </div>
                    </div>
                  </div>
                  <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                    <h4 className="font-bold text-green-900 mb-3">24/7 Customer Support</h4>
                    <div className="space-y-2 text-sm text-gray-700">
                      <div>
                        <div className="font-semibold text-green-900">Contact Hours</div>
                        <p>{voucherData.faredownOffice.hours}</p>
                      </div>
                      <div>
                        <div className="font-semibold text-green-900">Website</div>
                        <p>{voucherData.faredownOffice.website}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Terms and Conditions */}
            <div className="mb-8">
              <h2 className="text-xl font-bold mb-4">Terms and Conditions</h2>
              <div className="space-y-3 text-xs leading-relaxed text-gray-700">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="font-semibold text-gray-900 mb-1">
                    1. Booking Confirmation
                  </p>
                  <p>
                    Your booking is confirmed only upon receipt of payment. A
                    confirmation email with all booking details will be sent to
                    your registered email address.
                  </p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="font-semibold text-gray-900 mb-1">
                    2. Payment Terms
                  </p>
                  <p>
                    All payments must be made through the Faredown booking
                    platform using the selected payment method. Payment failure
                    may result in automatic booking cancellation.
                  </p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="font-semibold text-gray-900 mb-1">
                    3. Cancellation & Refunds
                  </p>
                  <p>
                    Cancellation policies vary by booking. Please refer to the
                    "Important Policies" section above for specific cancellation
                    terms applicable to your reservation.
                  </p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="font-semibold text-gray-900 mb-1">
                    4. Modification of Bookings
                  </p>
                  <p>
                    Changes to your booking (dates, guests, room type) may be
                    allowed subject to availability and may incur additional
                    charges. Modifications must be made directly through your
                    account.
                  </p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="font-semibold text-gray-900 mb-1">
                    5. Hotel Policies
                  </p>
                  <p>
                    The hotel reserves the right to enforce its own
                    check-in/check-out policies, dress codes, and conduct rules.
                    Guests must adhere to all hotel policies during their stay.
                  </p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="font-semibold text-gray-900 mb-1">
                    6. Liability & Valuables
                  </p>
                  <p>
                    Faredown is not responsible for loss, theft, or damage to
                    personal belongings during your stay. Hotel safe facilities
                    are available free of charge.
                  </p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="font-semibold text-gray-900 mb-1">
                    7. Guest Information & Age
                  </p>
                  <p>
                    Guests must be at least 18 years old. Valid
                    government-issued photo ID is required at check-in. The name
                    on the ID must match the booking name.
                  </p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="font-semibold text-gray-900 mb-1">
                    8. Customer Support
                  </p>
                  <p>
                    For booking assistance and customer support, contact us at
                    support@faredown.com or call +971 4 123 4567. Available 24/7
                    for your convenience.
                  </p>
                </div>
              </div>
            </div>

            {/* Emergency Contacts */}
            <div className="mb-6">
              <h2 className="text-xl font-bold mb-4">Emergency Contacts</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <strong>Hotel:</strong>
                  <br />
                  {voucherData.emergencyContacts.hotel}
                </div>
                <div>
                  <strong>Police:</strong>
                  <br />
                  {voucherData.emergencyContacts.police}
                </div>
                <div>
                  <strong>Ambulance:</strong>
                  <br />
                  {voucherData.emergencyContacts.ambulance}
                </div>
                <div>
                  <strong>Fire Department:</strong>
                  <br />
                  {voucherData.emergencyContacts.fire}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="border-t-2 border-gray-300 pt-4 text-center text-xs text-gray-600">
              <p className="mb-2">
                This voucher is electronically generated and is valid without
                signature.
              </p>
              <p className="mb-2">
                Please ensure to carry a valid photo ID for verification at the
                hotel.
              </p>
              <p>
                For any queries, please contact our support team or the hotel
                directly.
              </p>
              <div className="mt-4 text-xs">
                <p>{voucherData.hotel.license}</p>
                <p>Generated on: {new Date().toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Back Navigation */}
        <div className="no-print mt-6 text-center">
          <Button
            onClick={() => navigate("/hotels")}
            variant="outline"
            className="mr-4"
          >
            Book Another Hotel
          </Button>
          <Button onClick={() => navigate("/account/bookings")}>
            View All Bookings
          </Button>
        </div>
      </div>
    </div>
  );
}
