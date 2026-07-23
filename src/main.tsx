import React from "react";
import ReactDOM from "react-dom/client";
import { HashRouter } from "react-router-dom";
import { GoogleOAuthProvider } from "@react-oauth/google";
import App from "./App";
import "./App.css";

const initSettings = () => {
  const saved = localStorage.getItem('user_settings');
  if (saved) {
    try {
      const settings = JSON.parse(saved);
      if (settings['dark-mode']) document.documentElement.setAttribute('data-theme', 'dark');
      if (settings['compact']) document.documentElement.setAttribute('data-sidebar', 'compact');
      if (settings['motion']) document.documentElement.setAttribute('data-reduced-motion', 'true');
    } catch (e) {}
  }
};
initSettings();

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <HashRouter>
      <GoogleOAuthProvider clientId="218481603135-sj7mggjqaupo2idfopts60uotpre4t68.apps.googleusercontent.com">
        <App />
      </GoogleOAuthProvider>
    </HashRouter>
  </React.StrictMode>,
);
