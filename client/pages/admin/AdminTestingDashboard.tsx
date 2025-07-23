import React from 'react';
import { ApiErrorTest } from '@/components/ApiErrorTest';
import { LiveIntegrationTest } from '@/components/LiveIntegrationTest';
import { BookingFlowTest } from '@/components/BookingFlowTest';
import { EmailDeliveryTest } from '@/components/EmailDeliveryTest';
import { SystemStatus } from '@/components/SystemStatus';
import { LiveHotelbedsTest } from '@/components/LiveHotelbedsTest';
import { ApiHealthCheck } from '@/components/ApiHealthCheck';

export default function AdminTestingDashboard() {
  const isProduction = typeof window !== 'undefined' && window.location.hostname !== "localhost";

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Production Environment Banner */}
      {isProduction && (
        <div className="bg-blue-600 text-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
            <div className="flex items-center justify-between flex-wrap">
              <div className="flex items-center">
                <span className="text-lg mr-3">🏭</span>
                <div>
                  <div className="font-semibold">Production Environment Detected</div>
                  <div className="text-sm text-blue-100">
                    Tests use intelligent fallback data. API server routing optimized for production.
                  </div>
                </div>
              </div>
              <div className="text-sm bg-blue-500 px-3 py-1 rounded-full">
                Host: {window.location.hostname}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-6">
            <h1 className="text-3xl font-bold text-gray-900">Admin Testing Dashboard</h1>
            <p className="mt-2 text-gray-600">Comprehensive API integration and system testing tools</p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* System Overview */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">🎯 System Overview</h2>
              <p className="text-gray-600 mb-4">
                Real-time monitoring and testing of all Faredown system components including 
                live API integrations, email delivery, booking flow, and fallback systems.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="text-green-600 font-semibold">🏨 Hotelbeds API</div>
                  <div className="text-sm text-green-700">Live Integration</div>
                </div>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="text-blue-600 font-semibold">📧 SendGrid Email</div>
                  <div className="text-sm text-blue-700">Production Ready</div>
                </div>
                <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                  <div className="text-purple-600 font-semibold">💳 Razorpay</div>
                  <div className="text-sm text-purple-700">Test Mode</div>
                </div>
                <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
                  <div className="text-indigo-600 font-semibold">🗄️ PostgreSQL</div>
                  <div className="text-sm text-indigo-700">Render Hosted</div>
                </div>
              </div>
            </div>
          </div>

          {/* API Health Check */}
          <div className="lg:col-span-2 mb-4">
            <ApiHealthCheck />
          </div>

          {/* Live Hotelbeds Data Test */}
          <div className="lg:col-span-2 mb-8">
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">🔴 Live Hotelbeds API Data</h3>
              <p className="text-sm text-gray-600 mb-4">
                Test real Hotelbeds API responses (bypasses production fallback mode)
              </p>
              <LiveHotelbedsTest />
            </div>
          </div>

          {/* Test Components */}
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">🔧 API Error Testing</h3>
              <p className="text-sm text-gray-600 mb-4">
                Tests the production-safe fallback system and ensures zero fetch errors.
              </p>
              <div className="relative">
                <ApiErrorTest />
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">🌐 Live API Integration</h3>
              <p className="text-sm text-gray-600 mb-4">
                Tests live hotel search endpoints and database connectivity.
              </p>
              <div className="relative">
                <LiveIntegrationTest />
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">📧 Email Delivery Testing</h3>
              <p className="text-sm text-gray-600 mb-4">
                Tests SendGrid email delivery, voucher generation, and tracking.
              </p>
              <div className="relative">
                <EmailDeliveryTest />
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">🔄 Complete Booking Flow</h3>
              <p className="text-sm text-gray-600 mb-4">
                End-to-end testing of the complete booking pipeline from search to voucher.
              </p>
              <div className="relative">
                <BookingFlowTest />
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">📊 System Status</h3>
              <p className="text-sm text-gray-600 mb-4">
                Real-time monitoring of all system components and their operational status.
              </p>
              <div className="relative">
                <SystemStatus />
              </div>
            </div>
          </div>

        </div>

        {/* Additional Information */}
        <div className="mt-8 bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">💡 Testing Guidelines</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium text-gray-900 mb-2">🧪 Running Tests</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Use "Test SendGrid Delivery" for email verification</li>
                <li>• Run "Test Complete Flow" for end-to-end validation</li>
                <li>• Monitor "System Status" for real-time health</li>
                <li>• Check "API Error Test" for fallback validation</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium text-gray-900 mb-2">🎯 Production Readiness</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• All systems show "Operational" status</li>
                <li>• Zero fetch errors in production mode</li>
                <li>• Email delivery working via SendGrid</li>
                <li>• Database persistence confirmed</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
