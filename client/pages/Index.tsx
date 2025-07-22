import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Calendar,
  Plane,
  Search,
  Menu,
  Users,
  ChevronDown,
} from "lucide-react";

export default function Index() {
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="bg-blue-600 text-white">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <Link to="/" className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-white rounded flex items-center justify-center">
                <Plane className="w-5 h-5 text-blue-600" />
              </div>
              <span className="text-xl font-bold">faredown.com</span>
            </Link>
            
            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center space-x-8 text-sm font-medium">
              <Link to="/flights" className="hover:text-blue-200 border-b-2 border-white pb-2">
                Flights
              </Link>
              <Link to="/hotels" className="hover:text-blue-200 pb-2">
                Hotels
              </Link>
              <Link to="/packages" className="hover:text-blue-200 pb-2">
                Packages
              </Link>
              <Link to="/trains" className="hover:text-blue-200 pb-2">
                Trains
              </Link>
            </nav>

            {/* Right side */}
            <div className="flex items-center space-x-4">
              <div className="hidden md:flex items-center space-x-4 text-sm">
                <span>English (UK)</span>
                <span>₹ INR</span>
              </div>
              
              {/* Mobile menu button */}
              <button
                onClick={() => setShowMobileMenu(!showMobileMenu)}
                className="md:hidden"
              >
                <Menu className="w-6 h-6" />
              </button>
              
              <div className="flex items-center space-x-2">
                <Button
                  size="sm"
                  variant="outline"
                  className="bg-white text-blue-600 border-white hover:bg-gray-100 text-sm"
                >
                  Register
                </Button>
                <Button
                  size="sm"
                  className="bg-blue-700 hover:bg-blue-800 text-white text-sm"
                >
                  Sign in
                </Button>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="bg-blue-600 text-white py-12">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-8">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              Upgrade. Bargain. Book.
            </h1>
            <p className="text-xl md:text-2xl mb-2 opacity-90">
              faredown is the world's first travel portal where you control the price for
            </p>
            <p className="text-xl md:text-2xl opacity-90">
              flights and hotels.
            </p>
            <p className="text-lg mt-4 opacity-75">
              Don't Just Book It. <strong>Bargain it™</strong>
            </p>
          </div>

          {/* Search Form */}
          <div className="bg-white rounded-lg p-6 max-w-5xl mx-auto">
            {/* Trip Type Selection */}
            <div className="flex items-center space-x-6 mb-6">
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="radio"
                  name="tripType"
                  value="roundtrip"
                  defaultChecked
                  className="w-4 h-4 text-blue-600"
                />
                <span className="text-gray-700">Round trip</span>
              </label>
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="radio"
                  name="tripType"
                  value="oneway"
                  className="w-4 h-4 text-blue-600"
                />
                <span className="text-gray-700">One way</span>
              </label>
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="radio"
                  name="tripType"
                  value="multicity"
                  className="w-4 h-4 text-blue-600"
                />
                <span className="text-gray-700">Multi-city</span>
              </label>
            </div>

            {/* Search Inputs */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              {/* From */}
              <div className="relative">
                <label className="absolute -top-2 left-3 bg-white px-1 text-xs text-gray-600 font-medium">
                  From
                </label>
                <div className="flex items-center border-2 border-blue-500 rounded px-3 py-3 bg-white">
                  <Plane className="w-4 h-4 text-gray-500 mr-2" />
                  <div>
                    <div className="text-sm font-medium text-gray-900">BOM</div>
                    <div className="text-xs text-gray-500">Mumbai, Chhatrapati...</div>
                  </div>
                </div>
              </div>

              {/* To */}
              <div className="relative">
                <label className="absolute -top-2 left-3 bg-white px-1 text-xs text-gray-600 font-medium">
                  To
                </label>
                <div className="flex items-center border border-gray-300 rounded px-3 py-3 bg-white">
                  <Plane className="w-4 h-4 text-gray-500 mr-2" />
                  <div>
                    <div className="text-sm font-medium text-gray-900">DEL</div>
                    <div className="text-xs text-gray-500">Delhi International Airport</div>
                  </div>
                </div>
              </div>

              {/* Departure */}
              <div className="relative">
                <label className="absolute -top-2 left-3 bg-white px-1 text-xs text-gray-600 font-medium">
                  Departure
                </label>
                <div className="flex items-center border border-gray-300 rounded px-3 py-3 bg-white">
                  <Calendar className="w-4 h-4 text-gray-500 mr-2" />
                  <div>
                    <div className="text-sm font-medium text-gray-900">09 Dec</div>
                    <div className="text-xs text-gray-500">Monday</div>
                  </div>
                </div>
              </div>

              {/* Return */}
              <div className="relative">
                <label className="absolute -top-2 left-3 bg-white px-1 text-xs text-gray-600 font-medium">
                  Return
                </label>
                <div className="flex items-center border border-gray-300 rounded px-3 py-3 bg-white">
                  <Calendar className="w-4 h-4 text-gray-500 mr-2" />
                  <div>
                    <div className="text-sm font-medium text-gray-900">16 Dec</div>
                    <div className="text-xs text-gray-500">Monday</div>
                  </div>
                </div>
              </div>

              {/* Travelers & Search */}
              <div className="flex space-x-2">
                <div className="relative flex-1">
                  <label className="absolute -top-2 left-3 bg-white px-1 text-xs text-gray-600 font-medium">
                    Travelers
                  </label>
                  <div className="flex items-center border border-gray-300 rounded px-3 py-3 bg-white">
                    <Users className="w-4 h-4 text-gray-500 mr-2" />
                    <span className="text-sm font-medium text-gray-900">1 Adult</span>
                  </div>
                </div>
                <Button className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 h-auto">
                  <Search className="w-4 h-4 mr-2" />
                  Search
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Why Faredown Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Why Faredown is Reinventing Travel Booking
            </h2>
            <p className="text-lg text-gray-600">
              The future of booking isn't fixed pricing — it's live bargaining.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-600 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Plane className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Live Bargain Technology</h3>
              <p className="text-gray-600">
                Negotiate upgrades instantly — from economy to business, from standard to suite.
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-blue-600 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Users className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Pay What You Feel Is Fair</h3>
              <p className="text-gray-600">
                Set your price and let Faredown try to get it for you — no more overpaying.
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-blue-600 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Search className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Secure, Real-Time Bookings</h3>
              <p className="text-gray-600">
                Your data is encrypted and bookings are confirmed instantly.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Mobile Menu */}
      {showMobileMenu && (
        <div className="md:hidden bg-blue-700 border-t border-blue-500">
          <div className="px-4 py-4 space-y-2">
            <Link to="/flights" className="block text-white py-2 border-b border-blue-500">
              Flights
            </Link>
            <Link to="/hotels" className="block text-white py-2 border-b border-blue-500">
              Hotels
            </Link>
            <Link to="/packages" className="block text-white py-2 border-b border-blue-500">
              Packages
            </Link>
            <Link to="/trains" className="block text-white py-2">
              Trains
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
