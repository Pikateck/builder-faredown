import React from "react";
import { Layout } from "@/components/layout/Layout";
import { UnifiedLandingPage } from "@/components/UnifiedLandingPage";
import { MobileNativeSearchForm } from "@/components/mobile/MobileNativeSearchForm";
import SearchBar from "@/components/SearchBar";

export default function Transfers() {
  return (
    <Layout showSearch={false}>
      <UnifiedLandingPage
        module="transfers"
        tagline="Ride in comfort for less — AI secures your best deal on every trip."
        searchPanel={
          <>
            {/* Desktop Search Panel */}
            <div className="hidden md:block">
              {/* Blue Header Section - Consistent with flights */}
              <div
                className="py-6 md:py-8"
                style={{ backgroundColor: "#003580" }}
              >
                <div className="max-w-7xl mx-auto px-3 sm:px-4">
                  <div className="text-center mb-4">
                    <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-2">
                      Upgrade. Bargain. Book.
                    </h2>
                    <h1 className="text-lg sm:text-xl md:text-2xl font-semibold text-white leading-tight opacity-95">
                      Ride in comfort for less — AI secures your best deal on
                      every trip.
                    </h1>
                  </div>
                </div>
              </div>

              {/* Search Panel Section - Same design as flights */}
              <div className="bg-white border-b border-gray-200 shadow-sm">
                <div className="max-w-7xl mx-auto px-3 sm:px-4 py-3 overflow-visible">
                  <SearchBar module="transfers" />
                </div>
              </div>
            </div>
            {/* Mobile Native Search Form */}
            <div className="block md:hidden">
              <MobileNativeSearchForm
                module="transfers"
                transferType="airport-taxi"
              />
            </div>
          </>
        }
      />
    </Layout>
  );
}
