import React, { useState } from "react";
import { ChevronLeft, Clock, Check } from "lucide-react";
import { Button } from "@/components/ui/button";

interface MobileFullScreenTimeInputProps {
  title: string;
  transferTripType: "one-way" | "return";
  initialPickupTime: string;
  initialReturnTime: string;
  onSelect: (time: string, type: "pickup" | "return") => void;
  onBack: () => void;
}

export function MobileFullScreenTimeInput({
  title,
  transferTripType,
  initialPickupTime,
  initialReturnTime,
  onSelect,
  onBack
}: MobileFullScreenTimeInputProps) {
  const [pickupTime, setPickupTime] = useState(initialPickupTime);
  const [returnTime, setReturnTime] = useState(initialReturnTime);

  // Generate time slots (24 hours in 30-minute intervals)
  const timeSlots = Array.from({ length: 48 }, (_, i) => {
    const hour = Math.floor(i / 2);
    const minute = i % 2 === 0 ? "00" : "30";
    const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
    const period = hour < 12 ? "AM" : "PM";
    const value = `${hour.toString().padStart(2, "0")}:${minute}`;
    const display = `${displayHour}:${minute} ${period}`;
    return { value, display };
  });

  const handleConfirm = () => {
    onSelect(pickupTime, "pickup");
    if (transferTripType === "return") {
      onSelect(returnTime, "return");
    }
    onBack();
  };

  const getTimeDisplay = (timeValue: string) => {
    const slot = timeSlots.find(slot => slot.value === timeValue);
    return slot ? slot.display : timeValue;
  };

  return (
    <div className="fixed inset-0 bg-white z-50 overflow-hidden flex flex-col">
      {/* Native App Header */}
      <div className="bg-[#003580] text-white px-4 py-3 shadow-lg flex-shrink-0">
        <div className="flex items-center justify-between">
          <button 
            onClick={onBack}
            className="p-2 -ml-2 rounded-full hover:bg-white/10 transition-colors"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          <h1 className="text-lg font-semibold">{title}</h1>
          <div className="w-10"></div>
        </div>
      </div>

      {/* Time Summary */}
      <div className="bg-white px-4 py-4 border-b border-gray-200 flex-shrink-0">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 bg-[#003580] rounded-xl flex items-center justify-center shadow-md">
            <Clock className="w-6 h-6 text-white" />
          </div>
          <div className="flex-1">
            <div className="text-sm text-gray-600 mb-1">
              {transferTripType === "return" ? "Pickup & return time" : "Pickup time"}
            </div>
            <div className="font-semibold text-gray-900 text-base">
              {transferTripType === "return" 
                ? `${getTimeDisplay(pickupTime)} - ${getTimeDisplay(returnTime)}`
                : getTimeDisplay(pickupTime)
              }
            </div>
          </div>
        </div>
      </div>

      {/* Time Selection */}
      <div className="flex-1 overflow-y-auto">
        {/* Pickup Time */}
        <div className="p-4">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Pickup Time</h2>
          <div className="grid grid-cols-3 gap-2">
            {timeSlots.map((slot) => (
              <button
                key={slot.value}
                onClick={() => setPickupTime(slot.value)}
                className={`p-3 rounded-xl border-2 text-center transition-all ${
                  pickupTime === slot.value
                    ? "border-[#003580] bg-[#003580] text-white"
                    : "border-gray-200 hover:border-[#003580] hover:bg-blue-50"
                }`}
              >
                <div className="font-semibold text-sm">{slot.display}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Return Time (if return trip) */}
        {transferTripType === "return" && (
          <div className="p-4 border-t border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Return Time</h2>
            <div className="grid grid-cols-3 gap-2">
              {timeSlots.map((slot) => (
                <button
                  key={slot.value}
                  onClick={() => setReturnTime(slot.value)}
                  className={`p-3 rounded-xl border-2 text-center transition-all ${
                    returnTime === slot.value
                      ? "border-[#003580] bg-[#003580] text-white"
                      : "border-gray-200 hover:border-[#003580] hover:bg-blue-50"
                  }`}
                >
                  <div className="font-semibold text-sm">{slot.display}</div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Popular Times */}
        <div className="p-4 border-t border-gray-200">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">Popular Times</h3>
          <div className="flex flex-wrap gap-2">
            {["06:00", "09:00", "12:00", "15:00", "18:00", "21:00"].map((time) => (
              <button
                key={time}
                onClick={() => setPickupTime(time)}
                className="px-4 py-2 bg-gray-100 hover:bg-blue-50 hover:border-[#003580] border border-gray-200 rounded-lg text-sm font-medium transition-colors"
              >
                {getTimeDisplay(time)}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Confirm Button */}
      <div className="bg-white border-t border-gray-200 p-4 shadow-lg flex-shrink-0">
        <Button
          onClick={handleConfirm}
          className="w-full bg-[#003580] hover:bg-[#002660] text-white py-3 rounded-xl font-medium text-base flex items-center justify-center space-x-2"
        >
          <Check className="w-5 h-5" />
          <span>Confirm Time</span>
        </Button>
      </div>
    </div>
  );
}
