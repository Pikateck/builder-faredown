import "@/builder/registry";
import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.tsx";
import "./global.css";
import "./styles/print.css";
import { registerAdminWorker } from "@/lib/register-admin-worker";

if (typeof window !== "undefined" && "serviceWorker" in navigator) {
  const { hostname, pathname } = window.location;
  const isAdminRoute = pathname.startsWith("/admin");
  const isBuilderPreview =
    hostname.includes("builder") ||
    hostname.includes("netlify.app") ||
    hostname.includes("fly.dev");

  if (isAdminRoute || isBuilderPreview) {
    registerAdminWorker().catch((error) => {
      console.warn("⚠️ Global Service Worker registration failed", error);
    });
  }
}

ReactDOM.createRoot(document.getElementById("root")!).render(<App />);
