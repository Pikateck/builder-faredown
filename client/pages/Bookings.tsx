import React, { useState } from "react";
import { Header } from "@/components/Header";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

const Bookings: React.FC = () => {
  const [activeTab, setActiveTab] = useState<"all" | "flights" | "hotels">(
    "all",
  );
  const [selectedBooking, setSelectedBooking] = useState<any>(null);
  const [viewDetailsModal, setViewDetailsModal] = useState(false);
  const [manageBookingModal, setManageBookingModal] = useState(false);
  const [cancelBookingModal, setCancelBookingModal] = useState(false);
  const [ticketModal, setTicketModal] = useState(false);
  const [invoiceModal, setInvoiceModal] = useState(false);
  const [refundModal, setRefundModal] = useState(false);

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
      totalAmount: "₹1,53,750",
      bookingRef: "EM123456",
      flightNumber: "EK001",
      seat: "12A, 12B",
      terminal: "Terminal 3",
      gate: "A15",
      bookingDate: "2024-01-01",
      cancellable: true,
      refundAmount: "₹1,38,375",
      refundStatus: null,
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
      totalAmount: "₹76,360",
      bookingRef: "BA789012",
      flightNumber: "BA177",
      seat: "24C",
      terminal: "Terminal 5",
      gate: "B12",
      bookingDate: "2024-01-05",
      cancellable: true,
      refundAmount: "₹68,724",
      refundStatus: null,
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
      totalAmount: "₹62,250",
      bookingRef: "GH456789",
      roomType: "Deluxe Room",
      bedType: "King Bed",
      address: "Sheikh Zayed Road, Dubai",
      phone: "+971 4 317 1234",
      bookingDate: "2024-01-01",
      cancellable: true,
      refundAmount: "₹56,025",
      refundStatus: null,
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
      totalAmount: "₹39,840",
      bookingRef: "TL234567",
      roomType: "Superior Room",
      bedType: "Queen Bed",
      address: "1C Portland Place, London",
      phone: "+44 20 7636 1000",
      bookingDate: "2024-01-05",
      cancellable: true,
      refundAmount: "₹35,856",
      refundStatus: null,
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
      <Header />

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
                    <button
                      onClick={() => {
                        setSelectedBooking(booking);
                        setViewDetailsModal(true);
                      }}
                      className="px-4 py-2 text-sm text-blue-600 border border-blue-600 rounded-md hover:bg-blue-50"
                    >
                      View Details
                    </button>
                    <button
                      onClick={() => {
                        setSelectedBooking(booking);
                        setManageBookingModal(true);
                      }}
                      className="px-4 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700"
                    >
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

      {/* View Details Modal */}
      <Dialog open={viewDetailsModal} onOpenChange={setViewDetailsModal}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Booking Details</DialogTitle>
          </DialogHeader>
          {selectedBooking && (
            <div className="space-y-6">
              <div className="flex items-center space-x-3 p-4 bg-gray-50 rounded-lg">
                <div className="text-3xl">
                  {selectedBooking.type === "flight" ? "✈️" : "🏨"}
                </div>
                <div>
                  <h3 className="text-xl font-semibold">
                    {selectedBooking.type === "flight"
                      ? `${selectedBooking.airline} - ${selectedBooking.route}`
                      : selectedBooking.name}
                  </h3>
                  <p className="text-gray-600">
                    Booking Reference: {selectedBooking.bookingRef}
                  </p>
                </div>
              </div>

              {selectedBooking.type === "flight" ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-medium mb-3">Flight Information</h4>
                    <div className="space-y-2 text-sm">
                      <div>
                        <span className="text-gray-600">Flight:</span>{" "}
                        {selectedBooking.flightNumber}
                      </div>
                      <div>
                        <span className="text-gray-600">Date:</span>{" "}
                        {selectedBooking.date}
                      </div>
                      <div>
                        <span className="text-gray-600">Time:</span>{" "}
                        {selectedBooking.time}
                      </div>
                      <div>
                        <span className="text-gray-600">Route:</span>{" "}
                        {selectedBooking.route}
                      </div>
                      <div>
                        <span className="text-gray-600">Terminal:</span>{" "}
                        {selectedBooking.terminal}
                      </div>
                      <div>
                        <span className="text-gray-600">Gate:</span>{" "}
                        {selectedBooking.gate}
                      </div>
                    </div>
                  </div>
                  <div>
                    <h4 className="font-medium mb-3">Passenger Information</h4>
                    <div className="space-y-2 text-sm">
                      <div>
                        <span className="text-gray-600">Passengers:</span>{" "}
                        {selectedBooking.passengers}
                      </div>
                      <div>
                        <span className="text-gray-600">Seats:</span>{" "}
                        {selectedBooking.seat}
                      </div>
                      <div>
                        <span className="text-gray-600">Status:</span>
                        <span
                          className={`ml-1 px-2 py-1 rounded-full text-xs ${getStatusColor(selectedBooking.status)}`}
                        >
                          {selectedBooking.status}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-medium mb-3">Hotel Information</h4>
                    <div className="space-y-2 text-sm">
                      <div>
                        <span className="text-gray-600">Hotel:</span>{" "}
                        {selectedBooking.name}
                      </div>
                      <div>
                        <span className="text-gray-600">Location:</span>{" "}
                        {selectedBooking.location}
                      </div>
                      <div>
                        <span className="text-gray-600">Address:</span>{" "}
                        {selectedBooking.address}
                      </div>
                      <div>
                        <span className="text-gray-600">Phone:</span>{" "}
                        {selectedBooking.phone}
                      </div>
                    </div>
                  </div>
                  <div>
                    <h4 className="font-medium mb-3">Reservation Details</h4>
                    <div className="space-y-2 text-sm">
                      <div>
                        <span className="text-gray-600">Check-in:</span>{" "}
                        {selectedBooking.checkIn}
                      </div>
                      <div>
                        <span className="text-gray-600">Check-out:</span>{" "}
                        {selectedBooking.checkOut}
                      </div>
                      <div>
                        <span className="text-gray-600">Room Type:</span>{" "}
                        {selectedBooking.roomType}
                      </div>
                      <div>
                        <span className="text-gray-600">Bed Type:</span>{" "}
                        {selectedBooking.bedType}
                      </div>
                      <div>
                        <span className="text-gray-600">Guests:</span>{" "}
                        {selectedBooking.guests}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div className="border-t pt-4">
                <div className="flex justify-between items-center">
                  <div>
                    <span className="text-gray-600">Total Amount:</span>
                    <span className="text-xl font-bold text-blue-600 ml-2">
                      {selectedBooking.totalAmount}
                    </span>
                  </div>
                  <div className="text-sm text-gray-600">
                    Booked on: {selectedBooking.bookingDate}
                  </div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Manage Booking Modal */}
      <Dialog open={manageBookingModal} onOpenChange={setManageBookingModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Manage Booking</DialogTitle>
          </DialogHeader>
          {selectedBooking && (
            <div className="space-y-4">
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <div className="text-2xl mb-2">
                  {selectedBooking.type === "flight" ? "✈️" : "🏨"}
                </div>
                <h4 className="font-medium">
                  {selectedBooking.type === "flight"
                    ? `${selectedBooking.airline} ${selectedBooking.flightNumber}`
                    : selectedBooking.name}
                </h4>
                <p className="text-sm text-gray-600">
                  {selectedBooking.bookingRef}
                </p>
              </div>

              <div className="grid grid-cols-1 gap-3">
                <Button
                  onClick={() => {
                    setManageBookingModal(false);
                    setTicketModal(true);
                  }}
                  variant="outline"
                  className="w-full justify-start"
                >
                  🎫 View{" "}
                  {selectedBooking.type === "flight"
                    ? "Boarding Pass"
                    : "Voucher"}
                </Button>

                <Button
                  onClick={() => {
                    setManageBookingModal(false);
                    setInvoiceModal(true);
                  }}
                  variant="outline"
                  className="w-full justify-start"
                >
                  📄 Download Invoice
                </Button>

                {selectedBooking.cancellable && (
                  <Button
                    onClick={() => {
                      setManageBookingModal(false);
                      setCancelBookingModal(true);
                    }}
                    variant="outline"
                    className="w-full justify-start text-red-600 border-red-600 hover:bg-red-50"
                  >
                    ❌ Cancel Booking
                  </Button>
                )}

                <Button
                  onClick={() => {
                    setManageBookingModal(false);
                    setRefundModal(true);
                  }}
                  variant="outline"
                  className="w-full justify-start"
                >
                  💰 Check Refund Status
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Ticket/Voucher Modal */}
      <Dialog open={ticketModal} onOpenChange={setTicketModal}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {selectedBooking?.type === "flight"
                ? "Boarding Pass"
                : "Hotel Voucher"}
            </DialogTitle>
          </DialogHeader>
          {selectedBooking && (
            <div className="space-y-4">
              <div className="border-2 border-dashed border-gray-300 p-6 rounded-lg bg-gradient-to-r from-blue-50 to-indigo-50">
                <div className="text-center">
                  <div className="text-4xl mb-4">
                    {selectedBooking.type === "flight" ? "✈️" : "🏨"}
                  </div>
                  <h3 className="text-xl font-bold mb-2">
                    {selectedBooking.type === "flight"
                      ? `${selectedBooking.airline} ${selectedBooking.flightNumber}`
                      : selectedBooking.name}
                  </h3>
                  <p className="text-gray-600 mb-4">
                    {selectedBooking.bookingRef}
                  </p>

                  {selectedBooking.type === "flight" ? (
                    <div className="text-left space-y-2">
                      <div className="flex justify-between">
                        <span>Route:</span>
                        <span className="font-medium">
                          {selectedBooking.route}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Date:</span>
                        <span className="font-medium">
                          {selectedBooking.date}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Time:</span>
                        <span className="font-medium">
                          {selectedBooking.time}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Seat:</span>
                        <span className="font-medium">
                          {selectedBooking.seat}
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="text-left space-y-2">
                      <div className="flex justify-between">
                        <span>Check-in:</span>
                        <span className="font-medium">
                          {selectedBooking.checkIn}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Check-out:</span>
                        <span className="font-medium">
                          {selectedBooking.checkOut}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Room:</span>
                        <span className="font-medium">
                          {selectedBooking.roomType}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Guests:</span>
                        <span className="font-medium">
                          {selectedBooking.guests}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex space-x-3">
                <Button className="flex-1">📱 Download to Phone</Button>
                <Button variant="outline" className="flex-1">
                  🖨️ Print
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Invoice Modal */}
      <Dialog open={invoiceModal} onOpenChange={setInvoiceModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Invoice</DialogTitle>
          </DialogHeader>
          {selectedBooking && (
            <div className="space-y-6">
              <div className="border rounded-lg p-6 bg-white">
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <h2 className="text-2xl font-bold text-blue-600">
                      FAREDOWN
                    </h2>
                    <p className="text-gray-600">Travel Booking Platform</p>
                  </div>
                  <div className="text-right">
                    <h3 className="text-lg font-semibold">INVOICE</h3>
                    <p className="text-gray-600">
                      #{selectedBooking.bookingRef}
                    </p>
                    <p className="text-gray-600">
                      Date: {selectedBooking.bookingDate}
                    </p>
                  </div>
                </div>

                <div className="border-t border-b py-4 mb-4">
                  <h4 className="font-semibold mb-2">Booking Details</h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600">Service:</span>
                      <p className="font-medium">
                        {selectedBooking.type === "flight"
                          ? `Flight - ${selectedBooking.airline}`
                          : `Hotel - ${selectedBooking.name}`}
                      </p>
                    </div>
                    <div>
                      <span className="text-gray-600">Reference:</span>
                      <p className="font-medium">
                        {selectedBooking.bookingRef}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-2 mb-6">
                  <div className="flex justify-between">
                    <span>Subtotal:</span>
                    <span>{selectedBooking.totalAmount}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Taxes & Fees:</span>
                    <span>Included</span>
                  </div>
                  <div className="flex justify-between font-bold text-lg border-t pt-2">
                    <span>Total:</span>
                    <span>{selectedBooking.totalAmount}</span>
                  </div>
                </div>

                <div className="text-center text-sm text-gray-600">
                  <p>Thank you for booking with Faredown!</p>
                  <p>For support, contact us at support@faredown.com</p>
                </div>
              </div>

              <div className="flex space-x-3">
                <Button className="flex-1">📧 Email Invoice</Button>
                <Button variant="outline" className="flex-1">
                  📄 Download PDF
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Cancel Booking Modal */}
      <Dialog open={cancelBookingModal} onOpenChange={setCancelBookingModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Cancel Booking</DialogTitle>
          </DialogHeader>
          {selectedBooking && (
            <div className="space-y-4">
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-center space-x-2 text-red-800">
                  <span>⚠️</span>
                  <span className="font-medium">Cancellation Policy</span>
                </div>
                <p className="text-sm text-red-700 mt-2">
                  You can cancel this booking and receive a refund of{" "}
                  <span className="font-bold">
                    {selectedBooking.refundAmount}
                  </span>
                  . Cancellation fees have been deducted.
                </p>
              </div>

              <div className="space-y-3">
                <div className="text-sm">
                  <span className="text-gray-600">Booking:</span>
                  <p className="font-medium">
                    {selectedBooking.type === "flight"
                      ? `${selectedBooking.airline} ${selectedBooking.flightNumber}`
                      : selectedBooking.name}
                  </p>
                </div>
                <div className="text-sm">
                  <span className="text-gray-600">Reference:</span>
                  <p className="font-medium">{selectedBooking.bookingRef}</p>
                </div>
                <div className="text-sm">
                  <span className="text-gray-600">Refund Amount:</span>
                  <p className="font-medium text-green-600">
                    {selectedBooking.refundAmount}
                  </p>
                </div>
              </div>

              <div className="flex space-x-3 pt-4">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setCancelBookingModal(false)}
                >
                  Keep Booking
                </Button>
                <Button
                  className="flex-1 bg-red-600 hover:bg-red-700"
                  onClick={() => {
                    // Handle cancellation logic here
                    setCancelBookingModal(false);
                    alert(
                      "Booking cancelled successfully. Refund will be processed in 3-5 business days.",
                    );
                  }}
                >
                  Cancel Booking
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Refund Status Modal */}
      <Dialog open={refundModal} onOpenChange={setRefundModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Refund Status</DialogTitle>
          </DialogHeader>
          {selectedBooking && (
            <div className="space-y-4">
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <div className="text-2xl mb-2">💰</div>
                <h4 className="font-medium">{selectedBooking.bookingRef}</h4>
              </div>

              {selectedBooking.refundStatus ? (
                <div className="space-y-3">
                  <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex items-center space-x-2 text-green-800">
                      <span>✅</span>
                      <span className="font-medium">Refund Processed</span>
                    </div>
                    <p className="text-sm text-green-700 mt-1">
                      Refund of {selectedBooking.refundAmount} has been
                      processed to your original payment method.
                    </p>
                  </div>
                  <div className="text-sm">
                    <div className="flex justify-between mb-1">
                      <span>Amount:</span>
                      <span className="font-medium">
                        {selectedBooking.refundAmount}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Date:</span>
                      <span className="font-medium">2024-01-10</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="flex items-center space-x-2 text-blue-800">
                      <span>ℹ️</span>
                      <span className="font-medium">No Refunds</span>
                    </div>
                    <p className="text-sm text-blue-700 mt-1">
                      This booking has no pending or processed refunds.
                    </p>
                  </div>

                  <div className="text-center">
                    <p className="text-sm text-gray-600 mb-3">
                      Need to cancel this booking?
                    </p>
                    <Button
                      onClick={() => {
                        setRefundModal(false);
                        setCancelBookingModal(true);
                      }}
                      variant="outline"
                      className="w-full"
                    >
                      Cancel Booking
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Bookings;
