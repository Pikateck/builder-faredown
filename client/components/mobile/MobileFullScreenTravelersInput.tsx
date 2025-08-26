import React, { useState } from "react";
import { ChevronLeft, Users, Plus, Minus, Check } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Travelers {
  adults: number;
  children: number;
  infants?: number;
  rooms?: number;
}

interface MobileFullScreenTravelersInputProps {
  title: string;
  bookingType: "flight" | "hotel" | "sightseeing" | "transfer";
  initialTravelers: Travelers;
  onSelect: (travelers: Travelers) => void;
  onBack: () => void;
}

export function MobileFullScreenTravelersInput({
  title,
  bookingType,
  initialTravelers,
  onSelect,
  onBack
}: MobileFullScreenTravelersInputProps) {
  const [travelers, setTravelers] = useState<Travelers>(initialTravelers);

  const updateCount = (type: keyof Travelers, operation: "increment" | "decrement") => {
    setTravelers(prev => {
      const newValue = operation === "increment" ? (prev[type] || 0) + 1 : Math.max(0, (prev[type] || 0) - 1);
      
      // Validation rules
      if (type === "adults" && newValue < 1) return prev;
      if (type === "rooms" && newValue < 1) return prev;
      if (newValue > 30) return prev;

      return { ...prev, [type]: newValue };
    });
  };

  const handleConfirm = () => {
    onSelect(travelers);
    onBack();
  };

  const getTotalTravelers = () => {
    return (travelers.adults || 0) + (travelers.children || 0) + (travelers.infants || 0);
  };

  const getSummary = () => {
    const parts = [];
    
    if (travelers.adults) {
      parts.push(`${travelers.adults} adult${travelers.adults > 1 ? 's' : ''}`);
    }
    
    if (travelers.children) {
      parts.push(`${travelers.children} child${travelers.children > 1 ? 'ren' : ''}`);
    }
    
    if (travelers.infants) {
      parts.push(`${travelers.infants} infant${travelers.infants > 1 ? 's' : ''}`);
    }
    
    if (bookingType === "hotel" && travelers.rooms) {
      parts.push(`${travelers.rooms} room${travelers.rooms > 1 ? 's' : ''}`);
    }
    
    return parts.join(', ');
  };

  const Counter = ({ 
    label, 
    description, 
    value, 
    type, 
    min = 0, 
    max = 30 
  }: { 
    label: string; 
    description: string; 
    value: number; 
    type: keyof Travelers; 
    min?: number; 
    max?: number; 
  }) => (
    <div className="flex items-center justify-between py-6 px-4 bg-white rounded-xl border border-gray-200">
      <div className="flex-1">
        <div className="font-semibold text-gray-900 text-base">{label}</div>
        <div className="text-sm text-gray-600 mt-1">{description}</div>
      </div>
      <div className="flex items-center space-x-4">
        <button
          onClick={() => updateCount(type, "decrement")}
          disabled={value <= min}
          className="w-10 h-10 rounded-full border-2 border-[#003580] flex items-center justify-center hover:bg-blue-50 disabled:border-gray-300 disabled:text-gray-400 disabled:hover:bg-transparent transition-colors"
        >
          <Minus className="w-5 h-5" />
        </button>
        <div className="w-8 text-center">
          <span className="text-lg font-semibold text-gray-900">{value}</span>
        </div>
        <button
          onClick={() => updateCount(type, "increment")}
          disabled={value >= max}
          className="w-10 h-10 rounded-full border-2 border-[#003580] flex items-center justify-center hover:bg-blue-50 disabled:border-gray-300 disabled:text-gray-400 disabled:hover:bg-transparent transition-colors"
        >
          <Plus className="w-5 h-5" />
        </button>
      </div>
    </div>
  );

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

      {/* Summary Section */}
      <div className="bg-white px-4 py-4 border-b border-gray-200 flex-shrink-0">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 bg-[#003580] rounded-xl flex items-center justify-center shadow-md">
            <Users className="w-6 h-6 text-white" />
          </div>
          <div className="flex-1">
            <div className="text-sm text-gray-600 mb-1">Total travelers</div>
            <div className="font-semibold text-gray-900 text-base">
              {getSummary() || "No travelers selected"}
            </div>
          </div>
        </div>
      </div>

      {/* Travelers Configuration */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="space-y-4">
          {/* Adults */}
          <Counter
            label="Adults"
            description="Ages 18 and above"
            value={travelers.adults || 0}
            type="adults"
            min={1}
          />

          {/* Children */}
          <Counter
            label="Children"
            description={bookingType === "flight" ? "Ages 2-17" : "Ages 0-17"}
            value={travelers.children || 0}
            type="children"
          />

          {/* Infants (for flights) */}
          {bookingType === "flight" && (
            <Counter
              label="Infants"
              description="Under 2 years (on lap)"
              value={travelers.infants || 0}
              type="infants"
            />
          )}

          {/* Rooms (for hotels) */}
          {bookingType === "hotel" && (
            <Counter
              label="Rooms"
              description="Number of rooms needed"
              value={travelers.rooms || 1}
              type="rooms"
              min={1}
            />
          )}
        </div>

        {/* Tips Section */}
        <div className="mt-8 p-4 bg-blue-50 rounded-xl border border-blue-200">
          <h3 className="font-medium text-blue-900 mb-2">Tips</h3>
          <ul className="space-y-1 text-sm text-blue-800">
            {bookingType === "flight" && (
              <>
                <li>• Infants under 2 can travel on your lap for free</li>
                <li>• Children 12+ may need adult supervision for some airlines</li>
              </>
            )}
            {bookingType === "hotel" && (
              <>
                <li>• Extra beds may be available for children</li>
                <li>• Some hotels offer free stays for children</li>
              </>
            )}
            <li>• Maximum 9 travelers per booking</li>
          </ul>
        </div>
      </div>

      {/* Confirm Button */}
      <div className="bg-white border-t border-gray-200 p-4 shadow-lg flex-shrink-0">
        <Button
          onClick={handleConfirm}
          disabled={!travelers.adults || travelers.adults < 1}
          className="w-full bg-[#003580] hover:bg-[#002660] text-white py-3 rounded-xl font-medium text-base flex items-center justify-center space-x-2"
        >
          <Check className="w-5 h-5" />
          <span>Confirm Travelers</span>
        </Button>
      </div>
    </div>
  );
}
