import React, { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { LandingPageSearchPanel } from "@/components/LandingPageSearchPanel";
import { UnifiedLandingPage } from "@/components/UnifiedLandingPage";

export default function Index() {
  const location = useLocation();
  const navigate = useNavigate();

  // Handle tab redirects
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const tab = searchParams.get("tab");

    if (tab) {
      switch (tab) {
        case "flights":
          navigate("/flights", { replace: true });
          break;
        case "hotels":
          navigate("/hotels", { replace: true });
          break;
        case "sightseeing":
          navigate("/sightseeing", { replace: true });
          break;
        case "transfers":
          navigate("/transfers", { replace: true });
          break;
      }
    }
  }, [location.search, navigate]);
  return (
    <Layout showSearch={false}>
      <UnifiedLandingPage
        module="flights"
        tagline="Turn your fare into an upgrade with live AI bargaining."
        searchPanel={<LandingPageSearchPanel />}
      />
    </Layout>
  );
}
