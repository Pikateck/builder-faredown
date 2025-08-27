import React from "react";
import { Layout } from "@/components/layout/Layout";

export default function FooterTest() {
  return (
    <Layout showSearch={false}>
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center max-w-2xl mx-auto px-4">
          <h1 className="text-h1 text-gray-900 mb-4">
            Footer V5 Ultra-Compact Test
          </h1>
          <p className="text-body text-gray-600 mb-8">
            Testing the V5 ultra-compact footer with ≤220px desktop height requirement.
          </p>
          
          <div className="bg-green-50 border border-green-200 p-5 rounded-xl mb-8">
            <h3 className="font-semibold text-green-800 mb-2 text-[16px]">✅ V5 Ultra-Compact Footer Active</h3>
            <p className="text-[13px] text-green-700 line-clamp-2">
              The footer below should meet the strict height constraints with minimal copy and compact spacing.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
            <div className="bg-[#003580]/5 p-4 rounded-xl">
              <h4 className="font-semibold text-gray-900 mb-2 text-[16px]">V5 Height Requirements</h4>
              <ul className="text-[13px] text-gray-600 space-y-1">
                <li>• Desktop: ≤200–220px (with bottom bar)</li>
                <li>• Mobile: ≤320px total</li>
                <li>• Container: py-5 desktop/py-4 mobile</li>
                <li>• Bottom bar: py-2</li>
              </ul>
            </div>

            <div className="bg-[#0071c2]/5 p-4 rounded-xl">
              <h4 className="font-semibold text-gray-900 mb-2 text-[16px]">Copy Limits</h4>
              <ul className="text-[13px] text-gray-600 space-y-1">
                <li>• Brand blurb: ≤90 chars</li>
                <li>• Quick Links: max 6 items, 12px text</li>
                <li>• Trust: 1 line + short quote ≤60 chars</li>
                <li>• No debug banners</li>
              </ul>
            </div>

            <div className="bg-[#10b981]/5 p-4 rounded-xl">
              <h4 className="font-semibold text-gray-900 mb-2 text-[16px]">Typography & Icons</h4>
              <ul className="text-[13px] text-gray-600 space-y-1">
                <li>• Inter font family only</li>
                <li>• Lucide icons, 16px size</li>
                <li>• Compact 8px newsletter input</li>
                <li>• Yellow CTA button</li>
              </ul>
            </div>

            <div className="bg-[#febb02]/10 p-4 rounded-xl">
              <h4 className="font-semibold text-gray-900 mb-2 text-[16px]">Verification</h4>
              <ul className="text-[13px] text-gray-600 space-y-1">
                <li>• Measure footer height in DevTools</li>
                <li>• Should be ≤220px desktop</li>
                <li>• All text should be minimal</li>
                <li>• Clean, elegant appearance</li>
              </ul>
            </div>
          </div>

          <div className="mt-6 bg-gray-50 p-4 rounded-xl">
            <p className="text-[12px] text-gray-500">
              Open DevTools → Elements → Find &lt;footer&gt; → Check computed height. Should be ≤220px on desktop.
            </p>
          </div>
        </div>
      </div>
    </Layout>
  );
}
