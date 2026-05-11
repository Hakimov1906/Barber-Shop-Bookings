import { createRoot } from "react-dom/client";
import { useState, useEffect } from "react";
import App from "./App.tsx";
import "./index.css";

const SplashScreen = ({ fading }: { fading: boolean }) => (
  <div className={`fixed inset-0 z-50 flex items-center justify-center bg-background transition-opacity duration-500 ${fading ? "opacity-0" : "opacity-100"}`}>
    <img src="/app-icon.svg" alt="HairLine" className="h-24 w-24" />
  </div>
);

const Root = () => {
  const [showSplash, setShowSplash] = useState(true);
  const [fading, setFading] = useState(false);

  useEffect(() => {
    const fadeTimer = setTimeout(() => setFading(true), 1000);
    const hideTimer = setTimeout(() => setShowSplash(false), 1500);
    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(hideTimer);
    };
  }, []);

  if (showSplash) {
    return <SplashScreen fading={fading} />;
  }

  return <App />;
};

createRoot(document.getElementById("root")!).render(<Root />);
