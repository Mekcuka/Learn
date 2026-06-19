import Typography from "@mui/material/Typography";

import type { AuthorLessonDetail } from "../../../api/authorApi";
import type { LessonDetail } from "../../../types/lesson";
import type { QuizSubmitResult } from "../../../types/lesson";
import QuizPanel from "./QuizPanel";
import SlideCarousel from "./SlideCarousel";

export type LessonSlideViewMode = "student" | "author" | "preview";

type LessonSlideViewProps = {
  mode: LessonSlideViewMode;
  lesson: LessonDetail | AuthorLessonDetail;
  slideIndex: number;
  onSlideIndexChange: (index: number) => void;
  activeHotspotId?: string | null;
  onHotspotSelect?: (id: string | null) => void;
  hasUnpublishedChanges?: boolean;
  busy?: boolean;
  quizResult?: QuizSubmitResult | null;
  isPreview?: boolean;
  onQuizSubmit?: (answers: Record<string, string[]>) => void;
};

export default function LessonSlideView({
  mode,
  lesson,
  slideIndex,
  onSlideIndexChange,
  activeHotspotId,
  onHotspotSelect,
  hasUnpublishedChanges = false,
  busy = false,
  quizResult = null,
  isPreview = false,
  onQuizSubmit,
}: LessonSlideViewProps) {
  const isQuizLesson = lesson.verify.type === "quiz_passed";
  const showStudentActions = mode === "student" || mode === "preview";
  const studentLesson = lesson as LessonDetail;
  const quiz = "quiz" in lesson ? studentLesson.quiz : null;

  return (
    <div className={`lesson-slide-view lesson-slide-view--${mode}`}>
      {mode === "author" && (
        <div className="lesson-slide-view-author-banner" role="status">
          <Typography variant="caption" color="text.secondary">
            {hasUnpublishedChanges
              ? "Режим конструктора — показывает черновик. Ученики увидят это после публикации."
              : "Режим конструктора — содержимое совпадает с опубликованным для учеников."}
          </Typography>
        </div>
      )}

      {isQuizLesson && quiz && showStudentActions ? (
        <QuizPanel
          quiz={quiz}
          busy={busy}
          result={quizResult}
          isPreview={isPreview || mode === "preview"}
          onSubmit={onQuizSubmit ?? (() => undefined)}
        />
      ) : (
        <SlideCarousel
          slides={lesson.slides}
          currentIndex={slideIndex}
          onChange={onSlideIndexChange}
          activeHotspotId={activeHotspotId}
          onHotspotSelect={onHotspotSelect}
        />
      )}
    </div>
  );
}
