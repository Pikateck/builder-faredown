import React from "react";
import { Layout } from "@/components/layout/Layout";

export default function FooterTest() {
  return (
    <Layout showSearch={false}>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 flex items-center justify-center">
        <div className="text-center max-w-4xl mx-auto px-6">
          <h1 className="text-h1 text-gray-900 mb-6">Footer V6 Premium Test</h1>
          <p className="text-xl text-gray-600 mb-12 max-w-2xl mx-auto">
            Testing the new V6 premium footer with ultra-compact design,
            sophisticated typography, and elegant spacing.
          </p>

          <div className="bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200 p-8 rounded-2xl mb-12 shadow-soft">
            <h3 className="text-h3 text-green-800 mb-4">
              ✅ V6 Premium Footer Active
            </h3>
            <p className="text-green-700 leading-relaxed">
              The footer below features a truly minimal design with horizontal
              layout, premium typography, and sophisticated spacing that should
              meet all height requirements.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 text-left">
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-8 rounded-2xl shadow-soft">
              <h4 className="text-h4 text-gray-900 mb-4 flex items-center">
                <div className="w-2 h-2 bg-blue-500 rounded-full mr-3"></div>
                V6 Design Features
              </h4>
              <ul className="text-gray-600 space-y-3 leading-relaxed">
                <li>• Horizontal layout for maximum space efficiency</li>
                <li>• Premium Inter font with perfect spacing</li>
                <li>• Sophisticated brand presentation</li>
                <li>• Elegant social icons and newsletter</li>
              </ul>
            </div>

            <div className="bg-gradient-to-br from-purple-50 to-violet-50 p-8 rounded-2xl shadow-soft">
              <h4 className="text-h4 text-gray-900 mb-4 flex items-center">
                <div className="w-2 h-2 bg-purple-500 rounded-full mr-3"></div>
                Height Requirements
              </h4>
              <ul className="text-gray-600 space-y-3 leading-relaxed">
                <li>• Desktop: ≤180px total height</li>
                <li>• Mobile: ≤280px stacked layout</li>
                <li>• Minimal padding: py-4 main, py-1 bottom</li>
                <li>• Compact content with smart spacing</li>
              </ul>
            </div>

            <div className="bg-gradient-to-br from-amber-50 to-yellow-50 p-8 rounded-2xl shadow-soft">
              <h4 className="text-h4 text-gray-900 mb-4 flex items-center">
                <div className="w-2 h-2 bg-amber-500 rounded-full mr-3"></div>
                Content Strategy
              </h4>
              <ul className="text-gray-600 space-y-3 leading-relaxed">
                <li>• Horizontal grouping for efficiency</li>
                <li>• Minimal copy: 5 nav links only</li>
                <li>• Compact trust indicators</li>
                <li>• Streamlined newsletter signup</li>
              </ul>
            </div>

            <div className="bg-gradient-to-br from-emerald-50 to-green-50 p-8 rounded-2xl shadow-soft">
              <h4 className="text-h4 text-gray-900 mb-4 flex items-center">
                <div className="w-2 h-2 bg-emerald-500 rounded-full mr-3"></div>
                Verification Steps
              </h4>
              <ul className="text-gray-600 space-y-3 leading-relaxed">
                <li>• Open DevTools → Elements</li>
                <li>• Find &lt;footer&gt; element</li>
                <li>• Check computed height ≤180px</li>
                <li>• Verify clean, elegant appearance</li>
              </ul>
            </div>
          </div>

          <div className="mt-12 bg-white p-8 rounded-2xl shadow-premium border border-gray-100">
            <h4 className="text-h4 text-gray-900 mb-4">
              Premium Design Validation
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm text-gray-600">
              <div className="text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-3">
                  <span className="text-white font-bold text-xl">✓</span>
                </div>
                <div className="font-semibold text-gray-900">
                  Sophisticated Layout
                </div>
                <div>Horizontal efficiency with premium spacing</div>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-3">
                  <span className="text-white font-bold text-xl">✓</span>
                </div>
                <div className="font-semibold text-gray-900">
                  Minimal Content
                </div>
                <div>Essential information only, no clutter</div>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-3">
                  <span className="text-white font-bold text-xl">✓</span>
                </div>
                <div className="font-semibold text-gray-900">
                  Classy Typography
                </div>
                <div>Inter font with perfect proportions</div>
              </div>
            </div>
          </div>

          <div className="mt-8 bg-gray-50 p-6 rounded-xl border border-gray-200">
            <p className="text-sm text-gray-500 leading-relaxed">
              <strong>DevTools Measurement:</strong> Right-click footer →
              Inspect → Check computed height in Styles panel. Target: ≤180px
              desktop for truly compact, premium appearance.
            </p>
          </div>
        </div>
      </div>
    </Layout>
  );
}
