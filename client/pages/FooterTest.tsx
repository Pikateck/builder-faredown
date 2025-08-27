import React from "react";
import { Layout } from "@/components/layout/Layout";

export default function FooterTest() {
  return (
    <Layout showSearch={false}>
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center max-w-2xl mx-auto px-4">
          <h1 className="text-h1 text-gray-900 mb-4">
            Footer V4 Compact Test
          </h1>
          <p className="text-body text-gray-600 mb-8">
            Testing the new V4 compact footer implementation with premium design standards.
          </p>
          
          <div className="bg-green-50 border border-green-200 p-5 rounded-xl mb-8">
            <h3 className="text-h3 text-green-800 mb-3">✅ V4 Compact Footer Active</h3>
            <p className="text-body text-green-700">
              The footer below should meet the new premium standards with proper height constraints.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left">
            <div className="bg-[#003580]/5 p-5 rounded-xl">
              <h4 className="text-h3 text-gray-900 mb-3">Height Requirements</h4>
              <ul className="text-body text-gray-600 space-y-2">
                <li>• Desktop: ≤ 240–260px (with bottom bar)</li>
                <li>• Mobile: ≤ 360px total</li>
                <li>• Container: py-6 md:py-8</li>
                <li>• Bottom bar: py-2</li>
              </ul>
            </div>

            <div className="bg-[#0071c2]/5 p-5 rounded-xl">
              <h4 className="text-h3 text-gray-900 mb-3">Design Elements</h4>
              <ul className="text-body text-gray-600 space-y-2">
                <li>• 4 columns layout</li>
                <li>• Inter font family</li>
                <li>• Lucide icons (18px, stroke 2)</li>
                <li>• Yellow subscribe button</li>
                <li>• No debug banners</li>
              </ul>
            </div>

            <div className="bg-[#10b981]/5 p-5 rounded-xl">
              <h4 className="text-h3 text-gray-900 mb-3">Brand Colors</h4>
              <ul className="text-body text-gray-600 space-y-2">
                <li>• Background: #003580</li>
                <li>• Text: white/white-variants</li>
                <li>• Hover: #0071c2</li>
                <li>• CTA: #febb02 → #e6a602 → #d19900</li>
              </ul>
            </div>

            <div className="bg-[#febb02]/10 p-5 rounded-xl">
              <h4 className="text-h3 text-gray-900 mb-3">Performance</h4>
              <ul className="text-body text-gray-600 space-y-2">
                <li>• SVG icons only</li>
                <li>• Optimized font loading</li>
                <li>• Minimal animations ≤150ms</li>
                <li>• Responsive design</li>
              </ul>
            </div>
          </div>

          <div className="mt-8 bg-gray-50 p-5 rounded-xl">
            <p className="text-small text-gray-500">
              Open DevTools and measure the footer height to verify it meets the 240-260px desktop requirement.
            </p>
          </div>
        </div>
      </div>
    </Layout>
  );
}
