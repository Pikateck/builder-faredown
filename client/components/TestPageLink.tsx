/**
 * Test Page Link Component
 * Provides easy access to the bargain test page
 */

import React from 'react';
import { Link } from 'react-router-dom';
import { TestTube } from 'lucide-react';

export default function TestPageLink() {
  return (
    <div className="fixed bottom-4 right-4 z-50">
      <Link
        to="/bargain-test"
        className="bg-blue-600 text-white px-4 py-2 rounded-lg shadow-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
      >
        <TestTube className="w-4 h-4" />
        Test Bargain
      </Link>
    </div>
  );
}
