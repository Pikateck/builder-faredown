import React from "react";
import { Layout } from "@/components/layout/Layout";
import { UnifiedLandingPage } from "@/components/UnifiedLandingPage";
import { PackagesSearchForm } from "@/components/PackagesSearchForm";
import { MobileNativeSearchForm } from "@/components/mobile/MobileNativeSearchForm";

export default function Packages() {
  return (
    <Layout showSearch={false}>
      <UnifiedLandingPage
        module="packages"
        tagline="Discover amazing destinations with our curated fixed packages."
        searchPanel={
          <>
            {/* Desktop Search Panel */}
            <div className="hidden md:block">
              {/* Blue Header Section - Consistent with other modules */}
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
                      Discover amazing destinations with our curated fixed packages.
                    </h1>
                  </div>
                </div>
              </div>

              {/* Search Panel Section - Same design as other modules */}
              <div className="bg-white border-b border-gray-200 shadow-sm">
                <div className="max-w-7xl mx-auto px-3 sm:px-4 py-3 overflow-visible">
                  <PackagesSearchForm />
                </div>
              </div>
            </div>
            {/* Mobile Native Search Form */}
            <div className="block md:hidden">
              <MobileNativeSearchForm module="packages" />
            </div>
          </>
        }
      />
    </Layout>
  );
}
