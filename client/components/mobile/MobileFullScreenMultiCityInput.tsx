import React, { useState } from "react";
import { ChevronLeft, Plus, Minus, Check, Plane, MapPin, Calendar, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MobileFullScreenDateInput } from "./MobileFullScreenDateInput";
import { MobileFullScreenCityInput } from "./MobileFullScreenCityInput";
import { format, addDays } from "date-fns";

interface FlightLeg {
  id: string;
  from: string;
  fromCode: string;
  to: string;
  toCode: string;
  date: Date;
}

interface MobileFullScreenMultiCityInputProps {
  title: string;
  initialLegs: FlightLeg[];
  onSelect: (legs: FlightLeg[]) => void;
  onBack: () => void;
  cities: Record<string, any>;
}

export function MobileFullScreenMultiCityInput({
  title,
  initialLegs,
  onSelect,
  onBack,
  cities
}: MobileFullScreenMultiCityInputProps) {
  const [legs, setLegs] = useState<FlightLeg[]>(initialLegs.length > 0 ? initialLegs : [
    {
      id: "leg1",
      from: "Mumbai",
      fromCode: "BOM",
      to: "Dubai", 
      toCode: "DXB",
      date: addDays(new Date(), 1)
    },
    {
      id: "leg2",
      from: "Dubai",
      fromCode: "DXB", 
      to: "London",
      toCode: "LHR",
      date: addDays(new Date(), 8)
    }
  ]);

  const [editingLeg, setEditingLeg] = useState<string | null>(null);
  const [editingField, setEditingField] = useState<"from" | "to" | "date" | null>(null);
  const [showDateInput, setShowDateInput] = useState(false);
  const [showCityInput, setShowCityInput] = useState(false);

  const addLeg = () => {
    if (legs.length >= 6) return; // Maximum 6 legs

    const lastLeg = legs[legs.length - 1];
    const newLeg: FlightLeg = {
      id: `leg${legs.length + 1}`,
      from: lastLeg.to, // Start from previous destination
      fromCode: lastLeg.toCode,
      to: "Paris",
      toCode: "CDG",
      date: addDays(lastLeg.date, 3)
    };

    setLegs([...legs, newLeg]);
  };

  const removeLeg = (legId: string) => {
    if (legs.length <= 2) return; // Minimum 2 legs
    setLegs(legs.filter(leg => leg.id !== legId));
  };

  const updateLeg = (legId: string, field: keyof FlightLeg, value: any) => {
    setLegs(legs.map(leg => 
      leg.id === legId ? { ...leg, [field]: value } : leg
    ));
  };

  const handleCitySelect = (city: string, code: string) => {
    if (editingLeg && editingField) {
      if (editingField === "from") {
        updateLeg(editingLeg, "from", city);
        updateLeg(editingLeg, "fromCode", code);
      } else {
        updateLeg(editingLeg, "to", city);
        updateLeg(editingLeg, "toCode", code);
      }
    }
    setEditingLeg(null);
    setEditingField(null);
    setShowCityInput(false);
  };

  const handleDateSelect = (range: { startDate: Date; endDate?: Date }) => {
    if (editingLeg) {
      updateLeg(editingLeg, "date", range.startDate);
    }
    setEditingLeg(null);
    setEditingField(null);
    setShowDateInput(false);
  };

  const handleConfirm = () => {
    onSelect(legs);
    onBack();
  };

  const formatLegSummary = () => {
    const cities = legs.map(leg => leg.fromCode).concat(legs[legs.length - 1].toCode);
    return cities.join(" → ");
  };



  return (
    <div className="fixed inset-0 bg-white z-50 overflow-hidden flex flex-col">
      {/* Header */}
      <div className="bg-[#003580] text-white px-4 py-3 shadow-lg flex-shrink-0">
        <div className="flex items-center justify-between">
          <button onClick={onBack} className="p-2 -ml-2 rounded-full hover:bg-white/10">
            <ChevronLeft className="w-6 h-6" />
          </button>
          <h1 className="text-lg font-semibold">{title}</h1>
          <div className="w-10"></div>
        </div>
      </div>

      {/* Summary */}
      <div className="bg-white px-4 py-4 border-b border-gray-200 flex-shrink-0">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 bg-orange-500 rounded-xl flex items-center justify-center shadow-md">
            <Plane className="w-6 h-6 text-white" />
          </div>
          <div className="flex-1">
            <div className="text-sm text-gray-600 mb-1">Multi-city itinerary ({legs.length} flights)</div>
            <div className="font-semibold text-gray-900 text-base">
              {formatLegSummary()}
            </div>
            <div className="text-xs text-gray-500 mt-1">
              Tap cities/dates to edit • Use + to add more flights
            </div>
          </div>
        </div>
      </div>

      {/* Flight Legs */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="space-y-4">
          {legs.map((leg, index) => (
            <div key={leg.id} className="bg-white rounded-xl border border-gray-200 p-4">
              {/* Leg Header */}
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-900">Flight {index + 1}</h3>
                {legs.length > 2 && (
                  <button
                    onClick={() => removeLeg(leg.id)}
                    className="p-1 hover:bg-red-50 rounded-full transition-colors"
                  >
                    <X className="w-5 h-5 text-red-500" />
                  </button>
                )}
              </div>

              {/* From */}
              <button
                onClick={() => {
                  setEditingLeg(leg.id);
                  setEditingField("from");
                  setShowCityInput(true);
                }}
                className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg text-left mb-3 hover:border-[#003580] hover:bg-blue-50"
              >
                <div className="flex items-center space-x-3">
                  <Plane className="w-5 h-5 text-gray-500" />
                  <div>
                    <div className="text-xs text-gray-500">From</div>
                    <div className="font-medium text-gray-900">{leg.from} ({leg.fromCode})</div>
                  </div>
                </div>
              </button>

              {/* To */}
              <button
                onClick={() => {
                  setEditingLeg(leg.id);
                  setEditingField("to");
                  setShowCityInput(true);
                }}
                className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg text-left mb-3 hover:border-[#003580] hover:bg-blue-50"
              >
                <div className="flex items-center space-x-3">
                  <MapPin className="w-5 h-5 text-gray-500" />
                  <div>
                    <div className="text-xs text-gray-500">To</div>
                    <div className="font-medium text-gray-900">{leg.to} ({leg.toCode})</div>
                  </div>
                </div>
              </button>

              {/* Date */}
              <button
                onClick={() => {
                  setEditingLeg(leg.id);
                  setEditingField("date");
                  setShowDateInput(true);
                }}
                className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg text-left hover:border-[#003580] hover:bg-blue-50"
              >
                <div className="flex items-center space-x-3">
                  <Calendar className="w-5 h-5 text-gray-500" />
                  <div>
                    <div className="text-xs text-gray-500">Departure</div>
                    <div className="font-medium text-gray-900">{format(leg.date, "EEE, MMM d, yyyy")}</div>
                  </div>
                </div>
              </button>
            </div>
          ))}

          {/* Add Flight Button */}
          {legs.length < 6 && (
            <button
              onClick={addLeg}
              className="w-full p-5 border-2 border-dashed border-[#003580] rounded-xl text-center hover:border-[#002660] hover:bg-blue-50 transition-colors bg-blue-50/50"
            >
              <div className="flex items-center justify-center space-x-3">
                <div className="w-8 h-8 bg-[#003580] rounded-full flex items-center justify-center">
                  <Plus className="w-5 h-5 text-white" />
                </div>
                <div className="text-left">
                  <div className="text-[#003580] font-semibold">Add another flight</div>
                  <div className="text-xs text-gray-600">Create multi-city itinerary</div>
                </div>
              </div>
            </button>
          )}

          {/* Select Button - Similar to Booking.com */}
          <Button
            onClick={handleConfirm}
            className="w-full bg-[#003580] hover:bg-[#002660] text-white py-4 rounded-xl font-semibold text-base flex items-center justify-center space-x-2 shadow-lg"
          >
            <Check className="w-5 h-5" />
            <span>Select ({legs.length} flights)</span>
          </Button>

          {/* Help Text */}
          <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
            <div className="text-sm text-blue-800">
              <strong>💡 How it works:</strong> Add up to 6 flight segments to create your multi-city journey. Each segment can have different dates and destinations.
            </div>
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
          <span>Confirm Multi-City</span>
        </Button>
      </div>

      {/* Unified City Input */}
      {showCityInput && editingLeg && editingField && (
        <MobileFullScreenCityInput
          title={`Select ${editingField === "from" ? "departure" : "destination"}`}
          placeholder="Search cities, airports..."
          selectedValue={editingField === "from"
            ? `${legs.find(l => l.id === editingLeg)?.from} (${legs.find(l => l.id === editingLeg)?.fromCode})`
            : `${legs.find(l => l.id === editingLeg)?.to} (${legs.find(l => l.id === editingLeg)?.toCode})`
          }
          onSelect={handleCitySelect}
          onBack={() => {
            setShowCityInput(false);
            setEditingLeg(null);
            setEditingField(null);
          }}
          cities={cities}
        />
      )}

      {/* Unified Date Input */}
      {showDateInput && editingLeg && (
        <MobileFullScreenDateInput
          title="Select date"
          tripType="one-way"
          initialRange={{
            startDate: legs.find(l => l.id === editingLeg)?.date || new Date()
          }}
          onSelect={handleDateSelect}
          onBack={() => {
            setShowDateInput(false);
            setEditingLeg(null);
            setEditingField(null);
          }}
        />
      )}
    </div>
  );
}
