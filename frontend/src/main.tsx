// Suppress ResizeObserver loop limit errors and React Flow container warnings
// This MUST run before any other code to catch errors early.
if (typeof window !== 'undefined') {
  const resizeObserverErr = 'ResizeObserver loop limit exceeded';
  const rfContainerErr = 'The React Flow parent container needs a width and a height to render the graph';
  
  window.addEventListener('error', (e) => {
    if (e.message?.includes(resizeObserverErr) || e.message?.includes('ResizeObserver loop completed') || e.message?.includes(rfContainerErr)) {
      const viteErrOverlay = document.querySelector('vite-error-overlay');
      if (viteErrOverlay) viteErrOverlay.remove();
      e.stopImmediatePropagation();
    }
  });

  const originalConsoleError = console.error;
  console.error = (...args) => {
    if (args[0]?.includes?.(rfContainerErr) || args[0]?.includes?.(resizeObserverErr)) return;
    originalConsoleError.apply(console, args);
  };
}

import { createRoot } from "react-dom/client";
import { setBaseUrl } from "@workspace/api-client-react";
import { injectSpeedInsights } from "@vercel/speed-insights";
import App from "./App";
import "./index.css";

// Initialize API Base URL
setBaseUrl(import.meta.env.VITE_API_URL || "http://localhost:3000");

// Initialize Vercel Speed Insights
injectSpeedInsights();

createRoot(document.getElementById("root")!).render(<App />);
