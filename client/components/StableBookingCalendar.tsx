import React, { useState, useEffect, useCallback } from "react";
import { format, addDays, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, isAfter, isBefore, addMonths, subMonths } from "date-fns";
import { cn } from "@/lib/utils";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface StableBookingCalendarProps {
  onChange?: (range: { startDate: Date; endDate: Date }) => void;
  initialRange?: {
    startDate: Date;
    endDate: Date;
  };
  onClose?: () => void;
  className?: string;
  bookingType?: "hotel" | "flight" | "sightseeing" | "transfers";
}

export function StableBookingCalendar({
  onChange,
  initialRange,
  onClose,
  className,
  bookingType = "hotel",
}: StableBookingCalendarProps) {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [startDate, setStartDate] = useState<Date | null>(initialRange?.startDate || null);
  const [endDate, setEndDate] = useState<Date | null>(initialRange?.endDate || null);
  const [isSelectingEnd, setIsSelectingEnd] = useState(false);
  const [hoveredDate, setHoveredDate] = useState<Date | null>(null);

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const nextMonth = addMonths(currentMonth, 1);
  const nextMonthStart = startOfMonth(nextMonth);
  const nextMonthEnd = endOfMonth(nextMonth);

  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });
  const nextMonthDays = eachDayOfInterval({ start: nextMonthStart, end: nextMonthEnd });

  const handleDateClick = useCallback((date: Date) => {
    if (isBefore(date, tomorrow)) return;

    if (!startDate || (startDate && endDate) || (startDate && isBefore(date, startDate))) {
      // Start new selection
      setStartDate(date);
      setEndDate(null);
      setIsSelectingEnd(true);
    } else if (startDate && !endDate) {
      // Complete selection
      const newEndDate = bookingType === "hotel" && isSameDay(date, startDate) 
        ? addDays(date, 1) 
        : date;
      
      setEndDate(newEndDate);
      setIsSelectingEnd(false);
      
      if (onChange) {
        onChange({
          startDate,
          endDate: newEndDate,
        });
      }
    }
  }, [startDate, endDate, isSelectingEnd, onChange, bookingType, tomorrow]);

  const isDateInRange = useCallback((date: Date): boolean => {
    if (!startDate) return false;
    if (!endDate && !hoveredDate) return isSameDay(date, startDate);
    
    const rangeEnd = endDate || (isSelectingEnd ? hoveredDate : null);
    if (!rangeEnd) return isSameDay(date, startDate);
    
    return (isAfter(date, startDate) || isSameDay(date, startDate)) && 
           (isBefore(date, rangeEnd) || isSameDay(date, rangeEnd));
  }, [startDate, endDate, hoveredDate, isSelectingEnd]);

  const isDateRangeStart = useCallback((date: Date): boolean => {
    return startDate ? isSameDay(date, startDate) : false;
  }, [startDate]);

  const isDateRangeEnd = useCallback((date: Date): boolean => {
    const rangeEnd = endDate || (isSelectingEnd ? hoveredDate : null);
    return rangeEnd ? isSameDay(date, rangeEnd) : false;
  }, [endDate, hoveredDate, isSelectingEnd]);

  const handleMouseEnter = useCallback((date: Date) => {
    if (isSelectingEnd && startDate && !endDate) {
      setHoveredDate(date);
    }
  }, [isSelectingEnd, startDate, endDate]);

  const renderMonth = (monthDate: Date, daysArray: Date[]) => (
    <div className="p-4">
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={() => setCurrentMonth(subMonths(monthDate, 1))}
          className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          disabled={isSameMonth(monthDate, currentMonth) && false}
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <h3 className="text-lg font-semibold text-gray-900">
          {format(monthDate, "MMMM yyyy")}
        </h3>
        <button
          onClick={() => setCurrentMonth(addMonths(monthDate, 1))}
          className="p-2 hover:bg-gray-100 rounded-full transition-colors"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1 mb-2">
        {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((day) => (
          <div key={day} className="p-2 text-center text-sm font-medium text-gray-500">
            {day}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {daysArray.map((date, index) => {
          const isDisabled = isBefore(date, tomorrow);
          const isSelected = isDateRangeStart(date) || isDateRangeEnd(date);
          const isInRange = isDateInRange(date);
          const isStart = isDateRangeStart(date);
          const isEnd = isDateRangeEnd(date);

          return (
            <button
              key={index}
              onClick={() => handleDateClick(date)}
              onMouseEnter={() => handleMouseEnter(date)}
              disabled={isDisabled}
              className={cn(
                "h-10 w-10 rounded-lg text-sm font-medium transition-colors duration-150",
                "hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-blue-500",
                {
                  "text-gray-300 cursor-not-allowed hover:bg-transparent": isDisabled,
                  "bg-blue-600 text-white hover:bg-blue-700": isSelected,
                  "bg-blue-100 text-blue-900": isInRange && !isSelected,
                  "rounded-l-lg rounded-r-none": isStart && !isEnd,
                  "rounded-r-lg rounded-l-none": isEnd && !isStart,
                  "rounded-lg": isStart && isEnd,
                  "text-gray-900": !isDisabled && !isSelected && !isInRange,
                }
              )}
              style={{ willChange: isSelected || isInRange ? 'background-color' : 'auto' }}
            >
              {format(date, "d")}
            </button>
          );
        })}
      </div>
    </div>
  );

  const getTotalNights = () => {
    if (!startDate || !endDate) return 0;
    const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const handleApply = () => {
    if (startDate && endDate && onChange) {
      onChange({ startDate, endDate });
    }
    onClose?.();
  };

  const handleClear = () => {
    setStartDate(null);
    setEndDate(null);
    setIsSelectingEnd(false);
    setHoveredDate(null);
  };

  return (
    <div className={cn("bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden", className)}>
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-6 py-4 border-b border-gray-100">
        <h2 className="text-xl font-bold text-gray-900">Select dates</h2>
        {startDate && endDate && (
          <p className="text-sm text-gray-600 mt-1">
            {format(startDate, "MMM d")} - {format(endDate, "MMM d")} 
            {getTotalNights() > 0 && ` • ${getTotalNights()} night${getTotalNights() > 1 ? 's' : ''}`}
          </p>
        )}
      </div>

      {/* Calendar Grid */}
      <div className="flex" style={{ willChange: 'transform' }}>
        <div style={{ willChange: 'contents' }}>
          {renderMonth(currentMonth, days)}
        </div>
        <div className="border-l border-gray-200" style={{ willChange: 'contents' }}>
          {renderMonth(nextMonth, nextMonthDays)}
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between p-4 border-t border-gray-200 bg-gray-50">
        <button
          onClick={handleClear}
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
        >
          Clear
        </button>
        <button
          onClick={handleApply}
          disabled={!startDate || !endDate}
          className={cn(
            "px-8 py-3 text-sm font-semibold rounded-lg transition-all duration-200",
            startDate && endDate
              ? "bg-blue-600 text-white hover:bg-blue-700 shadow-lg hover:shadow-xl"
              : "bg-gray-300 text-gray-500 cursor-not-allowed"
          )}
        >
          Apply
        </button>
      </div>
    </div>
  );
}
