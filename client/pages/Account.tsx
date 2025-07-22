import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Plane,
  User,
  Mail,
  Phone,
  Calendar,
  Clock,
  Download,
  Eye,
  ArrowLeft,
  MapPin,
  CreditCard,
  FileText,
  Settings,
  Bell,
  Shield,
  Gift,
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function Account() {
  const [bookings, setBookings] = useState([]);
  const [activeTab, setActiveTab] = useState("bookings");

  useEffect(() => {
    // Load bookings from localStorage
    const savedBookings = JSON.parse(
      localStorage.getItem("faredownBookings") || "[]",
    );
    setBookings(savedBookings);
  }, []);

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const getBookingStatus = (bookingDate) => {
    // For demo purposes, all bookings are confirmed
    return "Confirmed";
  };

  const renderBookings = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">My Bookings</h2>
        <div className="text-sm text-gray-600">
          {bookings.length} {bookings.length === 1 ? "booking" : "bookings"}{" "}
          found
        </div>
      </div>

      {bookings.length === 0 ? (
        <Card className="p-12 text-center">
          <Plane className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            No bookings yet
          </h3>
          <p className="text-gray-600 mb-6">
            Start your journey by booking your first flight
          </p>
          <Link to="/flights">
            <Button className="bg-blue-600 hover:bg-blue-700 text-white">
              Search Flights
            </Button>
          </Link>
        </Card>
      ) : (
        <div className="grid gap-6">
          {bookings.map((booking, index) => (
            <Card key={index} className="overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-blue-50 to-blue-100">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg font-semibold text-gray-900">
                      Mumbai ⇄ Dubai
                    </CardTitle>
                    <p className="text-sm text-gray-600">
                      Booking Reference: {booking.bookingDetails.bookingRef}
                    </p>
                  </div>
                  <div className="text-right">
                    <Badge
                      variant="secondary"
                      className="bg-green-100 text-green-800 border-green-200"
                    >
                      {getBookingStatus(booking.bookingDetails.bookingDate)}
                    </Badge>
                    <p className="text-sm text-gray-600 mt-1">
                      Booked on {formatDate(booking.bookingDetails.bookingDate)}
                    </p>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Flight Details */}
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-2">
                        Outbound Flight
                      </h4>
                      <div className="flex items-center space-x-2 text-sm text-gray-600">
                        <MapPin className="w-4 h-4" />
                        <span>BOM → DXB</span>
                      </div>
                      <div className="flex items-center space-x-2 text-sm text-gray-600">
                        <Calendar className="w-4 h-4" />
                        <span>Sat, Aug 3 • 10:15 - 13:45</span>
                      </div>
                      <div className="flex items-center space-x-2 text-sm text-gray-600">
                        <Plane className="w-4 h-4" />
                        <span>Emirates EK 508</span>
                      </div>
                    </div>

                    <div>
                      <h4 className="font-semibold text-gray-900 mb-2">
                        Return Flight
                      </h4>
                      <div className="flex items-center space-x-2 text-sm text-gray-600">
                        <MapPin className="w-4 h-4" />
                        <span>DXB → BOM</span>
                      </div>
                      <div className="flex items-center space-x-2 text-sm text-gray-600">
                        <Calendar className="w-4 h-4" />
                        <span>Sat, Aug 10 • 15:20 - 20:00</span>
                      </div>
                      <div className="flex items-center space-x-2 text-sm text-gray-600">
                        <Plane className="w-4 h-4" />
                        <span>Emirates EK 509</span>
                      </div>
                    </div>
                  </div>

                  {/* Passenger Details */}
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">
                      Passengers
                    </h4>
                    <div className="space-y-2">
                      {booking.bookingDetails.passengers.map(
                        (passenger, pIndex) => (
                          <div key={pIndex} className="text-sm">
                            <div className="font-medium text-gray-900">
                              {passenger.firstName} {passenger.lastName}
                            </div>
                            <div className="text-gray-600">
                              Adult {pIndex + 1} •{" "}
                              {passenger.title || "Not specified"}
                            </div>
                          </div>
                        ),
                      )}
                    </div>

                    <div className="mt-4">
                      <h5 className="font-medium text-gray-900 mb-1">
                        Contact
                      </h5>
                      <div className="text-sm text-gray-600">
                        <div className="flex items-center">
                          <Mail className="w-3 h-3 mr-1" />
                          {booking.bookingDetails.contactDetails.email}
                        </div>
                        <div className="flex items-center">
                          <Phone className="w-3 h-3 mr-1" />
                          {
                            booking.bookingDetails.contactDetails.countryCode
                          }{" "}
                          {booking.bookingDetails.contactDetails.phone}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Booking Summary */}
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">
                      Booking Summary
                    </h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Total Paid</span>
                        <span className="font-semibold text-gray-900">
                          {booking.bookingDetails.currency.symbol}
                          {booking.bookingDetails.totalAmount.toLocaleString()}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Payment ID</span>
                        <span className="text-gray-900 font-mono text-xs">
                          {booking.paymentId?.slice(0, 12)}...
                        </span>
                      </div>
                      {booking.bookingDetails.selectedSeats &&
                        Object.keys(booking.bookingDetails.selectedSeats)
                          .length > 0 && (
                          <div className="flex justify-between">
                            <span className="text-gray-600">Seats</span>
                            <span className="text-gray-900">
                              {Object.values(
                                booking.bookingDetails.selectedSeats,
                              ).join(", ")}
                            </span>
                          </div>
                        )}
                    </div>

                    <div className="mt-4 space-y-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full"
                        onClick={() => alert("View ticket functionality")}
                      >
                        <Eye className="w-4 h-4 mr-2" />
                        View Ticket
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full"
                        onClick={() => alert("Download ticket functionality")}
                      >
                        <Download className="w-4 h-4 mr-2" />
                        Download
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );

  const renderProfile = () => (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">My Profile</h2>

      <Card className="p-6">
        <div className="flex items-center space-x-4 mb-6">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
            <User className="w-8 h-8 text-blue-600" />
          </div>
          <div>
            <h3 className="text-xl font-semibold text-gray-900">
              {bookings.length > 0
                ? `${bookings[0].bookingDetails.passengers[0]?.firstName} ${bookings[0].bookingDetails.passengers[0]?.lastName}`
                : "John Doe"}
            </h3>
            <p className="text-gray-600">Frequent Traveler</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="font-semibold text-gray-900 mb-3">
              Contact Information
            </h4>
            <div className="space-y-2 text-sm">
              <div className="flex items-center">
                <Mail className="w-4 h-4 text-gray-600 mr-2" />
                <span>
                  {bookings.length > 0
                    ? bookings[0].bookingDetails.contactDetails.email
                    : "john@example.com"}
                </span>
              </div>
              <div className="flex items-center">
                <Phone className="w-4 h-4 text-gray-600 mr-2" />
                <span>
                  {bookings.length > 0
                    ? `${bookings[0].bookingDetails.contactDetails.countryCode} ${bookings[0].bookingDetails.contactDetails.phone}`
                    : "+91 9876543210"}
                </span>
              </div>
            </div>
          </div>

          <div>
            <h4 className="font-semibold text-gray-900 mb-3">
              Travel Statistics
            </h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Total Bookings</span>
                <span className="font-medium">{bookings.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Countries Visited</span>
                <span className="font-medium">2</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Member Since</span>
                <span className="font-medium">Dec 2024</span>
              </div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );

  const renderSettings = () => (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">Settings</h2>

      <div className="grid gap-4">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Bell className="w-5 h-5 text-gray-600" />
              <div>
                <h3 className="font-medium text-gray-900">
                  Email Notifications
                </h3>
                <p className="text-sm text-gray-600">
                  Receive booking confirmations and updates
                </p>
              </div>
            </div>
            <Button variant="outline" size="sm">
              Manage
            </Button>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Shield className="w-5 h-5 text-gray-600" />
              <div>
                <h3 className="font-medium text-gray-900">
                  Privacy & Security
                </h3>
                <p className="text-sm text-gray-600">
                  Manage your privacy settings
                </p>
              </div>
            </div>
            <Button variant="outline" size="sm">
              Configure
            </Button>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <CreditCard className="w-5 h-5 text-gray-600" />
              <div>
                <h3 className="font-medium text-gray-900">Payment Methods</h3>
                <p className="text-sm text-gray-600">
                  Manage saved cards and payment options
                </p>
              </div>
            </div>
            <Button variant="outline" size="sm">
              Manage
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link
              to="/"
              className="flex items-center text-blue-600 hover:text-blue-700"
            >
              <ArrowLeft className="w-5 h-5 mr-2" />
              <span className="font-medium">faredown.com</span>
            </Link>
            <div className="text-sm text-gray-600">My Account</div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <Card className="p-4">
              <nav className="space-y-2">
                <button
                  onClick={() => setActiveTab("bookings")}
                  className={cn(
                    "w-full text-left px-3 py-2 rounded-lg flex items-center space-x-2 transition-colors",
                    activeTab === "bookings"
                      ? "bg-blue-100 text-blue-700"
                      : "text-gray-600 hover:bg-gray-100",
                  )}
                >
                  <Plane className="w-4 h-4" />
                  <span>My Bookings</span>
                </button>
                <button
                  onClick={() => setActiveTab("profile")}
                  className={cn(
                    "w-full text-left px-3 py-2 rounded-lg flex items-center space-x-2 transition-colors",
                    activeTab === "profile"
                      ? "bg-blue-100 text-blue-700"
                      : "text-gray-600 hover:bg-gray-100",
                  )}
                >
                  <User className="w-4 h-4" />
                  <span>Profile</span>
                </button>
                <button
                  onClick={() => setActiveTab("settings")}
                  className={cn(
                    "w-full text-left px-3 py-2 rounded-lg flex items-center space-x-2 transition-colors",
                    activeTab === "settings"
                      ? "bg-blue-100 text-blue-700"
                      : "text-gray-600 hover:bg-gray-100",
                  )}
                >
                  <Settings className="w-4 h-4" />
                  <span>Settings</span>
                </button>
              </nav>
            </Card>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            {activeTab === "bookings" && renderBookings()}
            {activeTab === "profile" && renderProfile()}
            {activeTab === "settings" && renderSettings()}
          </div>
        </div>
      </div>
    </div>
  );
}
