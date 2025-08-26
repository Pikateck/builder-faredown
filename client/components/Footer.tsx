import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { Plane, Facebook, Instagram, Twitter, Linkedin, Star, Mail } from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";

export function Footer() {
  const navigate = useNavigate();

  const handleNavigation = (path: string) => {
    navigate(path);
    window.scrollTo(0, 0);
  };

  return (
    <footer className="bg-[#003580] text-white">
      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand Block */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-[#febb02] rounded-lg flex items-center justify-center">
                <Plane className="w-4 h-4 text-[#003580]" />
              </div>
              <span className="text-lg font-bold">faredown.com</span>
            </div>
            <p className="text-blue-200 text-sm">
              The world's first AI-powered travel platform
            </p>
            
            {/* Certifications */}
            <div className="flex items-center space-x-2">
              {["TAAI", "TAAFI", "IATA"].map((cert) => (
                <div key={cert} className="bg-white/10 rounded px-2 py-1">
                  <span className="text-white text-xs font-medium">{cert}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-3">
            <h3 className="font-semibold text-white mb-3">Quick Links</h3>
            <div className="space-y-2 text-sm">
              <button
                onClick={() => handleNavigation("/flights")}
                className="block text-blue-200 hover:text-white transition-colors"
              >
                Flights
              </button>
              <button
                onClick={() => handleNavigation("/hotels")}
                className="block text-blue-200 hover:text-white transition-colors"
              >
                Hotels
              </button>
              <button
                onClick={() => handleNavigation("/sightseeing")}
                className="block text-blue-200 hover:text-white transition-colors"
              >
                Sightseeing
              </button>
              <button
                onClick={() => handleNavigation("/transfers")}
                className="block text-blue-200 hover:text-white transition-colors"
              >
                Transfers
              </button>
              <Link
                to="/help-center"
                className="block text-blue-200 hover:text-white transition-colors"
                onClick={() => window.scrollTo(0, 0)}
              >
                Help Center
              </Link>
              <Link
                to="/privacy-policy"
                className="block text-blue-200 hover:text-white transition-colors"
                onClick={() => window.scrollTo(0, 0)}
              >
                Privacy
              </Link>
              <Link
                to="/terms-conditions"
                className="block text-blue-200 hover:text-white transition-colors"
                onClick={() => window.scrollTo(0, 0)}
              >
                Terms
              </Link>
            </div>
          </div>

          {/* Trust & Reviews */}
          <div className="space-y-3">
            <h3 className="font-semibold text-white mb-3">Trust & Reviews</h3>
            
            {/* TrustPilot Rating */}
            <div className="bg-white/10 rounded-lg p-3">
              <div className="flex items-center space-x-2 mb-2">
                <div className="flex items-center">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 text-[#febb02] fill-current" />
                  ))}
                </div>
                <span className="text-white font-bold">4.9</span>
              </div>
              <div className="text-xs text-blue-200">
                Excellent • Based on 50,000+ reviews
              </div>
              <div className="text-xs text-green-400 mt-1">
                ★ Rated on TrustPilot
              </div>
            </div>
            
            {/* Customer Review Snippet */}
            <div className="text-xs text-blue-200 italic">
              "Saved ₹15,000 on my Dubai trip using AI Bargaining!"
            </div>
          </div>

          {/* Social & Newsletter */}
          <div className="space-y-3">
            <h3 className="font-semibold text-white mb-3">Stay Connected</h3>
            
            {/* Social Icons */}
            <div className="flex space-x-3">
              {[
                { Icon: Facebook, href: "https://facebook.com" },
                { Icon: Instagram, href: "https://instagram.com" },
                { Icon: Twitter, href: "https://twitter.com" },
                { Icon: Linkedin, href: "https://linkedin.com" },
              ].map(({ Icon, href }, index) => (
                <a
                  key={index}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-8 h-8 bg-white/10 rounded-lg flex items-center justify-center hover:bg-white/20 transition-colors"
                >
                  <Icon className="w-4 h-4" />
                </a>
              ))}
            </div>
            
            {/* Newsletter Signup */}
            <div className="space-y-2">
              <p className="text-xs text-blue-200">Subscribe for secret deals</p>
              <div className="flex space-x-2">
                <Input
                  type="email"
                  placeholder="Your email"
                  className="h-8 text-xs bg-white/10 border-white/20 text-white placeholder:text-blue-200"
                />
                <Button className="h-8 px-3 bg-[#febb02] hover:bg-[#e6a602] text-[#003580] text-xs">
                  <Mail className="w-3 h-3" />
                </Button>
              </div>
              <p className="text-xs text-blue-300">No spam emails</p>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Line */}
      <div className="border-t border-blue-700">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-2 md:space-y-0">
            <div className="text-xs text-blue-200">
              © 2025 Faredown Bookings and Travels Pvt Ltd. All rights reserved.
            </div>
            <div className="flex items-center space-x-4 opacity-60">
              <span className="text-xs text-blue-300">Partners:</span>
              <div className="flex space-x-2">
                {["Amadeus", "Hotelbeds", "Sabre"].map((partner) => (
                  <span key={partner} className="text-xs text-blue-300">{partner}</span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
