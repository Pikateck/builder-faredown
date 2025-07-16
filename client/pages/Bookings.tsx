import React, { useState } from "react";
import { Navigation } from "../components/Navigation";

const Bookings: React.FC = () => {
  const [activeTab, setActiveTab] = useState<"all" | "flights" | "hotels">(
    "all",
  );

  const flightBookings = [
    {
      id: "FL001",
      type: "flight",
      airline: "Emirates",
      route: "DXB → LHR",
      date: "2024-01-15",
      time: "14:30",
      status: "Confirmed",
      passengers: 2,
      totalAmount: "$1,850",
      bookingRef: "EM123456",
    },
    {
      id: "FL002",
      type: "flight",
      airline: "British Airways",
      route: "LHR → JFK",
      date: "2024-01-20",
      time: "10:15",
      status: "Pending",
      passengers: 1,
      totalAmount: "$920",
      bookingRef: "BA789012",
    },
  ];

  const hotelBookings = [
    {
      id: "HT001",
      type: "hotel",
      name: "Grand Hyatt Dubai",
      location: "Dubai, UAE",
      checkIn: "2024-01-15",
      checkOut: "2024-01-18",
      guests: 2,
      rooms: 1,
      status: "Confirmed",
      totalAmount: "$750",
      bookingRef: "GH456789",
    },
    {
      id: "HT002",
      type: "hotel",
      name: "The Langham London",
      location: "London, UK",
      checkIn: "2024-01-20",
      checkOut: "2024-01-23",
      guests: 1,
      rooms: 1,
      status: "Confirmed",
      totalAmount: "$480",
      bookingRef: "TL234567",
    },
  ];

  const allBookings = [...flightBookings, ...hotelBookings].sort(
    (a, b) =>
      new Date(a.type === "flight" ? a.date : a.checkIn).getTime() -
      new Date(b.type === "flight" ? b.date : b.checkIn).getTime(),
  );

  const getFilteredBookings = () => {
    switch (activeTab) {
      case "flights":
        return flightBookings;
      case "hotels":
        return hotelBookings;
      default:
        return allBookings;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Confirmed":
        return "bg-green-100 text-green-800";
      case "Pending":
        return "bg-yellow-100 text-yellow-800";
      case "Cancelled":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">My Bookings</h1>
          <p className="text-gray-600">
            Manage your flights and hotel reservations
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="mb-8">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setActiveTab("all")}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === "all"
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                All Bookings ({allBookings.length})
              </button>
              <button
                onClick={() => setActiveTab("flights")}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === "flights"
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                ✈️ Flights ({flightBookings.length})
              </button>
              <button
                onClick={() => setActiveTab("hotels")}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === "hotels"
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                🏨 Hotels ({hotelBookings.length})
              </button>
            </nav>
          </div>
        </div>

        {/* Bookings List */}
        <div className="space-y-6">
          {getFilteredBookings().map((booking) => (
            <div
              key={booking.id}
              className="bg-white rounded-lg shadow-md overflow-hidden"
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="text-2xl">
                      {booking.type === "flight" ? "✈️" : "🏨"}
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">
                        {booking.type === "flight"
                          ? `${booking.airline} - ${booking.route}`
                          : booking.name}
                      </h3>
                      <p className="text-sm text-gray-600">
                        Booking Reference: {booking.bookingRef}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(booking.status)}`}
                    >
                      {booking.status}
                    </span>
                    <span className="text-xl font-bold text-blue-600">
                      {booking.totalAmount}
                    </span>
                  </div>
                </div>

                {booking.type === "flight" ? (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div>
                      <span className="text-gray-500">Date & Time:</span>
                      <p className="font-medium">
                        {booking.date} at {booking.time}
                      </p>
                    </div>
                    <div>
                      <span className="text-gray-500">Passengers:</span>
                      <p className="font-medium">{booking.passengers}</p>
                    </div>
                    <div>
                      <span className="text-gray-500">Route:</span>
                      <p className="font-medium">{booking.route}</p>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <span className="text-gray-500">Check-in:</span>
                      <p className="font-medium">{booking.checkIn}</p>
                    </div>
                    <div>
                      <span className="text-gray-500">Check-out:</span>
                      <p className="font-medium">{booking.checkOut}</p>
                    </div>
                    <div>
                      <span className="text-gray-500">Guests:</span>
                      <p className="font-medium">{booking.guests}</p>
                    </div>
                    <div>
                      <span className="text-gray-500">Rooms:</span>
                      <p className="font-medium">{booking.rooms}</p>
                    </div>
                  </div>
                )}

                <div className="flex justify-between items-center mt-6 pt-4 border-t border-gray-200">
                  <div className="text-sm text-gray-600">
                    {booking.type === "hotel"
                      ? booking.location
                      : `Airline: ${booking.airline}`}
                  </div>
                  <div className="flex space-x-3">
                    <button className="px-4 py-2 text-sm text-blue-600 border border-blue-600 rounded-md hover:bg-blue-50">
                      View Details
                    </button>
                    <button className="px-4 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700">
                      Manage Booking
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {getFilteredBookings().length === 0 && (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">📋</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No bookings found
            </h3>
            <p className="text-gray-600">
              You don't have any bookings in this category yet.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Bookings;
