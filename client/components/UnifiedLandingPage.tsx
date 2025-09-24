import React from "react";
import { Link } from "react-router-dom";
import {
  Plane,
  Hotel,
  Camera,
  Car,
  Package,
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
  module: "flights" | "hotels" | "sightseeing" | "transfers" | "packages";
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

        {/* How it Works - Futuristic Glassmorphism Design */}
        <section className="py-16 md:py-24 bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50 relative overflow-hidden">
          {/* Animated Background */}
          <div className="absolute inset-0 bg-gradient-to-r from-blue-400/10 via-purple-400/10 to-cyan-400/10 animate-pulse"></div>
          <div
            className="absolute top-0 left-1/4 w-96 h-96 bg-blue-400/20 rounded-full blur-3xl animate-bounce"
            style={{ animationDuration: "6s" }}
          ></div>
          <div
            className="absolute bottom-0 right-1/4 w-64 h-64 bg-purple-400/20 rounded-full blur-3xl animate-bounce"
            style={{ animationDuration: "8s", animationDelay: "2s" }}
          ></div>

          <div className="max-w-7xl mx-auto px-6 relative">
            <div className="text-center mb-16">
              <div className="inline-flex items-center gap-2 bg-white/80 backdrop-blur-sm rounded-full px-6 py-2 mb-6 shadow-lg border border-white/20">
                <Sparkles className="w-5 h-5 text-[#febb02]" />
                <span className="text-sm font-semibold text-gray-700 tracking-wide">
                  AI-POWERED TECHNOLOGY
                </span>
              </div>
              <h2 className="text-3xl md:text-5xl font-bold text-gray-900 mb-6 tracking-tight">
                How It{" "}
                <span className="bg-gradient-to-r from-[#003580] to-[#0071c2] bg-clip-text text-transparent">
                  Works
                </span>
              </h2>
              <p className="text-lg md:text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
                Experience the future of travel with our revolutionary AI
                bargaining system
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Upgrade */}
              <div className="group relative h-full">
                <div className="absolute inset-0 bg-gradient-to-r from-[#003580] to-[#0071c2] rounded-3xl blur-xl opacity-25 group-hover:opacity-40 transition-opacity duration-300"></div>
                <div className="relative bg-white/80 backdrop-blur-lg rounded-3xl p-8 md:p-10 shadow-2xl border border-white/20 hover:shadow-3xl transition-all duration-300 hover:transform hover:scale-105 h-full flex flex-col">
                  <div className="absolute top-6 right-6 text-6xl font-bold text-gray-100/50">
                    01
                  </div>
                  <div className="mb-8">
                    <div className="w-20 h-20 bg-gradient-to-br from-[#003580] to-[#0071c2] rounded-2xl flex items-center justify-center mb-6 shadow-xl group-hover:shadow-2xl transition-shadow duration-300">
                      <Search
                        className="w-10 h-10 text-white"
                        strokeWidth={1.5}
                      />
                    </div>
                  </div>
                  <h3 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4">
                    Upgrade
                  </h3>
                  <div className="flex-grow">
                    <p className="text-base md:text-lg text-gray-600 leading-relaxed mb-4">
                      Your journey, your choice — rooms, seats, sightseeing or transfers.
                    </p>
                    <div className="h-10 flex items-center">
                      {/* Spacer to match other cards */}
                    </div>
                  </div>
                  <div className="w-full h-1 bg-gradient-to-r from-[#003580] to-[#0071c2] rounded-full mt-4"></div>
                </div>
              </div>

              {/* Bargain */}
              <div className="group relative h-full">
                <div className="absolute inset-0 bg-gradient-to-r from-[#0071c2] to-[#febb02] rounded-3xl blur-xl opacity-25 group-hover:opacity-40 transition-opacity duration-300"></div>
                <div className="relative bg-white/80 backdrop-blur-lg rounded-3xl p-8 md:p-10 shadow-2xl border border-white/20 hover:shadow-3xl transition-all duration-300 hover:transform hover:scale-105 h-full flex flex-col">
                  <div className="absolute top-6 right-6 text-6xl font-bold text-gray-100/50">
                    02
                  </div>
                  <div className="mb-8">
                    <div className="w-20 h-20 bg-gradient-to-br from-[#0071c2] to-[#febb02] rounded-2xl flex items-center justify-center mb-6 shadow-xl group-hover:shadow-2xl transition-shadow duration-300">
                      <TrendingUp
                        className="w-10 h-10 text-white"
                        strokeWidth={1.5}
                      />
                    </div>
                  </div>
                  <h3 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4">
                    Bargain
                  </h3>
                  <div className="flex-grow">
                    <p className="text-base md:text-lg text-gray-600 leading-relaxed mb-4">
                      AI negotiates live with suppliers —{" "}
                      <strong className="text-[#003580]">3 attempts</strong>,{" "}
                      <strong className="text-[#003580]">30-second</strong> timer.
                    </p>
                    <div className="h-10 flex items-center">
                      <div className="inline-flex items-center gap-2 bg-gradient-to-r from-[#0071c2] to-[#febb02] rounded-full px-4 py-2 text-white text-sm font-semibold">
                        <Clock className="w-4 h-4" />
                        <span>Real-time AI</span>
                      </div>
                    </div>
                  </div>
                  <div className="w-full h-1 bg-gradient-to-r from-[#0071c2] to-[#febb02] rounded-full mt-4"></div>
                </div>
              </div>

              {/* Book */}
              <div className="group relative h-full">
                <div className="absolute inset-0 bg-gradient-to-r from-[#febb02] to-[#003580] rounded-3xl blur-xl opacity-25 group-hover:opacity-40 transition-opacity duration-300"></div>
                <div className="relative bg-white/80 backdrop-blur-lg rounded-3xl p-8 md:p-10 shadow-2xl border border-white/20 hover:shadow-3xl transition-all duration-300 hover:transform hover:scale-105 h-full flex flex-col">
                  <div className="absolute top-6 right-6 text-6xl font-bold text-gray-100/50">
                    03
                  </div>
                  <div className="mb-8">
                    <div className="w-20 h-20 bg-gradient-to-br from-[#febb02] to-[#003580] rounded-2xl flex items-center justify-center mb-6 shadow-xl group-hover:shadow-2xl transition-shadow duration-300">
                      <CheckCircle
                        className="w-10 h-10 text-white"
                        strokeWidth={1.5}
                      />
                    </div>
                  </div>
                  <h3 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4">
                    Book
                  </h3>
                  <div className="flex-grow">
                    <p className="text-base md:text-lg text-gray-600 leading-relaxed mb-4">
                      Instant confirmation & support. Sleep suite tonight.
                    </p>
                    <div className="h-10 flex items-center">
                      {/* Spacer to match other cards */}
                    </div>
                  </div>
                  <div className="w-full h-1 bg-gradient-to-r from-[#febb02] to-[#003580] rounded-full mt-4"></div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Reviews & Trustpilot Section */}
        <section className="py-16 md:py-20 bg-gradient-to-br from-gray-900 via-slate-800 to-gray-900 text-white relative overflow-hidden">
          {/* Background Effects */}
          <div
            className={
              'absolute inset-0 bg-[url(\'data:image/svg+xml,%3Csvg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg"%3E%3Cg fill="none" fill-rule="evenodd"%3E%3Cg fill="%23ffffff" fill-opacity="0.05"%3E%3Ccircle cx="30" cy="30" r="1"/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\')]'
            }
          ></div>

          <div className="max-w-7xl mx-auto px-6 relative">
            {/* Trustpilot Header */}
            <div className="text-center mb-16">
              <div className="inline-flex items-center gap-4 bg-white/10 backdrop-blur-sm rounded-2xl px-8 py-4 mb-8 border border-white/20">
                <img
                  src="/assets/partners/trustpilot/trustpilot-wordmark-dark.svg"
                  alt="Trustpilot rating"
                  className="h-8 w-auto brightness-0 invert"
                />
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className="w-6 h-6 text-[#00B67A] fill-current"
                      />
                    ))}
                  </div>
                  <a
                    href="#"
                    className="text-xl font-bold text-white hover:text-[#00B67A] transition-colors focus:outline-none focus:ring-2 focus:ring-[#00B67A] focus:ring-offset-2 focus:ring-offset-gray-900 rounded-md px-2 py-1"
                    aria-label="Trustpilot rating: 4.9 out of 5 stars with 50k+ reviews"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    4.9 • 50k+ reviews
                  </a>
                </div>
              </div>

              <h2 className="text-3xl md:text-5xl font-bold mb-6 tracking-tight">
                Trusted by{" "}
                <span className="bg-gradient-to-r from-[#00B67A] to-[#febb02] bg-clip-text text-transparent">
                  Travelers Worldwide
                </span>
              </h2>
              <p className="text-lg md:text-xl text-gray-300 max-w-3xl mx-auto">
                See what our community says about their AI bargaining
                experiences
              </p>
            </div>

            {/* Customer Reviews */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* Review 1 */}
              <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 md:p-8 border border-white/20 hover:bg-white/15 transition-all duration-300">
                <div className="flex items-center gap-1 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className="w-5 h-5 text-[#febb02] fill-current"
                    />
                  ))}
                </div>
                <p className="text-gray-200 mb-6 italic leading-relaxed">
                  "AI bargaining saved me ₹45,000 on my Dubai honeymoon! Got
                  upgraded to a luxury suite for the price of a standard room.
                  Absolutely revolutionary!"
                </p>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-[#003580] to-[#0071c2] rounded-full flex items-center justify-center text-white font-bold text-lg">
                    P
                  </div>
                  <div>
                    <div className="font-semibold text-white">Priya Sharma</div>
                    <div className="text-sm text-gray-400">Mumbai, India</div>
                  </div>
                </div>
              </div>

              {/* Review 2 */}
              <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 md:p-8 border border-white/20 hover:bg-white/15 transition-all duration-300">
                <div className="flex items-center gap-1 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className="w-5 h-5 text-[#febb02] fill-current"
                    />
                  ))}
                </div>
                <p className="text-gray-200 mb-6 italic leading-relaxed">
                  "Business class upgrade on my London trip through AI
                  bargaining. The technology is mind-blowing – instant
                  confirmations every time!"
                </p>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-[#0071c2] to-[#febb02] rounded-full flex items-center justify-center text-white font-bold text-lg">
                    R
                  </div>
                  <div>
                    <div className="font-semibold text-white">Rohit Kumar</div>
                    <div className="text-sm text-gray-400">Delhi, India</div>
                  </div>
                </div>
              </div>

              {/* Review 3 */}
              <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 md:p-8 border border-white/20 hover:bg-white/15 transition-all duration-300">
                <div className="flex items-center gap-1 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className="w-5 h-5 text-[#febb02] fill-current"
                    />
                  ))}
                </div>
                <p className="text-gray-200 mb-6 italic leading-relaxed">
                  "Faredown's AI technology delivers incredible savings
                  consistently! I've used it for 5 trips now – each time better
                  deals than I could imagine."
                </p>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-[#febb02] to-[#003580] rounded-full flex items-center justify-center text-white font-bold text-lg">
                    A
                  </div>
                  <div>
                    <div className="font-semibold text-white">Anjali Patel</div>
                    <div className="text-sm text-gray-400">
                      Bangalore, India
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Trustpilot Widget Placeholder */}
            <div className="mt-12 text-center">
              <div className="inline-block bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10">
                <div
                  className="trustpilot-widget"
                  data-locale="en-US"
                  data-template-id="PLACEHOLDER_TEMPLATE_ID"
                  data-businessunit-id="YOUR_BUSINESS_UNIT_ID"
                  data-style-width="100%"
                  data-style-height="24"
                  data-theme="dark"
                >
                  <p className="text-gray-400 text-sm">
                    Official Trustpilot widget will load here
                  </p>
                  {/* Widget will be loaded here when Trustpilot script is added:
                       <script async src="https://widget.trustpilot.com/bootstrap/v5/tp.widget.bootstrap.min.js"></script> */}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Get the Faredown App - Modern Design */}
        <section className="py-16 md:py-24 bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 text-white relative overflow-hidden">
          {/* Animated Background */}
          <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 via-purple-600/20 to-pink-600/20"></div>
          <div className="absolute top-1/4 left-1/3 w-72 h-72 bg-blue-500/30 rounded-full blur-3xl animate-pulse"></div>
          <div
            className="absolute bottom-1/4 right-1/3 w-64 h-64 bg-purple-500/30 rounded-full blur-3xl animate-pulse"
            style={{ animationDelay: "1s" }}
          ></div>

          <div className="max-w-7xl mx-auto px-6 relative">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
              {/* Left Side - Content */}
              <div className="text-center lg:text-left">
                <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-4 py-2 mb-6">
                  <Smartphone className="w-5 h-5 text-[#febb02]" />
                  <span className="text-sm font-semibold tracking-wide">
                    MOBILE APP
                  </span>
                </div>

                <h2 className="text-4xl md:text-6xl font-bold mb-6 tracking-tight">
                  Get the{" "}
                  <span className="bg-gradient-to-r from-[#febb02] to-[#ff6b6b] bg-clip-text text-transparent">
                    Faredown
                  </span>{" "}
                  App
                </h2>

                <p className="text-lg md:text-xl text-gray-200 mb-8 max-w-lg lg:max-w-none">
                  Exclusive mobile deals and instant AI bargaining on the go.
                  Download now for premium travel experiences.
                </p>

                {/* Features Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10">
                  <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                    <Smartphone className="w-6 h-6 text-[#febb02] mb-2 mx-auto sm:mx-0" />
                    <p className="text-sm font-semibold text-center sm:text-left">
                      Mobile-only upgrades
                    </p>
                  </div>
                  <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                    <Zap className="w-6 h-6 text-[#febb02] mb-2 mx-auto sm:mx-0" />
                    <p className="text-sm font-semibold text-center sm:text-left">
                      Live counteroffers
                    </p>
                  </div>
                  <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                    <CheckCircle className="w-6 h-6 text-[#febb02] mb-2 mx-auto sm:mx-0" />
                    <p className="text-sm font-semibold text-center sm:text-left">
                      One-tap checkout
                    </p>
                  </div>
                </div>

                {/* Download Buttons */}
                <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                  <a
                    href="https://apps.apple.com/app/faredown"
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="Download Faredown on the App Store"
                    className="group bg-black/50 backdrop-blur-sm rounded-2xl p-4 border border-white/20 hover:bg-black/70 transition-all duration-300 hover:transform hover:scale-105"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center">
                        <span className="text-black font-bold text-lg"></span>
                      </div>
                      <div className="text-left">
                        <div className="text-xs text-gray-300">
                          Download on the
                        </div>
                        <div className="text-lg font-semibold">App Store</div>
                      </div>
                    </div>
                  </a>

                  <a
                    href="https://play.google.com/store/apps/details?id=com.faredown.app"
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="Get Faredown on Google Play"
                    className="group bg-black/50 backdrop-blur-sm rounded-2xl p-4 border border-white/20 hover:bg-black/70 transition-all duration-300 hover:transform hover:scale-105"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center">
                        <span className="text-black font-bold text-lg">▶</span>
                      </div>
                      <div className="text-left">
                        <div className="text-xs text-gray-300">Get it on</div>
                        <div className="text-lg font-semibold">Google Play</div>
                      </div>
                    </div>
                  </a>
                </div>
              </div>

              {/* Right Side - Phone Mockup */}
              <div className="relative flex justify-center lg:justify-end">
                <div className="relative">
                  {/* Phone Frame */}
                  <div className="w-72 h-[600px] bg-gradient-to-b from-gray-800 to-gray-900 rounded-[3rem] p-2 shadow-2xl">
                    <div className="w-full h-full bg-gradient-to-br from-[#003580] to-[#0071c2] rounded-[2.5rem] relative overflow-hidden">
                      {/* Screen Content */}
                      <div className="absolute inset-4 bg-white rounded-[2rem] flex flex-col">
                        {/* Status Bar */}
                        <div className="h-6 bg-gray-100 rounded-t-[2rem] flex items-center justify-between px-4">
                          <div className="text-xs font-semibold">9:41</div>
                          <div className="flex gap-1">
                            <div className="w-4 h-2 bg-green-500 rounded-sm"></div>
                          </div>
                        </div>

                        {/* App Content */}
                        <div className="flex-1 p-4 bg-gradient-to-br from-blue-50 to-indigo-50">
                          <div className="text-center mb-4">
                            <div className="w-12 h-12 bg-gradient-to-br from-[#003580] to-[#0071c2] rounded-xl mx-auto mb-2 flex items-center justify-center">
                              <img
                                src="https://cdn.builder.io/api/v1/image/assets%2F4235b10530ff469795aa00c0333d773c%2F6610cbb1369a49b6a98ce99413f8d9ae?format=webp&width=800"
                                alt="Faredown Logo"
                                className="w-6 h-6 object-contain"
                                style={{
                                  background: "none",
                                  border: "none",
                                  boxShadow: "none",
                                }}
                              />
                            </div>
                            <h3 className="text-lg font-bold text-gray-900">
                              faredown.com
                            </h3>
                            <p className="text-sm text-gray-600">
                              AI Travel Bargains
                            </p>
                          </div>

                          <div className="space-y-3">
                            <div className="bg-white rounded-xl p-3 shadow-sm">
                              <div className="text-sm font-semibold text-gray-900">
                                Current Bargain
                              </div>
                              <div className="text-xs text-green-600">
                                Suite Upgrade → ₹12,000 saved!
                              </div>
                            </div>
                            <div className="bg-white rounded-xl p-3 shadow-sm">
                              <div className="text-sm font-semibold text-gray-900">
                                AI Status
                              </div>
                              <div className="text-xs text-blue-600">
                                Negotiating... 2/3 attempts
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Glow Effect */}
                      <div className="absolute inset-0 bg-gradient-to-r from-blue-400/20 to-purple-400/20 rounded-[2.5rem] animate-pulse"></div>
                    </div>
                  </div>

                  {/* Floating Elements */}
                  <div className="absolute -top-4 -right-4 w-8 h-8 bg-[#febb02] rounded-full animate-bounce"></div>
                  <div
                    className="absolute -bottom-4 -left-4 w-6 h-6 bg-purple-400 rounded-full animate-bounce"
                    style={{ animationDelay: "0.5s" }}
                  ></div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Newsletter - Modern & Engaging */}
        <section className="py-16 md:py-24 bg-gradient-to-br from-blue-50 via-white to-indigo-50 relative overflow-hidden">
          <div className="absolute top-1/4 right-1/4 w-64 h-64 bg-blue-200/30 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-1/4 left-1/4 w-48 h-48 bg-indigo-200/30 rounded-full blur-3xl animate-pulse"></div>

          <div className="max-w-6xl mx-auto px-6 relative">
            <div className="text-center mb-12">
              <div className="inline-flex items-center gap-2 bg-white/80 backdrop-blur-sm rounded-full px-6 py-2 mb-6 shadow-lg border border-white/20">
                <Star className="w-5 h-5 text-[#febb02]" />
                <span className="text-sm font-semibold text-gray-700 tracking-wide">
                  EXCLUSIVE DEALS
                </span>
              </div>

              <h2 className="text-3xl md:text-5xl font-bold text-gray-900 mb-6 tracking-tight">
                Stay Ahead with{" "}
                <span className="bg-gradient-to-r from-[#003580] to-[#0071c2] bg-clip-text text-transparent">
                  Exclusive Deals
                </span>
              </h2>
              <p className="text-lg md:text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
                Join 2M+ smart travelers getting secret bargains and AI-powered
                deals delivered to your inbox
              </p>
            </div>

            <div className="max-w-3xl mx-auto">
              {/* Stats */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
                <div className="text-center bg-white/60 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
                  <div className="text-2xl md:text-3xl font-bold text-[#003580] mb-2">
                    2M+
                  </div>
                  <div className="text-sm text-gray-600">
                    Active Subscribers
                  </div>
                </div>
                <div className="text-center bg-white/60 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
                  <div className="text-2xl md:text-3xl font-bold text-[#0071c2] mb-2">
                    ₹50K
                  </div>
                  <div className="text-sm text-gray-600">
                    Avg. Monthly Savings
                  </div>
                </div>
                <div className="text-center bg-white/60 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
                  <div className="text-2xl md:text-3xl font-bold text-[#febb02] mb-2">
                    24/7
                  </div>
                  <div className="text-sm text-gray-600">AI Deal Alerts</div>
                </div>
              </div>

              {/* Email Signup */}
              <div className="bg-white/80 backdrop-blur-lg rounded-3xl p-6 md:p-8 shadow-2xl border border-white/20">
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="flex-1">
                    <Input
                      type="email"
                      placeholder="Enter your email address"
                      className="w-full h-14 px-6 bg-white/90 border-2 border-gray-200 rounded-2xl text-gray-900 placeholder:text-gray-500 focus:border-[#0071c2] focus:ring-4 focus:ring-[#0071c2]/20 transition-all duration-150 text-base"
                    />
                  </div>
                  <Button className="bg-gradient-to-r from-[#003580] to-[#0071c2] hover:from-[#002966] hover:to-[#005fa3] text-white px-8 py-4 h-14 rounded-2xl font-bold transition-all duration-150 shadow-lg hover:shadow-xl transform hover:scale-105 whitespace-nowrap">
                    Get Exclusive Deals
                  </Button>
                </div>

                <div className="flex items-center justify-center gap-6 mt-6 text-sm text-gray-600">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <span>No spam, ever</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Shield className="w-4 h-4 text-blue-500" />
                    <span>Secure & private</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Zap className="w-4 h-4 text-yellow-500" />
                    <span>Instant delivery</span>
                  </div>
                </div>
              </div>

              {/* Social Proof */}
              <div className="text-center mt-8">
                <p className="text-sm text-gray-500 mb-4">
                  Trusted by travelers from 195+ countries
                </p>
                <div className="flex items-center justify-center gap-2">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className="w-5 h-5 text-[#febb02] fill-current"
                    />
                  ))}
                  <span className="ml-2 text-sm font-semibold text-gray-600">
                    4.9/5 from 50,000+ reviews
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
