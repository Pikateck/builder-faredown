import React from "react";

interface MobileNativeLandingPageProps {
  module: "flights" | "hotels" | "sightseeing" | "transfers";
  tagline: string;
  searchPanel: React.ReactNode;
}

const moduleConfig = {
  flights: {
    icon: "✈️",
    title: "Flights",
  },
  hotels: {
    icon: "🏨",
    title: "Hotels",
  },
  sightseeing: {
    icon: "📸",
    title: "Sightseeing",
  },
  transfers: {
    icon: "🚗",
    title: "Transfers",
  },
};

export function MobileNativeLandingPage({ 
  module, 
  tagline, 
  searchPanel 
}: MobileNativeLandingPageProps) {
  const config = moduleConfig[module];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Search Panel - This is the primary focus */}
      {searchPanel}

      {/* Minimal below-the-fold content - Only essential features */}
      <div className="hidden md:block py-12 bg-white">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <div className="inline-flex items-center space-x-2 bg-blue-50 px-4 py-2 rounded-full mb-6">
            <div className="w-2 h-2 bg-[#003580] rounded-full animate-pulse"></div>
            <span className="text-[#003580] font-semibold text-sm">
              AI-Powered Travel Platform
            </span>
          </div>
          
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Why Choose Faredown {config.title}?
          </h2>
          <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto">
            {tagline}
          </p>

          {/* Compact Feature Grid - Only 3 essential features */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100">
              <div className="w-12 h-12 bg-gradient-to-br from-[#003580] to-[#0071c2] rounded-xl flex items-center justify-center mx-auto mb-4 shadow-md">
                <span className="text-2xl">{config.icon}</span>
              </div>
              <h3 className="font-bold text-gray-900 mb-2">AI Bargaining</h3>
              <p className="text-gray-600 text-sm">Live price negotiations for better deals</p>
            </div>
            
            <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100">
              <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-green-500 rounded-xl flex items-center justify-center mx-auto mb-4 shadow-md">
                <span className="text-2xl">💰</span>
              </div>
              <h3 className="font-bold text-gray-900 mb-2">Best Rates</h3>
              <p className="text-gray-600 text-sm">Guaranteed lowest prices or money back</p>
            </div>
            
            <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-indigo-500 rounded-xl flex items-center justify-center mx-auto mb-4 shadow-md">
                <span className="text-2xl">🔒</span>
              </div>
              <h3 className="font-bold text-gray-900 mb-2">Secure Booking</h3>
              <p className="text-gray-600 text-sm">Instant confirmations with 24/7 support</p>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile-only minimal content */}
      <div className="md:hidden py-8 px-4">
        <div className="text-center mb-6">
          <div className="inline-flex items-center space-x-2 bg-blue-50 px-3 py-1.5 rounded-full mb-4">
            <div className="w-1.5 h-1.5 bg-[#003580] rounded-full animate-pulse"></div>
            <span className="text-[#003580] font-medium text-xs">AI-Powered Platform</span>
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">
            Why Faredown {config.title}?
          </h2>
          <p className="text-gray-600 text-sm">{tagline}</p>
        </div>

        {/* Mobile Compact Grid - 2x2 */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white rounded-xl p-4 shadow-md border border-gray-100">
            <div className="w-10 h-10 bg-gradient-to-br from-[#003580] to-[#0071c2] rounded-lg flex items-center justify-center mx-auto mb-3 shadow-md">
              <span className="text-lg">{config.icon}</span>
            </div>
            <h3 className="font-bold text-gray-900 text-sm mb-1 text-center">AI Bargaining</h3>
            <p className="text-gray-600 text-xs text-center">Live negotiations</p>
          </div>
          
          <div className="bg-white rounded-xl p-4 shadow-md border border-gray-100">
            <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-green-500 rounded-lg flex items-center justify-center mx-auto mb-3 shadow-md">
              <span className="text-lg">💰</span>
            </div>
            <h3 className="font-bold text-gray-900 text-sm mb-1 text-center">Best Rates</h3>
            <p className="text-gray-600 text-xs text-center">Lowest prices</p>
          </div>
          
          <div className="bg-white rounded-xl p-4 shadow-md border border-gray-100">
            <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-indigo-500 rounded-lg flex items-center justify-center mx-auto mb-3 shadow-md">
              <span className="text-lg">🔒</span>
            </div>
            <h3 className="font-bold text-gray-900 text-sm mb-1 text-center">Secure</h3>
            <p className="text-gray-600 text-xs text-center">Instant booking</p>
          </div>
          
          <div className="bg-white rounded-xl p-4 shadow-md border border-gray-100">
            <div className="w-10 h-10 bg-gradient-to-br from-amber-500 to-orange-500 rounded-lg flex items-center justify-center mx-auto mb-3 shadow-md">
              <span className="text-lg">🎧</span>
            </div>
            <h3 className="font-bold text-gray-900 text-sm mb-1 text-center">24/7 Support</h3>
            <p className="text-gray-600 text-xs text-center">Expert help</p>
          </div>
        </div>
      </div>
    </div>
  );
}
