import React from "react";
import { Button } from "@/components/ui/button";
import { Plane, Hotel, Camera, Car, Search } from "lucide-react";

export default function IndexSimple() {
  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="bg-[#003580] text-white">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-[#febb02] rounded-lg flex items-center justify-center">
                <Plane className="w-4 h-4 text-[#003580]" />
              </div>
              <span className="text-xl font-bold">faredown.com</span>
            </div>
            <nav className="flex items-center space-x-8">
              <a href="#" className="hover:text-blue-200">Flights</a>
              <a href="#" className="hover:text-blue-200">Hotels</a>
              <a href="#" className="hover:text-blue-200">Sightseeing</a>
              <a href="#" className="hover:text-blue-200">Transfers</a>
            </nav>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <div className="bg-[#003580] text-white pb-16">
        <div className="max-w-4xl mx-auto px-4 pt-8">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold mb-4">Upgrade. Bargain. Book.</h1>
            <p className="text-xl text-blue-200">
              Turn your seat into an upgrade and your fare into a win, with AI that bargains for you.
            </p>
          </div>

          {/* Search Form */}
          <div className="bg-white rounded-lg p-6 text-gray-900">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium mb-2">From</label>
                <input 
                  type="text" 
                  placeholder="Departure city"
                  className="w-full p-3 border border-gray-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">To</label>
                <input 
                  type="text" 
                  placeholder="Destination city"
                  className="w-full p-3 border border-gray-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Departure</label>
                <input 
                  type="date" 
                  className="w-full p-3 border border-gray-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Return</label>
                <input 
                  type="date" 
                  className="w-full p-3 border border-gray-300 rounded-lg"
                />
              </div>
            </div>
            <Button className="w-full bg-[#febb02] hover:bg-[#d19900] text-[#003580] font-bold py-3 text-lg">
              <Search className="w-5 h-5 mr-2" />
              Search Flights
            </Button>
          </div>
        </div>
      </div>

      {/* Features */}
      <div className="py-16 bg-gray-50">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">Why Choose Faredown?</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-[#003580] rounded-full flex items-center justify-center mx-auto mb-4">
                <Plane className="w-8 h-8 text-white" />
              </div>
              <h3 className="font-semibold mb-2">Smart Flights</h3>
              <p className="text-gray-600">AI-powered flight search with bargaining</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-[#003580] rounded-full flex items-center justify-center mx-auto mb-4">
                <Hotel className="w-8 h-8 text-white" />
              </div>
              <h3 className="font-semibold mb-2">Premium Hotels</h3>
              <p className="text-gray-600">5-star accommodations at bargained rates</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-[#003580] rounded-full flex items-center justify-center mx-auto mb-4">
                <Camera className="w-8 h-8 text-white" />
              </div>
              <h3 className="font-semibold mb-2">Experiences</h3>
              <p className="text-gray-600">Sightseeing tours and activities</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-[#003580] rounded-full flex items-center justify-center mx-auto mb-4">
                <Car className="w-8 h-8 text-white" />
              </div>
              <h3 className="font-semibold mb-2">Transfers</h3>
              <p className="text-gray-600">Luxury airport and city transfers</p>
            </div>
          </div>
        </div>
      </div>

      {/* Admin Links */}
      <div className="bg-[#003580] text-white py-8">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h3 className="text-xl font-semibold mb-4">System Access</h3>
          <div className="flex justify-center space-x-4">
            <a 
              href="/admin/login" 
              className="bg-[#febb02] text-[#003580] px-6 py-2 rounded-lg font-semibold hover:bg-[#d19900]"
            >
              Admin Panel
            </a>
            <a 
              href="/admin/api" 
              className="bg-green-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-green-700"
            >
              API Testing
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
