import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  CheckCircle,
  Download,
  Mail,
  Plane,
  Calendar,
  Users,
} from "lucide-react";
import TicketPDF from "@/components/TicketPDF";
import TicketEmail from "@/components/emails/TicketEmail";

export default function BookingConfirmation() {
  const [booking, setBooking] = useState(null);
  const [showTicketPDF, setShowTicketPDF] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  useEffect(() => {
    // Load booking data from localStorage
    const savedBooking = localStorage.getItem("latestBooking");
    if (savedBooking) {
      setBooking(JSON.parse(savedBooking));
    }
  }, []);

  const handleDownloadTicket = () => {
    setShowTicketPDF(true);
    // In a real app, this would generate and download a PDF
    setTimeout(() => {
      window.print(); // For now, use browser print to save as PDF
    }, 500);
  };

  const handleEmailTicket = async () => {
    // In a real app, this would send an email with the ticket
    setEmailSent(true);
    console.log("Sending ticket email...");
  };

  if (!booking) {
    return (
      <div className="min-h-screen bg-[#f2f6fa] flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            No booking found
          </h1>
          <Link to="/">
            <Button className="bg-[#003580] hover:bg-[#009fe3]">
              Return to Home
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  if (showTicketPDF) {
    return <TicketPDF booking={booking} />;
  }

  return (
    <div className="min-h-screen bg-[#f2f6fa]">
      {/* Header */}
      <header className="bg-[#003580] text-white">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <Link to="/" className="text-2xl font-bold">
            faredown.com
          </Link>
        </div>
      </header>

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
            Your flight has been successfully booked. Here are your booking
            details:
          </p>
          <div className="bg-[#003580] text-white px-6 py-3 rounded-lg inline-block">
            <span className="text-lg font-bold">Booking ID: {booking.id}</span>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-lg border border-[#f2f6fa] p-6 mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4">
            Get Your Ticket
          </h2>
          <div className="grid md:grid-cols-2 gap-4">
            <Button
              onClick={handleDownloadTicket}
              className="bg-[#003580] hover:bg-[#009fe3] flex items-center justify-center"
            >
              <Download className="w-4 h-4 mr-2" />
              Download PDF Ticket
            </Button>
            <Button
              onClick={handleEmailTicket}
              variant="outline"
              className="border-[#003580] text-[#003580] hover:bg-[#003580] hover:text-white flex items-center justify-center"
              disabled={emailSent}
            >
              <Mail className="w-4 h-4 mr-2" />
              {emailSent ? "Email Sent!" : "Email Ticket"}
            </Button>
          </div>
        </div>

        {/* Booking Summary */}
        <div className="grid md:grid-cols-2 gap-8">
          {/* Flight Details */}
          <div className="bg-white rounded-lg border border-[#f2f6fa] p-6">
            <div className="flex items-center mb-4">
              <Plane className="w-5 h-5 text-[#003580] mr-2" />
              <h2 className="text-xl font-bold text-gray-900">
                Flight Details
              </h2>
            </div>
            <div className="space-y-4">
              {booking.flights.map((flight, index) => (
                <div key={index} className="p-4 bg-[#f2f6fa] rounded-lg">
                  <h3 className="font-bold text-gray-900 mb-2">
                    {flight.from} → {flight.to}
                  </h3>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <span className="text-gray-600">Date:</span>
                      <p className="font-medium">{flight.date}</p>
                    </div>
                    <div>
                      <span className="text-gray-600">Time:</span>
                      <p className="font-medium">{flight.time}</p>
                    </div>
                    <div>
                      <span className="text-gray-600">Flight:</span>
                      <p className="font-medium">{flight.flightNumber}</p>
                    </div>
                    <div>
                      <span className="text-gray-600">Duration:</span>
                      <p className="font-medium">{flight.duration}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Passenger Details */}
          <div className="bg-white rounded-lg border border-[#f2f6fa] p-6">
            <div className="flex items-center mb-4">
              <Users className="w-5 h-5 text-[#003580] mr-2" />
              <h2 className="text-xl font-bold text-gray-900">Passengers</h2>
            </div>
            <div className="space-y-3">
              {booking.passengers.map((passenger, index) => (
                <div
                  key={index}
                  className="flex justify-between items-center p-3 bg-[#f2f6fa] rounded-lg"
                >
                  <div>
                    <p className="font-medium text-gray-900">
                      {passenger.firstName} {passenger.lastName}
                    </p>
                    <p className="text-sm text-gray-600">{passenger.type}</p>
                  </div>
                  {booking.seats[index] && (
                    <div className="text-right">
                      <p className="font-bold text-[#003580]">
                        Seat {booking.seats[index].seat}
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Total Amount */}
        <div className="bg-white rounded-lg border border-[#f2f6fa] p-6 mt-8">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold text-gray-900">Total Paid</h2>
            <span className="text-3xl font-bold text-[#003580]">
              ₹ {booking.total.toLocaleString("en-IN")}
            </span>
          </div>
        </div>

        {/* Important Information */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 mt-8">
          <h3 className="font-bold text-yellow-800 mb-3">
            Important Information
          </h3>
          <ul className="text-yellow-700 space-y-2 text-sm">
            <li>
              • Please arrive at the airport at least 2 hours before domestic
              flights
            </li>
            <li>• Carry a valid photo ID for verification</li>
            <li>
              • Check-in online 24 hours before departure for faster processing
            </li>
            <li>• For any changes or queries, contact our support team</li>
          </ul>
        </div>

        {/* Navigation */}
        <div className="text-center mt-8">
          <Link to="/">
            <Button variant="outline" className="mr-4">
              Book Another Flight
            </Button>
          </Link>
          <Link to="/my-bookings">
            <Button className="bg-[#003580] hover:bg-[#009fe3]">
              View My Bookings
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
