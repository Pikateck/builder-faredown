import React, { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import {
  Sparkles,
  Target,
  Crown,
  Star,
  Play,
  Download,
  Smartphone,
  Zap,
  Headphones,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { LandingPageSearchPanel } from "@/components/LandingPageSearchPanel";

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
      {/* ========== FRESH MOBILE REDESIGN STARTS HERE ========== */}

      {/* AI Hero Banner - Mobile */}
      <section className="md:hidden relative bg-gradient-to-br from-[#003580] via-[#0071c2] to-[#003580] py-20 overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-4 left-4 w-24 h-24 bg-[#febb02] rounded-full blur-2xl animate-pulse"></div>
          <div className="absolute bottom-8 right-4 w-32 h-32 bg-white rounded-full blur-3xl"></div>
        </div>

        <div className="relative px-6 text-center text-white">
          <div className="inline-flex items-center space-x-2 bg-[#febb02] text-[#003580] px-4 py-2 rounded-full mb-8 font-bold text-sm">
            <Sparkles className="w-4 h-4" />
            <span>AI that bargains while you relax</span>
          </div>

          <h2 className="text-4xl font-black mb-6 leading-tight">
            Save more,
            <br />
            fly smarter.
          </h2>

          <Button className="bg-[#febb02] hover:bg-[#e6a602] text-[#003580] font-bold px-10 py-4 rounded-full text-lg">
            Start Bargaining Now
          </Button>
        </div>
      </section>

      {/* Minimal Benefits - Mobile */}
      <section className="md:hidden py-16 bg-white">
        <div className="px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-black text-gray-900 mb-4">
              Your fare, your win.
            </h2>
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-[#003580] to-[#0071c2] rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Zap className="w-8 h-8 text-white" />
              </div>
              <h3 className="font-bold text-gray-900">Bargain in seconds</h3>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-[#003580] to-[#0071c2] rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Crown className="w-8 h-8 text-white" />
              </div>
              <h3 className="font-bold text-gray-900">
                AI upgrades your journey
              </h3>
            </div>
          </div>
        </div>
      </section>

      {/* Trust Section - Mobile */}
      <section className="md:hidden py-16 bg-gray-50">
        <div className="px-6 text-center">
          <h2 className="text-2xl font-black text-gray-900 mb-8">
            4.9★ – Loved by travelers worldwide
          </h2>

          <div className="space-y-6">
            <div className="bg-white rounded-2xl p-6 shadow-lg">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-[#003580] to-[#0071c2] rounded-full flex items-center justify-center">
                  <span className="text-white font-bold">P</span>
                </div>
                <div className="text-left">
                  <div className="font-bold text-gray-900">Priya Sharma</div>
                  <div className="flex items-center">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className="w-4 h-4 text-[#febb02] fill-current"
                      />
                    ))}
                  </div>
                </div>
              </div>
              <p className="text-gray-700 text-left">
                "Saved ₹15,000 on my Dubai trip – business class at economy
                price!"
              </p>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-lg">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-[#003580] to-[#0071c2] rounded-full flex items-center justify-center">
                  <span className="text-white font-bold">R</span>
                </div>
                <div className="text-left">
                  <div className="font-bold text-gray-900">Rohit Kumar</div>
                  <div className="flex items-center">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className="w-4 h-4 text-[#febb02] fill-current"
                      />
                    ))}
                  </div>
                </div>
              </div>
              <p className="text-gray-700 text-left">
                "Suite upgrade in Singapore using AI Bargaining –
                revolutionary!"
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Flight Search Panel - Responsive */}
      <LandingPageSearchPanel />

      {/* App Download - Mobile */}
      <section className="md:hidden py-16 bg-[#003580] text-white">
        <div className="px-6 text-center">
          <div className="w-20 h-20 bg-[#febb02] rounded-2xl flex items-center justify-center mx-auto mb-6">
            <Smartphone className="w-10 h-10 text-[#003580]" />
          </div>

          <h2 className="text-2xl font-bold mb-4">
            Your AI travel companion, in your pocket.
          </h2>
          <p className="text-blue-100 mb-8">
            Download for exclusive mobile deals
          </p>

          <div className="space-y-4">
            <Button className="w-full bg-black hover:bg-gray-900 text-white py-4 rounded-xl flex items-center justify-center space-x-3">
              <Download className="w-5 h-5" />
              <div className="text-left">
                <div className="text-xs opacity-75">Download on the</div>
                <div className="font-bold">App Store</div>
              </div>
            </Button>

            <Button className="w-full bg-black hover:bg-gray-900 text-white py-4 rounded-xl flex items-center justify-center space-x-3">
              <Download className="w-5 h-5" />
              <div className="text-left">
                <div className="text-xs opacity-75">Get it on</div>
                <div className="font-bold">Google Play</div>
              </div>
            </Button>
          </div>
        </div>
      </section>

      {/* ========== FRESH DESKTOP REDESIGN STARTS HERE ========== */}

      {/* Premium AI Hero Section */}
      <section className="hidden md:block relative py-32 bg-gradient-to-br from-slate-50 via-white to-blue-50/30 overflow-hidden">
        <div className="absolute inset-0 opacity-5">
          <div className="absolute top-20 left-20 w-96 h-96 bg-gradient-to-r from-[#003580] to-[#0071c2] rounded-full blur-3xl"></div>
          <div className="absolute bottom-20 right-20 w-80 h-80 bg-gradient-to-r from-[#febb02] to-[#e6a602] rounded-full blur-3xl"></div>
        </div>

        <div className="relative max-w-7xl mx-auto px-8 text-center">
          <div className="inline-flex items-center space-x-3 bg-gradient-to-r from-[#003580] to-[#0071c2] text-white px-8 py-4 rounded-full mb-12 shadow-lg">
            <Sparkles className="w-5 h-5" />
            <span className="font-bold text-lg">
              AI that bargains while you relax
            </span>
          </div>

          <h1 className="text-7xl md:text-8xl font-black text-gray-900 mb-16 leading-tight">
            Save more,
            <br />
            <span className="bg-gradient-to-r from-[#003580] to-[#0071c2] bg-clip-text text-transparent">
              fly smarter.
            </span>
          </h1>

          <div className="flex flex-col sm:flex-row items-center justify-center space-y-6 sm:space-y-0 sm:space-x-8 mb-20">
            <Button className="bg-[#febb02] hover:bg-[#e6a602] text-[#003580] font-bold text-xl px-16 py-6 rounded-full shadow-xl hover:shadow-2xl transition-all transform hover:scale-105">
              Start Bargaining Now
            </Button>

            <Button
              variant="outline"
              className="border-2 border-[#003580] text-[#003580] hover:bg-[#003580] hover:text-white font-bold text-xl px-16 py-6 rounded-full"
            >
              <Play className="w-6 h-6 mr-3" />
              Watch Demo
            </Button>
          </div>

          {/* Hero Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 max-w-5xl mx-auto">
            <div className="bg-white/80 backdrop-blur-sm border border-white/20 rounded-3xl p-8 shadow-lg">
              <div className="text-5xl font-black text-[#003580] mb-3">60%</div>
              <div className="text-gray-600 font-medium text-lg">
                Average savings
              </div>
            </div>

            <div className="bg-white/80 backdrop-blur-sm border border-white/20 rounded-3xl p-8 shadow-lg">
              <div className="text-5xl font-black text-[#003580] mb-3">2M+</div>
              <div className="text-gray-600 font-medium text-lg">
                Happy travelers
              </div>
            </div>

            <div className="bg-white/80 backdrop-blur-sm border border-white/20 rounded-3xl p-8 shadow-lg">
              <div className="text-5xl font-black text-[#003580] mb-3">
                4.9★
              </div>
              <div className="text-gray-600 font-medium text-lg">
                Customer rating
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Minimal Benefits Section */}
      <section className="hidden md:block py-24 bg-white">
        <div className="max-w-7xl mx-auto px-8">
          <div className="text-center mb-20">
            <h2 className="text-6xl font-black text-gray-900 mb-4">
              Your fare, <span className="text-[#003580]">your win.</span>
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-12 max-w-6xl mx-auto">
            <div className="text-center group">
              <div className="w-24 h-24 bg-gradient-to-br from-[#003580] to-[#0071c2] rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-lg group-hover:scale-110 transition-transform">
                <Zap className="w-12 h-12 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900">
                Bargain in seconds
              </h3>
            </div>

            <div className="text-center group">
              <div className="w-24 h-24 bg-gradient-to-br from-[#003580] to-[#0071c2] rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-lg group-hover:scale-110 transition-transform">
                <Crown className="w-12 h-12 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900">
                AI upgrades your journey
              </h3>
            </div>

            <div className="text-center group">
              <div className="w-24 h-24 bg-gradient-to-br from-[#003580] to-[#0071c2] rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-lg group-hover:scale-110 transition-transform">
                <Target className="w-12 h-12 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900">
                Your fare, your win
              </h3>
            </div>

            <div className="text-center group">
              <div className="w-24 h-24 bg-gradient-to-br from-[#003580] to-[#0071c2] rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-lg group-hover:scale-110 transition-transform">
                <Star className="w-12 h-12 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900">
                Trusted worldwide
              </h3>
            </div>
          </div>
        </div>
      </section>

      {/* Trust & Social Proof */}
      <section className="hidden md:block py-20 bg-gradient-to-b from-gray-50 to-white">
        <div className="max-w-7xl mx-auto px-8">
          <div className="text-center mb-16">
            <h2 className="text-5xl font-black text-gray-900 mb-8">
              4.9★ – Loved by travelers worldwide
            </h2>
          </div>

          {/* Customer Reviews */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            <div className="bg-white rounded-3xl p-8 shadow-lg hover:shadow-xl transition-shadow">
              <div className="flex items-center space-x-4 mb-6">
                <div className="w-16 h-16 bg-gradient-to-br from-[#003580] to-[#0071c2] rounded-full flex items-center justify-center">
                  <span className="text-white font-bold text-xl">P</span>
                </div>
                <div>
                  <div className="font-bold text-gray-900">Priya Sharma</div>
                  <div className="text-gray-500 text-sm">Marketing Manager</div>
                </div>
              </div>

              <div className="flex items-center space-x-1 mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className="w-5 h-5 text-[#febb02] fill-current"
                  />
                ))}
              </div>

              <blockquote className="text-gray-700 leading-relaxed text-lg">
                "Saved ₹15,000 on my Dubai trip – business class at economy
                price!"
              </blockquote>
            </div>

            <div className="bg-white rounded-3xl p-8 shadow-lg hover:shadow-xl transition-shadow">
              <div className="flex items-center space-x-4 mb-6">
                <div className="w-16 h-16 bg-gradient-to-br from-[#003580] to-[#0071c2] rounded-full flex items-center justify-center">
                  <span className="text-white font-bold text-xl">R</span>
                </div>
                <div>
                  <div className="font-bold text-gray-900">Rohit Kumar</div>
                  <div className="text-gray-500 text-sm">Software Engineer</div>
                </div>
              </div>

              <div className="flex items-center space-x-1 mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className="w-5 h-5 text-[#febb02] fill-current"
                  />
                ))}
              </div>

              <blockquote className="text-gray-700 leading-relaxed text-lg">
                "Suite upgrade in Singapore using AI Bargaining –
                revolutionary!"
              </blockquote>
            </div>

            <div className="bg-white rounded-3xl p-8 shadow-lg hover:shadow-xl transition-shadow">
              <div className="flex items-center space-x-4 mb-6">
                <div className="w-16 h-16 bg-gradient-to-br from-[#003580] to-[#0071c2] rounded-full flex items-center justify-center">
                  <span className="text-white font-bold text-xl">A</span>
                </div>
                <div>
                  <div className="font-bold text-gray-900">Anjali Patel</div>
                  <div className="text-gray-500 text-sm">Product Designer</div>
                </div>
              </div>

              <div className="flex items-center space-x-1 mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className="w-5 h-5 text-[#febb02] fill-current"
                  />
                ))}
              </div>

              <blockquote className="text-gray-700 leading-relaxed text-lg">
                "Easy booking + instant savings. Faredown is my go-to travel
                app."
              </blockquote>
            </div>
          </div>
        </div>
      </section>

      {/* Mobile App CTA */}
      <section className="hidden md:block py-20 bg-[#003580] text-white">
        <div className="max-w-5xl mx-auto px-8 text-center">
          <div className="w-28 h-28 bg-[#febb02] rounded-3xl flex items-center justify-center mx-auto mb-8">
            <Smartphone className="w-14 h-14 text-[#003580]" />
          </div>

          <h2 className="text-5xl font-black mb-8">
            Travel Smarter. Bargain Better.
            <br />
            <span className="text-[#febb02]">On the Go.</span>
          </h2>

          <p className="text-xl text-blue-100 mb-12">
            Get the Faredown app for instant bargains and exclusive deals.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-6 mb-12">
            <div className="flex items-center space-x-2 text-blue-100">
              <Zap className="w-5 h-5 text-[#febb02]" />
              <span>Instant alerts</span>
            </div>
            <div className="flex items-center space-x-2 text-blue-100">
              <Smartphone className="w-5 h-5 text-[#febb02]" />
              <span>Mobile exclusive deals</span>
            </div>
            <div className="flex items-center space-x-2 text-blue-100">
              <Headphones className="w-5 h-5 text-[#febb02]" />
              <span>Offline support</span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-6">
            <Button className="bg-black hover:bg-gray-900 text-white py-6 px-8 rounded-2xl flex items-center space-x-4 text-lg">
              <Download className="w-6 h-6" />
              <div className="text-left">
                <div className="text-sm opacity-75">Download on the</div>
                <div className="font-bold">App Store</div>
              </div>
            </Button>

            <Button className="bg-black hover:bg-gray-900 text-white py-6 px-8 rounded-2xl flex items-center space-x-4 text-lg">
              <Download className="w-6 h-6" />
              <div className="text-left">
                <div className="text-sm opacity-75">Get it on</div>
                <div className="font-bold">Google Play</div>
              </div>
            </Button>
          </div>
        </div>
      </section>

      {/* Newsletter Signup */}
      <section className="hidden md:block py-20 bg-gray-50">
        <div className="max-w-4xl mx-auto px-8 text-center">
          <h2 className="text-4xl font-black text-gray-900 mb-6">
            Book smarter with AI
          </h2>
          <p className="text-xl text-gray-600 mb-12">
            Join 2M+ travelers getting exclusive deals
          </p>

          <div className="flex flex-col sm:flex-row max-w-lg mx-auto space-y-4 sm:space-y-0 sm:space-x-4">
            <input
              type="email"
              placeholder="Enter your email"
              className="flex-1 px-6 py-5 border border-gray-300 rounded-2xl focus:outline-none focus:border-[#003580] text-gray-900 text-lg"
            />
            <Button className="bg-[#003580] hover:bg-[#0071c2] text-white px-10 py-5 rounded-2xl font-bold text-lg">
              Subscribe
            </Button>
          </div>
        </div>
      </section>
    </Layout>
  );
}
