import React from "react";
import { Layout } from "@/components/layout/Layout";

export default function FooterTest() {
  return (
    <Layout showSearch={false}>
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Footer Test Page
          </h1>
          <p className="text-gray-600 mb-8">
            This page tests the new compact footer implementation.
          </p>
          <div className="bg-blue-50 p-4 rounded-lg">
            <p className="text-blue-800 font-medium">
              ✅ If you see a compact blue footer with "NEW" badge at the bottom, 
              the footer redesign is working correctly.
            </p>
          </div>
          <div className="mt-8 space-y-2 text-sm text-gray-600">
            <p>• Footer should have blue background (#003580)</p>
            <p>• Yellow border at the top</p>
            <p>• 4 columns: Brand | Quick Links | Trust & Reviews | Stay Connected</p>
            <p>• Yellow "NEW" badge in brand section</p>
            <p>• Much smaller height (~280px)</p>
          </div>
        </div>
      </div>
    </Layout>
  );
}
