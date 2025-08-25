import React from "react";
import { useLocation } from "react-router-dom";
import { FlightSearchForm } from "@/components/FlightSearchForm";
import { HotelSearchForm } from "@/components/HotelSearchForm";
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

  // Get content based on active tab with enhanced designs
  const getTabContent = () => {
    switch (activeTab) {
      case "hotels":
        return {
          title: "Find your perfect stay",
          subtitle: "Search hotels with live AI bargaining — luxury for less.",
          icon: "🏨",
          gradient: "from-orange-500 to-red-500",
          searchForm: <HotelSearchForm />,
        };
      case "sightseeing":
        return {
          title: "Discover. Explore. Experience.",
          subtitle: "Unforgettable attractions and cultural landmarks await your discovery.",
          icon: "🎭",
          gradient: "from-purple-500 to-pink-500",
          searchForm: <SightseeingSearchForm />,
        };
      case "transfers":
        return {
          title: "Seamless Airport Transfers",
          subtitle: "Ride in comfort for less — AI secures your best deal on every trip.",
          icon: "🚗",
          gradient: "from-green-500 to-teal-500",
          searchForm: <TransfersSearchForm />,
        };
      default: // flights
        return {
          title: "Upgrade. Bargain. Book.",
          subtitle: "Turn your seat into an upgrade and your fare into a win, with AI that bargains for you.",
          icon: "✈️",
          gradient: "from-blue-600 to-blue-700",
          searchForm: <FlightSearchForm />,
        };
    }
  };

  const tabContent = getTabContent();

  return (
    <>
      {/* Mobile Search Section - Enhanced Design */}
      <div className="md:hidden">
        <div className="relative pb-8 pt-6 bg-gradient-to-br from-white via-blue-50/30 to-indigo-50/40 overflow-hidden">
          {/* Background Pattern */}
          <div className="absolute inset-0 opacity-5">
            <div className="absolute top-4 right-4 w-24 h-24 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full blur-2xl"></div>
            <div className="absolute bottom-4 left-4 w-32 h-32 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full blur-2xl"></div>
          </div>
          
          <div className="relative px-4">
            {/* Enhanced Header */}
            <div className="text-center mb-8">
              <div className="inline-flex items-center space-x-3 bg-white/80 backdrop-blur-xl border border-white/20 px-6 py-3 rounded-full mb-4 shadow-lg">
                <span className="text-2xl">{tabContent.icon}</span>
                <span className="bg-gradient-to-r from-slate-700 to-slate-900 bg-clip-text text-transparent font-bold text-sm">
                  {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}
                </span>
              </div>
              
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900 mb-3 leading-tight">
                {tabContent.title}
              </h1>
              <p className="text-slate-600 font-medium text-sm leading-relaxed max-w-sm mx-auto">
                {tabContent.subtitle}
              </p>
            </div>

            {/* Enhanced Search Form Container */}
            <div className="bg-white/90 backdrop-blur-xl rounded-2xl p-1 shadow-xl border border-white/20">
              {tabContent.searchForm}
            </div>
          </div>
        </div>
      </div>

      {/* Desktop Search Section - Enhanced Design */}
      <div className="hidden md:block">
        <div
          className={`relative py-6 md:py-12 pb-16 bg-gradient-to-br ${tabContent.gradient} overflow-hidden`}
        >
          {/* Enhanced Background Elements */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-10 left-10 w-40 h-40 bg-white rounded-full blur-3xl"></div>
            <div className="absolute bottom-10 right-10 w-48 h-48 bg-white rounded-full blur-3xl"></div>
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-white rounded-full blur-3xl"></div>
          </div>

          <div className="relative max-w-7xl mx-auto px-4 sm:px-6">
            {/* Enhanced Header Section */}
            <div className="text-center mb-8 lg:mb-12">
              <div className="inline-flex items-center space-x-3 bg-white/20 backdrop-blur-xl border border-white/30 px-8 py-4 rounded-full mb-6 shadow-lg">
                <span className="text-3xl">{tabContent.icon}</span>
                <span className="text-white font-bold text-lg">
                  {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} Search
                </span>
              </div>
              
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white mb-4 leading-tight">
                {tabContent.title}
              </h1>
              <p className="text-lg sm:text-xl lg:text-2xl font-medium text-white/90 mb-6 leading-relaxed max-w-4xl mx-auto">
                {tabContent.subtitle}
              </p>

              {/* Feature Pills */}
              <div className="flex flex-wrap justify-center gap-3 mb-8">
                <div className="bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full text-white text-sm font-medium">
                  ⚡ Instant Results
                </div>
                <div className="bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full text-white text-sm font-medium">
                  🎯 Best Prices
                </div>
                <div className="bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full text-white text-sm font-medium">
                  🛡️ Secure Booking
                </div>
              </div>
            </div>

            {/* Enhanced Search Form Container */}
            <div className="bg-white/95 backdrop-blur-xl rounded-2xl p-6 lg:p-8 shadow-2xl border border-white/20 max-w-6xl mx-auto">
              <div className="bg-gradient-to-r from-gray-50 to-blue-50 rounded-xl p-4 mb-4">
                <div className="flex items-center justify-center space-x-2 text-sm text-gray-600">
                  <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                  <span className="font-medium">Live search powered by AI bargaining technology</span>
                </div>
              </div>
              {tabContent.searchForm}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
