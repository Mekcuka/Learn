import { createTheme } from "@mui/material/styles";
import { ruRU } from "@mui/material/locale";

export const appTheme = createTheme(
  {
    palette: {
      mode: "light",
      primary: {
        main: "#0078d2",
        light: "#e8f4fd",
        dark: "#005a9e",
      },
      secondary: {
        main: "#7b61ff",
      },
      success: {
        main: "#22a06b",
        light: "#f0fdf4",
      },
      warning: {
        main: "#f5a623",
      },
      error: {
        main: "#e5484d",
      },
      background: {
        default: "#ffffff",
        paper: "#ffffff",
      },
      text: {
        primary: "#1a1a1a",
        secondary: "#6b7280",
      },
      divider: "#e8e8e8",
    },
    typography: {
      fontFamily: '"Manrope", system-ui, sans-serif',
      button: {
        textTransform: "none",
      },
    },
    shape: {
      borderRadius: 12,
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
