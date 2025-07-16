import React, { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  CheckCircle,
  Download,
  Mail,
  MapPin,
  Calendar,
  Users,
  Hotel,
  CreditCard,
  Star,
} from "lucide-react";
import { Header } from "@/components/Header";

export default function BookingConfirmation() {
  const [searchParams] = useSearchParams();
  const [booking, setBooking] = useState<any>(null);
  const [showVoucher, setShowVoucher] = useState(false);
  const [showInvoice, setShowInvoice] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  // Format date to DD-MMM-YYYY
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const months = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ];
    return `${date.getDate().toString().padStart(2, "0")}-${months[date.getMonth()]}-${date.getFullYear()}`;
  };

  useEffect(() => {
    // Load booking data from localStorage or URL params
    const savedBooking = localStorage.getItem("latestHotelBooking");
    if (savedBooking) {
      setBooking(JSON.parse(savedBooking));
    } else {
      // Create mock booking data from URL params for demo
      const hotelId = searchParams.get("hotelId");
      const roomType = searchParams.get("roomType");
      const price = searchParams.get("price");
      const nights = searchParams.get("nights");
      const bargained = searchParams.get("bargained");

      if (hotelId && roomType && price && nights) {
        const mockBooking = {
          id: `HB${Date.now()}`,
          bookingDate: new Date().toISOString(),
          hotel: {
            id: hotelId,
            name: "Grand Hyatt Dubai",
            location:
              "Near Sheikh Zayed Road & Mall Mall, Dubai, United Arab Emirates",
            image:
              "https://cdn.builder.io/api/v1/image/assets%2F4235b10530ff469795aa00c0333d773c%2F4e78c7022f0345f4909bc6063cdeffd6?format=webp&width=800",
            rating: 4.5,
            reviews: 1247,
          },
          room: {
            type: roomType,
            name:
              roomType === "twin-skyline"
                ? "Twin Room with Skyline View"
                : roomType === "king-skyline"
                  ? "King Room with Skyline View"
                  : roomType === "superior-king"
                    ? "Superior King Room"
                    : roomType === "superior-twin-club"
                      ? "Superior Twin Room - Club Access"
                      : "One Bedroom Grand Suite with Garden View",
            details:
              roomType === "twin-skyline"
                ? "1 X Twin Classic - Twin bed"
                : roomType === "king-skyline"
                  ? "1 X King Classic - 1 king bed"
                  : roomType === "superior-king"
                    ? "1 X Superior King - 1 king bed"
                    : roomType === "superior-twin-club"
                      ? "2 X Twin Superior Club - 2 twin beds"
                      : "1 X Grand Suite - 1 king bed + living area",
            pricePerNight: parseInt(price) / parseInt(nights),
            image:
              "https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=300",
          },
          checkIn: "2025-07-16",
          checkOut: "2025-07-19",
          nights: parseInt(nights),
          guests: 2,
          rooms: 1,
          total: parseInt(price),
          originalPrice: bargained === "true" ? parseInt(price) * 1.15 : null,
          bargained: bargained === "true",
          paymentMethod: "Pay at Hotel",
          paymentStatus: "Confirmed",
          cancellation: "Free cancellation until 24 hours before check-in",
          guest: {
            firstName: "John",
            lastName: "Doe",
            email: "john.doe@example.com",
            phone: "+91 98765 43210",
          },
          specialRequests: "Non-smoking room preferred",
        };
        setBooking(mockBooking);
        localStorage.setItem("latestHotelBooking", JSON.stringify(mockBooking));
      }
    }
  }, [searchParams]);

  const handleDownloadVoucher = () => {
    setShowVoucher(true);
    setTimeout(() => {
      window.print();
      setShowVoucher(false);
    }, 500);
  };

  const handleDownloadInvoice = () => {
    setShowInvoice(true);
    setTimeout(() => {
      window.print();
      setShowInvoice(false);
    }, 500);
  };

  const handleEmailConfirmation = async () => {
    setEmailSent(true);
    console.log("Sending confirmation email...");
  };

  if (!booking) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="flex items-center justify-center min-h-[80vh]">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">
              No booking found
            </h1>
            <Link to="/">
              <Button className="bg-blue-700 hover:bg-blue-800">
                Return to Home
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (showVoucher) {
    return (
      <div className="min-h-screen bg-white p-8 print:p-0">
        <div className="max-w-4xl mx-auto">
          {/* Hotel Voucher */}
          <div className="text-center border-b-2 border-blue-700 pb-4 mb-6">
            <h1 className="text-2xl font-bold text-blue-700">
              HOTEL BOOKING VOUCHER
            </h1>
            <p className="text-gray-600">faredown.com</p>
          </div>

          <div className="grid grid-cols-2 gap-8 mb-6">
            <div>
              <h3 className="font-bold text-gray-900 mb-2">Booking Details</h3>
              <div className="space-y-1 text-sm">
                <p>
                  <span className="font-medium">Booking ID:</span> {booking.id}
                </p>
                <p>
                  <span className="font-medium">Booking Date:</span>{" "}
                  {formatDate(booking.bookingDate)}
                </p>
                <p>
                  <span className="font-medium">Payment Status:</span>{" "}
                  <span className="text-green-600">
                    {booking.paymentStatus}
                  </span>
                </p>
              </div>
            </div>
            <div>
              <h3 className="font-bold text-gray-900 mb-2">Guest Details</h3>
              <div className="space-y-1 text-sm">
                <p>
                  <span className="font-medium">Name:</span>{" "}
                  {booking.guest.firstName} {booking.guest.lastName}
                </p>
                <p>
                  <span className="font-medium">Email:</span>{" "}
                  {booking.guest.email}
                </p>
                <p>
                  <span className="font-medium">Phone:</span>{" "}
                  {booking.guest.phone}
                </p>
              </div>
            </div>
          </div>

          <div className="border border-gray-200 rounded-lg p-4 mb-6">
            <h3 className="font-bold text-gray-900 mb-3">Hotel Information</h3>
            <div className="flex gap-4">
              <img
                src={booking.hotel.image}
                alt={booking.hotel.name}
                className="w-24 h-24 object-cover rounded"
              />
              <div>
                <h4 className="font-bold text-lg">{booking.hotel.name}</h4>
                <p className="text-sm text-gray-600 mb-2">
                  {booking.hotel.location}
                </p>
                <div className="flex items-center">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`w-4 h-4 ${
                        i < Math.floor(booking.hotel.rating)
                          ? "text-yellow-400 fill-current"
                          : "text-gray-300"
                      }`}
                    />
                  ))}
                  <span className="ml-2 text-sm">
                    {booking.hotel.rating} ({booking.hotel.reviews} reviews)
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6 mb-6">
            <div className="border border-gray-200 rounded-lg p-4">
              <h3 className="font-bold text-gray-900 mb-3">Stay Details</h3>
              <div className="space-y-2 text-sm">
                <p>
                  <span className="font-medium">Check-in:</span>{" "}
                  {formatDate(booking.checkIn)}
                </p>
                <p>
                  <span className="font-medium">Check-out:</span>{" "}
                  {formatDate(booking.checkOut)}
                </p>
                <p>
                  <span className="font-medium">Nights:</span> {booking.nights}
                </p>
                <p>
                  <span className="font-medium">Guests:</span> {booking.guests}
                </p>
                <p>
                  <span className="font-medium">Rooms:</span> {booking.rooms}
                </p>
              </div>
            </div>
            <div className="border border-gray-200 rounded-lg p-4">
              <h3 className="font-bold text-gray-900 mb-3">Room Details</h3>
              <div className="space-y-2 text-sm">
                <p>
                  <span className="font-medium">Room Type:</span>{" "}
                  {booking.room.name}
                </p>
                <p>
                  <span className="font-medium">Details:</span>{" "}
                  {booking.room.details}
                </p>
                <p>
                  <span className="font-medium">Rate per night:</span> ₹
                  {booking.room.pricePerNight.toLocaleString()}
                </p>
              </div>
            </div>
          </div>

          <div className="border-t-2 border-blue-700 pt-4 text-center">
            <p className="text-sm text-gray-600 mb-2">
              Please present this voucher at the hotel during check-in
            </p>
            <p className="text-xs text-gray-500">
              This is a computer-generated voucher and does not require a
              signature
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (showInvoice) {
    return (
      <div className="min-h-screen bg-white p-8 print:p-0">
        <div className="max-w-4xl mx-auto">
          {/* Hotel Invoice */}
          <div className="text-center border-b-2 border-blue-700 pb-4 mb-6">
            <h1 className="text-2xl font-bold text-blue-700">
              HOTEL BOOKING INVOICE
            </h1>
            <p className="text-gray-600">faredown.com</p>
            <p className="text-sm text-gray-500">
              Invoice Date: {formatDate(booking.bookingDate)}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-8 mb-6">
            <div>
              <h3 className="font-bold text-gray-900 mb-2">Bill To:</h3>
              <div className="space-y-1 text-sm">
                <p className="font-medium">
                  {booking.guest.firstName} {booking.guest.lastName}
                </p>
                <p>{booking.guest.email}</p>
                <p>{booking.guest.phone}</p>
              </div>
            </div>
            <div>
              <h3 className="font-bold text-gray-900 mb-2">Booking Details:</h3>
              <div className="space-y-1 text-sm">
                <p>
                  <span className="font-medium">Booking ID:</span> {booking.id}
                </p>
                <p>
                  <span className="font-medium">Invoice Date:</span>{" "}
                  {formatDate(booking.bookingDate)}
                </p>
                <p>
                  <span className="font-medium">Payment Method:</span>{" "}
                  {booking.paymentMethod}
                </p>
              </div>
            </div>
          </div>

          <div className="border border-gray-200 rounded-lg overflow-hidden mb-6">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left p-3 font-medium">Description</th>
                  <th className="text-center p-3 font-medium">Qty</th>
                  <th className="text-right p-3 font-medium">Rate</th>
                  <th className="text-right p-3 font-medium">Amount</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-t">
                  <td className="p-3">
                    <div>
                      <p className="font-medium">{booking.room.name}</p>
                      <p className="text-sm text-gray-600">
                        {booking.hotel.name}
                      </p>
                      <p className="text-sm text-gray-600">
                        {formatDate(booking.checkIn)} to{" "}
                        {formatDate(booking.checkOut)}
                      </p>
                    </div>
                  </td>
                  <td className="text-center p-3">{booking.nights} nights</td>
                  <td className="text-right p-3">
                    ₹{booking.room.pricePerNight.toLocaleString()}
                  </td>
                  <td className="text-right p-3">
                    ₹{booking.total.toLocaleString()}
                  </td>
                </tr>
              </tbody>
              <tfoot className="bg-gray-50 border-t">
                <tr>
                  <td colSpan={3} className="text-right p-3 font-medium">
                    Subtotal:
                  </td>
                  <td className="text-right p-3">
                    ₹{booking.total.toLocaleString()}
                  </td>
                </tr>
                <tr>
                  <td colSpan={3} className="text-right p-3 font-medium">
                    Taxes & Fees (Included):
                  </td>
                  <td className="text-right p-3">₹0</td>
                </tr>
                <tr className="border-t-2">
                  <td colSpan={3} className="text-right p-3 font-bold text-lg">
                    Total Amount:
                  </td>
                  <td className="text-right p-3 font-bold text-lg">
                    ₹{booking.total.toLocaleString()}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>

          {booking.bargained && (
            <div className="bg-green-50 border border-green-200 rounded p-3 mb-6">
              <p className="text-sm text-green-800">
                <span className="font-medium">Bargain Savings:</span> You saved
                ₹{(booking.originalPrice - booking.total).toLocaleString()} with
                our bargaining feature!
              </p>
            </div>
          )}

          <div className="text-center text-xs text-gray-500">
            <p>
              This is a computer-generated invoice and does not require a
              signature
            </p>
            <p>For any queries, please contact our support team</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Success Message */}
        <div className="bg-white rounded-lg border border-green-200 p-8 mb-8 text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Booking Confirmed!
          </h1>
          <p className="text-gray-600 mb-4">
            Your hotel reservation has been successfully confirmed. Here are
            your booking details:
          </p>
          <div className="bg-blue-700 text-white px-6 py-3 rounded-lg inline-block">
            <span className="text-lg font-bold">Booking ID: {booking.id}</span>
          </div>
          {booking.bargained && (
            <div className="mt-4">
              <Badge className="bg-green-100 text-green-800 px-4 py-2">
                🎉 You saved ₹
                {(booking.originalPrice - booking.total).toLocaleString()} with
                bargaining!
              </Badge>
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-lg border border-gray-200 p-6 mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4">
            Download Documents
          </h2>
          <div className="grid md:grid-cols-3 gap-4">
            <Button
              onClick={handleDownloadVoucher}
              className="bg-blue-700 hover:bg-blue-800 flex items-center justify-center"
            >
              <Download className="w-4 h-4 mr-2" />
              Hotel Voucher
            </Button>
            <Button
              onClick={handleDownloadInvoice}
              variant="outline"
              className="border-blue-700 text-blue-700 hover:bg-blue-700 hover:text-white flex items-center justify-center"
            >
              <Download className="w-4 h-4 mr-2" />
              Invoice
            </Button>
            <Button
              onClick={handleEmailConfirmation}
              variant="outline"
              className="border-blue-700 text-blue-700 hover:bg-blue-700 hover:text-white flex items-center justify-center"
              disabled={emailSent}
            >
              <Mail className="w-4 h-4 mr-2" />
              {emailSent ? "Email Sent!" : "Email Details"}
            </Button>
          </div>
        </div>

        {/* Booking Summary */}
        <div className="grid md:grid-cols-2 gap-8">
          {/* Hotel Details */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center mb-4">
              <Hotel className="w-5 h-5 text-blue-700 mr-2" />
              <h2 className="text-xl font-bold text-gray-900">Hotel Details</h2>
            </div>
            <div className="flex gap-4 mb-4">
              <img
                src={booking.hotel.image}
                alt={booking.hotel.name}
                className="w-20 h-20 object-cover rounded-lg"
              />
              <div className="flex-1">
                <h3 className="font-bold text-lg text-gray-900">
                  {booking.hotel.name}
                </h3>
                <div className="flex items-center mb-2">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`w-4 h-4 ${
                        i < Math.floor(booking.hotel.rating)
                          ? "text-yellow-400 fill-current"
                          : "text-gray-300"
                      }`}
                    />
                  ))}
                  <span className="ml-2 text-sm">
                    {booking.hotel.rating} ({booking.hotel.reviews} reviews)
                  </span>
                </div>
                <div className="flex items-start">
                  <MapPin className="w-4 h-4 text-gray-500 mr-1 mt-0.5" />
                  <p className="text-sm text-gray-600">
                    {booking.hotel.location}
                  </p>
                </div>
              </div>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="font-semibold text-gray-900 mb-2">
                {booking.room.name}
              </h4>
              <p className="text-sm text-gray-600">{booking.room.details}</p>
            </div>
          </div>

          {/* Stay Details */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center mb-4">
              <Calendar className="w-5 h-5 text-blue-700 mr-2" />
              <h2 className="text-xl font-bold text-gray-900">Stay Details</h2>
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 p-3 rounded-lg text-center">
                  <p className="text-sm text-gray-600">Check-in</p>
                  <p className="font-bold">{formatDate(booking.checkIn)}</p>
                </div>
                <div className="bg-gray-50 p-3 rounded-lg text-center">
                  <p className="text-sm text-gray-600">Check-out</p>
                  <p className="font-bold">{formatDate(booking.checkOut)}</p>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3 text-center">
                <div>
                  <p className="text-lg font-bold">{booking.nights}</p>
                  <p className="text-xs text-gray-600">nights</p>
                </div>
                <div>
                  <p className="text-lg font-bold">{booking.guests}</p>
                  <p className="text-xs text-gray-600">guests</p>
                </div>
                <div>
                  <p className="text-lg font-bold">{booking.rooms}</p>
                  <p className="text-xs text-gray-600">room</p>
                </div>
              </div>
              <div className="bg-blue-50 p-3 rounded-lg">
                <div className="flex items-center mb-2">
                  <CreditCard className="w-4 h-4 text-blue-700 mr-2" />
                  <span className="text-sm font-medium">Payment Method</span>
                </div>
                <p className="text-sm text-gray-700">{booking.paymentMethod}</p>
                <p className="text-xs text-green-600 mt-1">
                  Status: {booking.paymentStatus}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Guest Information */}
        <div className="bg-white rounded-lg border border-gray-200 p-6 mt-8">
          <div className="flex items-center mb-4">
            <Users className="w-5 h-5 text-blue-700 mr-2" />
            <h2 className="text-xl font-bold text-gray-900">
              Guest Information
            </h2>
          </div>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">
                Primary Guest
              </h3>
              <div className="space-y-1 text-sm">
                <p>
                  <span className="text-gray-600">Name:</span>{" "}
                  {booking.guest.firstName} {booking.guest.lastName}
                </p>
                <p>
                  <span className="text-gray-600">Email:</span>{" "}
                  {booking.guest.email}
                </p>
                <p>
                  <span className="text-gray-600">Phone:</span>{" "}
                  {booking.guest.phone}
                </p>
              </div>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">
                Special Requests
              </h3>
              <p className="text-sm text-gray-600">
                {booking.specialRequests || "None"}
              </p>
            </div>
          </div>
        </div>

        {/* Total Amount */}
        <div className="bg-white rounded-lg border border-gray-200 p-6 mt-8">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-xl font-bold text-gray-900">Total Amount</h2>
              {booking.bargained && (
                <p className="text-sm text-gray-600">
                  Original price: ₹{booking.originalPrice.toLocaleString()}
                </p>
              )}
            </div>
            <span className="text-3xl font-bold text-blue-700">
              ₹{booking.total.toLocaleString()}
            </span>
          </div>
          <p className="text-sm text-gray-600 mt-2">
            All taxes and fees included
          </p>
        </div>

        {/* Cancellation Policy */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 mt-8">
          <h3 className="font-bold text-yellow-800 mb-3">
            Cancellation Policy
          </h3>
          <p className="text-yellow-700 text-sm">{booking.cancellation}</p>
        </div>

        {/* Important Information */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mt-8">
          <h3 className="font-bold text-blue-800 mb-3">
            Important Information
          </h3>
          <ul className="text-blue-700 space-y-2 text-sm">
            <li>• Please carry a valid photo ID for check-in verification</li>
            <li>• Check-in time: 3:00 PM | Check-out time: 12:00 PM</li>
            <li>• Contact the hotel directly for any special requests</li>
            <li>• Present your booking confirmation at the reception</li>
          </ul>
        </div>

        {/* Navigation */}
        <div className="text-center mt-8">
          <Link to="/hotels">
            <Button variant="outline" className="mr-4">
              Book Another Hotel
            </Button>
          </Link>
          <Link to="/my-account">
            <Button className="bg-blue-700 hover:bg-blue-800">
              View My Bookings
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
