import React from "react";
import { Layout } from "@/components/layout/Layout";
import { UnifiedLandingPage } from "@/components/UnifiedLandingPage";
import { MobileNativeSearchForm } from "@/components/mobile/MobileNativeSearchForm";
import { LandingPageSearchPanel } from "@/components/LandingPageSearchPanel";

export default function Flights() {
  return (
    <Layout showSearch={false}>
      <UnifiedLandingPage
        module="flights"
        tagline="Turn your seat into an upgrade and your fare into a win, with AI that bargains for you."
        searchPanel={
          <>
            {/* Desktop Search Panel */}
            <div className="hidden md:block">
              <LandingPageSearchPanel />
            </div>
            {/* Mobile Native Search Form */}
            <div className="block md:hidden">
              <MobileNativeSearchForm module="flights" />
            </div>
          </>
        }
      />
    </Layout>
  );
}
