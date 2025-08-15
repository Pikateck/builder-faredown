import React from "react";

export default function IndexTest() {
  return (
    <div className="min-h-screen bg-white flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          Faredown.com
        </h1>
        <p className="text-gray-600 mb-8">
          AI-Powered Travel Booking Platform
        </p>
        <div className="space-y-4">
          <div className="bg-blue-50 p-4 rounded-lg">
            <h2 className="text-lg font-semibold mb-2">✅ Frontend Server</h2>
            <p className="text-sm text-gray-600">Running on port 8080</p>
          </div>
          <div className="bg-green-50 p-4 rounded-lg">
            <h2 className="text-lg font-semibold mb-2">✅ API Server</h2>
            <p className="text-sm text-gray-600">Running on port 3001</p>
          </div>
          <div className="bg-purple-50 p-4 rounded-lg">
            <h2 className="text-lg font-semibold mb-2">✅ Database</h2>
            <p className="text-sm text-gray-600">PostgreSQL Connected</p>
          </div>
        </div>
        <div className="mt-8">
          <a
            href="/admin/login"
            className="inline-block bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 mr-4"
          >
            Admin Panel
          </a>
          <a
            href="/admin/api"
            className="inline-block bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700"
          >
            API Testing
          </a>
        </div>
      </div>
    </div>
  );
}
