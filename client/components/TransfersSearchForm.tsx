import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { MapPin, Calendar, Clock, Users } from "lucide-react";

export function TransfersSearchForm() {
  const navigate = useNavigate();
  const [fromLocation, setFromLocation] = useState("Mumbai Airport (BOM)");
  const [toLocation, setToLocation] = useState("Hotel Taj Mahal Palace");
  const [transferDate, setTransferDate] = useState("Dec 15");
  const [transferTime, setTransferTime] = useState("10:30");
  const [passengers, setPassengers] = useState("2 passengers");

  const handleSearch = () => {
    navigate("/transfer-results");
  };

  return (
    <div className="bg-green-400 rounded-lg p-6">
      <h2 className="text-2xl font-bold text-gray-900 mb-4">
        Book reliable airport transfers
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <div className="relative">
          <label className="absolute -top-2 left-3 bg-green-400 px-1 text-xs text-gray-700 font-medium">
            From
          </label>
          <div className="flex items-center bg-white rounded border border-gray-300 px-3 py-3 h-12">
            <MapPin className="w-4 h-4 text-gray-500 mr-2" />
            <input
              type="text"
              value={fromLocation}
              onChange={(e) => setFromLocation(e.target.value)}
              className="flex-1 outline-none text-sm font-medium"
            />
          </div>
        </div>

        <div className="relative">
          <label className="absolute -top-2 left-3 bg-green-400 px-1 text-xs text-gray-700 font-medium">
            To
          </label>
          <div className="flex items-center bg-white rounded border border-gray-300 px-3 py-3 h-12">
            <MapPin className="w-4 h-4 text-gray-500 mr-2" />
            <input
              type="text"
              value={toLocation}
              onChange={(e) => setToLocation(e.target.value)}
              className="flex-1 outline-none text-sm font-medium"
            />
          </div>
        </div>

        <div className="relative">
          <label className="absolute -top-2 left-3 bg-green-400 px-1 text-xs text-gray-700 font-medium">
            Date
          </label>
          <div className="flex items-center bg-white rounded border border-gray-300 px-3 py-3 h-12">
            <Calendar className="w-4 h-4 text-gray-500 mr-2" />
            <input
              type="text"
              value={transferDate}
              onChange={(e) => setTransferDate(e.target.value)}
              className="flex-1 outline-none text-sm font-medium"
            />
          </div>
        </div>

        <div className="relative">
          <label className="absolute -top-2 left-3 bg-green-400 px-1 text-xs text-gray-700 font-medium">
            Time
          </label>
          <div className="flex items-center bg-white rounded border border-gray-300 px-3 py-3 h-12">
            <Clock className="w-4 h-4 text-gray-500 mr-2" />
            <input
              type="text"
              value={transferTime}
              onChange={(e) => setTransferTime(e.target.value)}
              className="flex-1 outline-none text-sm font-medium"
            />
          </div>
        </div>

        <div className="relative">
          <label className="absolute -top-2 left-3 bg-green-400 px-1 text-xs text-gray-700 font-medium">
            Passengers
          </label>
          <div className="flex items-center bg-white rounded border border-gray-300 px-3 py-3 h-12">
            <Users className="w-4 h-4 text-gray-500 mr-2" />
            <input
              type="text"
              value={passengers}
              onChange={(e) => setPassengers(e.target.value)}
              className="flex-1 outline-none text-sm font-medium"
            />
          </div>
        </div>
      </div>

      <Button 
        onClick={handleSearch}
        className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 mt-4 font-medium"
      >
        Search Transfers
      </Button>
    </div>
  );
}
