import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";

import type { NextLessonNavigation } from "../../../utils/lessonUi";

import styles from "./LessonNextStepCard.module.css";

type LessonNextStepCardProps = {
  navigation: NextLessonNavigation;
  onNavigate: (path: string) => void;
};

export default function LessonNextStepCard({ navigation, onNavigate }: LessonNextStepCardProps) {
  if (navigation.kind === "lesson") {
    return (
      <section className={styles.root} aria-label="Следующий урок">
        <Button
          variant="contained"
          color="primary"
          fullWidth
          className={styles.btn}
          onClick={() => onNavigate(`/lessons/${navigation.lessonId}`)}
        >
          <span className={styles.btnLabel}>Следующий урок</span>
          <Typography component="span" variant="body2" className={styles.btnTitle}>
            {navigation.title}
          </Typography>
        </Button>
      </section>
    );
  }

  return (
    <section className={styles.root} aria-label="Завершение модуля">
      <Button
        variant="outlined"
        color="primary"
        fullWidth
        className={`${styles.btn} ${styles.btnCatalog}`}
        onClick={() => onNavigate("/dashboard")}
      >
        К каталогу уроков
      </Button>
    </section>
  );
}
