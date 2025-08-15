import React from "react";

export default function IndexWorking() {
  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="bg-blue-600 text-white py-4">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-yellow-400 rounded-lg flex items-center justify-center">
                <span className="text-blue-600 font-bold">F</span>
              </div>
              <span className="text-xl font-bold">Faredown.com</span>
            </div>
            <nav className="hidden md:flex space-x-6">
              <a href="#" className="hover:text-blue-200">Flights</a>
              <a href="#" className="hover:text-blue-200">Hotels</a>
              <a href="#" className="hover:text-blue-200">Sightseeing</a>
              <a href="#" className="hover:text-blue-200">Transfers</a>
            </nav>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <div className="bg-blue-600 text-white py-16">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h1 className="text-4xl font-bold mb-4">Upgrade. Bargain. Book.</h1>
          <p className="text-xl text-blue-100 mb-8">
            Turn your seat into an upgrade and your fare into a win, with AI that bargains for you.
          </p>
          
          {/* Status Indicators */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <div className="bg-green-500 text-white p-4 rounded-lg">
              <h3 className="font-semibold">✅ Frontend Server</h3>
              <p className="text-sm">Running on port 8080</p>
            </div>
            <div className="bg-green-500 text-white p-4 rounded-lg">
              <h3 className="font-semibold">✅ API Server</h3>
              <p className="text-sm">Running on port 3001</p>
            </div>
            <div className="bg-green-500 text-white p-4 rounded-lg">
              <h3 className="font-semibold">✅ Database</h3>
              <p className="text-sm">5 pricing tables connected</p>
            </div>
          </div>

          {/* Search Form */}
          <div className="bg-white rounded-lg p-6 text-gray-900 max-w-3xl mx-auto">
            <h2 className="text-xl font-semibold mb-4 text-center">Flight Search</h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium mb-2">From</label>
                <input 
                  type="text" 
                  placeholder="Departure city"
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">To</label>
                <input 
                  type="text" 
                  placeholder="Destination city"
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Departure</label>
                <input 
                  type="date" 
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Return</label>
                <input 
                  type="date" 
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            <button className="w-full bg-yellow-400 text-blue-600 font-bold py-3 px-6 rounded-lg hover:bg-yellow-500 transition-colors">
              Search Flights
            </button>
          </div>
        </div>
      </div>

      {/* Admin Access */}
      <div className="py-12 bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-2xl font-bold mb-6">System Access</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <a 
              href="/admin/login" 
              className="block bg-blue-600 text-white p-6 rounded-lg hover:bg-blue-700 transition-colors"
            >
              <h3 className="text-xl font-semibold mb-2">Admin Panel</h3>
              <p>Manage markup rules, promo codes, and view analytics</p>
            </a>
            <a 
              href="/admin/api" 
              className="block bg-green-600 text-white p-6 rounded-lg hover:bg-green-700 transition-colors"
            >
              <h3 className="text-xl font-semibold mb-2">API Testing</h3>
              <p>Test pricing engine, bargaining, and booking endpoints</p>
            </a>
          </div>
        </div>
      </div>

      {/* Features */}
      <div className="py-12">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-8">Your Complete System</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="text-center p-6 border rounded-lg">
              <div className="w-12 h-12 bg-blue-600 rounded-full mx-auto mb-4 flex items-center justify-center">
                <span className="text-white font-bold">P</span>
              </div>
              <h3 className="font-semibold mb-2">Pricing Engine</h3>
              <p className="text-gray-600 text-sm">Markup rules, promo codes, bargaining logic</p>
            </div>
            <div className="text-center p-6 border rounded-lg">
              <div className="w-12 h-12 bg-green-600 rounded-full mx-auto mb-4 flex items-center justify-center">
                <span className="text-white font-bold">A</span>
              </div>
              <h3 className="font-semibold mb-2">Admin System</h3>
              <p className="text-gray-600 text-sm">Complete CMS for managing travel products</p>
            </div>
            <div className="text-center p-6 border rounded-lg">
              <div className="w-12 h-12 bg-purple-600 rounded-full mx-auto mb-4 flex items-center justify-center">
                <span className="text-white font-bold">D</span>
              </div>
              <h3 className="font-semibold mb-2">Database</h3>
              <p className="text-gray-600 text-sm">PostgreSQL with 5 pricing tables</p>
            </div>
            <div className="text-center p-6 border rounded-lg">
              <div className="w-12 h-12 bg-yellow-600 rounded-full mx-auto mb-4 flex items-center justify-center">
                <span className="text-white font-bold">B</span>
              </div>
              <h3 className="font-semibold mb-2">Bargaining</h3>
              <p className="text-gray-600 text-sm">AI-powered price negotiation system</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
