import React from "react";
import { Link } from "react-router-dom";
import {
  Sparkles,
  Target,
  Shield,
  Star,
  Download,
  Smartphone,
  Zap,
  Headphones,
  Users,
  DollarSign,
  ArrowRight,
  Play,
  Crown,
  MessageCircle,
  Lock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MobileNativeLandingPage } from "@/components/mobile/MobileNativeLandingPage";

interface UnifiedLandingPageProps {
  module: "flights" | "hotels" | "sightseeing" | "transfers";
  tagline: string;
  searchPanel: React.ReactNode;
}

const moduleConfig = {
  flights: {
    icon: "✈️",
    primaryFeature: "Flight Upgrade Bargaining",
    primaryDescription:
      "Our AI negotiates seat upgrades in real-time, turning economy bookings into business class at unbeatable prices.",
    testimonial:
      "Saved ₹15,000 on my Dubai trip – business class at economy price!",
    upgradeType: "flight upgrades",
    serviceType: "flights",
    supportType: "flight",
  },
  hotels: {
    icon: "🏨",
    primaryFeature: "Room Upgrade Bargaining",
    primaryDescription:
      "Our AI negotiates room upgrades in real-time, turning standard bookings into luxury suites at incredible prices.",
    testimonial: "Got luxury suite upgrade in Singapore using AI Bargaining!",
    upgradeType: "room upgrades",
    serviceType: "hotels",
    supportType: "hotel",
  },
  sightseeing: {
    icon: "📸",
    primaryFeature: "Tour Upgrade Bargaining",
    primaryDescription:
      "Our AI negotiates premium tour experiences in real-time, turning basic tours into VIP experiences at amazing prices.",
    testimonial:
      "Saved ₹8,000 on my Dubai city tour – VIP experience at standard price!",
    upgradeType: "tour upgrades",
    serviceType: "experiences",
    supportType: "tour",
  },
  transfers: {
    icon: "🚗",
    primaryFeature: "Ride Upgrade Bargaining",
    primaryDescription:
      "Our AI negotiates premium transfers in real-time, turning standard rides into luxury car service at great prices.",
    testimonial: "Got luxury car service in Singapore using AI Bargaining!",
    upgradeType: "ride upgrades",
    serviceType: "transfers",
    supportType: "transfer",
  },
};

