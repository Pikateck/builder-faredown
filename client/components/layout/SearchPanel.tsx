import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { FlightSearchForm } from "@/components/FlightSearchForm";
import { HotelSearchForm } from "@/components/HotelSearchForm";
import { SightseeingSearchForm } from "@/components/SightseeingSearchForm";
import { TransfersSearchForm } from "@/components/TransfersSearchForm";
import { Button } from "@/components/ui/button";
import { 
  Plane, 
  Hotel, 
  Camera, 
  Car, 
  MapPin,
  CalendarIcon,
  Users,
  Edit3,
  ArrowLeft,
  Sparkles,
  Zap,
  Star
} from "lucide-react";

export function SearchPanel() {
  const location = useLocation();
  const navigate = useNavigate();
  const [showEditModal, setShowEditModal] = useState(false);
  const [isLiveData, setIsLiveData] = useState(true);

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

  // Tab configuration with enhanced content
  const getTabContent = () => {
    switch (activeTab) {
      case "hotels":
        return {
          title: "Find your perfect stay",
          subtitle: "Search hotels with live AI bargaining for exclusive deals.",
          icon: <Hotel className="w-6 h-6" />,
          searchForm: <HotelSearchForm />,
          gradient: "from-orange-500 to-red-600",
          bgColor: "#e53e3e",
        };
      case "sightseeing":
        return {
          title: "Discover amazing experiences",
          subtitle: "Explore fascinating attractions with AI-powered savings.",
          icon: <Camera className="w-6 h-6" />,
          searchForm: <SightseeingSearchForm />,
          gradient: "from-green-500 to-teal-600",
          bgColor: "#38a169",
        };
      case "transfers":
        return {
          title: "Comfortable rides, smart prices",
          subtitle: "Ride in comfort for less — AI secures your best deal.",
          icon: <Car className="w-6 h-6" />,
          searchForm: <TransfersSearchForm />,
          gradient: "from-purple-500 to-indigo-600",
          bgColor: "#805ad5",
        };
      default: // flights
        return {
          title: "Upgrade. Bargain. Book.",
          subtitle: "Turn your seat into an upgrade and your fare into a win, with AI that bargains for you.",
          icon: <Plane className="w-6 h-6" />,
          searchForm: <FlightSearchForm />,
          gradient: "from-blue-600 to-cyan-600",
          bgColor: "#003580",
        };
    }
  };

  const tabContent = getTabContent();

  // Sample search summary data (would come from context/props in real app)
  const searchSummary = {
    destination: "Dubai, United Arab Emirates",
    dates: "Mon, Sep 1 - Tue, Sep 2 (1 night)",
    guests: "2 adults, 1 child",
    resultsCount: 247
  };

  return (
    <>
      {/* ========== ENHANCED MOBILE SEARCH SECTION ========== */}
      <div className="md:hidden">
        {/* Mobile Navigation Bar with Live Indicator */}
        <div className="flex items-center justify-between p-4 bg-white shadow-sm border-b border-gray-100">
          <div className="flex items-center space-x-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate(-1)}
              className="p-2 hover:bg-gray-100 rounded-full"
            >
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </Button>
            
            <div className="flex items-center space-x-2">
              <div className="flex items-center space-x-2 text-[#003580]">
                {tabContent.icon}
                <span className="font-semibold capitalize">{activeTab}</span>
              </div>
              
              {isLiveData && (
                <div className="flex items-center space-x-1 bg-red-100 text-red-600 px-2 py-1 rounded-full">
                  <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                  <span className="text-xs font-bold">LIVE</span>
                </div>
              )}
            </div>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowEditModal(true)}
            className="flex items-center space-x-2 border-[#003580] text-[#003580] hover:bg-blue-50"
          >
            <Edit3 className="w-4 h-4" />
            <span className="text-sm font-medium">Edit</span>
          </Button>
        </div>

        {/* Enhanced Mobile Search Summary */}
        <div className="bg-gradient-to-r from-blue-50 to-cyan-50 p-4">
          <div className="space-y-3">
            {/* AI Bargaining Badge */}
            <div className="flex items-center justify-center">
              <div className="inline-flex items-center space-x-2 bg-gradient-to-r from-[#003580] to-[#0071c2] text-white px-4 py-2 rounded-full shadow-lg">
                <Sparkles className="w-4 h-4" />
                <span className="text-sm font-bold">AI Bargaining Active</span>
                <Zap className="w-4 h-4" />
              </div>
            </div>

            {/* Search Details */}
            <div className="bg-white rounded-2xl p-4 shadow-sm">
              <div className="text-center mb-4">
                <h2 className="text-xl font-bold text-gray-900 mb-1">
                  {tabContent.title}
                </h2>
                <p className="text-sm text-gray-600">
                  {tabContent.subtitle}
                </p>
              </div>

              {/* Current Search Info */}
              <div className="space-y-2 text-sm">
                <div className="flex items-center space-x-2 text-gray-700">
                  <MapPin className="w-4 h-4 text-[#003580]" />
                  <span>{searchSummary.destination}</span>
                </div>
                <div className="flex items-center space-x-2 text-gray-700">
                  <CalendarIcon className="w-4 h-4 text-[#003580]" />
                  <span>{searchSummary.dates}</span>
                </div>
                <div className="flex items-center space-x-2 text-gray-700">
                  <Users className="w-4 h-4 text-[#003580]" />
                  <span>{searchSummary.guests}</span>
                </div>
              </div>

              {/* Results Count */}
              <div className="mt-4 pt-3 border-t border-gray-100">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">
                    {searchSummary.resultsCount} options found
                  </span>
                  <div className="flex items-center space-x-1">
                    <Star className="w-4 h-4 text-yellow-500 fill-current" />
                    <span className="text-sm font-medium text-gray-900">4.8</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Enhanced Search Form */}
        <div className="p-4 bg-white">
          {tabContent.searchForm}
        </div>
      </div>

      {/* ========== ENHANCED DESKTOP SEARCH SECTION ========== */}
      <div className="hidden md:block">
        <div
          className="relative py-8 pb-24 overflow-hidden"
          style={{ backgroundColor: tabContent.bgColor }}
        >
          {/* Background Effects */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-4 left-4 w-32 h-32 bg-white rounded-full blur-3xl"></div>
            <div className="absolute bottom-4 right-4 w-40 h-40 bg-yellow-300 rounded-full blur-3xl"></div>
            <div className="absolute top-1/2 left-1/3 w-24 h-24 bg-cyan-300 rounded-full blur-2xl"></div>
          </div>

          <div className="relative max-w-7xl mx-auto px-4">
            {/* Enhanced Header */}
            <div className="text-center mb-8">
              {/* AI Badge */}
              <div className="inline-flex items-center space-x-2 bg-white/20 backdrop-blur-sm text-white px-6 py-3 rounded-full mb-6 shadow-lg">
                <Sparkles className="w-5 h-5" />
                <span className="font-bold text-lg">AI Bargaining Engine</span>
                <Zap className="w-5 h-5" />
              </div>

              {/* Main Title */}
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-black text-white mb-4 leading-tight">
                {tabContent.title}
              </h1>

              {/* Subtitle with enhanced styling */}
              <p className="text-xl md:text-2xl text-white/90 mb-8 max-w-4xl mx-auto leading-relaxed">
                {tabContent.subtitle}
              </p>

              {/* Trust Indicators */}
              <div className="flex items-center justify-center space-x-8 text-white/80 text-sm">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                  <span>Live Pricing</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Star className="w-4 h-4 text-yellow-400 fill-current" />
                  <span>4.9/5 Rating</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Zap className="w-4 h-4 text-yellow-400" />
                  <span>AI Powered</span>
                </div>
              </div>
            </div>

            {/* Enhanced Desktop Search Form */}
            <div className="max-w-6xl mx-auto">
              <div className="bg-white/95 backdrop-blur-sm rounded-3xl p-6 shadow-2xl border border-white/20">
                {tabContent.searchForm}
              </div>
            </div>

            {/* Quick Tips */}
            <div className="mt-8 text-center">
              <div className="inline-flex items-center space-x-4 text-white/70 text-sm">
                <span>💡 Pro tip: Let AI bargain for upgrades automatically</span>
                <span>•</span>
                <span>🚀 Save up to 60% with smart booking</span>
                <span>•</span>
                <span>⚡ Instant confirmations</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ========== ENHANCED EDIT MODAL (MOBILE) ========== */}
      {showEditModal && (
        <>
          {/* Overlay */}
          <div 
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
            onClick={() => setShowEditModal(false)}
          />
          
          {/* Modal */}
          <div className="fixed inset-0 z-50 flex items-start md:hidden">
            <div className="w-full bg-white rounded-b-3xl shadow-2xl max-h-[90vh] overflow-hidden">
              {/* Modal Header */}
              <div className="bg-gradient-to-r from-[#003580] to-[#0071c2] text-white p-6 relative">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    {tabContent.icon}
                    <h3 className="text-xl font-bold">Edit Search</h3>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowEditModal(false)}
                    className="text-white hover:bg-white/20 rounded-full p-2"
                  >
                    ✕
                  </Button>
                </div>
                
                {/* AI Badge */}
                <div className="mt-4">
                  <div className="inline-flex items-center space-x-2 bg-white/20 px-3 py-1 rounded-full">
                    <Sparkles className="w-4 h-4" />
                    <span className="text-sm font-medium">AI Optimization Active</span>
                  </div>
                </div>
              </div>

              {/* Enhanced Search Form */}
              <div className="p-6 space-y-6 overflow-y-auto max-h-[calc(90vh-200px)]">
                {tabContent.searchForm}
              </div>

              {/* Action Buttons */}
              <div className="p-6 bg-gray-50 border-t border-gray-200 flex space-x-3">
                <Button
                  variant="outline"
                  onClick={() => setShowEditModal(false)}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  onClick={() => {
                    setShowEditModal(false);
                    // Handle search update logic here
                  }}
                  className="flex-1 bg-gradient-to-r from-[#003580] to-[#0071c2] hover:from-[#002660] hover:to-[#005aa2] text-white"
                >
                  <Search className="w-4 h-4 mr-2" />
                  Update Search
                </Button>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
}

// Helper component for search icon
function Search({ className }: { className: string }) {
  return (
    <svg
      className={className}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="m21 21-6-6m2-5a7 7 0 1 1-14 0 7 7 0 0 1 14 0Z"
      />
    </svg>
  );
}
