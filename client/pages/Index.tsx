import React from "react";
import { Link } from "react-router-dom";
import { Plane } from "lucide-react";

export default function Index() {
  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="bg-blue-700 text-white">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <Link to="/" className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-[#febb02] rounded-lg flex items-center justify-center">
                <Plane className="w-4 h-4 text-[#003580]" />
              </div>
              <span className="text-xl font-bold tracking-tight">
                faredown.com
              </span>
            </Link>
            <div className="flex items-center space-x-6">
              <nav className="hidden md:flex items-center space-x-6 text-sm font-medium">
                <Link
                  to="/flights"
                  className="text-white hover:text-blue-200"
                >
                  Flights
                </Link>
                <Link
                  to="/hotels"
                  className="text-white hover:text-blue-200"
                >
                  Hotels
                </Link>
                <Link
                  to="/sightseeing"
                  className="text-white hover:text-blue-200"
                >
                  Sightseeing
                </Link>
                <Link
                  to="/transfers"
                  className="text-white hover:text-blue-200"
                >
                  Transfers
                </Link>
              </nav>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="bg-gradient-to-br from-blue-600 via-purple-600 to-blue-800 text-white py-24">
        <div className="max-w-6xl mx-auto px-4 text-center">
          <div className="bg-orange-500 text-white px-6 py-3 rounded-full inline-block mb-6">
            🟠 Bargain Mode Activated
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-6">
            Don't Just Book It. Bargain It.™
          </h1>
          <p className="text-xl text-blue-100 mb-8 max-w-3xl mx-auto">
            The world's first AI-powered travel platform that lets you{" "}
            <strong>bargain and upgrade your flight, hotel, or holiday</strong>{" "}
            in real-time.
          </p>

          {/* Quick Search Form */}
          <div className="bg-white rounded-2xl p-6 max-w-4xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
              <div>
                <label className="block text-gray-700 text-sm font-medium mb-2">
                  From
                </label>
                <input
                  type="text"
                  defaultValue="Mumbai (BOM)"
                  className="w-full p-3 border border-gray-300 rounded-lg text-gray-900"
                />
              </div>
              <div>
                <label className="block text-gray-700 text-sm font-medium mb-2">
                  To
                </label>
                <input
                  type="text"
                  defaultValue="Dubai (DXB)"
                  className="w-full p-3 border border-gray-300 rounded-lg text-gray-900"
                />
              </div>
              <div>
                <label className="block text-gray-700 text-sm font-medium mb-2">
                  Departure
                </label>
                <input
                  type="date"
                  className="w-full p-3 border border-gray-300 rounded-lg text-gray-900"
                />
              </div>
              <div>
                <label className="block text-gray-700 text-sm font-medium mb-2">
                  Passengers
                </label>
                <select className="w-full p-3 border border-gray-300 rounded-lg text-gray-900">
                  <option>1 Adult</option>
                  <option>2 Adults</option>
                  <option>3 Adults</option>
                </select>
              </div>
            </div>
            <Link
              to="/flights/results?from=Mumbai&to=Dubai"
              className="w-full bg-orange-500 hover:bg-orange-600 text-white py-4 px-8 rounded-xl font-semibold text-lg inline-block text-center transition-colors"
            >
              Search & Bargain Flights
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              How Faredown Works
            </h2>
            <p className="text-gray-600 text-lg">
              Revolutionary AI bargaining technology that saves you money
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">🔍</span>
              </div>
              <h3 className="text-xl font-semibold mb-2">Search</h3>
              <p className="text-gray-600">
                Find flights, hotels, and experiences from trusted partners
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">⚡</span>
              </div>
              <h3 className="text-xl font-semibold mb-2">Bargain</h3>
              <p className="text-gray-600">
                Let our AI negotiate better prices and upgrades for you
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">✈️</span>
              </div>
              <h3 className="text-xl font-semibold mb-2">Travel</h3>
              <p className="text-gray-600">
                Book your upgraded travel experience at the best price
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Quick Links */}
      <section className="py-16 bg-white">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-2xl font-bold text-center mb-8">Quick Access</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <Link
              to="/flights"
              className="bg-blue-50 hover:bg-blue-100 p-6 rounded-lg text-center transition-colors"
            >
              <div className="text-2xl mb-2">✈️</div>
              <div className="font-semibold">Flights</div>
            </Link>

            <Link
              to="/hotels"
              className="bg-orange-50 hover:bg-orange-100 p-6 rounded-lg text-center transition-colors"
            >
              <div className="text-2xl mb-2">🏨</div>
              <div className="font-semibold">Hotels</div>
            </Link>

            <Link
              to="/sightseeing"
              className="bg-purple-50 hover:bg-purple-100 p-6 rounded-lg text-center transition-colors"
            >
              <div className="text-2xl mb-2">📷</div>
              <div className="font-semibold">Sightseeing</div>
            </Link>

            <Link
              to="/transfers"
              className="bg-green-50 hover:bg-green-100 p-6 rounded-lg text-center transition-colors"
            >
              <div className="text-2xl mb-2">🚗</div>
              <div className="font-semibold">Transfers</div>
            </Link>
          </div>
        </div>
      </section>

      {/* Popular Destinations */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Popular Destinations
            </h2>
            <p className="text-gray-600 text-lg">
              Discover amazing places and book flights to your dream
              destinations
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="relative aspect-[4/3] rounded-lg overflow-hidden">
              <img
                src="https://images.unsplash.com/photo-1502602898536-47ad22581b52?w=400&h=300&fit=crop"
                alt="Paris"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-black bg-opacity-40"></div>
              <div className="absolute bottom-4 left-4 text-white">
                <h3 className="text-xl font-bold mb-1">Paris</h3>
                <p className="text-sm opacity-90">From ₹32,000</p>
              </div>
            </div>

            <div className="relative aspect-[4/3] rounded-lg overflow-hidden">
              <img
                src="https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=300&fit=crop"
                alt="Sydney"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-black bg-opacity-40"></div>
              <div className="absolute bottom-4 left-4 text-white">
                <h3 className="text-xl font-bold mb-1">Sydney</h3>
                <p className="text-sm opacity-90">From ₹75,000</p>
              </div>
            </div>

            <div className="relative aspect-[4/3] rounded-lg overflow-hidden">
              <img
                src="https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=400&h=300&fit=crop"
                alt="Tokyo"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-black bg-opacity-40"></div>
              <div className="absolute bottom-4 left-4 text-white">
                <h3 className="text-xl font-bold mb-1">Tokyo</h3>
                <p className="text-sm opacity-90">From ₹59,000</p>
              </div>
            </div>

            <div className="relative aspect-[4/3] rounded-lg overflow-hidden">
              <img
                src="https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?w=400&h=300&fit=crop"
                alt="London"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-black bg-opacity-40"></div>
              <div className="absolute bottom-4 left-4 text-white">
                <h3 className="text-xl font-bold mb-1">London</h3>
                <p className="text-sm opacity-90">From ₹28,000</p>
              </div>
            </div>

            <div className="relative aspect-[4/3] rounded-lg overflow-hidden">
              <img
                src="https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?w=400&h=300&fit=crop"
                alt="New York"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-black bg-opacity-40"></div>
              <div className="absolute bottom-4 left-4 text-white">
                <h3 className="text-xl font-bold mb-1">New York</h3>
                <p className="text-sm opacity-90">From ₹18,000</p>
              </div>
            </div>

            <div className="relative aspect-[4/3] rounded-lg overflow-hidden">
              <img
                src="https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=400&h=300&fit=crop"
                alt="Dubai"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-black bg-opacity-40"></div>
              <div className="absolute bottom-4 left-4 text-white">
                <h3 className="text-xl font-bold mb-1">Dubai</h3>
                <p className="text-sm opacity-90">From ₹45,000</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <div className="w-8 h-8 bg-[#febb02] rounded-lg flex items-center justify-center">
                  <Plane className="w-4 h-4 text-[#003580]" />
                </div>
                <span className="text-xl font-bold">faredown.com</span>
              </div>
              <p className="text-gray-400 text-sm">
                The World's First Online Travel Bargain Portal™
              </p>
            </div>

            <div>
              <h3 className="font-bold mb-4">Company</h3>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><Link to="/about" className="hover:text-white">About Us</Link></li>
                <li><Link to="/careers" className="hover:text-white">Careers</Link></li>
                <li><Link to="/press" className="hover:text-white">Press</Link></li>
                <li><Link to="/blog" className="hover:text-white">Blog</Link></li>
              </ul>
            </div>

            <div>
              <h3 className="font-bold mb-4">Support</h3>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><Link to="/help-center" className="hover:text-white">Help Center</Link></li>
                <li><Link to="/contact" className="hover:text-white">Contact Us</Link></li>
                <li><Link to="/safety" className="hover:text-white">Safety</Link></li>
                <li><Link to="/accessibility" className="hover:text-white">Accessibility</Link></li>
              </ul>
            </div>

            <div>
              <h3 className="font-bold mb-4">Legal</h3>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><Link to="/privacy-policy" className="hover:text-white">Privacy Policy</Link></li>
                <li><Link to="/terms-conditions" className="hover:text-white">Terms of Service</Link></li>
                <li><Link to="/cookie-policy" className="hover:text-white">Cookie Policy</Link></li>
                <li><Link to="/refund-policy" className="hover:text-white">Refund Policy</Link></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-sm text-gray-400">
            <p>&copy; 2025 Faredown Technologies. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
