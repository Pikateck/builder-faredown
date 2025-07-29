import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  CalendarDays,
  MapPin,
  Plane,
  Hotel,
  Users,
  Clock,
  Download,
  Eye,
  Filter,
  Search,
} from "lucide-react";
import { Header } from "@/components/Header";

interface Trip {
  id: string;
  bookingType: "flight" | "hotel";
  bookingDate: string;
  total: number;
  passengers?: any[];
  guests?: number;
  flights?: any[];
  hotel?: any;
  checkIn?: string;
  checkOut?: string;
  nights?: number;
}

export default function MyTrips() {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [filteredTrips, setFilteredTrips] = useState<Trip[]>([]);
  const [filterType, setFilterType] = useState<"all" | "flight" | "hotel">(
    "all",
  );
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    // Load trips from localStorage
    const savedTrips = JSON.parse(localStorage.getItem("myTrips") || "[]");

    // Also load any existing bookings that haven't been added to trips yet
    const existingTrips = [...savedTrips];

    // Generate unique ID function
    const generateUniqueId = (bookingType: string, baseId?: string) => {
      const timestamp = Date.now();
      const random = Math.random().toString(36).substr(2, 5);
      return baseId && baseId !== ""
        ? `${baseId}_${timestamp}`
        : `${bookingType.toUpperCase()}_${timestamp}_${random}`;
    };

    // Check for flight booking
    const flightBooking = localStorage.getItem("latestBooking");
    if (flightBooking) {
      try {
        const flightData = JSON.parse(flightBooking);
        // Ensure unique ID for flight booking
        const uniqueFlightId = generateUniqueId("flight", flightData.id);

        // Check if this booking is already in trips (by original ID or unique ID)
        const existsInTrips = existingTrips.some(
          (trip) => trip.id === flightData.id || trip.id === uniqueFlightId,
        );

        if (!existsInTrips && flightData.id) {
          const flightTrip: Trip = {
            ...flightData,
            id: uniqueFlightId,
            bookingType: "flight",
            bookingDate: new Date().toISOString(),
          };
          existingTrips.push(flightTrip);
        }
      } catch (error) {
        console.error("Error parsing flight booking:", error);
      }
    }

    // Check for hotel booking
    const hotelBooking = localStorage.getItem("latestHotelBooking");
    if (hotelBooking) {
      try {
        const hotelData = JSON.parse(hotelBooking);
        // Ensure unique ID for hotel booking
        const uniqueHotelId = generateUniqueId("hotel", hotelData.id);

        // Check if this booking is already in trips (by original ID or unique ID)
        const existsInTrips = existingTrips.some(
          (trip) => trip.id === hotelData.id || trip.id === uniqueHotelId,
        );

        if (!existsInTrips && hotelData.id) {
          const hotelTrip: Trip = {
            ...hotelData,
            id: uniqueHotelId,
            bookingType: "hotel",
            bookingDate: hotelData.bookingDate || new Date().toISOString(),
          };
          existingTrips.push(hotelTrip);
        }
      } catch (error) {
        console.error("Error parsing hotel booking:", error);
      }
    }

    // Add a test hotel booking if no trips exist (for testing)
    if (existingTrips.length === 0) {
      const testHotelTrip: Trip = {
        id: generateUniqueId("hotel", "HB240001"),
        bookingType: "hotel",
        bookingDate: "2024-01-16",
        total: 9148,
        guests: 2,
        hotel: {
          id: "1",
          name: "Roessli Hotel",
          location: "Mumbai, India",
          image: "https://via.placeholder.com/80x80?text=Hotel",
          rating: 4.2,
          reviews: 150,
        },
        room: {
          type: "twin-double",
          name: "Twin/Double with Shared Bathroom",
          details: "ROOM ONLY",
          pricePerNight: 2287,
        },
        checkIn: "2024-02-01",
        checkOut: "2024-02-05",
        nights: 4,
        paymentMethod: "Credit Card",
        paymentStatus: "Confirmed",
        cancellation: "Free cancellation until 24 hours before check-in",
        guest: {
          firstName: "Zubin",
          lastName: "Aibara",
          email: "zubin@example.com",
          phone: "+91 98765 43210",
        },
      };
      existingTrips.push(testHotelTrip);
    }

    // Remove any potential duplicates by ID (additional safeguard)
    const uniqueTrips = existingTrips.filter(
      (trip, index, self) => index === self.findIndex((t) => t.id === trip.id),
    );

    // Update localStorage with the combined trips
    if (uniqueTrips.length > savedTrips.length) {
      localStorage.setItem("myTrips", JSON.stringify(uniqueTrips));
    }

    console.log("All trips:", uniqueTrips);
    console.log(
      "Hotel trips:",
      uniqueTrips.filter((trip) => trip.bookingType === "hotel"),
    );

    setTrips(uniqueTrips);
    setFilteredTrips(uniqueTrips);
  }, []);

  useEffect(() => {
    // Filter trips based on type and search term
    let filtered = trips;

    console.log("Filtering trips:", { trips, filterType, searchTerm });

    if (filterType !== "all") {
      filtered = filtered.filter((trip) => trip.bookingType === filterType);
      console.log(`Filtered by ${filterType}:`, filtered);
    }

    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter((trip) => {
        // Search by booking ID
        if (trip.id.toLowerCase().includes(searchLower)) return true;

        // Search by booking type
        if (trip.bookingType.toLowerCase().includes(searchLower)) return true;

        // Search by dates (multiple formats)
        const bookingDate = new Date(trip.bookingDate);
        const bookingDateStr = bookingDate.toLocaleDateString();
        const bookingDateISO = trip.bookingDate;
        const bookingDateFormatted = formatDate(trip.bookingDate);

        if (bookingDateStr.includes(searchLower) ||
            bookingDateISO.includes(searchLower) ||
            bookingDateFormatted.toLowerCase().includes(searchLower)) return true;

        // Search by total amount
        if (trip.total?.toString().includes(searchLower)) return true;

        // Hotel-specific searches
        if (trip.bookingType === "hotel" && trip.hotel) {
          // Hotel name
          if (trip.hotel.name?.toLowerCase().includes(searchLower)) return true;

          // Hotel location
          if (trip.hotel.location?.toLowerCase().includes(searchLower)) return true;

          // Room type
          if (trip.room?.type?.toLowerCase().includes(searchLower)) return true;
          if (trip.room?.name?.toLowerCase().includes(searchLower)) return true;

          // Check-in/Check-out dates
          if (trip.checkIn) {
            const checkInDate = new Date(trip.checkIn);
            const checkInStr = checkInDate.toLocaleDateString();
            const checkInFormatted = formatDate(trip.checkIn);
            if (checkInStr.includes(searchLower) || checkInFormatted.toLowerCase().includes(searchLower)) return true;
          }

          if (trip.checkOut) {
            const checkOutDate = new Date(trip.checkOut);
            const checkOutStr = checkOutDate.toLocaleDateString();
            const checkOutFormatted = formatDate(trip.checkOut);
            if (checkOutStr.includes(searchLower) || checkOutFormatted.toLowerCase().includes(searchLower)) return true;
          }

          // Guest information
          if (trip.guest?.firstName?.toLowerCase().includes(searchLower)) return true;
          if (trip.guest?.lastName?.toLowerCase().includes(searchLower)) return true;
          if (trip.guest?.email?.toLowerCase().includes(searchLower)) return true;

          // Payment method and status
          if (trip.paymentMethod?.toLowerCase().includes(searchLower)) return true;
          if (trip.paymentStatus?.toLowerCase().includes(searchLower)) return true;
        }

        // Flight-specific searches
        if (trip.bookingType === "flight" && trip.flights) {
          return trip.flights.some((flight: any) => {
            // Airline name and flight number
            if (flight.airline?.toLowerCase().includes(searchLower)) return true;
            if (flight.flightNumber?.toLowerCase().includes(searchLower)) return true;

            // Airports (from/to)
            if (flight.from?.toLowerCase().includes(searchLower)) return true;
            if (flight.to?.toLowerCase().includes(searchLower)) return true;

            // Flight date and time
            if (flight.date?.toLowerCase().includes(searchLower)) return true;
            if (flight.time?.toLowerCase().includes(searchLower)) return true;

            // Departure and arrival times
            if (flight.departure?.toLowerCase().includes(searchLower)) return true;
            if (flight.arrival?.toLowerCase().includes(searchLower)) return true;

            return false;
          });
        }

        // Passenger information for flights
        if (trip.passengers) {
          return trip.passengers.some((passenger: any) => {
            if (passenger.firstName?.toLowerCase().includes(searchLower)) return true;
            if (passenger.lastName?.toLowerCase().includes(searchLower)) return true;
            if (passenger.email?.toLowerCase().includes(searchLower)) return true;
            return false;
          });
        }

        return false;
      });
      console.log(`Filtered by search "${searchTerm}":`, filtered);
    }

    console.log("Final filtered trips:", filtered);
    setFilteredTrips(filtered);
  }, [trips, filterType, searchTerm]);

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

  const TripCard = ({ trip }: { trip: Trip }) => (
    <div className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start mb-4">
        <div className="flex items-center">
          {trip.bookingType === "flight" ? (
            <Plane className="w-5 h-5 text-blue-600 mr-2" />
          ) : (
            <Hotel className="w-5 h-5 text-green-600 mr-2" />
          )}
          <div>
            <h3 className="font-semibold text-gray-900">
              {trip.bookingType === "flight"
                ? "Flight Booking"
                : "Hotel Booking"}
            </h3>
            <p className="text-sm text-gray-500">Booking ID: {trip.id}</p>
          </div>
        </div>
        <Badge
          variant={trip.bookingType === "flight" ? "default" : "secondary"}
        >
          {trip.bookingType === "flight" ? "Flight" : "Hotel"}
        </Badge>
      </div>

      {trip.bookingType === "flight" ? (
        // Flight Trip Details
        <div className="space-y-3">
          {trip.flights && trip.flights.length > 0 && (
            <div className="bg-blue-50 p-3 rounded-lg">
              <div className="flex justify-between items-center">
                <div className="text-sm">
                  <p className="font-medium">
                    {trip.flights[0].from} → {trip.flights[0].to}
                  </p>
                  <p className="text-gray-600">
                    {trip.flights[0].airline} {trip.flights[0].flightNumber}
                  </p>
                </div>
                <div className="text-right text-sm">
                  <p className="font-medium">{trip.flights[0].date}</p>
                  <p className="text-gray-600">{trip.flights[0].time}</p>
                </div>
              </div>
              {trip.flights.length > 1 && (
                <div className="mt-2 pt-2 border-t border-blue-200">
                  <div className="flex justify-between items-center">
                    <div className="text-sm">
                      <p className="font-medium">
                        {trip.flights[1].from} → {trip.flights[1].to}
                      </p>
                      <p className="text-gray-600">
                        {trip.flights[1].airline} {trip.flights[1].flightNumber}
                      </p>
                    </div>
                    <div className="text-right text-sm">
                      <p className="font-medium">{trip.flights[1].date}</p>
                      <p className="text-gray-600">{trip.flights[1].time}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
          <div className="flex items-center text-sm text-gray-600">
            <Users className="w-4 h-4 mr-1" />
            {trip.passengers?.length || 1} Passenger(s)
          </div>
        </div>
      ) : (
        // Hotel Trip Details
        <div className="space-y-3">
          {trip.hotel && (
            <div className="bg-green-50 p-3 rounded-lg">
              <h4 className="font-medium text-gray-900">{trip.hotel.name}</h4>
              <div className="flex items-start mt-1">
                <MapPin className="w-4 h-4 text-gray-500 mr-1 mt-0.5" />
                <p className="text-sm text-gray-600">{trip.hotel.location}</p>
              </div>
            </div>
          )}
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center text-gray-600">
              <CalendarDays className="w-4 h-4 mr-1" />
              {trip.checkIn && trip.checkOut
                ? `${formatDate(trip.checkIn)} - ${formatDate(trip.checkOut)}`
                : "Dates not available"}
            </div>
            <div className="flex items-center text-gray-600">
              <Clock className="w-4 h-4 mr-1" />
              {trip.nights || 1} Night(s)
            </div>
          </div>
          <div className="flex items-center text-sm text-gray-600">
            <Users className="w-4 h-4 mr-1" />
            {trip.guests || 1} Guest(s)
          </div>
        </div>
      )}

      <div className="flex justify-between items-center mt-4 pt-4 border-t border-gray-200">
        <div>
          <p className="text-sm text-gray-500">Total Amount</p>
          <p className="text-lg font-bold text-gray-900">
            ₹{trip.total?.toLocaleString() || "N/A"}
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => handleViewDetails(trip)}
          >
            <Eye className="w-4 h-4 mr-1" />
            View Details
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => handleDownload(trip)}
          >
            <Download className="w-4 h-4 mr-1" />
            Download
          </Button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">My Trips</h1>
          <p className="text-gray-600">View and manage all your bookings</p>
        </div>

        {/* Filters and Search */}
        <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search by booking ID, hotel name, airline, passenger name, dates, amount..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                onClick={() => setFilterType("all")}
                variant={filterType === "all" ? "default" : "outline"}
                size="sm"
              >
                <Filter className="w-4 h-4 mr-1" />
                All
              </Button>
              <Button
                onClick={() => setFilterType("flight")}
                variant={filterType === "flight" ? "default" : "outline"}
                size="sm"
              >
                <Plane className="w-4 h-4 mr-1" />
                Flights
              </Button>
              <Button
                onClick={() => setFilterType("hotel")}
                variant={filterType === "hotel" ? "default" : "outline"}
                size="sm"
              >
                <Hotel className="w-4 h-4 mr-1" />
                Hotels
              </Button>
            </div>
          </div>
        </div>

        {/* Trips List */}
        {filteredTrips.length > 0 ? (
          <div className="grid gap-6">
            {filteredTrips.map((trip, index) => (
              <TripCard key={`${trip.id}-${index}`} trip={trip} />
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              {filterType === "all" ? (
                <CalendarDays className="w-8 h-8 text-gray-400" />
              ) : filterType === "flight" ? (
                <Plane className="w-8 h-8 text-gray-400" />
              ) : (
                <Hotel className="w-8 h-8 text-gray-400" />
              )}
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {searchTerm
                ? "No trips found"
                : `No ${filterType === "all" ? "" : filterType} trips yet`}
            </h3>
            <p className="text-gray-600 mb-6">
              {searchTerm
                ? "Try adjusting your search criteria"
                : `When you book ${filterType === "all" ? "flights or hotels" : `a ${filterType}`}, they'll appear here.`}
            </p>
            <div className="flex gap-3 justify-center">
              <Link to="/flights">
                <Button className="bg-blue-700 hover:bg-blue-800">
                  <Plane className="w-4 h-4 mr-2" />
                  Book a Flight
                </Button>
              </Link>
              <Link to="/hotels">
                <Button variant="outline">
                  <Hotel className="w-4 h-4 mr-2" />
                  Book a Hotel
                </Button>
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
