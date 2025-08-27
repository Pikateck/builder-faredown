import React from "react";
import { Link } from "react-router-dom";
import {
  Plane,
  Hotel,
  Camera,
  Car,
  Target,
  Shield,
  Star,
  Download,
  Smartphone,
  Zap,
  Headphones,
  CheckCircle,
  Search,
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
    primaryFeature: "Bargain Flights",
    primaryDescription: "AI negotiates flight upgrades in real-time",
    upgradeType: "flight upgrades",
    serviceType: "flights",
    howItWorksTitle: "Get Flight Upgrades with AI",
    backgroundColor: "bg-[#003580]/10",
  },
  hotels: {
    icon: Hotel,
    primaryFeature: "Hotel Upgrades",
    primaryDescription: "AI negotiates room upgrades in real-time", 
    upgradeType: "room upgrades", 
    serviceType: "hotels",
    howItWorksTitle: "Get Hotel Upgrades with AI",
    backgroundColor: "bg-[#0071c2]/10",
  },
  sightseeing: {
    icon: Camera,
    primaryFeature: "Sightseeing Deals",
    primaryDescription: "AI negotiates premium tour experiences",
    upgradeType: "tour upgrades",
    serviceType: "experiences",
    howItWorksTitle: "Get Tour Upgrades with AI",
    backgroundColor: "bg-[#10b981]/10",
  },
  transfers: {
    icon: Car,
    primaryFeature: "Airport Taxi",
    primaryDescription: "AI negotiates premium transfer upgrades",
    upgradeType: "ride upgrades",
    serviceType: "transfers",
    howItWorksTitle: "Get Ride Upgrades with AI",
    backgroundColor: "bg-[#8b5cf6]/10",
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

      {/* Desktop version - Premium classy design */}
      <div className="hidden md:block">
        {/* Search Panel Section - DO NOT TOUCH */}
        {searchPanel}

        {/* USP Tiles - 5 Cards with Short Copy */}
        <section className="py-12 bg-gray-50">
          <div className="max-w-6xl mx-auto px-4 md:px-6">
            <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
              
              {/* Primary Feature */}
              <div className="bg-white rounded-xl p-5 shadow-[0_6px_20px_rgba(0,0,0,0.06)] hover:shadow-[0_8px_25px_rgba(0,0,0,0.08)] transition-shadow duration-150 text-center">
                <div className={`w-12 h-12 ${config.backgroundColor} rounded-xl flex items-center justify-center mx-auto mb-3`}>
                  <ModuleIcon className="w-7 h-7 text-[#003580]" strokeWidth={1.75} />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2 text-[16px]">
                  {config.primaryFeature}
                </h3>
                <p className="text-[13px] text-gray-600 line-clamp-1">
                  {config.primaryDescription}
                </p>
              </div>

              {/* Best Rates */}
              <div className="bg-white rounded-xl p-5 shadow-[0_6px_20px_rgba(0,0,0,0.06)] hover:shadow-[0_8px_25px_rgba(0,0,0,0.08)] transition-shadow duration-150 text-center">
                <div className="w-12 h-12 bg-[#0071c2]/10 rounded-xl flex items-center justify-center mx-auto mb-3">
                  <Target className="w-7 h-7 text-[#003580]" strokeWidth={1.75} />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2 text-[16px]">
                  Best Rates
                </h3>
                <p className="text-[13px] text-gray-600 line-clamp-1">
                  Pay what feels right for premium experiences
                </p>
              </div>

              {/* Secure Booking */}
              <div className="bg-white rounded-xl p-5 shadow-[0_6px_20px_rgba(0,0,0,0.06)] hover:shadow-[0_8px_25px_rgba(0,0,0,0.08)] transition-shadow duration-150 text-center">
                <div className="w-12 h-12 bg-[#10b981]/10 rounded-xl flex items-center justify-center mx-auto mb-3">
                  <Shield className="w-7 h-7 text-[#003580]" strokeWidth={1.75} />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2 text-[16px]">
                  Secure Booking
                </h3>
                <p className="text-[13px] text-gray-600 line-clamp-1">
                  Instant confirmations with enterprise security
                </p>
              </div>

              {/* AI Bargaining */}
              <div className="bg-white rounded-xl p-5 shadow-[0_6px_20px_rgba(0,0,0,0.06)] hover:shadow-[0_8px_25px_rgba(0,0,0,0.08)] transition-shadow duration-150 text-center">
                <div className="w-12 h-12 bg-[#8b5cf6]/10 rounded-xl flex items-center justify-center mx-auto mb-3">
                  <Zap className="w-7 h-7 text-[#003580]" strokeWidth={1.75} />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2 text-[16px]">
                  AI Bargaining
                </h3>
                <p className="text-[13px] text-gray-600 line-clamp-1">
                  Live negotiations powered by machine learning
                </p>
              </div>

              {/* 24/7 Support */}
              <div className="bg-white rounded-xl p-5 shadow-[0_6px_20px_rgba(0,0,0,0.06)] hover:shadow-[0_8px_25px_rgba(0,0,0,0.08)] transition-shadow duration-150 text-center">
                <div className="w-12 h-12 bg-[#f59e0b]/10 rounded-xl flex items-center justify-center mx-auto mb-3">
                  <Headphones className="w-7 h-7 text-[#003580]" strokeWidth={1.75} />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2 text-[16px]">
                  24/7 Support
                </h3>
                <p className="text-[13px] text-gray-600 line-clamp-1">
                  Expert assistance when you need it most
                </p>
              </div>

            </div>
          </div>
        </section>

        {/* How it Works - Compact 3 Step */}
        <section id="how-it-works" className="py-12 bg-white">
          <div className="max-w-4xl mx-auto px-4 md:px-6 text-center">
            <h2 className="text-3xl md:text-4xl font-semibold text-gray-900 mb-4 tracking-tight">
              {config.howItWorksTitle}
            </h2>
            <p className="text-[15px] md:text-base text-gray-600 mb-10">
              Experience the future of {config.serviceType} booking with AI-powered bargaining
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              
              {/* Step 1: Search */}
              <div className="text-center">
                <div className="w-14 h-14 bg-[#003580] rounded-xl flex items-center justify-center mx-auto mb-4">
                  <Search className="w-7 h-7 text-white" strokeWidth={1.75} />
                </div>
                <div className="w-6 h-6 bg-[#febb02] rounded-full flex items-center justify-center mx-auto mb-3">
                  <span className="text-black font-bold text-[11px]">1</span>
                </div>
                <h3 className="font-semibold text-gray-900 mb-2 text-[18px]">Search</h3>
                <p className="text-[15px] text-gray-600 line-clamp-1">
                  Find your perfect {module === 'flights' ? 'flight' : module === 'hotels' ? 'hotel' : module === 'sightseeing' ? 'tour' : 'transfer'} with smart search
                </p>
              </div>

              {/* Step 2: Bargain */}
              <div className="text-center">
                <div className="w-14 h-14 bg-[#0071c2] rounded-xl flex items-center justify-center mx-auto mb-4">
                  <Zap className="w-7 h-7 text-white" strokeWidth={1.75} />
                </div>
                <div className="w-6 h-6 bg-[#febb02] rounded-full flex items-center justify-center mx-auto mb-3">
                  <span className="text-black font-bold text-[11px]">2</span>
                </div>
                <h3 className="font-semibold text-gray-900 mb-2 text-[18px]">Bargain</h3>
                <p className="text-[15px] text-gray-600 line-clamp-1">
                  AI negotiates upgrades in seconds using real-time data
                </p>
              </div>

              {/* Step 3: Book/Upgrade */}
              <div className="text-center">
                <div className="w-14 h-14 bg-[#10b981] rounded-xl flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="w-7 h-7 text-white" strokeWidth={1.75} />
                </div>
                <div className="w-6 h-6 bg-[#febb02] rounded-full flex items-center justify-center mx-auto mb-3">
                  <span className="text-black font-bold text-[11px]">3</span>
                </div>
                <h3 className="font-semibold text-gray-900 mb-2 text-[18px]">Book/Upgrade</h3>
                <p className="text-[15px] text-gray-600 line-clamp-1">
                  Secure upgrade with instant confirmation & peace of mind
                </p>
              </div>

            </div>
          </div>
        </section>

        {/* Trust & Reviews - Compact */}
        <section className="py-12 bg-gray-50">
          <div className="max-w-4xl mx-auto px-4 md:px-6 text-center">
            
            {/* 4.9 Star Label */}
            <div className="inline-flex items-center space-x-3 bg-white rounded-xl p-4 shadow-[0_6px_20px_rgba(0,0,0,0.06)] mb-8">
              <div className="flex items-center space-x-1">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 text-[#febb02] fill-current" strokeWidth={1.75} />
                ))}
              </div>
              <div className="text-left">
                <div className="text-xl font-semibold text-gray-900">4.9</div>
                <div className="text-[12px] text-gray-600">Excellent – 50,000+ reviews</div>
              </div>
            </div>

            {/* 3 Customer Quotes - Compact */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-5xl mx-auto">
              
              <div className="bg-white rounded-xl p-4 shadow-[0_6px_20px_rgba(0,0,0,0.06)]">
                <div className="flex items-center space-x-2 mb-3">
                  <div className="w-8 h-8 bg-[#003580] rounded-full flex items-center justify-center">
                    <span className="text-white font-semibold text-[13px]">P</span>
                  </div>
                  <div className="text-left">
                    <div className="font-semibold text-gray-900 text-[14px]">Priya Sharma</div>
                    <div className="flex items-center">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className="w-3 h-3 text-[#febb02] fill-current" strokeWidth={1.75} />
                      ))}
                    </div>
                  </div>
                </div>
                <p className="text-[13px] text-gray-600 line-clamp-2">
                  "Saved ₹15,000 on Dubai trip – business class at economy price!"
                </p>
              </div>

              <div className="bg-white rounded-xl p-4 shadow-[0_6px_20px_rgba(0,0,0,0.06)]">
                <div className="flex items-center space-x-2 mb-3">
                  <div className="w-8 h-8 bg-[#0071c2] rounded-full flex items-center justify-center">
                    <span className="text-white font-semibold text-[13px]">R</span>
                  </div>
                  <div className="text-left">
                    <div className="font-semibold text-gray-900 text-[14px]">Rohit Kumar</div>
                    <div className="flex items-center">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className="w-3 h-3 text-[#febb02] fill-current" strokeWidth={1.75} />
                      ))}
                    </div>
                  </div>
                </div>
                <p className="text-[13px] text-gray-600 line-clamp-2">
                  "Professional service and instant confirmations. AI bargaining works perfectly!"
                </p>
              </div>

              <div className="bg-white rounded-xl p-4 shadow-[0_6px_20px_rgba(0,0,0,0.06)]">
                <div className="flex items-center space-x-2 mb-3">
                  <div className="w-8 h-8 bg-[#10b981] rounded-full flex items-center justify-center">
                    <span className="text-white font-semibold text-[13px]">A</span>
                  </div>
                  <div className="text-left">
                    <div className="font-semibold text-gray-900 text-[14px]">Anjali Patel</div>
                    <div className="flex items-center">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className="w-3 h-3 text-[#febb02] fill-current" strokeWidth={1.75} />
                      ))}
                    </div>
                  </div>
                </div>
                <p className="text-[13px] text-gray-600 line-clamp-2">
                  "Easy booking and great savings. Faredown's AI technology is revolutionary!"
                </p>
              </div>

            </div>
          </div>
        </section>

        {/* App CTA Band - Compact */}
        <section className="py-12 bg-[#003580] text-white">
          <div className="max-w-4xl mx-auto px-4 md:px-6 text-center">
            <div className="w-14 h-14 bg-[#febb02] rounded-xl flex items-center justify-center mx-auto mb-4">
              <Smartphone className="w-7 h-7 text-[#003580]" strokeWidth={1.75} />
            </div>
            <h2 className="text-3xl md:text-4xl font-semibold mb-3 tracking-tight">
              Travel Smarter. Bargain Better.
            </h2>
            <p className="text-[15px] md:text-base text-blue-200 mb-6">
              Download the Faredown app for exclusive mobile deals
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 max-w-md mx-auto">
              <Button className="bg-black hover:bg-gray-900 text-white py-2 px-4 rounded-xl flex items-center space-x-2 transition-colors duration-150">
                <Download className="w-4 h-4" strokeWidth={1.75} />
                <div className="text-left">
                  <div className="text-[10px] opacity-75">Download on the</div>
                  <div className="font-semibold text-[13px]">App Store</div>
                </div>
              </Button>
              <Button className="bg-black hover:bg-gray-900 text-white py-2 px-4 rounded-xl flex items-center space-x-2 transition-colors duration-150">
                <Download className="w-4 h-4" strokeWidth={1.75} />
                <div className="text-left">
                  <div className="text-[10px] opacity-75">Get it on</div>
                  <div className="font-semibold text-[13px]">Google Play</div>
                </div>
              </Button>
            </div>
          </div>
        </section>

        {/* Newsletter Band - Compact */}
        <section className="py-8 bg-gray-50">
          <div className="max-w-2xl mx-auto px-4 md:px-6 text-center">
            <h2 className="text-2xl md:text-3xl font-semibold text-gray-900 mb-3 tracking-tight">
              Stay ahead with secret travel bargains
            </h2>
            <p className="text-[15px] md:text-base text-gray-600 mb-6">
              Join 2M+ travelers getting exclusive deals
            </p>

            <div className="flex flex-col sm:flex-row max-w-md mx-auto gap-3">
              <Input
                type="email"
                placeholder="Enter your email"
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:border-[#003580] text-gray-900 text-[14px]"
              />
              <Button className="bg-[#febb02] hover:bg-[#e6a602] active:bg-[#d19900] text-black px-6 py-2 rounded-md font-medium text-[14px] transition-colors duration-150">
                Subscribe
              </Button>
            </div>
            <p className="text-[12px] text-gray-500 mt-3">No spam emails</p>
          </div>
        </section>

      </div>
    </div>
  );
}
