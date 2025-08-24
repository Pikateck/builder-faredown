import React from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import {
  Plane,
  Hotel,
  Camera,
  Car,
  User,
} from "lucide-react";

export function MobileBottomNav() {
  const location = useLocation();
  const navigate = useNavigate();

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

  // Handle tab change
  const handleTabChange = (tab: string) => {
    if (tab === "flights") {
      navigate("/?tab=flights");
    } else {
      navigate(`/?tab=${tab}`);
    }
    window.scrollTo(0, 0);
  };

  return (
    <div className="block md:hidden bg-white border-t border-gray-200 fixed bottom-0 left-0 right-0 z-50">
      <div className="grid grid-cols-5 h-16">
        <button
          onClick={() => handleTabChange("flights")}
          className="flex flex-col items-center justify-center space-y-1 touch-manipulation min-h-[48px] w-full"
        >
          <Plane className={cn("w-5 h-5", activeTab === "flights" ? "text-[#003580]" : "text-gray-400")} />
          <span className={cn("text-xs", activeTab === "flights" ? "text-[#003580] font-medium" : "text-gray-500")}>Flights</span>
        </button>
        <button
          onClick={() => handleTabChange("hotels")}
          className="flex flex-col items-center justify-center space-y-1 touch-manipulation min-h-[48px] w-full"
        >
          <Hotel className={cn("w-5 h-5", activeTab === "hotels" ? "text-[#003580]" : "text-gray-400")} />
          <span className={cn("text-xs", activeTab === "hotels" ? "text-[#003580] font-medium" : "text-gray-500")}>Hotels</span>
        </button>
        <button
          onClick={() => handleTabChange("sightseeing")}
          className="flex flex-col items-center justify-center space-y-1 touch-manipulation min-h-[48px] w-full"
        >
          <Camera className={cn("w-5 h-5", activeTab === "sightseeing" ? "text-[#003580]" : "text-gray-400")} />
          <span className={cn("text-xs", activeTab === "sightseeing" ? "text-[#003580] font-medium" : "text-gray-500")}>Sightseeing</span>
        </button>
        <button
          onClick={() => handleTabChange("transfers")}
          className="flex flex-col items-center justify-center space-y-1 touch-manipulation min-h-[48px] w-full"
        >
          <Car className={cn("w-5 h-5", activeTab === "transfers" ? "text-[#003580]" : "text-gray-400")} />
          <span className={cn("text-xs", activeTab === "transfers" ? "text-[#003580] font-medium" : "text-gray-500")}>Transfers</span>
        </button>
        <Link
          to="/account"
          className="flex flex-col items-center justify-center space-y-1 touch-manipulation min-h-[48px] w-full"
          onClick={() => window.scrollTo(0, 0)}
        >
          <User className="w-5 h-5 text-gray-400" />
          <span className="text-xs text-gray-500">Account</span>
        </Link>
      </div>
    </div>
  );
}
