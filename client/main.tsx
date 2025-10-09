import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.tsx";
import "./global.css";
import "./styles/print.css";

// Builder.io registry is now loaded conditionally in CmsPage.tsx to avoid CSP conflicts
ReactDOM.createRoot(document.getElementById("root")!).render(<App />);
