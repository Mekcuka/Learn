import { Theme, presetGpnDefault } from "@consta/uikit/Theme";
import type { ReactNode } from "react";

type AppThemeProps = {
  children: ReactNode;
};

export default function AppTheme({ children }: AppThemeProps) {
  return (
    <Theme preset={presetGpnDefault} className="learn-consta-theme">
      {children}
    </Theme>
  );
}
