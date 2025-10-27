import React from "react";
import { ChevronDown } from "lucide-react";

interface CollapsedSearchSummaryProps {
  cityFull: string;
  datesLabel: string;
  paxLabel: string;
  onExpand: () => void;
}

export default function CollapsedSearchSummary({
  cityFull,
  datesLabel,
  paxLabel,
  onExpand,
}: CollapsedSearchSummaryProps) {
  return (
    <button
      aria-label="Edit search criteria"
      onClick={onExpand}
      className="w-full text-left rounded-lg border border-gray-200 bg-white px-3 py-2.5 shadow-sm hover:bg-gray-50 transition-colors flex items-center justify-between gap-3"
    >
      <div className="min-w-0 flex-1">
        <div className="text-xs text-gray-500 font-medium">
          Where / Dates / Guests
        </div>
        <div className="mt-1 space-y-1">
          <div className="text-sm font-medium leading-5 break-words text-gray-900">
            {cityFull}
          </div>
          <div className="text-[13px] leading-4 text-gray-700">
            {datesLabel}
          </div>
          <div className="text-[13px] leading-4 text-gray-600">{paxLabel}</div>
        </div>
      </div>
      <ChevronDown className="shrink-0 h-5 w-5 text-gray-400" />
    </button>
  );
}
