import React from "react";

interface MobileNativeLandingPageProps {
  module: "flights" | "hotels" | "sightseeing" | "transfers";
  tagline: string;
  searchPanel: React.ReactNode;
}

export function MobileNativeLandingPage({ 
  module, 
  tagline, 
  searchPanel 
}: MobileNativeLandingPageProps) {
  
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Search Panel - This is the primary focus */}
      {searchPanel}
      
      {/* Absolutely minimal content - only what's essential */}
      <div className="px-4 py-6">
        <div className="text-center">
          <div className="inline-flex items-center space-x-2 bg-blue-50 px-3 py-1.5 rounded-full mb-3">
            <div className="w-1.5 h-1.5 bg-[#003580] rounded-full animate-pulse"></div>
            <span className="text-[#003580] font-medium text-xs">AI-Powered Platform</span>
          </div>
          
          <p className="text-gray-600 text-sm max-w-sm mx-auto leading-relaxed">
            {tagline}
          </p>
        </div>
      </div>
      
      {/* That's it - nothing more on mobile landing page */}
      {/* Everything else (reviews, features, etc.) should be in menu or separate pages */}
    </div>
  );
}
