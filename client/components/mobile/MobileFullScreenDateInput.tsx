import React, { useState } from "react";
import { ChevronLeft, Calendar, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BookingCalendar } from "@/components/BookingCalendar";
import { format, addDays } from "date-fns";

interface DateRange {
  startDate: Date;
  endDate?: Date;
}

interface MobileFullScreenDateInputProps {
  title: string;
  tripType: "round-trip" | "one-way" | "multi-city";
  initialRange: DateRange;
  onSelect: (range: DateRange) => void;
  onBack: () => void;
}

export function MobileFullScreenDateInput({
  title,
  tripType,
  initialRange,
  onSelect,
  onBack
}: MobileFullScreenDateInputProps) {
  const [selectedRange, setSelectedRange] = useState<DateRange>(initialRange);

  const handleDateChange = (range: DateRange) => {
    setSelectedRange(range);
  };

  const handleConfirm = () => {
    onSelect(selectedRange);
    onBack();
  };

  const formatDateRange = () => {
    if (!selectedRange.startDate) return "Select dates";
    
    if (tripType === "one-way") {
      return format(selectedRange.startDate, "EEE, MMM d, yyyy");
    }
    
    if (selectedRange.endDate) {
      return `${format(selectedRange.startDate, "EEE, MMM d")} - ${format(selectedRange.endDate, "EEE, MMM d, yyyy")}`;
    }
    
    return `${format(selectedRange.startDate, "EEE, MMM d, yyyy")} - Select return`;
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

      {/* Date Summary */}
      <div className="bg-white px-4 py-4 border-b border-gray-200 flex-shrink-0">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 bg-[#003580] rounded-xl flex items-center justify-center shadow-md">
            <Calendar className="w-6 h-6 text-white" />
          </div>
          <div className="flex-1">
            <div className="text-sm text-gray-600 mb-1">
              {tripType === "one-way" ? "Departure date" : tripType === "round-trip" ? "Travel dates" : "Travel dates"}
            </div>
            <div className="font-semibold text-gray-900 text-base">
              {formatDateRange()}
            </div>
          </div>
        </div>
      </div>

      {/* Calendar Section */}
      <div className="flex-1 overflow-y-auto p-4">
        <BookingCalendar
          bookingType="flight"
          initialRange={selectedRange}
          onChange={handleDateChange}
          onClose={() => {}}
          showRange={tripType === "round-trip"}
          className="w-full"
        />
      </div>

      {/* Confirm Button */}
      <div className="bg-white border-t border-gray-200 p-4 shadow-lg flex-shrink-0">
        <div className="space-y-3">
          {/* Quick Date Options */}
          <div className="flex space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                const today = new Date();
                const range: DateRange = {
                  startDate: today,
                  endDate: tripType === "round-trip" ? addDays(today, 7) : undefined
                };
                setSelectedRange(range);
              }}
              className="flex-1 text-xs"
            >
              Today
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                const tomorrow = addDays(new Date(), 1);
                const range: DateRange = {
                  startDate: tomorrow,
                  endDate: tripType === "round-trip" ? addDays(tomorrow, 7) : undefined
                };
                setSelectedRange(range);
              }}
              className="flex-1 text-xs"
            >
              Tomorrow
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                const nextWeek = addDays(new Date(), 7);
                const range: DateRange = {
                  startDate: nextWeek,
                  endDate: tripType === "round-trip" ? addDays(nextWeek, 7) : undefined
                };
                setSelectedRange(range);
              }}
              className="flex-1 text-xs"
            >
              Next Week
            </Button>
          </div>

          {/* Confirm Button */}
          <Button
            onClick={handleConfirm}
            disabled={!selectedRange.startDate || (tripType === "round-trip" && !selectedRange.endDate)}
            className="w-full bg-[#003580] hover:bg-[#002660] text-white py-3 rounded-xl font-medium text-base flex items-center justify-center space-x-2"
          >
            <Check className="w-5 h-5" />
            <span>Confirm Dates</span>
          </Button>
        </div>
      </div>
    </div>
  );
}
