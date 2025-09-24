import React, { useState, useEffect, useMemo, useCallback } from "react";
import { format, addDays, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, isAfter, isBefore, addMonths, subMonths, isToday } from "date-fns";
import { cn } from "@/lib/utils";
import { ChevronLeft, ChevronRight } from "lucide-react";
import "../styles/calendar-optimized.css";

interface FastCalendarProps {
  onChange?: (range: { startDate: Date; endDate: Date }) => void;
  initialRange?: {
    startDate: Date;
    endDate: Date;
  };
  onClose?: () => void;
  className?: string;
  bookingType?: "hotel" | "flight" | "sightseeing" | "transfers";
  isLoading?: boolean;
}

export function FastCalendar({
  onChange,
  initialRange,
  onClose,
  className,
  bookingType = "hotel",
  isLoading = false
}: FastCalendarProps) {
  // Memoize tomorrow's date to prevent recalculation
  const tomorrow = useMemo(() => {
    const date = new Date();
    date.setDate(date.getDate() + 1);
    return date;
  }, []);

  // State management - optimized to prevent unnecessary re-renders
  const [currentMonth, setCurrentMonth] = useState(() => new Date());
  const [startDate, setStartDate] = useState<Date | null>(initialRange?.startDate || null);
  const [endDate, setEndDate] = useState<Date | null>(initialRange?.endDate || null);
  const [isSelectingEnd, setIsSelectingEnd] = useState(false);
  const [hoveredDate, setHoveredDate] = useState<Date | null>(null);

  // Memoize calendar calculations to prevent recalculation on every render
  const calendarData = useMemo(() => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    const nextMonth = addMonths(currentMonth, 1);
    const nextMonthStart = startOfMonth(nextMonth);
    const nextMonthEnd = endOfMonth(nextMonth);

    const days = eachDayOfInterval({ start: monthStart, end: monthEnd });
    const nextMonthDays = eachDayOfInterval({ start: nextMonthStart, end: nextMonthEnd });

    return {
      currentMonthDays: days,
      nextMonthDays: nextMonthDays,
      currentMonthName: format(currentMonth, "MMMM yyyy"),
      nextMonthName: format(nextMonth, "MMMM yyyy")
    };
  }, [currentMonth]);

  // Optimized date click handler
  const handleDateClick = useCallback((date: Date) => {
    if (isBefore(date, tomorrow)) return;

    if (!startDate || (startDate && endDate) || (startDate && isBefore(date, startDate))) {
      // Start new selection
      setStartDate(date);
      setEndDate(null);
      setIsSelectingEnd(true);
      setHoveredDate(null);
    } else if (startDate && !endDate) {
      // Complete selection
      const newEndDate = bookingType === "hotel" && isSameDay(date, startDate) 
        ? addDays(date, 1) 
        : date;
      
      setEndDate(newEndDate);
      setIsSelectingEnd(false);
      setHoveredDate(null);
      
      // Debounce onChange to prevent excessive calls
      setTimeout(() => {
        if (onChange) {
          onChange({
            startDate,
            endDate: newEndDate,
          });
        }
      }, 50);
    }
  }, [startDate, endDate, isSelectingEnd, onChange, bookingType, tomorrow]);

  // Optimized date status checkers with useMemo
  const getDateStatus = useCallback((date: Date) => {
    const isDisabled = isBefore(date, tomorrow);
    const isStartSelected = startDate ? isSameDay(date, startDate) : false;
    const isEndSelected = endDate ? isSameDay(date, endDate) : false;
    
    // Check if date is in range
    let isInRange = false;
    if (startDate) {
      const rangeEnd = endDate || (isSelectingEnd ? hoveredDate : null);
      if (rangeEnd) {
        isInRange = (isAfter(date, startDate) || isSameDay(date, startDate)) && 
                   (isBefore(date, rangeEnd) || isSameDay(date, rangeEnd));
      } else {
        isInRange = isSameDay(date, startDate);
      }
    }

    return {
      isDisabled,
      isSelected: isStartSelected || isEndSelected,
      isInRange: isInRange && !isStartSelected && !isEndSelected,
      isToday: isToday(date)
    };
  }, [startDate, endDate, hoveredDate, isSelectingEnd, tomorrow]);

  // Optimized mouse enter handler
  const handleMouseEnter = useCallback((date: Date) => {
    if (isSelectingEnd && startDate && !endDate && !isBefore(date, tomorrow)) {
      setHoveredDate(date);
    }
  }, [isSelectingEnd, startDate, endDate, tomorrow]);

  // Navigation handlers
  const handlePrevMonth = useCallback(() => {
    setCurrentMonth(prev => subMonths(prev, 1));
  }, []);

  const handleNextMonth = useCallback(() => {
    setCurrentMonth(prev => addMonths(prev, 1));
  }, []);

  // Month renderer with optimized performance
  const renderMonth = useCallback((monthDate: Date, daysArray: Date[], isNextMonth = false) => (
    <div className="fast-calendar-month" key={isNextMonth ? 'next' : 'current'}>
      <h3 className="text-lg font-semibold text-gray-900 mb-4 text-center">
        {format(monthDate, "MMMM yyyy")}
      </h3>

      <div className="fast-calendar-weekdays">
        {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((day) => (
          <div key={day} className="fast-calendar-weekday">
            {day}
          </div>
        ))}
      </div>

      <div className="fast-calendar-days">
        {daysArray.map((date, index) => {
          const { isDisabled, isSelected, isInRange, isToday: isTodayDate } = getDateStatus(date);

          return (
            <button
              key={`${monthDate.getTime()}-${index}`}
              onClick={() => handleDateClick(date)}
              onMouseEnter={() => handleMouseEnter(date)}
              disabled={isDisabled || isLoading}
              className={cn(
                "fast-calendar-day",
                {
                  "selected": isSelected,
                  "in-range": isInRange,
                  "today": isTodayDate,
                }
              )}
            >
              {format(date, "d")}
            </button>
          );
        })}
      </div>
    </div>
  ), [getDateStatus, handleDateClick, handleMouseEnter, isLoading]);

  // Calculate total nights
  const totalNights = useMemo(() => {
    if (!startDate || !endDate) return 0;
    const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }, [startDate, endDate]);

  // Apply handler
  const handleApply = useCallback(() => {
    if (startDate && endDate && onChange) {
      onChange({ startDate, endDate });
    }
    onClose?.();
  }, [startDate, endDate, onChange, onClose]);

  // Clear handler
  const handleClear = useCallback(() => {
    setStartDate(null);
    setEndDate(null);
    setIsSelectingEnd(false);
    setHoveredDate(null);
  }, []);

  // Loading state
  if (isLoading) {
    return (
      <div className={cn("fast-calendar", className)}>
        <div className="fast-calendar-header">
          <div className="animate-pulse bg-gray-200 h-6 w-32 rounded"></div>
          <div className="fast-calendar-nav">
            <div className="animate-pulse bg-gray-200 h-9 w-9 rounded"></div>
            <div className="animate-pulse bg-gray-200 h-9 w-9 rounded"></div>
          </div>
        </div>
        <div className="p-8 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("fast-calendar", className)}>
      {/* Header */}
      <div className="fast-calendar-header">
        <h2 className="text-xl font-bold text-gray-900">Select dates</h2>
        <div className="fast-calendar-nav">
          <button
            onClick={handlePrevMonth}
            className="fast-calendar-nav-button"
            type="button"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={handleNextMonth}
            className="fast-calendar-nav-button"
            type="button"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="fast-calendar-months">
        {renderMonth(currentMonth, calendarData.currentMonthDays, false)}
        {renderMonth(addMonths(currentMonth, 1), calendarData.nextMonthDays, true)}
      </div>

      {/* Summary */}
      {startDate && endDate && (
        <div className="fast-calendar-summary">
          <div className="text-sm font-semibold text-blue-900">
            {format(startDate, "MMM d")} - {format(endDate, "MMM d")}
          </div>
          {totalNights > 0 && (
            <div className="text-xs text-blue-700 mt-1">
              {totalNights} night{totalNights > 1 ? 's' : ''}
            </div>
          )}
        </div>
      )}

      {/* Footer */}
      <div className="fast-calendar-footer">
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
          Apply Dates
        </button>
      </div>
    </div>
  );
}

export default FastCalendar;
