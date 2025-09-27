/**
 * Bargain Test Page
 * Dedicated page to test bargain modal error handling
 */

import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import BargainErrorTest from '@/components/BargainErrorTest';

export default function BargainTestPage() {
  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex items-center gap-4 mb-4">
            <Link 
              to="/" 
              className="flex items-center text-blue-600 hover:text-blue-700"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Home
            </Link>
          </div>
          
          <h1 className="text-2xl font-bold text-gray-900">
            Bargain Modal Test
          </h1>
          <p className="text-gray-600 mt-2">
            Test the ConversationalBargainModal error handling and offline fallback functionality.
          </p>
        </div>

        {/* Test Component */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <BargainErrorTest />
          
          <div className="mt-6 p-4 bg-blue-50 rounded-lg">
            <h3 className="font-semibold text-blue-900 mb-2">Test Instructions:</h3>
            <ol className="list-decimal list-inside text-blue-800 space-y-1">
              <li>Click the "Test Bargain Modal" button above</li>
              <li>Enter a price lower than ₹5,000 (e.g., ₹4,000)</li>
              <li>Click "Submit Offer"</li>
              <li>Accept the final offer when presented</li>
              <li>Verify the modal handles the offline API gracefully with a positive message</li>
            </ol>
          </div>

          <div className="mt-4 p-4 bg-green-50 rounded-lg">
            <h4 className="font-semibold text-green-900 mb-2">Expected Behavior:</h4>
            <ul className="list-disc list-inside text-green-800 space-y-1">
              <li>✅ Modal should show "Great! Proceeding with your booking..." message</li>
              <li>✅ Should NOT throw "Hold creation failed" error</li>
              <li>✅ Should proceed to booking acceptance without crashing</li>
              <li>✅ Should include warning about service being temporarily unavailable</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
