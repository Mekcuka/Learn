import CircularProgress from "@mui/material/CircularProgress";
import Typography from "@mui/material/Typography";

type PageLoadingProps = {
  label?: string;
};

export function PageLoading({ label = "Загрузка…" }: PageLoadingProps) {
  return (
    <div className="page-status">
      <CircularProgress size={28} />
      <Typography color="text.secondary">{label}</Typography>
    </div>
  );
}

type PageErrorProps = {
  message: string;
};

export function PageError({ message }: PageErrorProps) {
  return (
    <div className="page-status page-status-error">
      <Typography color="error">{message}</Typography>
    </div>
  );
}
