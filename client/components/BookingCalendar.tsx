import React, { useState, useEffect } from "react";
import { DateRange, RangeKeyDict } from "react-date-range";
import { format, addDays, isSameDay } from "date-fns";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { CalendarIcon, X } from "lucide-react";

import "react-date-range/dist/styles.css";
import "react-date-range/dist/theme/default.css";

interface BookingCalendarProps {
  onChange?: (range: { startDate: Date; endDate: Date }) => void;
  initialRange?: {
    startDate: Date;
    endDate: Date;
  };
  onClose?: () => void;
  className?: string;
  bookingType?: "hotel" | "flight";
}

export function BookingCalendar({
  onChange,
  initialRange,
  onClose,
  className,
  bookingType = "hotel",
}: BookingCalendarProps) {
  const [selection, setSelection] = useState(() => {
    const startDate = initialRange?.startDate || new Date();
    const endDate = initialRange?.endDate || addDays(startDate, 3);

    return [{
      startDate,
      endDate,
      key: "selection",
    }];
  });
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);

    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const handleSelect = (ranges: RangeKeyDict) => {
    const range = ranges.selection;
    if (range.startDate) {
      setSelection([{
        startDate: range.startDate,
        endDate: range.endDate || range.startDate,
        key: "selection",
      }]);

      // Call onChange even if we only have startDate
      onChange?.({
        startDate: range.startDate,
        endDate: range.endDate || range.startDate,
      });
    }
  };

  const addDaysToSelection = (days: number) => {
    const newEndDate = addDays(selection[0].startDate, days);
    const newSelection = [
      {
        ...selection[0],
        endDate: newEndDate,
      },
    ];
    setSelection(newSelection);
    onChange?.({
      startDate: selection[0].startDate,
      endDate: newEndDate,
    });
  };

  const formatSelectionText = () => {
    const { startDate, endDate } = selection[0];
    if (startDate && endDate && !isSameDay(startDate, endDate)) {
      return `${format(startDate, "EEE, MMM d")} - ${format(endDate, "EEE, MMM d")}`;
    }
    return format(startDate, "EEE, MMM d");
  };

  const getTotalNights = () => {
    const { startDate, endDate } = selection[0];
    if (startDate && endDate) {
      const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays;
    }
    return 0;
  };

  return (
    <div className={cn("booking-calendar", className)}>
      {/* Custom CSS for react-date-range styling */}
      <style>{`
                .booking-calendar .rdrCalendarWrapper {
          background: white;
          border-radius: 8px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
          border: 1px solid #e5e7eb;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        }

        .booking-calendar .rdrDateRangeWrapper {
          margin: 0;
        }

        .booking-calendar .rdrDefinedRangesWrapper {
          display: none;
        }

        .booking-calendar .rdrDateDisplayWrapper {
          display: none;
        }

                .booking-calendar .rdrMonthAndYearWrapper {
          padding: 16px 20px 8px;
          position: relative;
        }

        .booking-calendar .rdrMonthAndYearPickers {
          font-weight: 600;
          color: #1f2937;
          pointer-events: none;
        }

        .booking-calendar .rdrMonthPicker,
        .booking-calendar .rdrYearPicker {
          display: none !important;
        }

                .booking-calendar .rdrNextPrevButton {
          background: #ffffff;
          border: 1px solid #d1d5db;
          color: #374151;
          border-radius: 6px;
          width: 36px;
          height: 36px;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
        }

        .booking-calendar .rdrNextPrevButton:hover {
          background: #f8fafc;
          border-color: #9ca3af;
          color: #111827;
          box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);
        }

                .booking-calendar .rdrMonthWrapper {
          padding: 0 16px 16px;
        }

                .booking-calendar .rdrDayNumber {
          font-weight: 400;
          color: #374151;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 14px;
        }

                .booking-calendar .rdrDay:hover .rdrDayNumber span {
          background: #e6f3ff;
          color: #0066cc;
          border-radius: 3px;
        }

                .booking-calendar .rdrDayToday .rdrDayNumber span {
          background: #eff6ff;
          color: #2563eb;
          font-weight: 700;
          border: 2px solid #3b82f6;
          box-shadow: 0 0 0 1px rgba(59, 130, 246, 0.1);
        }

                .booking-calendar .rdrDayStartOfRange .rdrDayNumber span,
        .booking-calendar .rdrDayEndOfRange .rdrDayNumber span {
          background: #0066cc;
          color: white;
          font-weight: 600;
        }

                .booking-calendar .rdrDayInRange {
          background: #e6f3ff;
          color: #1f2937;
        }

        .booking-calendar .rdrDayInRange .rdrDayNumber span {
          background: transparent;
          color: #1f2937;
        }

        .booking-calendar .rdrDayDisabled {
          background-color: #f9fafb;
        }

        .booking-calendar .rdrDayDisabled .rdrDayNumber span {
          color: #d1d5db;
        }

                .booking-calendar .rdrWeekDay {
          font-weight: 600;
          color: #6b7280;
          font-size: 11px;
          text-transform: uppercase;
          padding: 8px 0;
          text-align: center;
        }

        .booking-calendar .rdrMonths {
          display: flex;
          flex-direction: row;
          gap: 20px;
        }

                .booking-calendar .rdrMonth {
          width: 280px;
          padding: 0;
        }

                .booking-calendar .rdrDateRangeWrapper {
          width: 100%;
          background: white;
        }

        @media (max-width: 768px) {
          .booking-calendar {
            height: auto;
            max-height: none;
            overflow: visible;
          }

          .booking-calendar .rdrMonths {
            flex-direction: column;
            gap: 10px;
          }

          .booking-calendar .rdrMonth {
            width: 100% !important;
            padding: 0 !important;
          }

          .booking-calendar .rdrCalendarWrapper {
            width: 100% !important;
            border-radius: 8px;
            overflow: visible;
            height: auto;
          }

          .booking-calendar .rdrMonthAndYearWrapper {
            padding: 12px 16px 8px;
          }

          .booking-calendar .rdrMonthWrapper {
            padding: 0 12px 12px;
          }

          .booking-calendar .rdrNextPrevButton {
            width: 32px;
            height: 32px;
          }

          .booking-calendar .rdrDayNumber span {
            width: 32px;
            height: 32px;
            line-height: 32px;
          }
        }
      `}</style>

      <div className="bg-white border border-gray-200 rounded-lg shadow-lg max-w-full h-auto">
        {/* Removed duplicate header - dates already shown in mobile picker */}

        {/* Quick action buttons - Booking.com style */}
        <div className="px-4 py-3 border-b border-gray-200 bg-gray-50">
          <div className="flex flex-wrap items-center justify-center gap-2">
            <span className="text-sm text-gray-600 mr-2 hidden sm:inline">
              Exact dates:
            </span>
            <button
              onClick={() => addDaysToSelection(1)}
              className="px-3 py-1.5 text-xs font-medium text-white bg-blue-600 border border-blue-600 rounded hover:bg-blue-700 transition-colors"
            >
              1 day
            </button>
            <button
              onClick={() => addDaysToSelection(2)}
              className="px-3 py-1.5 text-xs font-medium text-white bg-blue-600 border border-blue-600 rounded hover:bg-blue-700 transition-colors"
            >
              2 days
            </button>
            <button
              onClick={() => addDaysToSelection(3)}
              className="px-3 py-1.5 text-xs font-medium text-white bg-blue-600 border border-blue-600 rounded hover:bg-blue-700 transition-colors"
            >
              3 days
            </button>
            <button
              onClick={() => addDaysToSelection(7)}
              className="px-3 py-1.5 text-xs font-medium text-white bg-blue-600 border border-blue-600 rounded hover:bg-blue-700 transition-colors"
            >
              7 days
            </button>
          </div>
        </div>

        {/* Calendar component */}
        <div className="p-0">
          <DateRange
            ranges={selection}
            onChange={handleSelect}
            months={isMobile ? 1 : 2}
            direction={isMobile ? "vertical" : "horizontal"}
            rangeColors={["#0066cc"]}
            showSelectionPreview={true}
            moveRangeOnFirstSelection={false}
            retainEndDateOnFirstSelection={false}
            minDate={new Date()}
            maxDate={addDays(new Date(), 365)}
            showMonthAndYearPickers={false}
            showMonthArrow={true}
            showDateDisplay={false}
            showPreview={true}
            editableDateInputs={false}
            disabledDates={[]}
            dateDisplayFormat="MMM d, yyyy"
          />
        </div>

        {/* Footer with confirm button - Booking.com style */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0 p-4 border-t border-gray-200">
          {/* Removed duplicate date display */}
          <div></div>
          <div className="flex gap-2 w-full sm:w-auto">
            <button
              onClick={() => {
                setSelection([
                  {
                    startDate: new Date(),
                    endDate: addDays(new Date(), 3),
                    key: "selection",
                  },
                ]);
                onChange?.({
                  startDate: new Date(),
                  endDate: addDays(new Date(), 3),
                });
              }}
              className="flex-1 sm:flex-none px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50 transition-colors"
            >
              Reset
            </button>
            <button
              onClick={onClose}
              className="flex-1 sm:flex-none px-6 py-2 text-sm font-medium text-white bg-blue-600 rounded hover:bg-blue-700 transition-colors"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
