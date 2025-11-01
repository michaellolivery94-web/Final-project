import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// Register service worker for offline support
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').then(
      (registration) => {
        console.log('✅ Service Worker registered:', registration.scope);
      },
      (error) => {
        console.log('⚠️ Service Worker registration failed:', error);
      }
    );
  });
}

createRoot(document.getElementById("root")!).render(<App />);
