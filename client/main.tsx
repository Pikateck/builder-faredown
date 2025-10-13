import "@/builder/registry";
import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.tsx";
import "./global.css";
import "./styles/print.css";
import { registerAdminWorker } from "@/lib/register-admin-worker";

// Suppress benign ResizeObserver errors (they don't affect functionality)
const originalConsoleError = console.error;
console.error = (...args: any[]) => {
  if (
    typeof args[0] === "string" &&
    args[0].includes("ResizeObserver loop")
  ) {
    return;
  }
  originalConsoleError.apply(console, args);
};

if (typeof window !== "undefined" && "serviceWorker" in navigator) {
  registerAdminWorker().catch((error) => {
    console.warn("⚠️ Admin Service Worker registration failed", error);
  });
}

ReactDOM.createRoot(document.getElementById("root")!).render(<App />);
