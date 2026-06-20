import Button from "@mui/material/Button";

import { useEffect } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";

import "../../../styles/lesson-page.css";
import "../../../styles/quiz-editor.css";
import "../../../styles/screenshot.css";

import LessonPageHeader from "../components/LessonPageHeader";
import LessonPreviewBanner from "../components/LessonPreviewBanner";
import LessonReferencePanel from "../components/LessonReferencePanel";
import LessonScreenshotHintsPanel from "../components/LessonScreenshotHintsPanel";
import LessonShell from "../components/LessonShell";
import LessonSlideView from "../components/LessonSlideView";
import { useLessonProgress } from "../hooks/useLessonProgress";
import {
  isMixedQuizLesson,
  resolveNextLessonNavigation,
  resolveUpcomingLessonNavigation,
  shouldShowCompleteLessonButton,
} from "../../../utils/lessonUi";
import { lessonLayoutGridClasses } from "../../../constants/lessonLayout";
import { PageError, PageLoading } from "../../../components/mui/PageStatus";

export default function LessonPage() {
  const { lessonId } = useParams<{ lessonId: string }>();
  const [searchParams] = useSearchParams();
  const isPreview = searchParams.get("preview") === "1";
  const isDraftPreview = searchParams.get("draft") === "1";
  const navigate = useNavigate();

  const {
    phase,
    lesson,
    lessonState,
    error,
    slideIndex,
    activeHotspotId,
    feedback,
    quizResult,
    verifyBusy,
    goToSlide,
    selectHotspot,
    startVerify,
    completeLesson,
    handleQuizSubmit,
    setFeedback,
  } = useLessonProgress({ lessonId, isPreview, isDraftPreview });

  useEffect(() => {
    if (!lessonId) {
      navigate("/dashboard", { replace: true });
    }
  }, [lessonId, navigate]);

  if (phase === "loading") {
    return (
      <LessonShell>
        <PageLoading />
      </LessonShell>
    );
  }

  if (phase === "error" || !lesson) {
    return (
      <LessonShell>
        <PageError message={error ?? "Урок не найден"} />
        <Button size="small" variant="text" onClick={() => navigate("/dashboard")}>
          ← К каталогу уроков
        </Button>
      </LessonShell>
    );
  }

  const isQuizLesson = lesson.verify.type === "quiz_passed";
  const isMixedLesson = isMixedQuizLesson(lesson);
  const isOnQuizStep = isMixedLesson && slideIndex >= lesson.slides.length;
  const activeSlide = isOnQuizStep ? null : (lesson.slides[slideIndex] ?? null);
  const totalLessons = lesson.module_lessons.length;
  const lessonStatus = lessonState?.status;
  const nextLessonNavigation =
    !isPreview && lessonId
      ? resolveNextLessonNavigation(lessonId, lessonStatus, lesson.module_lessons)
      : null;
  const upcomingLessonNavigation =
    !isPreview && lessonId
      ? resolveUpcomingLessonNavigation(lessonId, lesson.module_lessons)
      : null;
  const showNextStep =
    !isPreview &&
    nextLessonNavigation != null &&
    (!isOnQuizStep || lessonStatus === "completed");
  const showHintsColumn =
    ((!isQuizLesson || isMixedLesson) || nextLessonNavigation != null) && !isOnQuizStep;
  const { body: bodyClass } = lessonLayoutGridClasses(showHintsColumn);
  const showCompleteButton = shouldShowCompleteLessonButton({
    lesson,
    slideIndex,
    lessonStatus,
    isPreview,
    isOnQuizStep,
    quizPassed: Boolean(quizResult?.passed),
  });
  const completeHint =
    feedback?.status === "failed" && showCompleteButton ? feedback.message : null;
  const isManualLesson = lesson.verify.type === "manual";
  const isOnLastSlide =
    !isOnQuizStep && lesson.slides.length > 0 && slideIndex === lesson.slides.length - 1;
  const showManualVerifyInNav =
    !isPreview && isManualLesson && isOnLastSlide && lessonStatus !== "completed";
  const manualVerifyDisabled = verifyBusy || lessonStatus === "locked";

  function handleCompleteLesson() {
    void completeLesson();
  }

  function roadmapLinkTo(targetLessonId: string): string {
    if (!isPreview) {
      return `/lessons/${targetLessonId}`;
    }
    const params = new URLSearchParams({ preview: "1" });
    if (isDraftPreview) {
      params.set("draft", "1");
    }
    return `/lessons/${targetLessonId}?${params.toString()}`;
  }

  return (
    <LessonShell>
      {isPreview && <LessonPreviewBanner isDraftPreview={isDraftPreview} />}

      <LessonPageHeader
        lesson={lesson}
        lessonState={lessonState}
        totalLessons={totalLessons}
        isPreview={isPreview}
        isDraftPreview={isDraftPreview}
        showHintsColumn={showHintsColumn}
        showNextStep={showNextStep}
        nextLessonNavigation={nextLessonNavigation}
        upcomingLessonNavigation={upcomingLessonNavigation}
        showCompleteButton={showCompleteButton}
        completeHint={completeHint}
        verifyBusy={verifyBusy}
        onBack={() => navigate("/dashboard")}
        onNavigate={(path) => navigate(path)}
        onComplete={handleCompleteLesson}
        roadmapLinkTo={roadmapLinkTo}
      />

      <div className={bodyClass}>
        <LessonReferencePanel
          lesson={lesson}
          slide={activeSlide}
          slideIndex={slideIndex}
          slideTotal={lesson.slides.length}
          isOnQuizStep={isOnQuizStep}
          lessonState={lessonState}
          feedback={feedback}
        />

        <div className="lesson-main">
          <LessonSlideView
            mode={isPreview ? "preview" : "student"}
            lesson={lesson}
            slideIndex={slideIndex}
            onSlideIndexChange={goToSlide}
            activeHotspotId={activeHotspotId}
            onHotspotSelect={selectHotspot}
            busy={verifyBusy}
            quizResult={quizResult}
            isPreview={isPreview}
            submitError={isOnQuizStep && feedback?.status === "failed" ? feedback.message : null}
            onQuizSubmit={handleQuizSubmit}
            manualVerify={
              showManualVerifyInNav
                ? {
                    onVerify: () => void startVerify(),
                    busy: verifyBusy,
                    disabled: manualVerifyDisabled,
                  }
                : null
            }
          />
        </div>

        {showHintsColumn && (
          <div className="lesson-hints-column">
            {(!isQuizLesson || isMixedLesson) && !isOnQuizStep && (
              <LessonScreenshotHintsPanel
                slide={activeSlide}
                activeHotspotId={activeHotspotId}
                onHotspotSelect={selectHotspot}
              />
            )}
          </div>
        )}
      </div>
    </LessonShell>
  );
}
