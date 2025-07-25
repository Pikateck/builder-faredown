import React, { useState } from "react";
import {
  X,
  Search,
  Plane,
  CalendarIcon,
  Users,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { BookingCalendar } from "@/components/BookingCalendar";
import { addDays } from "date-fns";

interface CityData {
  code: string;
  name: string;
  airport: string;
  fullName: string;
}

interface MobileCityDropdownProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  cities: Record<string, CityData>;
  selectedCity: string;
  onSelectCity: (city: string) => void;
}

export function MobileCityDropdown({
  isOpen,
  onClose,
  title,
  cities,
  selectedCity,
  onSelectCity,
}: MobileCityDropdownProps) {
  if (!isOpen) return null;

  return (
    <div className="sm:hidden fixed inset-0 bg-white z-[60] overflow-y-auto">
      <div className="sticky top-0 bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
        <button
          onClick={onClose}
          className="p-2 text-gray-500 hover:text-gray-700 touch-manipulation"
        >
          <X className="w-6 h-6" />
        </button>
      </div>
      <div className="p-4">
        <div className="mb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search airports, cities or countries"
              className="w-full pl-10 pr-4 py-4 text-base border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
              autoFocus
            />
          </div>
        </div>
        <div className="space-y-2">
          {Object.entries(cities).map(([city, data]) => (
            <button
              key={city}
              onClick={() => {
                onSelectCity(city);
                onClose();
              }}
              className={cn(
                "w-full text-left px-4 py-4 hover:bg-gray-50 rounded-lg border touch-manipulation",
                selectedCity === city
                  ? "border-blue-500 bg-blue-50"
                  : "border-gray-100",
              )}
            >
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                  <Plane className="w-5 h-5 text-blue-600" />
                </div>
                <div className="flex-1">
                  <div className="text-base font-medium text-gray-900">
                    {city} ({data.code})
                  </div>
                  <div className="text-sm text-gray-500">{data.airport}</div>
                  <div className="text-xs text-gray-400">{data.fullName}</div>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

interface MobileDatePickerProps {
  isOpen: boolean;
  onClose: () => void;
  tripType: string;
  setTripType: (type: string) => void;
  selectedDepartureDate: Date | null;
  selectedReturnDate: Date | null;
  setSelectedDepartureDate: (date: Date | null) => void;
  setSelectedReturnDate: (date: Date | null) => void;
  selectingDeparture: boolean;
  setSelectingDeparture: (selecting: boolean) => void;
}

export function MobileDatePicker({
  isOpen,
  onClose,
  tripType,
  setTripType,
  selectedDepartureDate,
  selectedReturnDate,
  setSelectedDepartureDate,
  setSelectedReturnDate,
  selectingDeparture,
  setSelectingDeparture,
}: MobileDatePickerProps) {
  if (!isOpen) return null;

  // Helper functions
  const formatDate = (date: Date | null) => {
    if (!date) return "";
    return date
      .toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
      .replace(/ /g, "-");
  };

  const handleCalendarChange = (range: { startDate: Date; endDate: Date }) => {
    console.log("Mobile calendar range selected:", range);
    setSelectedDepartureDate(range.startDate);
    if (tripType === "round-trip") {
      setSelectedReturnDate(range.endDate);
    }
  };



  return (
    <div className="sm:hidden fixed inset-0 bg-white z-[60] overflow-y-auto">
      <div className="sticky top-0 bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900">Select dates</h2>
        <button
          onClick={onClose}
          className="p-2 text-gray-500 hover:text-gray-700 touch-manipulation"
        >
          <X className="w-6 h-6" />
        </button>
      </div>
      <div className="p-4">
        {/* Trip Type Selector */}
        <div className="flex space-x-4 mb-6">
          <button
            onClick={() => setTripType("round-trip")}
            className={cn(
              "flex-1 py-3 px-4 rounded-lg border-2 text-sm font-medium touch-manipulation",
              tripType === "round-trip"
                ? "border-blue-600 bg-blue-50 text-blue-700"
                : "border-gray-300 text-gray-700",
            )}
          >
            Round trip
          </button>
          <button
            onClick={() => setTripType("one-way")}
            className={cn(
              "flex-1 py-3 px-4 rounded-lg border-2 text-sm font-medium touch-manipulation",
              tripType === "one-way"
                ? "border-blue-600 bg-blue-50 text-blue-700"
                : "border-gray-300 text-gray-700",
            )}
          >
            One way
          </button>
        </div>

        {/* Current Selection Display */}
        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          <div className="text-sm text-gray-600 mb-2">Selected dates:</div>
          <div className="text-base font-medium text-gray-900">
            {tripType === "one-way"
              ? formatDate(selectedDepartureDate) || "Select departure date"
              : selectedDepartureDate
                ? `${formatDate(selectedDepartureDate)} ${selectedReturnDate ? `- ${formatDate(selectedReturnDate)}` : "- Select return"}`
                : "Select departure and return dates"}
          </div>
          {tripType === "round-trip" && (
            <div className="text-xs text-gray-600 mt-1">
              {selectingDeparture
                ? "Select departure date"
                : "Select return date"}
            </div>
          )}
        </div>

        {/* Professional Hotel-Style Calendar */}
        <div className="mb-6">
          <BookingCalendar
            initialRange={{
              startDate: selectedDepartureDate || new Date(),
              endDate: selectedReturnDate || addDays(selectedDepartureDate || new Date(), tripType === "one-way" ? 1 : 7)
            }}
            onChange={handleCalendarChange}
            onClose={() => {}} // Don't auto-close on selection for mobile
            className="w-full"
          />
        </div>

        <Button
          onClick={onClose}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white py-4 rounded-lg font-semibold text-base touch-manipulation"
        >
          Done
        </Button>
      </div>
    </div>
  );
}

interface MobileTravelersProps {
  isOpen: boolean;
  onClose: () => void;
  travelers: { adults: number; children: number };
  setTravelers: React.Dispatch<
    React.SetStateAction<{ adults: number; children: number }>
  >;
}

export function MobileTravelers({
  isOpen,
  onClose,
  travelers,
  setTravelers,
}: MobileTravelersProps) {
  if (!isOpen) return null;

  return (
    <div className="sm:hidden fixed inset-0 bg-white z-[60] overflow-y-auto">
      <div className="sticky top-0 bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900">Travelers</h2>
        <button
          onClick={onClose}
          className="p-2 text-gray-500 hover:text-gray-700 touch-manipulation"
        >
          <X className="w-6 h-6" />
        </button>
      </div>
      <div className="p-4 space-y-8">
        <div className="flex items-center justify-between py-4 border-b border-gray-100">
          <div>
            <div className="text-lg font-medium text-gray-900">Adults</div>
            <div className="text-sm text-gray-500">Age 18+</div>
          </div>
          <div className="flex items-center space-x-4">
            <button
              onClick={() =>
                setTravelers((prev) => ({
                  ...prev,
                  adults: Math.max(1, prev.adults - 1),
                }))
              }
              disabled={travelers.adults <= 1}
              className="w-12 h-12 rounded-full border-2 border-blue-600 flex items-center justify-center hover:bg-blue-50 disabled:border-gray-300 disabled:text-gray-400 disabled:cursor-not-allowed text-blue-600 font-bold text-xl touch-manipulation"
            >
              −
            </button>
            <span className="w-8 text-center font-medium text-gray-900 text-lg">
              {travelers.adults}
            </span>
            <button
              onClick={() =>
                setTravelers((prev) => ({ ...prev, adults: prev.adults + 1 }))
              }
              className="w-12 h-12 rounded-full border-2 border-blue-600 flex items-center justify-center hover:bg-blue-50 text-blue-600 font-bold text-xl touch-manipulation"
            >
              +
            </button>
          </div>
        </div>
        <div className="flex items-center justify-between py-4 border-b border-gray-100">
          <div>
            <div className="text-lg font-medium text-gray-900">Children</div>
            <div className="text-sm text-gray-500">Age 0-17</div>
          </div>
          <div className="flex items-center space-x-4">
            <button
              onClick={() =>
                setTravelers((prev) => ({
                  ...prev,
                  children: Math.max(0, prev.children - 1),
                }))
              }
              disabled={travelers.children <= 0}
              className="w-12 h-12 rounded-full border-2 border-blue-600 flex items-center justify-center hover:bg-blue-50 disabled:border-gray-300 disabled:text-gray-400 disabled:cursor-not-allowed text-blue-600 font-bold text-xl touch-manipulation"
            >
              −
            </button>
            <span className="w-8 text-center font-medium text-gray-900 text-lg">
              {travelers.children}
            </span>
            <button
              onClick={() =>
                setTravelers((prev) => ({
                  ...prev,
                  children: prev.children + 1,
                }))
              }
              className="w-12 h-12 rounded-full border-2 border-blue-600 flex items-center justify-center hover:bg-blue-50 text-blue-600 font-bold text-xl touch-manipulation"
            >
              +
            </button>
          </div>
        </div>
        <div className="pt-4">
          <Button
            onClick={onClose}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-4 rounded-lg font-semibold text-base touch-manipulation"
          >
            Done
          </Button>
        </div>
      </div>
    </div>
  );
}
