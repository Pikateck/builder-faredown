import React from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Plane, Hotel, Camera, Car, User } from "lucide-react";

export function MobileBottomNav() {
  const location = useLocation();
  const navigate = useNavigate();

  // Get active tab from URL
  const getActiveTab = () => {
    // Check actual route paths first
    if (location.pathname === "/" || location.pathname === "/flights") return "flights";
    if (location.pathname.includes("/hotels")) return "hotels";
    if (location.pathname.includes("/sightseeing")) return "sightseeing";
    if (location.pathname.includes("/transfers")) return "transfers";

    // Fallback to query parameters for backward compatibility
    const searchParams = new URLSearchParams(location.search);
    const tab = searchParams.get("tab");
    if (tab) return tab;

    return "flights";
  };

  const activeTab = getActiveTab();

  // Handle tab change
  const handleTabChange = (tab: string) => {
    switch (tab) {
      case "flights":
        navigate("/flights");
        break;
      case "hotels":
        navigate("/hotels");
        break;
      case "sightseeing":
        navigate("/sightseeing");
        break;
      case "transfers":
        navigate("/transfers");
        break;
      default:
        navigate("/");
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
          <Plane
            className={cn(
              "w-5 h-5",
              activeTab === "flights" ? "text-[#003580]" : "text-gray-400",
            )}
          />
          <span
            className={cn(
              "text-xs",
              activeTab === "flights"
                ? "text-[#003580] font-medium"
                : "text-gray-500",
            )}
          >
            Flights
          </span>
        </button>
        <button
          onClick={() => handleTabChange("hotels")}
          className="flex flex-col items-center justify-center space-y-1 touch-manipulation min-h-[48px] w-full"
        >
          <Hotel
            className={cn(
              "w-5 h-5",
              activeTab === "hotels" ? "text-[#003580]" : "text-gray-400",
            )}
          />
          <span
            className={cn(
              "text-xs",
              activeTab === "hotels"
                ? "text-[#003580] font-medium"
                : "text-gray-500",
            )}
          >
            Hotels
          </span>
        </button>
        <button
          onClick={() => handleTabChange("sightseeing")}
          className="flex flex-col items-center justify-center space-y-1 touch-manipulation min-h-[48px] w-full"
        >
          <Camera
            className={cn(
              "w-5 h-5",
              activeTab === "sightseeing" ? "text-[#003580]" : "text-gray-400",
            )}
          />
          <span
            className={cn(
              "text-xs",
              activeTab === "sightseeing"
                ? "text-[#003580] font-medium"
                : "text-gray-500",
            )}
          >
            Sightseeing
          </span>
        </button>
        <button
          onClick={() => handleTabChange("transfers")}
          className="flex flex-col items-center justify-center space-y-1 touch-manipulation min-h-[48px] w-full"
        >
          <Car
            className={cn(
              "w-5 h-5",
              activeTab === "transfers" ? "text-[#003580]" : "text-gray-400",
            )}
          />
          <span
            className={cn(
              "text-xs",
              activeTab === "transfers"
                ? "text-[#003580] font-medium"
                : "text-gray-500",
            )}
          >
            Transfers
          </span>
        </button>
        <div className="relative">
          <button
            onClick={() => setShowAccountDropdown(!showAccountDropdown)}
            className={cn(
              "flex flex-col items-center justify-center space-y-1 touch-manipulation min-h-[48px] w-full",
              showAccountDropdown ? "bg-blue-50" : ""
            )}
          >
            <User className={cn(
              "w-5 h-5",
              showAccountDropdown ? "text-[#003580]" : "text-gray-400"
            )} />
            <span className={cn(
              "text-xs",
              showAccountDropdown ? "text-[#003580] font-medium" : "text-gray-500"
            )}>
              Account
            </span>
          </button>

          {/* Account Dropdown Menu */}
          {showAccountDropdown && (
            <>
              {/* Backdrop */}
              <div
                className="fixed inset-0 bg-black bg-opacity-25 z-40"
                onClick={() => setShowAccountDropdown(false)}
              />

              {/* Dropdown Menu */}
              <div className="absolute bottom-full right-0 mb-2 w-56 bg-white rounded-lg shadow-xl border border-gray-200 z-50">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-gray-200">
                  <span className="font-semibold text-gray-900">My Account</span>
                  <button
                    onClick={() => setShowAccountDropdown(false)}
                    className="p-1 hover:bg-gray-100 rounded"
                  >
                    <ChevronUp className="w-4 h-4 text-gray-500" />
                  </button>
                </div>

                {/* Menu Items */}
                <div className="py-2">
                  <button
                    onClick={() => {
                      navigate("/account?tab=bookings");
                      setShowAccountDropdown(false);
                      window.scrollTo(0, 0);
                    }}
                    className="flex items-center space-x-3 px-4 py-3 w-full text-left hover:bg-gray-50 text-gray-700"
                  >
                    <Plane className="w-5 h-5 text-[#003580]" />
                    <span className="font-medium">My Bookings</span>
                  </button>

                  <button
                    onClick={() => {
                      navigate("/account?tab=profile");
                      setShowAccountDropdown(false);
                      window.scrollTo(0, 0);
                    }}
                    className="flex items-center space-x-3 px-4 py-3 w-full text-left hover:bg-gray-50 text-gray-700"
                  >
                    <User className="w-5 h-5 text-[#003580]" />
                    <span className="font-medium">Profile</span>
                  </button>

                  <button
                    onClick={() => {
                      navigate("/account?tab=loyalty");
                      setShowAccountDropdown(false);
                      window.scrollTo(0, 0);
                    }}
                    className="flex items-center space-x-3 px-4 py-3 w-full text-left hover:bg-gray-50 text-gray-700"
                  >
                    <Award className="w-5 h-5 text-[#003580]" />
                    <span className="font-medium">Loyalty Program</span>
                  </button>

                  <button
                    onClick={() => {
                      navigate("/account?tab=payment");
                      setShowAccountDropdown(false);
                      window.scrollTo(0, 0);
                    }}
                    className="flex items-center space-x-3 px-4 py-3 w-full text-left hover:bg-gray-50 text-gray-700"
                  >
                    <CreditCard className="w-5 h-5 text-[#003580]" />
                    <span className="font-medium">Payment & Wallet</span>
                  </button>

                  <button
                    onClick={() => {
                      navigate("/account?tab=settings");
                      setShowAccountDropdown(false);
                      window.scrollTo(0, 0);
                    }}
                    className="flex items-center space-x-3 px-4 py-3 w-full text-left hover:bg-gray-50 text-gray-700"
                  >
                    <Settings className="w-5 h-5 text-[#003580]" />
                    <span className="font-medium">Settings</span>
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
