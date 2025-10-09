import "@/builder/registry";
import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.tsx";
import "./global.css";
import "./styles/print.css";
import { registerAdminWorker } from "@/lib/register-admin-worker";

if (typeof window !== "undefined" && "serviceWorker" in navigator) {
  registerAdminWorker().catch((error) => {
    console.warn("⚠️ Admin Service Worker registration failed", error);
  });
}

ReactDOM.createRoot(document.getElementById("root")!).render(<App />);
