import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Header } from "@/components/Header";
import { SightseeingSearchForm } from "@/components/SightseeingSearchForm";

export default function Sightseeing() {
  const navigate = useNavigate();

  // Redirect to homepage with sightseeing tab active
  useEffect(() => {
    navigate("/?tab=sightseeing", { replace: true });
  }, [navigate]);

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      {/* Mobile Header */}
      <div className="block md:hidden">
        <div className="bg-[#003580] text-white pb-8">
          <div className="px-4 pt-6">
            <div className="text-center mb-6">
              <h1 className="text-2xl font-bold mb-2">
                Discover Amazing Experiences
              </h1>
              <p className="text-blue-200 text-sm mb-3">
                Explore fascinating attractions, cultural landmarks, and
                exciting activities. Create unforgettable memories with our
                curated sightseeing experiences.
              </p>
            </div>

            {/* Mobile Sightseeing Search Form */}
            <SightseeingSearchForm />
          </div>
        </div>
      </div>

      {/* Desktop Header */}
      <div className="hidden md:block">
        <header
          className="py-3 sm:py-6 md:py-8 pb-24 sm:pb-8"
          style={{ backgroundColor: "#003580" }}
        >
          <div className="max-w-7xl mx-auto px-3 sm:px-4">
            <div className="text-center mb-2 sm:mb-3">
              <div className="mb-3 sm:mb-5">
                <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-2">
                  Discover Amazing Experiences
                </h2>
              </div>
              <h1 className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-semibold text-white mb-3 sm:mb-4 leading-tight px-2 opacity-95">
                Explore fascinating attractions, cultural landmarks, and
                exciting activities. Create unforgettable memories with our
                curated sightseeing experiences.
              </h1>
            </div>

            {/* Desktop Sightseeing Search Form */}
            <SightseeingSearchForm />
          </div>
        </header>
      </div>
    </div>
  );
}
