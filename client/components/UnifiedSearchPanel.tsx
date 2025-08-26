import React from "react";

interface UnifiedSearchPanelProps {
  module: "flights" | "hotels" | "sightseeing" | "transfers";
  tagline: string;
  searchForm: React.ReactNode;
}

export function UnifiedSearchPanel({
  module,
  tagline,
  searchForm,
}: UnifiedSearchPanelProps) {
  return (
    <div>
      {/* Blue Header Section - Consistent across all modules */}
      <div className="py-6 md:py-8" style={{ backgroundColor: "#003580" }}>
        <div className="max-w-7xl mx-auto px-3 sm:px-4">
          <div className="text-center mb-4">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-2">
              Upgrade. Bargain. Book.
            </h2>
            <h1 className="text-lg sm:text-xl md:text-2xl font-semibold text-white leading-tight opacity-95">
              {tagline}
            </h1>
          </div>
        </div>
      </div>

      {/* Search Form Section */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 py-3">{searchForm}</div>
      </div>
    </div>
  );
}
