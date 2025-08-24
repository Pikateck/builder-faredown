import React from "react";
import { useLocation } from "react-router-dom";
import { BookingSearchForm } from "@/components/BookingSearchForm";
import { SightseeingSearchForm } from "@/components/SightseeingSearchForm";
import { TransfersSearchForm } from "@/components/TransfersSearchForm";

export function SearchPanel() {
  const location = useLocation();
  
  // Get active tab from URL
  const getActiveTab = () => {
    const searchParams = new URLSearchParams(location.search);
    const tab = searchParams.get("tab");
    if (tab) return tab;
    
    if (location.pathname === "/") return "flights";
    if (location.pathname.includes("/flights")) return "flights";
    if (location.pathname.includes("/hotels")) return "hotels"; 
    if (location.pathname.includes("/sightseeing")) return "sightseeing";
    if (location.pathname.includes("/transfers")) return "transfers";
    return "flights";
  };

  const activeTab = getActiveTab();

  // Get content based on active tab
  const getTabContent = () => {
    switch (activeTab) {
      case "hotels":
        return {
          title: "Find your perfect stay",
          subtitle: "Search hotels with live AI bargaining.",
          searchForm: <BookingSearchForm />,
        };
      case "sightseeing":
        return {
          title: "Upgrade. Bargain. Book.",
          subtitle: "Explore fascinating attractions, cultural landmarks, and exciting activities. Create unforgettable memories with our curated sightseeing experiences.",
          searchForm: <SightseeingSearchForm />,
        };
      case "transfers":
        return {
          title: "Upgrade. Bargain. Book.",
          subtitle: "Ride in comfort for less — AI secures your best deal on every trip.",
          searchForm: <TransfersSearchForm />,
        };
      default: // flights
        return {
          title: "Upgrade. Bargain. Book.",
          subtitle: "Turn your seat into an upgrade and your fare into a win, with AI that bargains for you.",
          searchForm: <BookingSearchForm />,
        };
    }
  };

  const tabContent = getTabContent();

  return (
    <>
      {/* Mobile Search Section */}
      <div className="md:hidden">
        <div className="pb-8 pt-4 bg-white">
          <div className="px-4">
            {/* Upgrade Message */}
            <div className="text-center mb-6">
              <h1 className="text-2xl font-bold mb-2 text-gray-900">
                {tabContent.title}
              </h1>
              <p className="text-gray-600 text-sm mb-3">
                {tabContent.subtitle}
              </p>
            </div>

            {/* Search Form */}
            <div className="mx-auto">
              {tabContent.searchForm}
            </div>
          </div>
        </div>
      </div>

      {/* Desktop Search Section */}
      <div className="hidden md:block">
        <div
          className="py-3 sm:py-6 md:py-8 pb-24 sm:pb-8"
          style={{ backgroundColor: "#003580" }}
        >
          <div className="max-w-7xl mx-auto px-3 sm:px-4">
            <div className="text-center mb-2 sm:mb-3">
              <div className="mb-3 sm:mb-5">
                <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-2">
                  {tabContent.title}
                </h2>
              </div>
              <h1 className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-semibold text-white mb-3 sm:mb-4 leading-tight px-2 opacity-95">
                {tabContent.subtitle}
              </h1>
            </div>

            {/* Desktop Search Form */}
            <div className="max-w-7xl mx-auto">
              {tabContent.searchForm}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
