import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { Plane, Facebook, Instagram, Twitter, Linkedin } from "lucide-react";

export function Footer() {
  const navigate = useNavigate();

  const handleTabChange = (tab: string) => {
    navigate(`/?tab=${tab}`);
    window.scrollTo(0, 0);
  };

  const handleNavigation = (path: string) => {
    navigate(path);
    window.scrollTo(0, 0);
  };

  return (
    <footer className="bg-gray-900 text-white py-20">
      <div className="max-w-7xl mx-auto px-8 text-center">
        <div className="flex items-center justify-center space-x-3 mb-8">
          <div className="w-12 h-12 bg-[#febb02] rounded-2xl flex items-center justify-center">
            <Plane className="w-6 h-6 text-[#003580]" />
          </div>
          <span className="text-3xl font-bold">faredown.com</span>
        </div>

        <p className="text-xl text-gray-400 mb-12 max-w-2xl mx-auto">
          The world's first AI-powered travel platform
        </p>

        <div className="flex justify-center space-x-8 mb-12 text-gray-400 flex-wrap">
          <button
            onClick={() => handleTabChange("flights")}
            className="hover:text-white transition-colors font-medium mb-2"
          >
            Flights
          </button>
          <button
            onClick={() => handleTabChange("hotels")}
            className="hover:text-white transition-colors font-medium mb-2"
          >
            Hotels
          </button>
          <button
            onClick={() => handleTabChange("sightseeing")}
            className="hover:text-white transition-colors font-medium mb-2"
          >
            Sightseeing
          </button>
          <button
            onClick={() => handleTabChange("transfers")}
            className="hover:text-white transition-colors font-medium mb-2"
          >
            Transfers
          </button>
          <button
            onClick={() => handleNavigation("/help")}
            className="hover:text-white transition-colors font-medium mb-2"
          >
            Help Center
          </button>
          <button
            onClick={() => handleNavigation("/contact")}
            className="hover:text-white transition-colors font-medium mb-2"
          >
            Contact
          </button>
          <Link
            to="/privacy"
            className="hover:text-white transition-colors font-medium mb-2"
            onClick={() => window.scrollTo(0, 0)}
          >
            Privacy
          </Link>
          <Link
            to="/terms"
            className="hover:text-white transition-colors font-medium mb-2"
            onClick={() => window.scrollTo(0, 0)}
          >
            Terms
          </Link>
        </div>

        <div className="flex justify-center space-x-6 mb-12">
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
              className="w-14 h-14 bg-gray-800 rounded-2xl flex items-center justify-center hover:bg-[#003580] transition-colors"
            >
              <Icon className="w-6 h-6" />
            </a>
          ))}
        </div>

        <div className="border-t border-gray-800 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-6 md:space-y-0">
            <div className="flex items-center space-x-6">
              <span className="text-gray-400 font-medium">Certified by:</span>
              <div className="flex items-center space-x-4">
                {["TAAI", "TAAFI", "IATA"].map((cert) => (
                  <div key={cert} className="bg-white rounded-xl px-4 py-2">
                    <span className="text-[#003580] font-bold">{cert}</span>
                  </div>
                ))}
              </div>
            </div>

            <p className="text-gray-400 text-lg">
              © 2025 Faredown.com. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
