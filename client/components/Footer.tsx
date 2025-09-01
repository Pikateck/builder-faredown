import React from "react";
import { useNavigate } from "react-router-dom";
import { Facebook, Instagram, Twitter, Linkedin, Star } from "lucide-react";

export function Footer() {
  const navigate = useNavigate();

  const handleNavigation = (path: string) => {
    navigate(path);
    window.scrollTo(0, 0);
  };

  return (
    <footer
      className="bg-gradient-to-br from-[#001a33] via-[#003580] to-[#001a33] text-white relative overflow-hidden"
      data-footer-version="v7"
    >
      {/* Background Effects */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-400/20 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 right-1/4 w-64 h-64 bg-purple-400/20 rounded-full blur-3xl"></div>
      </div>

      {/* Main Content */}
      <div className="relative mx-auto max-w-7xl px-6 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12">
          {/* Brand Section */}
          <div className="lg:col-span-1">
            <div className="flex items-center gap-3 mb-6">
              <img
                src="https://cdn.builder.io/api/v1/image/assets%2F4235b10530ff469795aa00c0333d773c%2F101d62bb04d544d490348a0108724dfb?format=webp&width=800"
                alt="Faredown Logo"
                className="w-10 h-10 object-contain"
                style={{
                  background: "none",
                  border: "none",
                  boxShadow: "none",
                }}
              />
              <div>
                <span className="text-2xl font-bold text-white block">
                  faredown.com
                </span>
                <span className="text-blue-200 text-sm">
                  AI Travel Bargain Platform
                </span>
              </div>
            </div>
            <p className="text-blue-100 text-sm leading-relaxed mb-6">
              Experience the future of travel with our revolutionary AI
              bargaining technology. Get premium upgrades at your price.
            </p>

            {/* Trust Badge */}
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
              <div className="flex items-center gap-2 mb-2">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className="w-4 h-4 text-[#febb02] fill-current"
                  />
                ))}
                <span className="text-white font-semibold text-sm">4.9</span>
              </div>
              <p className="text-blue-200 text-xs">50,000+ verified reviews</p>
            </div>
          </div>

          {/* Quick Links */}
          <div className="lg:col-span-1">
            <h3 className="text-lg font-semibold text-white mb-6">
              Quick Links
            </h3>
            <nav className="space-y-3">
              {[
                { label: "Help Center", path: "/help-center" },
                { label: "Contact Us", path: "/contact" },
                { label: "About Us", path: "/about" },
                { label: "How It Works", path: "/how-it-works" },
              ].map((item) => (
                <button
                  key={item.label}
                  onClick={() => handleNavigation(item.path)}
                  className="block text-blue-200 hover:text-white transition-colors duration-150 text-sm"
                >
                  {item.label}
                </button>
              ))}
            </nav>
          </div>

          {/* Policies */}
          <div className="lg:col-span-1">
            <h3 className="text-lg font-semibold text-white mb-6">Policies</h3>
            <nav className="space-y-3">
              {[
                { label: "Privacy Policy", path: "/privacy-policy" },
                { label: "Terms of Service", path: "/terms" },
                { label: "Cancellation Policy", path: "/cancellation-policy" },
                { label: "Refunds", path: "/refunds" },
              ].map((item) => (
                <button
                  key={item.label}
                  onClick={() => handleNavigation(item.path)}
                  className="block text-blue-200 hover:text-white transition-colors duration-150 text-sm"
                >
                  {item.label}
                </button>
              ))}
            </nav>
          </div>

          {/* Newsletter & Social */}
          <div className="lg:col-span-1">
            <h3 className="text-lg font-semibold text-white mb-6">
              Stay Connected
            </h3>

            {/* Newsletter Signup */}
            <div className="mb-8">
              <form className="space-y-3">
                <input
                  type="email"
                  placeholder="Your email address"
                  className="w-full h-12 px-4 rounded-xl bg-white/10 backdrop-blur-sm border border-white/20 text-white placeholder:text-blue-200 focus:ring-2 focus:ring-[#febb02] focus:border-transparent focus:outline-none transition-all duration-150 text-sm"
                />
                <button
                  type="submit"
                  className="w-full h-12 bg-gradient-to-r from-[#febb02] to-[#e6a602] hover:from-[#e6a602] hover:to-[#d19502] text-black font-semibold rounded-xl transition-all duration-150 shadow-lg hover:shadow-xl transform hover:scale-105 text-sm"
                >
                  Subscribe
                </button>
              </form>
              <p className="text-blue-200 text-xs mt-2">
                Get exclusive deals & AI travel tips
              </p>
            </div>

            {/* Social Links */}
            <div>
              <p className="text-sm font-medium text-white mb-4">Follow Us</p>
              <div className="flex gap-3">
                <a
                  href="#"
                  aria-label="Facebook"
                  className="w-10 h-10 rounded-xl bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center hover:bg-white/20 hover:scale-110 transition-all duration-150 group"
                >
                  <Facebook
                    className="w-5 h-5 text-blue-200 group-hover:text-white transition-colors duration-150"
                    strokeWidth={1.5}
                  />
                </a>
                <a
                  href="#"
                  aria-label="Instagram"
                  className="w-10 h-10 rounded-xl bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center hover:bg-white/20 hover:scale-110 transition-all duration-150 group"
                >
                  <Instagram
                    className="w-5 h-5 text-blue-200 group-hover:text-white transition-colors duration-150"
                    strokeWidth={1.5}
                  />
                </a>
                <a
                  href="#"
                  aria-label="X"
                  className="w-10 h-10 rounded-xl bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center hover:bg-white/20 hover:scale-110 transition-all duration-150 group"
                >
                  <Twitter
                    className="w-5 h-5 text-blue-200 group-hover:text-white transition-colors duration-150"
                    strokeWidth={1.5}
                  />
                </a>
                <a
                  href="#"
                  aria-label="LinkedIn"
                  className="w-10 h-10 rounded-xl bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center hover:bg-white/20 hover:scale-110 transition-all duration-150 group"
                >
                  <Linkedin
                    className="w-5 h-5 text-blue-200 group-hover:text-white transition-colors duration-150"
                    strokeWidth={1.5}
                  />
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-white/20 bg-black/20 backdrop-blur-sm">
        <div className="mx-auto max-w-7xl px-6 py-6">
          <div className="text-center">
            <div className="text-sm text-blue-200">
              © 2025 Faredown Bookings and Travels Pvt Ltd. All rights
              reserved.
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
