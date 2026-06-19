import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import Typography from "@mui/material/Typography";
import type { ReactNode } from "react";

type BaseModalProps = {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  message?: string;
  children?: ReactNode;
  footer: ReactNode;
};

export function BaseModal({ isOpen, onClose, title, message, children, footer }: BaseModalProps) {
  return (
    <Dialog open={isOpen} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle component="h2">{title}</DialogTitle>
      {(message || children) && (
        <DialogContent className="app-modal-content">
          {message && (
            <Typography color="text.secondary" className="app-modal-message">
              {message}
            </Typography>
          )}
          {children}
        </DialogContent>
      )}
      <DialogActions className="app-modal-actions">{footer}</DialogActions>
    </Dialog>
  );
}
