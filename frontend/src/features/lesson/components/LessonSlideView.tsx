import Typography from "@mui/material/Typography";

import type { AuthorLessonDetail } from "../../../api/authorApi";
import type { LessonDetail } from "../../../types/lesson";
import type { QuizSubmitResult } from "../../../types/lesson";
import { isMixedQuizLesson, isQuizOnlyLesson } from "../../../utils/lessonUi";
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
  const showStudentActions = mode === "student" || mode === "preview";
  const studentLesson = lesson as LessonDetail;
  const quiz = "quiz" in lesson ? studentLesson.quiz : null;
  const hasSlides = lesson.slides.length > 0;
  const isMixedLesson = isMixedQuizLesson(lesson);
  const isQuizOnly = isQuizOnlyLesson(lesson);
  const isOnQuizStep = isMixedLesson && slideIndex >= lesson.slides.length;
  const showQuizPanel =
    showStudentActions && Boolean(quiz) && (isQuizOnly || isOnQuizStep);

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

      {showQuizPanel ? (
        <QuizPanel
          quiz={quiz!}
          busy={busy}
          result={quizResult}
          isPreview={isPreview || mode === "preview"}
          onSubmit={onQuizSubmit ?? (() => undefined)}
        />
      ) : hasSlides ? (
        <SlideCarousel
          slides={lesson.slides}
          currentIndex={slideIndex}
          onChange={onSlideIndexChange}
          activeHotspotId={activeHotspotId}
          onHotspotSelect={onHotspotSelect}
          hasTrailingQuiz={isMixedLesson && Boolean(quiz)}
        />
      ) : (
        <div className="slide-empty">
          <Typography color="text.secondary">Для этого урока пока нет содержимого.</Typography>
        </div>
      )}
    </div>
  );
}
