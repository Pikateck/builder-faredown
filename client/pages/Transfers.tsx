import React from "react";
import { Layout } from "@/components/layout/Layout";
import { UnifiedLandingPage } from "@/components/UnifiedLandingPage";

export default function Transfers() {
  return (
    <Layout>
      <UnifiedLandingPage 
        module="transfers"
        tagline="Ride in comfort for less — AI secures your best deal on every trip."
      />
    </Layout>
  );
}
