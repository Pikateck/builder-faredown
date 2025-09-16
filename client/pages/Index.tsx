import React, { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { HotelSearchForm } from "@/components/HotelSearchForm";
import { UnifiedLandingPage } from "@/components/UnifiedLandingPage";
import { MobileNativeSearchForm } from "@/components/mobile/MobileNativeSearchForm";

export default function Index() {
  const location = useLocation();
  const navigate = useNavigate();

  // Handle tab redirects
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const tab = searchParams.get("tab");

    if (tab) {
      switch (tab) {
        case "flights":
          navigate("/flights", { replace: true });
          break;
        case "hotels":
          navigate("/hotels", { replace: true });
          break;
        case "sightseeing":
          navigate("/sightseeing", { replace: true });
          break;
        case "transfers":
          navigate("/transfers", { replace: true });
          break;
      }
    }
  }, [location.search, navigate]);

  return (
    <Layout showSearch={false}>
      <UnifiedLandingPage
        module="hotels"
        tagline="Control your price with AI-powered hotel upgrades."
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
                      Control your price with AI-powered hotel upgrades.
                    </h1>
                  </div>
                </div>
              </div>

              {/* Search Panel Section - Same design as other modules */}
              <div className="bg-white border-b border-gray-200 shadow-sm">
                <div className="max-w-7xl mx-auto px-3 sm:px-4 py-3 overflow-visible">
                  <HotelSearchForm />
                </div>
              </div>
            </div>
            {/* Mobile Native Search Form */}
            <div className="block md:hidden">
              <MobileNativeSearchForm module="hotels" />
            </div>
          </>
        }
      />
    </Layout>
  );
}
