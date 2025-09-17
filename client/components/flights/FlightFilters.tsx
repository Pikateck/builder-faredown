import React from "react";

export type Filters = {
  stops?: "any" | "direct" | "1" | "2+";
  airlines?: string[];
};

export type FlightFiltersProps = {
  value: Filters;
  onChange: (v: Filters) => void;
};

export default function FlightFilters({ value, onChange }: FlightFiltersProps) {
  return (
    <aside className="w-full rounded-2xl border border-slate-200 bg-white shadow-sm p-4 md:p-5">
      <div className="font-semibold mb-3">Filter your results</div>

      <div className="space-y-3 text-sm">
        <div>
          <div className="text-slate-500 mb-1">Stops</div>
          <div className="flex flex-wrap gap-2">
            {(["any", "direct", "1", "2+"] as const).map((opt) => (
              <button
                key={opt}
                onClick={() => onChange({ ...value, stops: opt })}
                className={`px-3 h-9 rounded-lg border ${
                  value.stops === opt ? "bg-slate-900 text-white border-slate-900" : "border-slate-300"
                }`}
              >
                {opt === "any" ? "Any" : opt === "direct" ? "Direct only" : `${opt} stop${opt === "1" ? "" : "s"}`}
              </button>
            ))}
          </div>
        </div>
        {/* add airline checkboxes, price sliders, etc., later as needed */}
      </div>
    </aside>
  );
}
