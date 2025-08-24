import React from "react";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Sparkles, Target, Crown, Star } from "lucide-react";

export default function FlightsSimple() {
  return (
    <Layout>
      {/* Flight-specific content goes here */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-8 text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-8">
            Flight Excellence with AI Bargaining
          </h1>

          <p className="text-xl text-gray-600 mb-12 max-w-3xl mx-auto">
            Discover amazing flight deals and let our AI negotiate the best
            prices for you.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 max-w-4xl mx-auto">
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-[#003580] to-[#0071c2] rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Sparkles className="w-8 h-8 text-white" />
              </div>
              <h3 className="font-bold text-gray-900">AI Flight Bargaining</h3>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-[#003580] to-[#0071c2] rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Target className="w-8 h-8 text-white" />
              </div>
              <h3 className="font-bold text-gray-900">Best Flight Fares</h3>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-[#003580] to-[#0071c2] rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Crown className="w-8 h-8 text-white" />
              </div>
              <h3 className="font-bold text-gray-900">Premium for Less</h3>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-[#003580] to-[#0071c2] rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Star className="w-8 h-8 text-white" />
              </div>
              <h3 className="font-bold text-gray-900">Trusted Worldwide</h3>
            </div>
          </div>

          <div className="mt-12">
            <Button className="bg-[#febb02] hover:bg-[#e6a602] text-[#003580] font-bold px-8 py-4 rounded-full text-lg">
              Search Flights Now
            </Button>
          </div>
        </div>
      </section>

      {/* Additional flight-specific sections can go here */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-8">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-8">
            Popular Flight Destinations
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { destination: "Dubai", price: "₹25,000", savings: "Save 40%" },
              { destination: "London", price: "₹55,000", savings: "Save 35%" },
              {
                destination: "Singapore",
                price: "₹35,000",
                savings: "Save 45%",
              },
            ].map((flight, index) => (
              <div
                key={index}
                className="bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-shadow"
              >
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  {flight.destination}
                </h3>
                <p className="text-2xl font-bold text-[#003580] mb-1">
                  {flight.price}
                </p>
                <p className="text-green-600 font-medium">{flight.savings}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </Layout>
  );
}
