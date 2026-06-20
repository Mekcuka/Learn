import Button from "@mui/material/Button";

type LessonCompleteButtonProps = {
  busy: boolean;
  hint?: string | null;
  onComplete: () => void;
};

export default function LessonCompleteButton({ busy, hint, onComplete }: LessonCompleteButtonProps) {
  return (
    <div className="lesson-complete-button" aria-live="polite">
      <Button
        variant="contained"
        color="primary"
        size="medium"
        fullWidth
        disabled={busy}
        onClick={onComplete}
      >
        {busy ? "Завершение…" : "Завершить урок"}
      </Button>
      <div className="lesson-complete-button__hint-slot" aria-hidden={!hint}>
        {hint ? (
          <p className="lesson-complete-button__hint" role="alert">
            {hint}
          </p>
        ) : null}
      </div>
    </div>
  );
}
