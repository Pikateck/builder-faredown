import React from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Facebook,
  Instagram,
  Twitter,
  Linkedin,
} from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";

export function Footer() {
  const navigate = useNavigate();

  const handleNavigation = (path: string) => {
    navigate(path);
    window.scrollTo(0, 0);
  };

  return (
    <footer
      className="bg-[#003580] text-white/90 border-t-4 border-[#febb02]"
      data-footer-version="v3"
      style={{ minHeight: '280px' }}
    >
      <div className="mx-auto max-w-7xl px-4 py-8 sm:py-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <img
                src="/images/faredown-icon.png"
                alt="Faredown"
                className="h-6 w-6 object-contain"
              />
              <span className="text-lg font-bold text-white">
                faredown.com
              </span>
            </div>
            <p className="text-white/70 text-[13px]">
              The world's first AI-powered travel bargain platform.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-sm font-semibold mb-3">Quick Links</h4>
            <ul className="space-y-2 text-[13px]">
              {[
                { label: "Flights", path: "/flights" },
                { label: "Hotels", path: "/hotels" },
                { label: "Sightseeing", path: "/sightseeing" },
                { label: "Transfers", path: "/transfers" },
                { label: "Help Center", path: "/help-center" },
                { label: "Privacy", path: "/privacy-policy" },
                { label: "Terms", path: "/terms-of-service" },
                { label: "Refund Policy", path: "/refund-cancellation-policy" }
              ].map((item) => (
                <li key={item.label}>
                  <button
                    onClick={() => handleNavigation(item.path)}
                    className="text-white/80 hover:text-[#0071c2] transition-colors cursor-pointer"
                  >
                    {item.label}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Trust & Reviews */}
          <div>
            <h4 className="text-sm font-semibold mb-3">Trust & Reviews</h4>
            <div className="text-[13px] text-white/80">
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1">4.9★</span>
                <span>Excellent – 50,000+ reviews</span>
              </div>
              <div className="mt-2 text-white/60 italic">
                "Saved ₹15,000 on my Dubai trip using AI Bargaining!"
              </div>
            </div>
          </div>

          {/* Stay Connected */}
          <div>
            <h4 className="text-sm font-semibold mb-3">Stay Connected</h4>
            <div className="flex items-center gap-3 mb-3">
              {[
                { Icon: Facebook, href: "https://facebook.com", label: "facebook" },
                { Icon: Instagram, href: "https://instagram.com", label: "instagram" },
                { Icon: Twitter, href: "https://twitter.com", label: "x" },
                { Icon: Linkedin, href: "https://linkedin.com", label: "linkedin" }
              ].map(({ Icon, href, label }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={label}
                  className="opacity-80 hover:opacity-100 transition-opacity"
                >
                  <Icon className="text-[18px] w-[18px] h-[18px]" />
                </a>
              ))}
            </div>
            <form className="flex items-center gap-2">
              <Input
                type="email"
                placeholder="Your email"
                className="w-full h-9 rounded-md px-3 text-[13px] text-[#001833] placeholder:text-black/50 bg-white border-0 focus:ring-2 focus:ring-[#0071c2]"
              />
              <Button
                type="submit"
                className="h-9 px-3 rounded-md bg-[#febb02] hover:bg-[#e6a602] active:bg-[#d19900] text-black text-sm font-medium border-0"
              >
                Subscribe
              </Button>
            </form>
          </div>
        </div>
      </div>

      <div className="border-t border-white/10">
        <div className="mx-auto max-w-7xl px-4 py-3 flex flex-col sm:flex-row items-center justify-between gap-2 text-[12px] text-white/70">
          <div>
            © {new Date().getFullYear()} Faredown Bookings and Travels Pvt Ltd. All rights reserved.
          </div>
          <div className="opacity-80">
            Partners: Amadeus · Sabre · Hotelbeds · GIATA
          </div>
        </div>
      </div>
    </footer>
  );
}
