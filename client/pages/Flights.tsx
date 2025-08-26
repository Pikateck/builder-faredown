import React from "react";
import { Layout } from "@/components/layout/Layout";
import { UnifiedLandingPage } from "@/components/UnifiedLandingPage";

export default function Flights() {
  return (
    <Layout>
      <UnifiedLandingPage
        module="flights"
        tagline="Turn your fare into an upgrade with live AI bargaining."
      />
    </Layout>
  );
}
