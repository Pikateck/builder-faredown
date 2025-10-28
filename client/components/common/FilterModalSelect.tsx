/**
 * FilterModalSelect Component
 * Generic "View more" modal for filter lists with search and multi-select
 * Used for Brands, Amenities, and Locations
 */

import React, { useMemo, useState } from "react";
import { Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";

export interface FilterItem {
  code: string;
  name: string;
  count?: number;
}

interface FilterModalSelectProps {
  title: string;
  items: FilterItem[];
  selected: string[];
  onApply: (selected: string[]) => void;
  onClose: () => void;
  searchPlaceholder?: string;
}

export const FilterModalSelect: React.FC<FilterModalSelectProps> = ({
  title,
  items,
  selected,
  onApply,
  onClose,
  searchPlaceholder = "Search...",
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [localSelected, setLocalSelected] = useState(new Set(selected));

  // Filter items based on search query
  const filteredItems = useMemo(() => {
    if (!searchQuery.trim()) {
      return items;
    }

    const query = searchQuery.toLowerCase();
    return items.filter(
      (item) =>
        item.name.toLowerCase().includes(query) ||
        item.code.toLowerCase().includes(query),
    );
  }, [items, searchQuery]);

  const handleToggle = (code: string) => {
    const newSelected = new Set(localSelected);
    if (newSelected.has(code)) {
      newSelected.delete(code);
    } else {
      newSelected.add(code);
    }
    setLocalSelected(newSelected);
  };

  const handleSelectAll = () => {
    if (localSelected.size === filteredItems.length) {
      setLocalSelected(new Set());
    } else {
      const allCodes = new Set(filteredItems.map((item) => item.code));
      setLocalSelected(allCodes);
    }
  };

  const handleApply = () => {
    onApply(Array.from(localSelected));
    onClose();
  };

  const allSelected = localSelected.size === filteredItems.length && filteredItems.length > 0;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-end md:items-center md:justify-center">
      <div className="bg-white w-full md:w-96 rounded-t-3xl md:rounded-2xl max-h-[90vh] md:max-h-[80vh] flex flex-col shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 sticky top-0 bg-white rounded-t-3xl">
          <h2 className="text-lg font-bold text-gray-900">{title}</h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search Input */}
        <div className="px-4 py-3 border-b border-gray-200 sticky top-12 bg-white">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder={searchPlaceholder}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0071c2] focus:border-transparent outline-none"
            />
          </div>
        </div>

        {/* List Items */}
        <div className="flex-1 overflow-y-auto">
          {filteredItems.length === 0 ? (
            <div className="p-4 text-center text-gray-500">
              No items found
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {filteredItems.map((item) => (
                <label
                  key={item.code}
                  className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 cursor-pointer transition-colors"
                >
                  <input
                    type="checkbox"
                    checked={localSelected.has(item.code)}
                    onChange={() => handleToggle(item.code)}
                    className="w-4 h-4 rounded border-gray-300 cursor-pointer"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="text-gray-900 font-medium truncate">
                      {item.name}
                    </div>
                  </div>
                  {item.count !== undefined && (
                    <div className="text-xs text-gray-500 flex-shrink-0">
                      ({item.count})
                    </div>
                  )}
                </label>
              ))}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="border-t border-gray-200 p-4 bg-gray-50 sticky bottom-0 space-y-3">
          <div className="flex gap-2">
            <button
              onClick={handleSelectAll}
              className="flex-1 text-center px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              {allSelected ? "Clear All" : "Select All"}
            </button>
            <Button
              onClick={handleApply}
              className="flex-1 bg-[#0071c2] hover:bg-[#0056a0] text-white font-semibold"
            >
              Apply
            </Button>
          </div>
          <button
            onClick={onClose}
            className="w-full text-center px-3 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};
