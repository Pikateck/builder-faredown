import React from "react";
import { useNavigate } from "react-router-dom";
import { Facebook, Instagram, Twitter, Linkedin } from "lucide-react";

export function Footer() {
  const navigate = useNavigate();

  const handleNavigation = (path: string) => {
    navigate(path);
    window.scrollTo(0, 0);
  };

  return (
    <footer className="bg-[#003580] text-white" data-footer-version="v6">
      {/* Main Content - Ultra Compact */}
      <div className="mx-auto max-w-7xl px-4 py-4">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          {/* Left: Brand + Links */}
          <div className="flex flex-col md:flex-row items-center gap-6">
            <div className="flex items-center gap-3">
              <img
                src="https://cdn.builder.io/api/v1/image/assets%2F4235b10530ff469795aa00c0333d773c%2Fb099b42735944c35a1612487d092bd48?format=webp&width=800"
                alt="Faredown"
                className="w-8 h-8"
              />
              <div className="flex flex-col">
                <span className="text-xl font-medium text-white">
                  faredown.com
                </span>
                <span className="text-white/75 text-[12px]">
                  World's first AI travel bargain platform
                </span>
              </div>
            </div>
            <nav className="flex items-center gap-4 text-[11px]">
              {[
                { label: "Help Center", path: "/help-center" },
                { label: "Contact Us", path: "/contact" },
                { label: "Cancellation Policy", path: "/cancellation-policy" },
                { label: "Refunds", path: "/refunds" },
                { label: "About Us", path: "/about" },
              ].map((item) => (
                <button
                  key={item.label}
                  onClick={() => handleNavigation(item.path)}
                  className="text-white/80 hover:text-[#0071c2] transition-colors"
                >
                  {item.label}
                </button>
              ))}
            </nav>
          </div>

          {/* Center: Trust */}
          <div className="text-center">
            <div className="text-white text-[12px] font-semibold">
              4.9★ • 50K+ reviews
            </div>
            <div className="text-white/60 text-[10px] italic">
              "AI bargaining works!"
            </div>
          </div>

          {/* Right: Social + Newsletter */}
          <div className="flex items-center gap-4">
            <div className="flex gap-3">
              <a
                href="#"
                aria-label="Facebook"
                className="w-8 h-8 rounded-full border border-white bg-[#003580] flex items-center justify-center hover:bg-white hover:border-[#003580] transition-all duration-300 group"
              >
                <Facebook className="w-6 h-6 text-white group-hover:text-[#003580] transition-colors duration-300" strokeWidth={1.5} />
              </a>
              <a
                href="#"
                aria-label="Instagram"
                className="w-8 h-8 rounded-full border border-white bg-[#003580] flex items-center justify-center hover:bg-white hover:border-[#003580] transition-all duration-300 group"
              >
                <Instagram className="w-6 h-6 text-white group-hover:text-[#003580] transition-colors duration-300" strokeWidth={1.5} />
              </a>
              <a
                href="#"
                aria-label="X"
                className="w-8 h-8 rounded-full border border-white bg-[#003580] flex items-center justify-center hover:bg-white hover:border-[#003580] transition-all duration-300 group"
              >
                <Twitter className="w-6 h-6 text-white group-hover:text-[#003580] transition-colors duration-300" strokeWidth={1.5} />
              </a>
              <a
                href="#"
                aria-label="LinkedIn"
                className="w-8 h-8 rounded-full border border-white bg-[#003580] flex items-center justify-center hover:bg-white hover:border-[#003580] transition-all duration-300 group"
              >
                <Linkedin className="w-6 h-6 text-white group-hover:text-[#003580] transition-colors duration-300" strokeWidth={1.5} />
              </a>
            </div>
            <form className="flex items-center gap-1">
              <input
                type="email"
                placeholder="Email"
                className="h-7 w-32 rounded px-2 text-[10px] text-[#001833] placeholder:text-black/50 border-0 focus:ring-1 focus:ring-[#0071c2] focus:outline-none"
              />
              <button
                type="submit"
                className="h-7 px-2 rounded bg-[#febb02] hover:bg-[#e6a602] text-black text-[10px] font-medium transition-colors"
              >
                Join
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Bottom Bar - Minimal */}
      <div className="border-t border-white/10">
        <div className="mx-auto max-w-7xl px-4 py-1 flex flex-col sm:flex-row items-center justify-between text-[9px] text-white/60 gap-1">
          <span>© 2025 Faredown Bookings and Travels Pvt Ltd.</span>
          <span>Amadeus • Sabre • Hotelbeds • GIATA</span>
        </div>
      </div>
    </footer>
  );
}
