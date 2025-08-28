import React from "react";
import { Link } from "react-router-dom";
import {
  Plane,
  Hotel,
  Camera,
  Car,
  Sparkles,
  Crown,
  Shield,
  Star,
  Download,
  Smartphone,
  Zap,
  Clock,
  CheckCircle,
  Search,
  TrendingUp,
  Award,
  Users,
  ArrowRight,
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
    icon: Plane,
    primaryFeature: "Flight Bargains",
    primaryDescription: "AI secures premium upgrades",
    upgradeType: "flight upgrades",
    serviceType: "flights",
    howItWorksTitle: "AI Flight Upgrades",
    accentColor: "from-blue-600 to-blue-700",
    iconBg: "bg-gradient-to-br from-blue-50 to-blue-100",
  },
  hotels: {
    icon: Hotel,
    primaryFeature: "Hotel Upgrades",
    primaryDescription: "AI negotiates luxury suites",
    upgradeType: "room upgrades",
    serviceType: "hotels",
    howItWorksTitle: "AI Hotel Upgrades",
    accentColor: "from-indigo-600 to-indigo-700",
    iconBg: "bg-gradient-to-br from-indigo-50 to-indigo-100",
  },
  sightseeing: {
    icon: Camera,
    primaryFeature: "Experience Deals",
    primaryDescription: "AI finds premium tours",
    upgradeType: "tour upgrades",
    serviceType: "experiences",
    howItWorksTitle: "AI Experience Deals",
    accentColor: "from-emerald-600 to-emerald-700",
    iconBg: "bg-gradient-to-br from-emerald-50 to-emerald-100",
  },
  transfers: {
    icon: Car,
    primaryFeature: "Premium Rides",
    primaryDescription: "AI upgrades your transfers",
    upgradeType: "ride upgrades",
    serviceType: "transfers",
    howItWorksTitle: "AI Ride Upgrades",
    accentColor: "from-purple-600 to-purple-700",
    iconBg: "bg-gradient-to-br from-purple-50 to-purple-100",
  },
};

