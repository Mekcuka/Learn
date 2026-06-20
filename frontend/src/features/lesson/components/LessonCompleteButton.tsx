import Button from "@mui/material/Button";

type LessonCompleteButtonProps = {
  busy: boolean;
  onComplete: () => void;
};

export default function LessonCompleteButton({ busy, onComplete }: LessonCompleteButtonProps) {
  return (
    <div className="lesson-complete-button" aria-live="polite">
      <Button variant="contained" color="primary" size="medium" disabled={busy} onClick={onComplete}>
        {busy ? "Завершение…" : "Завершить урок"}
      </Button>
    </div>
  );
}
