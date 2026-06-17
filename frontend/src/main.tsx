import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";

import App from "./App";
import AppTheme from "./components/consta/AppTheme";
import { AuthProvider } from "./auth/AuthContext";
import "./index.css";
import "./consta-overrides.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      <AppTheme>
        <AuthProvider>
          <App />
        </AuthProvider>
      </AppTheme>
    </BrowserRouter>
  </StrictMode>,
);
