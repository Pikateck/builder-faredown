import React from "react";
import { Layout } from "@/components/layout/Layout";
import { UnifiedLandingPage } from "@/components/UnifiedLandingPage";

export default function Sightseeing() {
  return (
    <Layout>
      <UnifiedLandingPage 
        module="sightseeing"
        tagline="Explore attractions & experiences with AI that bargains for you."
      />
    </Layout>
  );
}
