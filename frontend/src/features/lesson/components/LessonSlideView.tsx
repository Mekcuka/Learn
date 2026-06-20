import Typography from "@mui/material/Typography";

import type { AuthorLessonDetail } from "../../../api/authorApi";
import type { LessonDetail } from "../../../types/lesson";
import type { QuizSubmitResult } from "../../../types/lesson";
import { isMixedQuizLesson, isQuizOnlyLesson, hasLoadedQuiz } from "../../../utils/lessonUi";
import QuizPanel from "./QuizPanel";
import SlideCarousel from "./SlideCarousel";

export type LessonSlideViewMode = "student" | "author" | "preview";

export type ManualVerifyAction = {
  onVerify: () => void;
  busy?: boolean;
  disabled?: boolean;
};

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
  submitError?: string | null;
  onQuizSubmit?: (answers: Record<string, string[]>) => void;
  manualVerify?: ManualVerifyAction | null;
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
  submitError = null,
  onQuizSubmit,
  manualVerify = null,
}: LessonSlideViewProps) {
  const showStudentActions = mode === "student" || mode === "preview";
  const slideNavManualVerify = mode === "student" ? manualVerify : null;
  const studentLesson = lesson as LessonDetail;
  const quiz = "quiz" in lesson ? studentLesson.quiz : null;
  const hasSlides = lesson.slides.length > 0;
  const isMixedLesson = isMixedQuizLesson(lesson);
  const isQuizOnly = isQuizOnlyLesson(lesson);
  const isOnQuizStep = isMixedLesson && slideIndex >= lesson.slides.length;
  const showQuizPanel =
    showStudentActions && hasLoadedQuiz(studentLesson) && (isQuizOnly || isOnQuizStep);
  const showQuizUnavailable =
    showStudentActions && isOnQuizStep && isMixedLesson && !hasLoadedQuiz(studentLesson);
  const showCarouselWithQuizStep =
    hasSlides && isMixedLesson && (showQuizPanel || showQuizUnavailable);
  const trailingQuiz = isMixedLesson && (hasLoadedQuiz(studentLesson) || isOnQuizStep);

  const quizContent = showQuizPanel ? (
    <QuizPanel
      quiz={quiz!}
      busy={busy}
      result={quizResult}
      isPreview={isPreview || mode === "preview"}
      submitError={submitError}
      onSubmit={onQuizSubmit ?? (() => undefined)}
    />
  ) : showQuizUnavailable ? (
    <div className="slide-empty quiz-unavailable">
      <Typography color="text.secondary">
        Вопросы квиза не загрузились. Обновите страницу или вернитесь к слайдам.
      </Typography>
    </div>
  ) : null;

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

      {showCarouselWithQuizStep ? (
        <SlideCarousel
          slides={lesson.slides}
          currentIndex={slideIndex}
          onChange={onSlideIndexChange}
          hasTrailingQuiz={trailingQuiz}
          hideSlideLabels={mode === "author"}
          manualVerify={slideNavManualVerify}
        >
          {quizContent}
        </SlideCarousel>
      ) : showQuizPanel ? (
        <QuizPanel
          quiz={quiz!}
          busy={busy}
          result={quizResult}
          isPreview={isPreview || mode === "preview"}
          submitError={submitError}
          onSubmit={onQuizSubmit ?? (() => undefined)}
        />
      ) : showQuizUnavailable ? (
        <div className="slide-empty quiz-unavailable">
          <Typography color="text.secondary">
            Вопросы квиза не загрузились. Обновите страницу или вернитесь к слайдам.
          </Typography>
        </div>
      ) : hasSlides ? (
        <SlideCarousel
          slides={lesson.slides}
          currentIndex={slideIndex}
          onChange={onSlideIndexChange}
          activeHotspotId={activeHotspotId}
          onHotspotSelect={onHotspotSelect}
          hasTrailingQuiz={isMixedLesson && hasLoadedQuiz(studentLesson)}
          hideSlideLabels={mode === "author"}
          manualVerify={slideNavManualVerify}
        />
      ) : (
        <div className="slide-empty">
          <Typography color="text.secondary">Для этого урока пока нет содержимого.</Typography>
        </div>
      )}
    </div>
  );
}
