import React, { useState, useEffect } from "react";
import { ChevronLeft, Calendar, Check, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  format,
  addDays,
  addMonths,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  isToday,
  isBefore,
} from "date-fns";

interface DateRange {
  startDate: Date;
  endDate?: Date;
}

interface MobileFullScreenDateInputProps {
  title: string;
  tripType: "round-trip" | "one-way" | "multi-city" | "return";
  module?: "flights" | "hotels" | "sightseeing" | "transfers";
  initialRange: DateRange;
  onSelect: (range: DateRange) => void;
  onBack: () => void;
}

export function MobileFullScreenDateInput({
  title,
  tripType,
  module = "flights",
  initialRange,
  onSelect,
  onBack,
}: MobileFullScreenDateInputProps) {
  const [selectedRange, setSelectedRange] = useState<DateRange>(initialRange);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [isSelectingEnd, setIsSelectingEnd] = useState(false);

  // Sync selectedRange with initialRange when it changes
  useEffect(() => {
    console.log('Syncing initial range:', initialRange);
    setSelectedRange(initialRange);

    // Set isSelectingEnd based on trip type and current selection
    if (tripType === "round-trip" || tripType === "return") {
      setIsSelectingEnd(!initialRange.endDate && !!initialRange.startDate);
    } else {
      setIsSelectingEnd(false);
    }
  }, [initialRange, tripType]);

  // Debug logging
  console.log('MobileFullScreenDateInput rendered:', {
    title,
    tripType,
    initialRange,
    selectedRange,
    isSelectingEnd,
    hasButton: true
  });

  const handleDateClick = (date: Date) => {
    console.log('Date clicked:', {
      date: format(date, 'MMM d, yyyy'),
      currentRange: selectedRange,
      tripType,
      module,
      isSelectingEnd
    });

    // Hotels always need check-in AND check-out dates (like round-trip)
    if (module === "hotels" || tripType === "round-trip" || tripType === "return") {
      // For round-trip logic
      if (!selectedRange.startDate) {
        // No dates selected yet - set start date
        setSelectedRange({ startDate: date, endDate: undefined });
        setIsSelectingEnd(true);
      } else if (!selectedRange.endDate || isSelectingEnd) {
        // Start date exists, now setting end date
        if (isBefore(date, selectedRange.startDate)) {
          // Clicked date is before start date - make it new start date
          setSelectedRange({ startDate: date, endDate: undefined });
          setIsSelectingEnd(true);
        } else {
          // Clicked date is after start date - make it end date
          setSelectedRange({
            startDate: selectedRange.startDate,
            endDate: date,
          });
          setIsSelectingEnd(false);
        }
      } else {
        // Both dates already selected - start fresh with new start date
        setSelectedRange({ startDate: date, endDate: undefined });
        setIsSelectingEnd(true);
      }
    }
  };

  const handleConfirm = () => {
    // Validate selection before proceeding
    const hasStartDate = !!selectedRange.startDate;
    const needsEndDate = tripType === "round-trip" || tripType === "return";
    const hasEndDate = !!selectedRange.endDate;
    const isValid = hasStartDate && (!needsEndDate || hasEndDate);

    console.log('handleConfirm called:', {
      selectedRange,
      tripType,
      validation: { hasStartDate, needsEndDate, hasEndDate, isValid }
    });

    if (!isValid) {
      console.warn('Invalid date selection - cannot confirm');
      return;
    }

    console.log('datesChanged', {
      start: selectedRange.startDate?.toISOString(),
      end: selectedRange.endDate?.toISOString(),
      tripType,
      isValid
    });

    console.log('Mobile date picker - Select Dates button tapped:', {
      selectedRange,
      tripType,
      currentURL: window.location.href
    });

    // Call the parent callback
    try {
      onSelect(selectedRange);
      console.log('onSelect callback completed successfully');
    } catch (error) {
      console.error('Error in onSelect callback:', error);
    }

    // Close the picker
    onBack();
  };

  const formatDateRange = () => {
    if (!selectedRange.startDate) return "Select dates";

    if (tripType === "one-way" || tripType === "multi-city") {
      return format(selectedRange.startDate, "EEE, MMM d, yyyy");
    }

    if (selectedRange.endDate) {
      return `${format(selectedRange.startDate, "EEE, MMM d")} - ${format(selectedRange.endDate, "EEE, MMM d, yyyy")}`;
    }

    return `${format(selectedRange.startDate, "EEE, MMM d, yyyy")} - Select return`;
  };

  const renderMonth = (monthDate: Date) => {
    const monthStart = startOfMonth(monthDate);
    const monthEnd = endOfMonth(monthDate);
    const days = eachDayOfInterval({ start: monthStart, end: monthEnd });

    // Get the first day of the week for proper grid layout
    const firstDayOfWeek = monthStart.getDay();
    const paddingDays = Array(firstDayOfWeek).fill(null);

    return (
      <div className="mb-8">
        {/* Month Header */}
        <div className="flex items-center justify-between mb-4 px-4">
          <h2 className="text-lg font-semibold text-gray-900">
            {format(monthDate, "MMMM yyyy")}
          </h2>
          {isSameMonth(monthDate, currentMonth) && (
            <div className="flex space-x-2">
              <button
                onClick={() => setCurrentMonth(addMonths(currentMonth, -1))}
                className="p-2 hover:bg-gray-100 rounded-full"
              >
                <ChevronLeft className="w-5 h-5 text-gray-600" />
              </button>
              <button
                onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
                className="p-2 hover:bg-gray-100 rounded-full"
              >
                <ChevronRight className="w-5 h-5 text-gray-600" />
              </button>
            </div>
          )}
        </div>

        {/* Week Headers */}
        <div className="grid grid-cols-7 gap-1 mb-2 px-4">
          {["S", "M", "T", "W", "T", "F", "S"].map((day, index) => (
            <div
              key={index}
              className="text-center text-sm font-medium text-gray-500 py-2"
            >
              {day}
            </div>
          ))}
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-7 gap-1 px-4">
          {/* Padding days for proper alignment */}
          {paddingDays.map((_, index) => (
            <div key={`padding-${index}`} className="h-12"></div>
          ))}

          {/* Actual days */}
          {days.map((date) => {
            const isSelected =
              selectedRange.startDate &&
              isSameDay(date, selectedRange.startDate);
            const isEndSelected =
              selectedRange.endDate && isSameDay(date, selectedRange.endDate);
            const isInRange =
              selectedRange.startDate &&
              selectedRange.endDate &&
              date > selectedRange.startDate &&
              date < selectedRange.endDate;
            const isPast = isBefore(date, new Date()) && !isToday(date);

            return (
              <button
                key={date.toISOString()}
                onClick={() => !isPast && handleDateClick(date)}
                disabled={isPast}
                className={`h-12 w-full rounded-lg text-sm font-medium transition-all ${
                  isPast
                    ? "text-gray-300 cursor-not-allowed"
                    : isSelected || isEndSelected
                      ? "bg-[#003580] text-white shadow-md"
                      : isInRange
                        ? "bg-blue-100 text-[#003580]"
                        : isToday(date)
                          ? "bg-blue-50 text-[#003580] border border-[#003580]"
                          : "text-gray-900 hover:bg-gray-100"
                }`}
              >
                {format(date, "d")}
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 bg-white z-[9998] overflow-hidden flex flex-col">
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
              {module === "hotels"
                ? "Check-in & Check-out"
                : module === "sightseeing"
                  ? "Activity date"
                  : module === "transfers"
                    ? "Transfer date"
                    : tripType === "one-way" || tripType === "multi-city"
                      ? "Departure date"
                      : "Travel dates"}
            </div>
            <div className="font-semibold text-gray-900 text-base">
              {formatDateRange()}
            </div>
          </div>
        </div>
      </div>

      {/* Calendar Section - Two Months Stacked Vertically */}
      <div className="flex-1 overflow-y-auto pb-32">
        {/* Current Month */}
        {renderMonth(currentMonth)}

        {/* Next Month */}
        {renderMonth(addMonths(currentMonth, 1))}

        {/* Additional months for scrolling */}
        {renderMonth(addMonths(currentMonth, 2))}
        {renderMonth(addMonths(currentMonth, 3))}
      </div>

      {/* Select Dates Button - Fixed at Bottom (Faredown Brand Style) */}
      <div
        className="fixed bottom-0 left-0 right-0 bg-white border-t-2 border-gray-300 p-6 shadow-2xl z-[9999] max-w-full"
        style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          zIndex: 9999,
          backgroundColor: 'white',
          boxShadow: '0 -10px 25px -5px rgba(0, 0, 0, 0.1), 0 -4px 10px -3px rgba(0, 0, 0, 0.05)'
        }}
      >
        {/* Debug info */}
        <div className="text-xs text-gray-500 mb-2 text-center">
          Selected: {selectedRange.startDate ? format(selectedRange.startDate, 'MMM d') : 'None'}
          {selectedRange.endDate && ` - ${format(selectedRange.endDate, 'MMM d')}`}
          <br />
          Trip: {tripType} | Selecting: {isSelectingEnd ? 'End' : 'Start'}
        </div>

        {/* Select Dates Button (Always Visible - Faredown Brand Yellow) */}
        <button
          onClick={handleConfirm}
          disabled={
            !selectedRange.startDate ||
            ((tripType === "round-trip" || tripType === "return") &&
              !selectedRange.endDate)
          }
          style={{
            width: '100%',
            padding: '16px 24px',
            borderRadius: '12px',
            fontWeight: 'bold',
            fontSize: '18px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            border: 'none',
            cursor: (() => {
              const hasStartDate = !!selectedRange.startDate;
              const needsEndDate = tripType === "round-trip" || tripType === "return";
              const hasEndDate = !!selectedRange.endDate;
              const isValid = hasStartDate && (!needsEndDate || hasEndDate);
              return isValid ? 'pointer' : 'not-allowed';
            })(),
            backgroundColor: (() => {
              const hasStartDate = !!selectedRange.startDate;
              const needsEndDate = tripType === "round-trip" || tripType === "return";
              const hasEndDate = !!selectedRange.endDate;
              const isValid = hasStartDate && (!needsEndDate || hasEndDate);
              return isValid ? '#febb02' : '#d1d5db';
            })(),
            color: (() => {
              const hasStartDate = !!selectedRange.startDate;
              const needsEndDate = tripType === "round-trip" || tripType === "return";
              const hasEndDate = !!selectedRange.endDate;
              const isValid = hasStartDate && (!needsEndDate || hasEndDate);
              return isValid ? 'black' : '#6b7280';
            })(),
            transition: 'all 0.2s ease',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
          }}
          onMouseDown={(e) => {
            const hasStartDate = !!selectedRange.startDate;
            const needsEndDate = tripType === "round-trip" || tripType === "return";
            const hasEndDate = !!selectedRange.endDate;
            const isValid = hasStartDate && (!needsEndDate || hasEndDate);
            if (isValid) {
              e.currentTarget.style.backgroundColor = '#d19900';
            }
          }}
          onMouseUp={(e) => {
            const hasStartDate = !!selectedRange.startDate;
            const needsEndDate = tripType === "round-trip" || tripType === "return";
            const hasEndDate = !!selectedRange.endDate;
            const isValid = hasStartDate && (!needsEndDate || hasEndDate);
            if (isValid) {
              e.currentTarget.style.backgroundColor = '#febb02';
            }
          }}
        >
          <Check className="w-5 h-5" />
          <span>Select Dates</span>
        </button>
      </div>
    </div>
  );
}
