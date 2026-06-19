import CssBaseline from "@mui/material/CssBaseline";
import { ThemeProvider } from "@mui/material/styles";
import type { ReactNode } from "react";

import { appTheme } from "./theme";

type AppThemeProps = {
  children: ReactNode;
};

export default function AppTheme({ children }: AppThemeProps) {
  return (
    <ThemeProvider theme={appTheme}>
      <CssBaseline />
      <div className="learn-mui-theme">{children}</div>
    </ThemeProvider>
  );
}
