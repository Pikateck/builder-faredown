import React from "react";
import { Link, useLocation } from "react-router-dom";
import { Plane, Building2, Heart, User, Sparkles, Crown, Diamond, Gem } from "lucide-react";

export function MobileNavigation() {
  const location = useLocation();

  const isActive = (path: string) => {
    if (path === "/" && location.pathname === "/") return true;
    if (path !== "/" && location.pathname.startsWith(path)) return true;
    return false;
  };

  const navItems = [
    {
      path: "/flights",
      icon: Plane,
      label: "Flights",
    },
    {
      path: "/hotels",
      icon: Building2,
      label: "Hotels",
    },
    {
      path: "/saved",
      icon: Heart,
      label: "Saved",
    },
    {
      path: "/account",
      icon: User,
      label: "Account",
    },
  ];

  return (
    <div className="bg-white border-t border-gray-200 fixed bottom-0 left-0 right-0 z-50 md:hidden shadow-lg">
      <div className="grid grid-cols-4 h-16">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.path);

          return (
            <Link
              key={item.path}
              to={item.path}
              className="flex flex-col items-center justify-center space-y-1 relative group"
            >
              {active && (
                <div className="absolute -top-1 right-3">
                  <Sparkles className="w-3 h-3 text-[#febb02] animate-pulse" />
                </div>
              )}
              <div className="relative">
                <Icon
                  className={`w-5 h-5 ${
                    active ? "text-[#003580]" : "text-gray-400"
                  }`}
                />
                {active && (
                  <div className="absolute -top-1 -right-1">
                    <Diamond className="w-2 h-2 text-[#febb02]" />
                  </div>
                )}
              </div>
              <span
                className={`text-xs flex items-center gap-1 ${
                  active ? "text-[#003580] font-medium" : "text-gray-500"
                }`}
              >
                {active && <Crown className="w-2 h-2 text-[#febb02]" />}
                {item.label}
                {active && <Gem className="w-2 h-2 text-[#febb02]" />}
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
