import { Alert, Snackbar } from "@mui/material";
import type { AlertColor } from "@mui/material/Alert";

type AppToastProps = {
  open: boolean;
  message: string;
  severity?: AlertColor;
  onClose: () => void;
};

export function AppToast({
  open,
  message,
  severity = "error",
  onClose,
}: AppToastProps) {
  return (
    <Snackbar
      open={open}
      autoHideDuration={6000}
      onClose={(_, reason) => {
        if (reason === "clickaway") {
          return;
        }
        onClose();
      }}
      anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
      sx={{ zIndex: (theme) => theme.zIndex.snackbar + 1 }}
    >
      <Alert
        severity={severity}
        variant="filled"
        onClose={onClose}
        role="alert"
        sx={{ width: "100%", maxWidth: 420 }}
      >
        {message}
      </Alert>
    </Snackbar>
  );
}
