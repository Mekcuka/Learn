/**
 * MUI theme — palette/radius values sourced from src/theme/tokens.ts.
 */
import { createTheme } from "@mui/material/styles";
import { ruRU } from "@mui/material/locale";

import { designColors, designRadius, designTypography } from "../../theme/tokens";

export const appTheme = createTheme(
  {
    palette: {
      mode: "light",
      primary: {
        main: designColors.accent,
        light: designColors.accentSoft,
        dark: designColors.accentDark,
      },
      secondary: {
        main: designColors.secondary,
      },
      success: {
        main: designColors.success,
        light: designColors.bgSuccess,
      },
      warning: {
        main: designColors.warning,
      },
      error: {
        main: designColors.error,
      },
      background: {
        default: designColors.bgDefault,
        paper: designColors.bgDefault,
      },
      text: {
        primary: designColors.textPrimary,
        secondary: designColors.textSecondary,
      },
      divider: designColors.border,
    },
    typography: {
      fontFamily: designTypography.fontFamily,
      button: {
        textTransform: "none",
      },
    },
    shape: {
      borderRadius: designRadius.control,
    },
    components: {
      MuiButton: {
        defaultProps: {
          disableElevation: true,
        },
      },
      MuiCssBaseline: {
        styleOverrides: {
          body: {
            overflowX: "hidden",
          },
        },
      },
    },
  },
  ruRU,
);
