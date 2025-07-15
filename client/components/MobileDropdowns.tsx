import React from "react";
import { X, Search, Plane, CalendarIcon, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

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
  selectedDepartureDate: string;
  selectedReturnDate: string;
  setSelectedDepartureDate: (date: string) => void;
  setSelectedReturnDate: (date: string) => void;
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
              ? selectedDepartureDate
              : `${selectedDepartureDate} - ${selectedReturnDate}`}
          </div>
        </div>

        {/* Month Header */}
        <div className="text-center mb-4">
          <h3 className="text-lg font-semibold text-gray-900">December 2024</h3>
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-7 gap-1 mb-4">
          <div className="text-center py-3 text-sm font-medium text-gray-500">
            Su
          </div>
          <div className="text-center py-3 text-sm font-medium text-gray-500">
            Mo
          </div>
          <div className="text-center py-3 text-sm font-medium text-gray-500">
            Tu
          </div>
          <div className="text-center py-3 text-sm font-medium text-gray-500">
            We
          </div>
          <div className="text-center py-3 text-sm font-medium text-gray-500">
            Th
          </div>
          <div className="text-center py-3 text-sm font-medium text-gray-500">
            Fr
          </div>
          <div className="text-center py-3 text-sm font-medium text-gray-500">
            Sa
          </div>
        </div>
        <div className="grid grid-cols-7 gap-1 mb-6">
          {Array.from({ length: 42 }, (_, i) => {
            const day = i - 6;
            const isValidDay = day >= 1 && day <= 31;
            const isDeparture = isValidDay && day === 9;
            const isReturn = isValidDay && day === 16;
            const isInRange = isValidDay && day > 9 && day < 16;

            if (!isValidDay) {
              return <div key={i} className="h-12"></div>;
            }

            return (
              <button
                key={i}
                onClick={() => {
                  if (tripType === "one-way") {
                    setSelectedDepartureDate(
                      `${day.toString().padStart(2, "0")}-Dec-2024`,
                    );
                  } else {
                    if (selectingDeparture) {
                      setSelectedDepartureDate(
                        `${day.toString().padStart(2, "0")}-Dec-2024`,
                      );
                      setSelectingDeparture(false);
                    } else {
                      setSelectedReturnDate(
                        `${day.toString().padStart(2, "0")}-Dec-2024`,
                      );
                      setSelectingDeparture(true);
                    }
                  }
                }}
                className={cn(
                  "h-12 w-full text-base font-medium flex items-center justify-center rounded-lg touch-manipulation",
                  tripType === "one-way"
                    ? isDeparture
                      ? "bg-blue-600 text-white"
                      : "hover:bg-gray-100 text-gray-900"
                    : (isDeparture && "bg-blue-600 text-white") ||
                        (isReturn && "bg-blue-600 text-white") ||
                        (isInRange && "bg-blue-100 text-blue-900") ||
                        "hover:bg-gray-100 text-gray-900",
                )}
              >
                {day}
              </button>
            );
          })}
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