export function UnifiedLandingPage({
  module,
  tagline,
  searchPanel,
}: UnifiedLandingPageProps) {
  const config = moduleConfig[module];

  return (
    <div>
      {/* Mobile version - minimal native design */}
      <div className="block md:hidden">
        <MobileNativeLandingPage
          module={module}
          tagline={tagline}
          searchPanel={searchPanel}
        />
      </div>

      {/* Desktop version remains rich with features */}
      <div className="hidden md:block">
        {/* Search Panel Section */}
        {searchPanel}

        {/* Hero Section - Compact Booking.com Style */}
        <section className="py-16 bg-gradient-to-b from-white to-gray-50">
          <div className="max-w-6xl mx-auto px-6">
            <div className="text-center mb-12">
              <div className="inline-flex items-center space-x-2 bg-blue-50 px-4 py-2 rounded-full mb-6">
                <div className="w-2 h-2 bg-[#003580] rounded-full animate-pulse"></div>
                <span className="text-[#003580] font-semibold text-sm">
                  AI-Powered Travel Platform
                </span>
              </div>
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4 leading-tight">
                Why Choose Faredown{" "}
                {module.charAt(0).toUpperCase() + module.slice(1)}?
              </h2>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                Experience the future of {config.serviceType} booking with
                AI-powered bargaining technology
              </p>
            </div>

            {/* Compact Feature Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
              {/* Primary Feature */}
              <div className="md:col-span-2 bg-white rounded-2xl p-8 shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300">
                <div className="flex items-start space-x-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-[#003580] to-[#0071c2] rounded-xl flex items-center justify-center shadow-md">
                    <Sparkles className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-gray-900 mb-2">
                      {config.primaryFeature}
                    </h3>
                    <p className="text-gray-600 text-sm leading-relaxed">
                      {config.primaryDescription}
                    </p>
                  </div>
                </div>
              </div>

              {/* Secondary Feature */}
              <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300">
                <div className="text-center">
                  <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-green-500 rounded-xl flex items-center justify-center mx-auto mb-4 shadow-md">
                    <Target className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="font-bold text-gray-900 mb-2">Best Rates</h3>
                  <p className="text-gray-600 text-sm">
                    Pay what feels right for premium experiences
                  </p>
                </div>
              </div>

              {/* Trust Feature */}
              <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-indigo-500 rounded-lg flex items-center justify-center shadow-md">
                    <Lock className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 text-sm">
                      Secure Booking
                    </h3>
                    <p className="text-gray-600 text-xs">
                      Instant confirmations
                    </p>
                  </div>
                </div>
              </div>

              {/* Support Feature */}
              <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-amber-500 to-orange-500 rounded-lg flex items-center justify-center shadow-md">
                    <MessageCircle className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 text-sm">
                      24/7 Support
                    </h3>
                    <p className="text-gray-600 text-xs">Expert assistance</p>
                  </div>
                </div>
              </div>

              {/* Bargain Feature */}
              <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-500 rounded-lg flex items-center justify-center shadow-md">
                    <Zap className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 text-sm">
                      AI Bargaining
                    </h3>
                    <p className="text-gray-600 text-xs">Live negotiations</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Trust & Reviews Section - Compact Booking.com Style */}
        <section className="py-12 md:py-16 bg-white">
          <div className="max-w-6xl mx-auto px-4 md:px-6">
            {/* TrustPilot Score - Compact */}
            <div className="text-center mb-8 md:mb-12">
              <div className="inline-flex items-center space-x-2 bg-green-50 px-3 py-1.5 rounded-full mb-4">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-green-700 font-medium text-xs">
                  Trusted worldwide
                </span>
              </div>

              <div className="bg-white rounded-xl shadow-md p-6 max-w-sm mx-auto border border-gray-100">
                <div className="flex items-center justify-center space-x-3 mb-3">
                  <div className="flex items-center space-x-1">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className="w-4 h-4 text-[#febb02] fill-current"
                      />
                    ))}
                  </div>
                  <span className="text-2xl font-bold text-gray-900">4.9</span>
                </div>
                <div className="text-center">
                  <div className="font-semibold text-gray-900">Excellent</div>
                  <div className="text-gray-600 text-sm">50,000+ reviews</div>
                  <div className="flex items-center justify-center space-x-1 mt-2">
                    <div className="bg-green-500 text-white px-2 py-0.5 rounded text-xs font-bold">
                      Trustpilot
                    </div>
                    <span className="text-green-600 text-sm">★★★★★</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Customer Reviews - Compact */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
              <div className="bg-white rounded-xl p-6 shadow-md border border-gray-100">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="w-10 h-10 bg-[#003580] rounded-full flex items-center justify-center">
                    <span className="text-white font-bold text-sm">P</span>
                  </div>
                  <div>
                    <div className="font-medium text-gray-900 text-sm">
                      Priya Sharma
                    </div>
                    <div className="flex items-center">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className="w-3 h-3 text-[#febb02] fill-current"
                        />
                      ))}
                    </div>
                  </div>
                </div>
                <p className="text-gray-700 text-sm leading-relaxed">
                  "{config.testimonial}"
                </p>
              </div>

              <div className="bg-white rounded-xl p-6 shadow-md border border-gray-100">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="w-10 h-10 bg-[#003580] rounded-full flex items-center justify-center">
                    <span className="text-white font-bold text-sm">R</span>
                  </div>
                  <div>
                    <div className="font-medium text-gray-900 text-sm">
                      Rohit Kumar
                    </div>
                    <div className="flex items-center">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className="w-3 h-3 text-[#febb02] fill-current"
                        />
                      ))}
                    </div>
                  </div>
                </div>
                <p className="text-gray-700 text-sm leading-relaxed">
                  "Professional service and instant confirmations. AI bargaining
                  works perfectly!"
                </p>
              </div>

              <div className="bg-white rounded-xl p-6 shadow-md border border-gray-100">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="w-10 h-10 bg-[#003580] rounded-full flex items-center justify-center">
                    <span className="text-white font-bold text-sm">A</span>
                  </div>
                  <div>
                    <div className="font-medium text-gray-900 text-sm">
                      Anjali Patel
                    </div>
                    <div className="flex items-center">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className="w-3 h-3 text-[#febb02] fill-current"
                        />
                      ))}
                    </div>
                  </div>
                </div>
                <p className="text-gray-700 text-sm leading-relaxed">
                  "Easy booking and great savings. Faredown's AI technology is
                  revolutionary!"
                </p>
              </div>
            </div>

            {/* Support Banner - Compact */}
            <div className="text-center mt-8 md:mt-12">
              <div className="bg-gradient-to-r from-[#003580] to-[#0071c2] text-white py-4 px-6 rounded-xl inline-block shadow-lg">
                <div className="flex items-center justify-center space-x-3">
                  <div className="bg-white/20 p-2 rounded-full">
                    <Headphones className="w-4 h-4" />
                  </div>
                  <div className="text-left">
                    <div className="font-bold">24/7 Customer Support</div>
                    <div className="text-blue-100 text-sm">
                      Live Chat & Call Available
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* App Download Section - Compact */}
        <section className="py-12 bg-[#003580] text-white">
          <div className="max-w-4xl mx-auto px-4 md:px-6 text-center">
            <div className="w-16 h-16 bg-[#febb02] rounded-2xl flex items-center justify-center mx-auto mb-6">
              <Smartphone className="w-8 h-8 text-[#003580]" />
            </div>
            <h2 className="text-2xl md:text-3xl font-bold mb-4">
              Travel Smarter. Bargain Better.
            </h2>
            <p className="text-blue-200 mb-8">
              Download the Faredown app for exclusive mobile deals
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-6">
              <Button className="bg-black hover:bg-gray-900 text-white py-3 px-6 rounded-xl flex items-center space-x-3">
                <Download className="w-5 h-5" />
                <div className="text-left">
                  <div className="text-xs opacity-75">Download on the</div>
                  <div className="font-bold">App Store</div>
                </div>
              </Button>
              <Button className="bg-black hover:bg-gray-900 text-white py-3 px-6 rounded-xl flex items-center space-x-3">
                <Download className="w-5 h-5" />
                <div className="text-left">
                  <div className="text-xs opacity-75">Get it on</div>
                  <div className="font-bold">Google Play</div>
                </div>
              </Button>
            </div>
          </div>
        </section>

        {/* Newsletter Section - Compact */}
        <section className="py-12 bg-gray-50">
          <div className="max-w-2xl mx-auto px-4 md:px-6 text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Stay ahead with secret travel bargains
            </h2>
            <p className="text-gray-600 mb-8">
              Join 2M+ travelers getting exclusive deals
            </p>

            <div className="flex flex-col sm:flex-row max-w-md mx-auto space-y-4 sm:space-y-0 sm:space-x-4">
              <Input
                type="email"
                placeholder="Enter your email"
                className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-[#003580] text-gray-900"
              />
              <Button className="bg-[#003580] hover:bg-[#0071c2] text-white px-8 py-3 rounded-lg font-medium">
                Subscribe
              </Button>
            </div>
            <p className="text-xs text-gray-500 mt-4">No spam emails</p>
          </div>
        </section>
      </div>
    </div>
  );
}
