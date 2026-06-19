import Button from "@mui/material/Button";
import CircularProgress from "@mui/material/CircularProgress";

import { BaseModal } from "./BaseModal";

type ConfirmModalProps = {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
};

export function ConfirmModal({
  isOpen,
  title,
  message,
  confirmLabel = "Подтвердить",
  cancelLabel = "Отмена",
  danger = false,
  loading = false,
  onConfirm,
  onCancel,
}: ConfirmModalProps) {
  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onCancel}
      title={title}
      message={message}
      footer={
        <>
          <Button variant="outlined" disabled={loading} onClick={onCancel}>
            {cancelLabel}
          </Button>
          <Button
            variant="contained"
            color={danger ? "error" : "primary"}
            disabled={loading}
            onClick={onConfirm}
            startIcon={loading ? <CircularProgress size={16} color="inherit" /> : undefined}
          >
            {confirmLabel}
          </Button>
        </>
      }
    />
  );
}
