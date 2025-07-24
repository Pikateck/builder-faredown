import React, { useState, useEffect } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { Header } from "@/components/Header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  CheckCircle,
  Download,
  Mail,
  Calendar,
  MapPin,
  Users,
  Phone,
  CreditCard,
  Printer,
  Share2,
  ArrowLeft,
} from "lucide-react";

interface BookingData {
  bookingRef: string;
  status: string;
  hotelDetails: {
    name: string;
    address: string;
    phone: string;
    email: string;
    starRating: number;
  };
  guestDetails: {
    primaryGuest: {
      title: string;
      firstName: string;
      lastName: string;
    };
    contactInfo: {
      email: string;
      phone: string;
    };
  };
  roomDetails: {
    name: string;
    category: string;
    bedType: string;
  };
  checkIn: string;
  checkOut: string;
  totalAmount: number;
  currency: string;
  paymentDetails: {
    method: string;
    razorpay_payment_id: string;
    paidAt: string;
  };
  confirmedAt: string;
}

export default function BookingConfirmation() {
  const navigate = useNavigate();
  const { bookingRef } = useParams();
  const [searchParams] = useSearchParams();
  const [booking, setBooking] = useState<BookingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [bookingType, setBookingType] = useState<"flight" | "hotel">("hotel");

  useEffect(() => {
    // Detect booking type from URL params, localStorage, or default to hotel
    const typeFromUrl = searchParams.get("type");
    const typeFromStorage = localStorage.getItem("currentBookingType");

    if (typeFromUrl === "flight" || typeFromStorage === "flight") {
      setBookingType("flight");
    } else {
      setBookingType("hotel");
    }

    if (bookingRef) {
      loadBookingDetails();
    } else {
      const tempRef = searchParams.get("ref");
      if (tempRef) {
        // Redirect from payment success with temp reference
        checkPaymentStatus(tempRef);
      }
    }
  }, [bookingRef, searchParams]);

  const loadBookingDetails = async () => {
    try {
      setLoading(true);
      // Use mock booking data to avoid fetch calls
      console.log(
        `Loading ${bookingType} booking ${bookingRef}: Using mock data (fetch disabled)`,
      );

      let mockData;

      if (bookingType === "flight") {
        // Mock flight booking data
        mockData = {
          bookingRef: bookingRef || `FD${Date.now()}`,
          status: "confirmed",
          type: "flight",
          flightDetails: {
            airline: "Emirates",
            flightNumber: "EK 225",
            departure: {
              airport: "Dubai International (DXB)",
              city: "Dubai",
              time: "14:30",
              date: "2025-01-25"
            },
            arrival: {
              airport: "Indira Gandhi International (DEL)",
              city: "Delhi",
              time: "19:45",
              date: "2025-01-25"
            },
            duration: "3h 15m",
            class: "Economy"
          },
          passengers: [
            {
              title: "Mr",
              firstName: "John",
              lastName: "Doe",
              type: "Adult"
            }
          ],
          totalAmount: 12500,
          currency: "INR",
          paymentDetails: {
            method: "Credit Card",
            razorpay_payment_id: "pay_" + Math.random().toString(36).substr(2, 9),
            paidAt: new Date().toISOString()
          },
          confirmedAt: new Date().toISOString()
        };
      } else {
        // Mock hotel booking data
        mockData = {
          bookingRef: bookingRef || `FD${Date.now()}`,
          status: "confirmed",
          type: "hotel",
          hotelDetails: {
            name: "Grand Hotel Dubai",
            address: "Downtown Dubai, United Arab Emirates",
            phone: "+971 4 123 4567",
            email: "reservations@grandhoteldubai.com",
            starRating: 5
          },
          guestDetails: {
            primaryGuest: {
              title: "Mr",
              firstName: "John",
              lastName: "Doe"
            },
            contactInfo: {
              email: "john.doe@example.com",
              phone: "+1 234 567 8900"
            }
          },
          roomDetails: {
            name: "Deluxe Suite with City View",
            category: "Suite",
            bedType: "King Bed"
          },
          checkIn: "2025-01-25",
          checkOut: "2025-01-27",
          totalAmount: 15000,
          currency: "INR",
          paymentDetails: {
            method: "Credit Card",
            razorpay_payment_id: "pay_" + Math.random().toString(36).substr(2, 9),
            paidAt: new Date().toISOString()
          },
          confirmedAt: new Date().toISOString()
        } as BookingData;
      }

      const result = {
        success: true,
        data: mockData,
      };

      if (result.success) {
        setBooking(result.data);
      } else {
        setError("Booking not found");
      }
    } catch (error) {
      console.error("Error loading booking:", error);
      setError("Failed to load booking details");
    } finally {
      setLoading(false);
    }
  };

  const checkPaymentStatus = async (tempRef: string) => {
    try {
      setLoading(true);
      // This would be called after payment success to get final booking details
      console.log(
        `Checking payment for ${tempRef}: Using mock data (fetch disabled)`,
      );
      const bookingRef = `FD${Date.now()}`;

      let mockData;

      if (bookingType === "flight") {
        // Mock flight booking data for payment success
        mockData = {
          bookingRef,
          status: "confirmed",
          type: "flight",
          flightDetails: {
            airline: "Air India",
            flightNumber: "AI 131",
            departure: {
              airport: "Mumbai International (BOM)",
              city: "Mumbai",
              time: "08:15",
              date: "2025-01-26"
            },
            arrival: {
              airport: "Dubai International (DXB)",
              city: "Dubai",
              time: "10:30",
              date: "2025-01-26"
            },
            duration: "3h 15m",
            class: "Economy"
          },
          passengers: [
            {
              title: "Mr",
              firstName: "Ahmed",
              lastName: "Al-Rashid",
              type: "Adult"
            }
          ],
          totalAmount: 18500,
          currency: "INR",
          paymentDetails: {
            method: "Razorpay",
            razorpay_payment_id: tempRef,
            paidAt: new Date().toISOString()
          },
          confirmedAt: new Date().toISOString()
        };
      } else {
        // Mock hotel booking data for payment success
        mockData = {
          bookingRef,
          status: "confirmed",
          type: "hotel",
          hotelDetails: {
            name: "Premium Hotel Dubai",
            address: "Business Bay, Dubai, United Arab Emirates",
            phone: "+971 4 567 8901",
            email: "reservations@premiumhoteldubai.com",
            starRating: 4
          },
          guestDetails: {
            primaryGuest: {
              title: "Mr",
              firstName: "Ahmed",
              lastName: "Al-Rashid"
            },
            contactInfo: {
              email: "ahmed.alrashid@example.com",
              phone: "+971 50 123 4567"
            }
          },
          roomDetails: {
            name: "Executive Room with Burj Khalifa View",
            category: "Executive",
            bedType: "Queen Bed"
          },
          checkIn: "2025-01-26",
          checkOut: "2025-01-28",
          totalAmount: 8500,
          currency: "AED",
          paymentDetails: {
            method: "Razorpay",
            razorpay_payment_id: tempRef,
            paidAt: new Date().toISOString()
          },
          confirmedAt: new Date().toISOString()
        } as BookingData;
      }

      const result = {
        success: true,
        data: mockData,
      };

      if (result.success) {
        // Set the booking data to display confirmation
        setBooking(result.data);
        // Update URL to show booking reference
        navigate(`/booking-confirmation/${bookingRef}`, { replace: true });
      } else {
        setError("Payment verification failed");
      }
    } catch (error) {
      console.error("Error checking payment status:", error);
      setError("Failed to verify payment status");
    } finally {
      setLoading(false);
    }
  };

  const downloadVoucher = async () => {
    try {
      // Mock voucher download to avoid fetch calls
      console.log(
        `Downloading voucher for ${bookingRef}: Using mock functionality (fetch disabled)`,
      );
      alert(
        "Voucher download simulated - fetch calls disabled for development",
      );
    } catch (error) {
      console.error("Error downloading voucher:", error);
    }
  };

  const downloadInvoice = async () => {
    try {
      // Mock invoice download to avoid fetch calls
      console.log(
        `Downloading invoice for ${bookingRef}: Using mock functionality (fetch disabled)`,
      );
      alert(
        "Invoice download simulated - fetch calls disabled for development",
      );
    } catch (error) {
      console.error("Error downloading invoice:", error);
    }
  };

  const sendVoucherEmail = async () => {
    try {
      // Mock email sending to avoid fetch calls
      console.log(
        `Sending voucher email for ${bookingRef}: Using mock functionality (fetch disabled)`,
      );
      alert(
        "Voucher email simulated - sent successfully! (fetch calls disabled for development)",
      );
    } catch (error) {
      console.error("Error sending voucher email:", error);
    }
  };

  const calculateNights = (checkIn: string, checkOut: string) => {
    const checkInDate = new Date(checkIn);
    const checkOutDate = new Date(checkOut);
    const timeDiff = checkOutDate.getTime() - checkInDate.getTime();
    return Math.ceil(timeDiff / (1000 * 60 * 60 * 24));
  };

  if (loading) {
    return (
      <div
        className="min-h-screen bg-white"
        style={{
          fontFamily:
            'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen, Ubuntu, Cantarell, "Open Sans", "Helvetica Neue", sans-serif',
        }}
      >
        <Header />
        <div className="max-w-4xl mx-auto px-3 sm:px-4 py-8">
          <div className="text-center">
            <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-gray-600">Loading booking details...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div
        className="min-h-screen bg-white"
        style={{
          fontFamily:
            'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen, Ubuntu, Cantarell, "Open Sans", "Helvetica Neue", sans-serif',
        }}
      >
        <Header />
        <div className="max-w-4xl mx-auto px-3 sm:px-4 py-8">
          <div className="text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-red-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Booking Error
            </h1>
            <p className="text-gray-600 mb-6">{error}</p>
            <Button
              onClick={() => navigate(bookingType === "flight" ? "/flights" : "/hotels")}
              className="bg-[#003580] hover:bg-[#002a66]"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to {bookingType === "flight" ? "Flights" : "Hotels"}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (!booking) {
    return null;
  }

  return (
    <div
      className="min-h-screen bg-white"
      style={{
        fontFamily:
          'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen, Ubuntu, Cantarell, "Open Sans", "Helvetica Neue", sans-serif',
      }}
    >
      <Header />

      {/* Success Header */}
      <div className="bg-green-50 border-b border-green-200">
        <div className="max-w-4xl mx-auto px-3 sm:px-4 py-6">
          <div className="flex items-center justify-center text-center">
            <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center mr-4">
              <CheckCircle className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-green-800">
                Booking Confirmed!
              </h1>
              <p className="text-green-700 text-sm sm:text-base">
                Your {bookingType === "flight" ? "flight ticket" : "hotel reservation"} has been successfully confirmed
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-3 sm:px-4 py-6 sm:py-8">
        {/* Booking Reference */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-blue-900 mb-1">
                Booking Reference
              </h2>
              <p className="text-2xl font-bold text-blue-600">
                {booking.bookingRef}
              </p>
            </div>
            <div className="mt-3 sm:mt-0 flex flex-wrap gap-2">
              <Button
                onClick={downloadVoucher}
                variant="outline"
                size="sm"
                className="border-blue-300 text-blue-700 hover:bg-blue-50"
              >
                <Download className="w-4 h-4 mr-2" />
                Download {bookingType === "flight" ? "E-Ticket" : "Voucher"}
              </Button>
              <Button
                onClick={downloadInvoice}
                variant="outline"
                size="sm"
                className="border-blue-300 text-blue-700 hover:bg-blue-50"
              >
                <Download className="w-4 h-4 mr-2" />
                Download Invoice
              </Button>
              <Button
                onClick={sendVoucherEmail}
                variant="outline"
                size="sm"
                className="border-blue-300 text-blue-700 hover:bg-blue-50"
              >
                <Mail className="w-4 h-4 mr-2" />
                Email {bookingType === "flight" ? "E-Ticket" : "Voucher"}
              </Button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Booking Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Flight/Hotel Details */}
            <Card>
              <CardContent className="p-6">
                {bookingType === "flight" ? (
                  <>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">
                      Flight Details
                    </h3>
                    <div className="space-y-4">
                      <div>
                        <div className="flex items-center justify-between mb-4">
                          <div>
                            <h4 className="text-xl font-bold text-gray-900">
                              {(booking as any).flightDetails.airline}
                            </h4>
                            <p className="text-lg text-gray-600">
                              Flight {(booking as any).flightDetails.flightNumber}
                            </p>
                          </div>
                          <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                            {(booking as any).flightDetails.class}
                          </Badge>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          {/* Departure */}
                          <div className="p-4 bg-gray-50 rounded-lg">
                            <h5 className="font-semibold text-gray-900 mb-2">Departure</h5>
                            <p className="text-sm text-gray-600">{(booking as any).flightDetails.departure.airport}</p>
                            <p className="text-lg font-bold text-gray-900">
                              {(booking as any).flightDetails.departure.time}
                            </p>
                            <p className="text-sm text-gray-600">{(booking as any).flightDetails.departure.date}</p>
                          </div>

                          {/* Arrival */}
                          <div className="p-4 bg-gray-50 rounded-lg">
                            <h5 className="font-semibold text-gray-900 mb-2">Arrival</h5>
                            <p className="text-sm text-gray-600">{(booking as any).flightDetails.arrival.airport}</p>
                            <p className="text-lg font-bold text-gray-900">
                              {(booking as any).flightDetails.arrival.time}
                            </p>
                            <p className="text-sm text-gray-600">{(booking as any).flightDetails.arrival.date}</p>
                          </div>
                        </div>

                        <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                          <p className="text-center text-blue-800">
                            <span className="font-semibold">Duration:</span> {(booking as any).flightDetails.duration}
                          </p>
                        </div>
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">
                      Hotel Details
                    </h3>
                    <div className="space-y-4">
                      <div>
                        <div className="flex items-start justify-between mb-2">
                          <h4 className="text-xl font-bold text-gray-900">
                            {(booking as any).hotelDetails?.name}
                          </h4>
                          {(booking as any).hotelDetails?.starRating && (
                            <div className="flex">
                              {Array.from({
                                length: (booking as any).hotelDetails.starRating,
                              }).map((_, i) => (
                                <span key={i} className="text-yellow-400 text-sm">
                                  ★
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                        <div className="flex items-start text-gray-600 text-sm">
                          <MapPin className="w-4 h-4 mr-2 mt-0.5 flex-shrink-0" />
                          <span>{(booking as any).hotelDetails?.address}</span>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-gray-200">
                        <div className="flex items-center text-sm text-gray-600">
                          <Phone className="w-4 h-4 mr-2" />
                          {(booking as any).hotelDetails?.phone}
                        </div>
                        <div className="flex items-center text-sm text-gray-600">
                          <Mail className="w-4 h-4 mr-2" />
                          {(booking as any).hotelDetails?.email}
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Stay Details */}
            <Card>
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Stay Details
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div>
                    <div className="flex items-center text-sm text-gray-600 mb-2">
                      <Calendar className="w-4 h-4 mr-2" />
                      Check-in
                    </div>
                    <p className="text-lg font-semibold text-gray-900">
                      {new Date(booking.checkIn).toLocaleDateString("en-GB", {
                        weekday: "short",
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </p>
                    <p className="text-sm text-gray-600">From 3:00 PM</p>
                  </div>

                  <div>
                    <div className="flex items-center text-sm text-gray-600 mb-2">
                      <Calendar className="w-4 h-4 mr-2" />
                      Check-out
                    </div>
                    <p className="text-lg font-semibold text-gray-900">
                      {new Date(booking.checkOut).toLocaleDateString("en-GB", {
                        weekday: "short",
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </p>
                    <p className="text-sm text-gray-600">Until 11:00 AM</p>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-gray-200">
                  <p className="text-sm text-gray-600 mb-2">Total duration</p>
                  <p className="text-lg font-semibold text-gray-900">
                    {calculateNights(booking.checkIn, booking.checkOut)} night
                    {calculateNights(booking.checkIn, booking.checkOut) !== 1
                      ? "s"
                      : ""}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Room Details */}
            <Card>
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Room Details
                </h3>
                <div className="space-y-3">
                  <div>
                    <p className="font-semibold text-gray-900">
                      {booking.roomDetails.name}
                    </p>
                    <p className="text-sm text-gray-600">
                      Category: {booking.roomDetails.category}
                    </p>
                    <p className="text-sm text-gray-600">
                      Bed Type: {booking.roomDetails.bedType}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Guest Details */}
            <Card>
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Guest Details
                </h3>
                <div className="space-y-4">
                  <div>
                    <div className="flex items-center text-sm text-gray-600 mb-2">
                      <Users className="w-4 h-4 mr-2" />
                      Primary Guest
                    </div>
                    <p className="font-semibold text-gray-900">
                      {booking.guestDetails.primaryGuest.title}{" "}
                      {booking.guestDetails.primaryGuest.firstName}{" "}
                      {booking.guestDetails.primaryGuest.lastName}
                    </p>
                  </div>

                  <div className="pt-4 border-t border-gray-200 space-y-2">
                    <div className="flex items-center text-sm text-gray-600">
                      <Mail className="w-4 h-4 mr-2" />
                      {booking.guestDetails.contactInfo.email}
                    </div>
                    <div className="flex items-center text-sm text-gray-600">
                      <Phone className="w-4 h-4 mr-2" />
                      {booking.guestDetails.contactInfo.phone}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Payment Details */}
            <Card>
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Payment Details
                </h3>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Total Amount</span>
                    <span className="text-xl font-bold text-gray-900">
                      {booking.currency === "INR" ? "₹" : booking.currency}{" "}
                      {booking.totalAmount.toLocaleString()}
                    </span>
                  </div>

                  <div className="pt-4 border-t border-gray-200 space-y-2">
                    <div className="flex items-center text-sm text-gray-600">
                      <CreditCard className="w-4 h-4 mr-2" />
                      Payment Method: {booking.paymentDetails.method}
                    </div>
                    <div className="text-sm text-gray-600">
                      Payment ID: {booking.paymentDetails.razorpay_payment_id}
                    </div>
                    <div className="text-sm text-gray-600">
                      Paid on:{" "}
                      {new Date(
                        booking.paymentDetails.paidAt,
                      ).toLocaleDateString("en-GB")}
                    </div>
                  </div>

                  <Badge className="bg-green-100 text-green-800 border-green-200">
                    Payment Confirmed
                  </Badge>
                </div>
              </CardContent>
            </Card>

            {/* Important Notes */}
            <Card>
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Important Notes
                </h3>
                <div className="space-y-3 text-sm text-gray-600">
                  <p>• Please carry a valid photo ID proof for check-in</p>
                  <p>
                    • Present this booking confirmation at the hotel reception
                  </p>
                  <p>
                    ��� Check-in time is usually 3:00 PM and check-out time is
                    11:00 AM
                  </p>
                  <p>
                    • Contact Faredown support for any booking modifications
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
          <Button
            onClick={() => navigate("/hotels")}
            variant="outline"
            className="border-gray-300 text-gray-700 hover:bg-gray-50"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Book Another Hotel
          </Button>
          <Button
            onClick={() => navigate("/account/bookings")}
            className="bg-[#003580] hover:bg-[#002a66]"
          >
            View All Bookings
          </Button>
        </div>
      </div>
    </div>
  );
}
