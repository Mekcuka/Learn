import Button from "@mui/material/Button";

import { useEffect } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";

import "../../../styles/lesson-page.css";
import "../../../styles/screenshot.css";

import LessonPageHeader from "../components/LessonPageHeader";
import LessonPreviewBanner from "../components/LessonPreviewBanner";
import LessonReferencePanel from "../components/LessonReferencePanel";
import LessonScreenshotHintsPanel from "../components/LessonScreenshotHintsPanel";
import LessonShell from "../components/LessonShell";
import LessonSlideView from "../components/LessonSlideView";
import { useLessonProgress } from "../hooks/useLessonProgress";
import { isMixedQuizLesson, resolveNextLessonNavigation } from "../../../utils/lessonUi";
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
    handleQuizSubmit,
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
  const completedLessons = lesson.module_lessons.filter((item) => item.status === "completed").length;
  const lessonStatus = lessonState?.status;
  const nextLessonNavigation =
    !isPreview && lessonId
      ? resolveNextLessonNavigation(lessonId, lessonStatus, lesson.module_lessons)
      : null;
  const showHintsColumn =
    ((!isQuizLesson || isMixedLesson) || nextLessonNavigation != null) && !isOnQuizStep;
  const { body: bodyClass } = lessonLayoutGridClasses(showHintsColumn);

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
        completedLessons={completedLessons}
        isPreview={isPreview}
        isDraftPreview={isDraftPreview}
        showHintsColumn={showHintsColumn}
        nextLessonNavigation={nextLessonNavigation}
        onBack={() => navigate("/dashboard")}
        onNavigate={(path) => navigate(path)}
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
          busy={verifyBusy}
          feedback={feedback}
          isPreview={isPreview}
          onVerify={() => void startVerify()}
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
            onQuizSubmit={handleQuizSubmit}
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
