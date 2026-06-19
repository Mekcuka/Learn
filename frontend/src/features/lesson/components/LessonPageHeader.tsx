import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import LinearProgress from "@mui/material/LinearProgress";
import Typography from "@mui/material/Typography";

import type { LessonDetail, LessonStateItem } from "../../../types/lesson";
import { lessonLayoutGridClasses } from "../../../constants/lessonLayout";
import { moduleProgressLabel } from "../../../utils/lessonUi";
import HashtagList from "../../../shared/content/HashtagList";
import LessonNextStepCard from "./LessonNextStepCard";
import LessonRoadmap from "./LessonRoadmap";
import type { NextLessonNavigation } from "../../../utils/lessonUi";

type LessonPageHeaderProps = {
  lesson: LessonDetail;
  lessonState: LessonStateItem | undefined;
  totalLessons: number;
  completedLessons: number;
  isPreview: boolean;
  isDraftPreview: boolean;
  showHintsColumn: boolean;
  nextLessonNavigation: NextLessonNavigation | null;
  onBack: () => void;
  onNavigate: (path: string) => void;
  roadmapLinkTo: (lessonId: string) => string;
};

export default function LessonPageHeader({
  lesson,
  lessonState,
  totalLessons,
  completedLessons,
  isPreview,
  isDraftPreview,
  showHintsColumn,
  nextLessonNavigation,
  onBack,
  onNavigate,
  roadmapLinkTo,
}: LessonPageHeaderProps) {
  const { headerGrid } = lessonLayoutGridClasses(showHintsColumn);
  const lessonStatus = lessonState?.status;
  const statusChip =
    lessonStatus === "completed"
      ? { color: "success" as const, label: "Выполнен" }
      : lessonStatus === "locked"
        ? { color: "default" as const, label: "Заблокирован" }
        : { color: "primary" as const, label: "В процессе" };

  return (
    <header className="lesson-page-header">
      <div className="lesson-page-header-row">
        <Button size="small" variant="text" onClick={onBack}>
          ← К каталогу
        </Button>
        <Typography variant="body2" color="text.secondary" className="lesson-page-meta">
          Урок {lesson.order} из {totalLessons} · {lesson.module_title}
        </Typography>
        {isPreview ? (
          <Chip
            size="small"
            color="warning"
            label={isDraftPreview ? "Превью черновика" : "Превью для ученика"}
            className="badge-preview"
          />
        ) : (
          <Chip size="small" color={statusChip.color} label={statusChip.label} className="lesson-page-status" />
        )}
      </div>
      <div className={headerGrid}>
        <div className="lesson-page-header__intro">
          <Typography variant="h4" fontWeight="bold" component="h1" className="lesson-page-title">
            {lesson.title}
          </Typography>
          {(lesson.tags?.length ?? 0) > 0 && (
            <HashtagList tags={lesson.tags ?? []} linkBase="/dashboard" className="lesson-page-tags" />
          )}
          {!isPreview && (
            <div className="lesson-page-progress-block" aria-label="Прогресс модуля">
              <div className="lesson-page-progress-meta">
                <Typography variant="caption" color="text.secondary">
                  {moduleProgressLabel(completedLessons, totalLessons)}
                </Typography>
                <Typography variant="caption" fontWeight={600} className="lesson-page-progress-value">
                  {lesson.progress_percent}%
                </Typography>
              </div>
              <LinearProgress variant="determinate" value={lesson.progress_percent} />
            </div>
          )}
        </div>
        <div className="lesson-page-header__roadmap">
          {totalLessons > 0 && (
            <LessonRoadmap
              lessons={lesson.module_lessons}
              currentLessonId={lesson.id}
              linkTo={roadmapLinkTo}
              abbreviateCurrentLabel
            />
          )}
        </div>
        {showHintsColumn && nextLessonNavigation && (
          <div className="lesson-page-header__next">
            <LessonNextStepCard navigation={nextLessonNavigation} onNavigate={onNavigate} />
          </div>
        )}
      </div>
    </header>
  );
}
