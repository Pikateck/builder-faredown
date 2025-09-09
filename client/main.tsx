https://8c0fb9dbe5f947261a7ca5e86515e3c9@o4509988944281600.ingest.de.sentry.io/4509988955750480
// Sentry (error + performance + session replay)
import * as Sentry from "@sentry/react";

Sentry.init({
  dsn: import.meta.env.VITE_SENTRY_DSN,
  integrations: [Sentry.browserTracingIntegration(), Sentry.replayIntegration()],
  tracesSampleRate: 0.1,
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,
  sendDefaultPii: false,
});

import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.tsx";
import "./global.css";
import "./styles/print.css";

ReactDOM.createRoot(document.getElementById("root")!).render(<App />);
