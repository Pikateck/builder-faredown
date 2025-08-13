import React from "react";
import { Header } from "@/components/Header";
import { TransfersSearchForm } from "@/components/TransfersSearchForm";

export default function Transfers() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Search Form */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
          <TransfersSearchForm />
        </div>

        {/* Info Section */}
        <div className="bg-blue-50 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Why book with Faredown Transfers?
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="flex items-start space-x-3">
              <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center mt-1">
                <span className="text-white text-xs">✓</span>
              </div>
              <div>
                <h4 className="font-medium text-gray-900">Reliable Service</h4>
                <p className="text-sm text-gray-600">
                  Professional drivers and well-maintained vehicles
                </p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center mt-1">
                <span className="text-white text-xs">⏰</span>
              </div>
              <div>
                <h4 className="font-medium text-gray-900">On-Time Guarantee</h4>
                <p className="text-sm text-gray-600">
                  Flight monitoring and punctual pickup service
                </p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center mt-1">
                <span className="text-white text-xs">💰</span>
              </div>
              <div>
                <h4 className="font-medium text-gray-900">Best Prices</h4>
                <p className="text-sm text-gray-600">
                  Competitive rates with no hidden fees
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
