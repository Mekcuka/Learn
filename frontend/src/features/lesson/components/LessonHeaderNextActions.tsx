import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";

import type { NextLessonNavigation } from "../../../utils/lessonUi";
import LessonCompleteButton from "./LessonCompleteButton";
import LessonNextStepCard from "./LessonNextStepCard";

import styles from "./LessonHeaderNextActions.module.css";

type LessonHeaderNextActionsProps = {
  showNextStep: boolean;
  showComplete: boolean;
  nextLessonNavigation: NextLessonNavigation | null;
  verifyBusy: boolean;
  completeHint?: string | null;
  onNavigate: (path: string) => void;
  onComplete: () => void;
};

function LessonHeaderSplitButton({
  navigation,
  verifyBusy,
  completeHint,
  onNavigate,
  onComplete,
}: {
  navigation: Extract<NextLessonNavigation, { kind: "lesson" }>;
  verifyBusy: boolean;
  completeHint?: string | null;
  onNavigate: (path: string) => void;
  onComplete: () => void;
}) {
  return (
    <section className={styles.root} aria-label="Действия урока">
      <div className={styles.splitBar} role="group" aria-label="Следующий урок и завершение">
        <Button
          variant="contained"
          color="primary"
          className={styles.splitLeft}
          onClick={() => onNavigate(`/lessons/${navigation.lessonId}`)}
          aria-label={`Следующий урок: ${navigation.title}`}
        >
          <span className={styles.btnLabel}>Следующий урок</span>
          <Typography component="span" variant="body2" className={styles.btnTitle}>
            {navigation.title}
          </Typography>
        </Button>
        <div className={styles.divider} role="separator" aria-orientation="vertical" />
        <Button
          variant="contained"
          color="primary"
          className={styles.splitRight}
          disabled={verifyBusy}
          onClick={onComplete}
          aria-live="polite"
        >
          {verifyBusy ? "Завершение…" : "Завершить урок"}
        </Button>
      </div>
      {completeHint ? (
        <p className={styles.completeHint} role="alert">
          {completeHint}
        </p>
      ) : null}
    </section>
  );
}

export default function LessonHeaderNextActions({
  showNextStep,
  showComplete,
  nextLessonNavigation,
  verifyBusy,
  completeHint,
  onNavigate,
  onComplete,
}: LessonHeaderNextActionsProps) {
  const showSplit =
    showNextStep &&
    showComplete &&
    nextLessonNavigation != null &&
    nextLessonNavigation.kind === "lesson";

  if (showSplit) {
    return (
      <LessonHeaderSplitButton
        navigation={nextLessonNavigation}
        verifyBusy={verifyBusy}
        completeHint={completeHint}
        onNavigate={onNavigate}
        onComplete={onComplete}
      />
    );
  }

  if (showNextStep && nextLessonNavigation) {
    return <LessonNextStepCard navigation={nextLessonNavigation} onNavigate={onNavigate} />;
  }

  if (showComplete) {
    return <LessonCompleteButton busy={verifyBusy} hint={completeHint} onComplete={onComplete} />;
  }

  return null;
}
