import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { MapPin, Calendar, Clock, Users, Plane, Hotel } from "lucide-react";

export function TransfersSearchForm() {
  const navigate = useNavigate();
  const [fromLocation, setFromLocation] = useState("Mumbai Airport (BOM)");
  const [toLocation, setToLocation] = useState("Hotel Taj Mahal Palace");
  const [transferDate, setTransferDate] = useState("Dec 15");
  const [transferTime, setTransferTime] = useState("10:30");
  const [passengers, setPassengers] = useState("2 passengers");
  const [transferType, setTransferType] = useState("airport-to-hotel");

  const handleSearch = () => {
    navigate("/transfer-results");
  };

  return (
    <div className="bg-green-400 rounded-lg p-6">
      <h2 className="text-2xl font-bold text-gray-900 mb-4">
        Book reliable airport transfers
      </h2>

      {/* Transfer Type Toggle */}
      <div className="flex items-center space-x-4 mb-4">
        <div className="flex bg-white rounded-lg p-1">
          <button
            onClick={() => setTransferType("airport-to-hotel")}
            className={`flex items-center space-x-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              transferType === "airport-to-hotel"
                ? "bg-blue-600 text-white"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            <Plane className="w-4 h-4" />
            <span>Airport → Hotel</span>
          </button>
          <button
            onClick={() => setTransferType("hotel-to-airport")}
            className={`flex items-center space-x-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              transferType === "hotel-to-airport"
                ? "bg-blue-600 text-white"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            <Hotel className="w-4 h-4" />
            <span>Hotel → Airport</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <div className="relative">
          <label className="absolute -top-2 left-3 bg-green-400 px-1 text-xs text-gray-700 font-medium">
            {transferType === "airport-to-hotel" ? "Airport" : "Hotel/Address"}
          </label>
          <div className="flex items-center bg-white rounded border border-gray-300 px-3 py-3 h-12">
            {transferType === "airport-to-hotel" ? (
              <Plane className="w-4 h-4 text-gray-500 mr-2" />
            ) : (
              <Hotel className="w-4 h-4 text-gray-500 mr-2" />
            )}
            <input
              type="text"
              value={fromLocation}
              onChange={(e) => setFromLocation(e.target.value)}
              className="flex-1 outline-none text-sm font-medium"
              placeholder={transferType === "airport-to-hotel" ? "Departure airport" : "Hotel or address"}
            />
          </div>
        </div>

        <div className="relative">
          <label className="absolute -top-2 left-3 bg-green-400 px-1 text-xs text-gray-700 font-medium">
            {transferType === "airport-to-hotel" ? "Hotel/Address" : "Airport"}
          </label>
          <div className="flex items-center bg-white rounded border border-gray-300 px-3 py-3 h-12">
            {transferType === "airport-to-hotel" ? (
              <Hotel className="w-4 h-4 text-gray-500 mr-2" />
            ) : (
              <Plane className="w-4 h-4 text-gray-500 mr-2" />
            )}
            <input
              type="text"
              value={toLocation}
              onChange={(e) => setToLocation(e.target.value)}
              className="flex-1 outline-none text-sm font-medium"
              placeholder={transferType === "airport-to-hotel" ? "Hotel or address" : "Departure airport"}
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
              placeholder="Transfer date"
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
              placeholder="Transfer time"
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
              placeholder="Number of passengers"
            />
          </div>
        </div>
      </div>

      {/* Flight number field for airport transfers */}
      <div className="mt-4 max-w-xs">
        <div className="relative">
          <label className="absolute -top-2 left-3 bg-green-400 px-1 text-xs text-gray-700 font-medium">
            Flight Number (Optional)
          </label>
          <div className="flex items-center bg-white rounded border border-gray-300 px-3 py-3 h-12">
            <Plane className="w-4 h-4 text-gray-500 mr-2" />
            <input
              type="text"
              placeholder="e.g. AI 102"
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
