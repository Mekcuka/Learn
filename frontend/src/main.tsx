import { StrictMode } from "react";

import { createRoot } from "react-dom/client";

import { BrowserRouter } from "react-router-dom";



import App from "./App";

import AppTheme from "./components/mui/AppTheme";

import ErrorBoundary from "./components/ErrorBoundary";

import { AuthProvider } from "./auth/AuthContext";

import "./index.css";

import "./mui-overrides.css";

import { injectDesignTokenCssVariables } from "./theme/tokens";

injectDesignTokenCssVariables();

createRoot(document.getElementById("root")!).render(

  <StrictMode>

    <ErrorBoundary>

      <BrowserRouter basename={import.meta.env.BASE_URL}>

        <AppTheme>

          <AuthProvider>

            <App />

          </AuthProvider>

        </AppTheme>

      </BrowserRouter>

    </ErrorBoundary>

  </StrictMode>,

);

