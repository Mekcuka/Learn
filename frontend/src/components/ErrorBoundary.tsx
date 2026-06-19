import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import { Component, type ErrorInfo, type ReactNode } from "react";

type ErrorBoundaryProps = {
  children: ReactNode;
};

type ErrorBoundaryState = {
  hasError: boolean;
};

export default class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("Unhandled UI error", error, info);
  }

  private handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="page-status">
          <Typography variant="h6" component="h1">
            Что-то пошло не так
          </Typography>
          <Typography color="text.secondary">
            Обновите страницу. Если ошибка повторится, сообщите методисту.
          </Typography>
          <Button variant="contained" onClick={this.handleReload}>
            Обновить страницу
          </Button>
        </div>
      );
    }

    return this.props.children;
  }
}
