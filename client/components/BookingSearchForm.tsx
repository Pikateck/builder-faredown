import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Calendar, MapPin, Users, Search } from "lucide-react";

export function BookingSearchForm() {
  const navigate = useNavigate();
  const [destination, setDestination] = useState("");
  const [checkIn, setCheckIn] = useState("2024-12-15");
  const [checkOut, setCheckOut] = useState("2024-12-18");
  const [adults, setAdults] = useState(2);
  const [children, setChildren] = useState(0);
  const [rooms, setRooms] = useState(1);

  const handleSearch = () => {
    const searchParams = new URLSearchParams({
      destination,
      checkIn,
      checkOut,
      adults: adults.toString(),
      children: children.toString(),
      rooms: rooms.toString(),
    });

    navigate(`/hotels/results?${searchParams}`);
  };

  return (
    <div className="bg-white rounded-lg p-4 sm:p-6 shadow-lg">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Destination */}
        <div className="md:col-span-1">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Destination
          </label>
          <div className="relative">
            <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              type="text"
              placeholder="Where are you going?"
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Check-in */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Check-in
          </label>
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              type="date"
              value={checkIn}
              onChange={(e) => setCheckIn(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Check-out */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Check-out
          </label>
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              type="date"
              value={checkOut}
              onChange={(e) => setCheckOut(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Guests & Rooms */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Guests & Rooms
          </label>
          <div className="flex space-x-2">
            <Input
              type="number"
              min="1"
              value={adults}
              onChange={(e) => setAdults(parseInt(e.target.value))}
              className="w-16 text-center"
              title="Adults"
            />
            <Input
              type="number"
              min="0"
              value={children}
              onChange={(e) => setChildren(parseInt(e.target.value))}
              className="w-16 text-center"
              title="Children"
            />
            <Input
              type="number"
              min="1"
              value={rooms}
              onChange={(e) => setRooms(parseInt(e.target.value))}
              className="w-16 text-center"
              title="Rooms"
            />
          </div>
        </div>
      </div>

      <div className="mt-4 flex justify-center">
        <Button
          onClick={handleSearch}
          className="bg-[#003580] hover:bg-[#002a66] text-white px-8 py-2"
        >
          <Search className="w-4 h-4 mr-2" />
          Search
        </Button>
      </div>
    </div>
  );
}
