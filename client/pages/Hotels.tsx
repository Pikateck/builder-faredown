import React from "react";
import { Layout } from "@/components/layout/Layout";
import { UnifiedLandingPage } from "@/components/UnifiedLandingPage";

export default function Hotels() {
  return (
    <Layout>
      <UnifiedLandingPage 
        module="hotels"
        tagline="Control your price with AI-powered hotel upgrades."
      />
    </Layout>
  );
}
