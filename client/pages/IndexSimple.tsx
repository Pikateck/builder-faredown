import React from "react";

export default function IndexSimple() {
  return (
    <div className="min-h-screen bg-white">
      <div className="py-6 md:py-8" style={{ backgroundColor: "#003580" }}>
        <div className="max-w-7xl mx-auto px-3 sm:px-4">
          <div className="text-center mb-4">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-2">
              Upgrade. Bargain. Book.
            </h2>
            <h1 className="text-lg sm:text-xl md:text-2xl font-semibold text-white leading-tight opacity-95">
              Control your price with AI-powered hotel upgrades.
            </h1>
          </div>
        </div>
      </div>
      
      <div className="bg-white p-8">
        <div className="text-center">
          <p className="text-lg text-gray-600">
            Landing page is working! The issue was with complex components.
          </p>
        </div>
      </div>
    </div>
  );
}