export function UnifiedLandingPage({
  module,
  tagline,
  searchPanel,
}: UnifiedLandingPageProps) {
  const config = moduleConfig[module];
  const ModuleIcon = config.icon;

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

      {/* Desktop version - Premium sophisticated design */}
      <div className="hidden md:block">
        {/* Search Panel Section - DO NOT TOUCH */}
        {searchPanel}

        {/* Hero Value Props - Premium Cards */}
        <section className="py-16 bg-gradient-to-br from-gray-50 via-white to-gray-50">
          <div className="max-w-7xl mx-auto px-6">
            <div className="text-center mb-12">
              <h2 className="text-4xl font-bold text-gray-900 mb-3 tracking-tight">
                World's First AI Travel Bargain Platform
              </h2>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                Premium experiences at unbeatable prices through intelligent AI
                negotiation
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
              {/* Primary Feature */}
              <div className="group relative bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <div className="relative">
                  <div
                    className={`w-16 h-16 ${config.iconBg} rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300`}
                  >
                    <ModuleIcon
                      className="w-8 h-8 text-[#003580]"
                      strokeWidth={1.5}
                    />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-3">
                    {config.primaryFeature}
                  </h3>
                  <p className="text-gray-600 text-sm leading-relaxed">
                    {config.primaryDescription}
                  </p>
                </div>
              </div>

              {/* Premium Quality */}
              <div className="group relative bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100">
                <div className="absolute inset-0 bg-gradient-to-br from-amber-50/50 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <div className="relative">
                  <div className="w-16 h-16 bg-gradient-to-br from-amber-50 to-amber-100 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                    <Crown
                      className="w-8 h-8 text-[#003580]"
                      strokeWidth={1.5}
                    />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-3">
                    Premium Quality
                  </h3>
                  <p className="text-gray-600 text-sm leading-relaxed">
                    Luxury experiences at standard prices
                  </p>
                </div>
              </div>

              {/* Instant Results */}
              <div className="group relative bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100">
                <div className="absolute inset-0 bg-gradient-to-br from-emerald-50/50 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <div className="relative">
                  <div className="w-16 h-16 bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                    <Zap className="w-8 h-8 text-[#003580]" strokeWidth={1.5} />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-3">
                    Instant Results
                  </h3>
                  <p className="text-gray-600 text-sm leading-relaxed">
                    Real-time AI negotiation in seconds
                  </p>
                </div>
              </div>

              {/* Trusted Platform */}
              <div className="group relative bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100">
                <div className="absolute inset-0 bg-gradient-to-br from-purple-50/50 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <div className="relative">
                  <div className="w-16 h-16 bg-gradient-to-br from-purple-50 to-purple-100 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                    <Shield
                      className="w-8 h-8 text-[#003580]"
                      strokeWidth={1.5}
                    />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-3">
                    Trusted Platform
                  </h3>
                  <p className="text-gray-600 text-sm leading-relaxed">
                    Enterprise-grade security & support
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* How it Works - Elegant Process */}
        <section className="py-20 bg-white">
          <div className="max-w-6xl mx-auto px-6">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold text-gray-900 mb-4 tracking-tight">
                {config.howItWorksTitle}
              </h2>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                Advanced AI technology meets premium travel in three simple
                steps
              </p>
            </div>

            <div className="relative">
              {/* Connection Lines */}
              <div className="absolute top-20 left-1/2 transform -translate-x-1/2 w-full max-w-4xl h-px bg-gradient-to-r from-transparent via-gray-300 to-transparent hidden lg:block"></div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 relative">
                {/* Upgrade */}
                <div className="text-center relative">
                  <div className="relative inline-block">
                    <div className="w-20 h-20 bg-gradient-to-br from-[#003580] to-[#0071c2] rounded-2xl flex items-center justify-center mb-8 shadow-xl p-6 md:p-8">
                      <Search
                        className="w-12 h-12 md:w-12 h-12 text-white"
                        strokeWidth={1.5}
                      />
                    </div>
                    <div className="absolute -top-1 -right-1 w-8 h-8 bg-[#febb02] rounded-full flex items-center justify-center">
                      <span className="text-[#003580] font-bold text-sm">
                        1
                      </span>
                    </div>
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-4">
                    Upgrade
                  </h3>
                  <p className="text-gray-600 max-w-xs mx-auto leading-relaxed">
                    Turn a regular fare into premium travel.
                  </p>
                </div>

                {/* Bargain */}
                <div className="text-center relative">
                  <div className="relative inline-block">
                    <div className="w-20 h-20 bg-gradient-to-br from-[#0071c2] to-[#003580] rounded-2xl flex items-center justify-center mb-8 shadow-xl p-6 md:p-8">
                      <TrendingUp
                        className="w-12 h-12 md:w-12 h-12 text-white"
                        strokeWidth={1.5}
                      />
                    </div>
                    <div className="absolute -top-1 -right-1 w-8 h-8 bg-[#febb02] rounded-full flex items-center justify-center">
                      <span className="text-[#003580] font-bold text-sm">
                        2
                      </span>
                    </div>
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-4">
                    Bargain
                  </h3>
                  <p className="text-gray-600 max-w-xs mx-auto leading-relaxed">
                    AI negotiates live with suppliers — 3 attempts, 30-second timer.
                  </p>
                </div>

                {/* Book */}
                <div className="text-center relative">
                  <div className="relative inline-block">
                    <div className="w-20 h-20 bg-gradient-to-br from-[#003580] to-[#0071c2] rounded-2xl flex items-center justify-center mb-8 shadow-xl p-6 md:p-8">
                      <CheckCircle
                        className="w-12 h-12 md:w-12 h-12 text-white"
                        strokeWidth={1.5}
                      />
                    </div>
                    <div className="absolute -top-1 -right-1 w-8 h-8 bg-[#febb02] rounded-full flex items-center justify-center">
                      <span className="text-[#003580] font-bold text-sm">
                        3
                      </span>
                    </div>
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-4">
                    Book
                  </h3>
                  <p className="text-gray-600 max-w-xs mx-auto leading-relaxed">
                    Lock the deal with instant confirmation & support.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Social Proof - Refined */}
        <section className="py-16 bg-gradient-to-br from-gray-50 via-white to-gray-50">
          <div className="max-w-6xl mx-auto px-6">
            {/* Trust Badge */}
            <div className="text-center mb-12">
              <div className="inline-flex items-center bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
                <div className="flex items-center space-x-2 mr-6">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className="w-6 h-6 text-[#febb02] fill-current"
                      strokeWidth={1.5}
                    />
                  ))}
                </div>
                <div className="text-left">
                  <div className="text-3xl font-bold text-gray-900">4.9</div>
                  <div className="text-sm text-gray-600">50,000+ reviews</div>
                </div>
              </div>
            </div>

            {/* Testimonials */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
                <div className="flex items-center mb-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center mr-3">
                    <span className="text-white font-bold">P</span>
                  </div>
                  <div>
                    <div className="font-bold text-gray-900">Priya Sharma</div>
                    <div className="flex items-center">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className="w-4 h-4 text-[#febb02] fill-current"
                          strokeWidth={1.5}
                        />
                      ))}
                    </div>
                  </div>
                </div>
                <p className="text-gray-600 italic">
                  "Business class at economy price – saved ₹15,000 on Dubai
                  trip!"
                </p>
              </div>

              <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
                <div className="flex items-center mb-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-full flex items-center justify-center mr-3">
                    <span className="text-white font-bold">R</span>
                  </div>
                  <div>
                    <div className="font-bold text-gray-900">Rohit Kumar</div>
                    <div className="flex items-center">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className="w-4 h-4 text-[#febb02] fill-current"
                          strokeWidth={1.5}
                        />
                      ))}
                    </div>
                  </div>
                </div>
                <p className="text-gray-600 italic">
                  "AI bargaining is revolutionary – instant confirmations every
                  time!"
                </p>
              </div>

              <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
                <div className="flex items-center mb-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-full flex items-center justify-center mr-3">
                    <span className="text-white font-bold">A</span>
                  </div>
                  <div>
                    <div className="font-bold text-gray-900">Anjali Patel</div>
                    <div className="flex items-center">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className="w-4 h-4 text-[#febb02] fill-current"
                          strokeWidth={1.5}
                        />
                      ))}
                    </div>
                  </div>
                </div>
                <p className="text-gray-600 italic">
                  "Faredown's technology delivers incredible savings
                  consistently!"
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* App CTA - Premium */}
        <section className="py-20 bg-gradient-to-br from-[#003580] via-[#0071c2] to-[#003580] text-white relative overflow-hidden">
          <div
            className={
              'absolute inset-0 bg-[url(\'data:image/svg+xml,%3Csvg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg"%3E%3Cg fill="none" fill-rule="evenodd"%3E%3Cg fill="%23ffffff" fill-opacity="0.03"%3E%3Ccircle cx="30" cy="30" r="1"/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\')] opacity-20'
            }
          ></div>
          <div className="max-w-4xl mx-auto px-6 text-center relative">
            <div className="w-20 h-20 bg-[#febb02] rounded-3xl flex items-center justify-center mx-auto mb-8">
              <Smartphone
                className="w-10 h-10 text-[#003580]"
                strokeWidth={1.5}
              />
            </div>
            <h2 className="text-4xl font-bold mb-4 tracking-tight">
              Travel Smarter. Bargain Better.
            </h2>
            <p className="text-xl text-blue-100 mb-10 max-w-2xl mx-auto">
              Download the Faredown app for exclusive mobile deals and instant
              AI bargaining
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
              <Button className="bg-black hover:bg-gray-900 text-white py-4 px-8 rounded-2xl flex items-center space-x-3 transition-all duration-300 shadow-lg">
                <Download className="w-5 h-5" strokeWidth={1.5} />
                <div className="text-left">
                  <div className="text-xs opacity-75">Download on the</div>
                  <div className="font-bold">App Store</div>
                </div>
              </Button>
              <Button className="bg-black hover:bg-gray-900 text-white py-4 px-8 rounded-2xl flex items-center space-x-3 transition-all duration-300 shadow-lg">
                <Download className="w-5 h-5" strokeWidth={1.5} />
                <div className="text-left">
                  <div className="text-xs opacity-75">Get it on</div>
                  <div className="font-bold">Google Play</div>
                </div>
              </Button>
            </div>
          </div>
        </section>

        {/* Newsletter - Elegant */}
        <section className="py-16 bg-white">
          <div className="max-w-4xl mx-auto px-6 text-center">
            <h2 className="text-4xl font-bold text-gray-900 mb-4 tracking-tight">
              Stay Ahead with Exclusive Deals
            </h2>
            <p className="text-xl text-gray-600 mb-10">
              Join 2M+ smart travelers getting secret bargains first
            </p>

            <div className="max-w-md mx-auto">
              <div className="flex bg-gray-50 rounded-2xl p-2 shadow-inner">
                <Input
                  type="email"
                  placeholder="Enter your email address"
                  className="flex-1 bg-transparent border-0 px-4 py-3 text-gray-900 placeholder:text-gray-500 focus:outline-none focus:ring-0"
                />
                <Button className="bg-[#febb02] hover:bg-[#e6a602] text-black px-8 py-3 rounded-xl font-bold transition-all duration-300 shadow-lg">
                  Subscribe
                </Button>
              </div>
              <p className="text-sm text-gray-500 mt-4">
                No spam, unsubscribe anytime
              </p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
