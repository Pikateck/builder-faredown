import React from "react";
import { useLocation } from "react-router-dom";
import { LandingPageSearchPanel } from "@/components/LandingPageSearchPanel";
import { HotelSearchForm } from "@/components/HotelSearchForm";
import { SightseeingSearchForm } from "@/components/SightseeingSearchForm";
import { TransfersSearchForm } from "@/components/TransfersSearchForm";

export function SearchPanel() {
  const location = useLocation();

  // Get active module from URL
  const getActiveModule = () => {
    if (location.pathname.includes("/hotels")) return "hotels";
    if (location.pathname.includes("/sightseeing")) return "sightseeing";
    if (location.pathname.includes("/transfers")) return "transfers";
    return "flights"; // Default to flights for home page and flight pages
  };

  const activeModule = getActiveModule();

  // Use flights search panel design for all modules, but different forms
  if (activeModule === "flights") {
    return <LandingPageSearchPanel />;
  }

  // For other modules, use the same blue header design but with module-specific search forms
  return (
    <div>
      {/* Blue Header Section - Consistent with flights */}
      <div className="py-6 md:py-8" style={{ backgroundColor: "#003580" }}>
        <div className="max-w-7xl mx-auto px-3 sm:px-4">
          <div className="text-center mb-4">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-2">
              Upgrade. Bargain. Book.
            </h2>
            <h1 className="text-lg sm:text-xl md:text-2xl font-semibold text-white leading-tight opacity-95">
              {activeModule === "hotels" && "Control your price with AI-powered hotel upgrades."}
              {activeModule === "sightseeing" && "Explore attractions & experiences with AI that bargains for you."}
              {activeModule === "transfers" && "Ride in comfort for less — AI secures your best deal on every trip."}
            </h1>
          </div>
        </div>
      </div>

      {/* Search Panel Section - Same design as flights */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 py-3 overflow-visible">
          {activeModule === "hotels" && <HotelSearchForm />}
          {activeModule === "sightseeing" && <SightseeingSearchForm />}
          {activeModule === "transfers" && <TransfersSearchForm />}
        </div>
      </div>
    </div>
  );
}
