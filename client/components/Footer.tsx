import React from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Facebook,
  Instagram,
  Twitter,
  Linkedin,
} from "lucide-react";

export function Footer() {
  const navigate = useNavigate();

  const handleNavigation = (path: string) => {
    navigate(path);
    window.scrollTo(0, 0);
  };

  return (
    <footer className="bg-[#003580] text-white" data-footer-version="v5">
      <div className="mx-auto max-w-7xl px-4 py-5 md:py-5">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          
          {/* Brand */}
          <div className="space-y-2">
            <img 
              src="/logo/faredown-logo.png?v=5" 
              alt="faredown.com" 
              className="h-5 w-auto" 
            />
            <p className="text-white/75 text-[13px] leading-tight">
              World's first AI-powered travel bargain platform.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-semibold mb-2 text-white text-[13px]">Quick Links</h4>
            <ul className="space-y-1 text-[12px] text-white/85">
              {[
                { label: "Flights", path: "/flights" },
                { label: "Hotels", path: "/hotels" },
                { label: "Sightseeing", path: "/sightseeing" },
                { label: "Transfers", path: "/transfers" },
                { label: "Help Center", path: "/help-center" },
                { label: "Privacy", path: "/privacy-policy" }
              ].map((item) => (
                <li key={item.label}>
                  <button
                    onClick={() => handleNavigation(item.path)}
                    className="hover:text-[#0071c2] transition-colors cursor-pointer"
                  >
                    {item.label}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Trust */}
          <div className="text-[12px] text-white/85">
            <h4 className="font-semibold mb-2 text-white text-[13px]">Trust</h4>
            <div className="font-semibold text-white">4.9★ Excellent — 50,000+ reviews</div>
            <div className="mt-1 text-white/65 italic leading-tight">
              "AI bargaining works perfectly!"
            </div>
          </div>

          {/* Stay Connected */}
          <div className="space-y-2">
            <h4 className="font-semibold text-white text-[13px]">Stay Connected</h4>
            <div className="flex gap-2 text-[16px] opacity-80">
              <a href="#" aria-label="Facebook" className="hover:opacity-100 transition-opacity">
                <Facebook className="w-[16px] h-[16px]" strokeWidth={2} />
              </a>
              <a href="#" aria-label="Instagram" className="hover:opacity-100 transition-opacity">
                <Instagram className="w-[16px] h-[16px]" strokeWidth={2} />
              </a>
              <a href="#" aria-label="X" className="hover:opacity-100 transition-opacity">
                <Twitter className="w-[16px] h-[16px]" strokeWidth={2} />
              </a>
              <a href="#" aria-label="LinkedIn" className="hover:opacity-100 transition-opacity">
                <Linkedin className="w-[16px] h-[16px]" strokeWidth={2} />
              </a>
            </div>
            <form className="flex gap-1">
              <input
                type="email"
                placeholder="Your email"
                className="h-8 w-full rounded-md bg-white px-2 text-[12px] text-[#001833] placeholder:text-black/50 border-0 focus:ring-1 focus:ring-[#0071c2] focus:outline-none"
              />
              <button
                type="submit"
                className="h-8 px-2 rounded-md bg-[#febb02] hover:bg-[#e6a602] active:bg-[#d19900] text-black text-[12px] font-medium transition-colors"
              >
                Subscribe
              </button>
            </form>
          </div>

        </div>
      </div>
      
      <div className="border-t border-white/10">
        <div className="mx-auto max-w-7xl px-4 py-2 flex flex-col sm:flex-row items-center justify-between text-[11px] text-white/70 gap-1">
          <span>© 2025 Faredown Bookings and Travels Pvt Ltd.</span>
          <span className="opacity-80">Partners: Amadeus · Sabre · Hotelbeds · GIATA</span>
        </div>
      </div>
    </footer>
  );
}
