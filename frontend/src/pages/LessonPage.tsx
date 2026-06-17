import { useCallback, useEffect, useState, type ReactNode } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";

import {
  getLesson,
  LearnApiError,
  startLesson,
  submitQuiz,
  verifyLesson,
  type LessonDetail,
  type QuizSubmitResult,
  type VerifyResult,
} from "../api/learnApi";
import LessonActions from "../components/LessonActions";
import HashtagList from "../components/HashtagList";
import LessonReferencePanel from "../components/LessonReferencePanel";
import { PageError, PageLoading } from "../components/consta/PageStatus";
import PortalTopbar from "../components/PortalTopbar";
import QuizPanel from "../components/QuizPanel";
import SlideCarousel from "../components/SlideCarousel";
import { useVerifyPolling } from "../hooks/useVerifyPolling";
import { buildDeepLink, lessonReturnUrl } from "../utils/deepLink";
import { listenForLearnStepDone } from "../utils/learnBridge";

function slideStorageKey(lessonId: string) {
  return `learn:slide:${lessonId}`;
}

function LessonShell({ children }: { children: ReactNode }) {
  return (
    <div className="catalog-layout">
      <PortalTopbar active="lessons" />
      <div className="lesson-shell">{children}</div>
    </div>
  );
}

export default function LessonPage() {
  const { lessonId } = useParams<{ lessonId: string }>();
  const [searchParams] = useSearchParams();
  const isPreview = searchParams.get("preview") === "1";
  const navigate = useNavigate();
  const [lesson, setLesson] = useState<LessonDetail | null>(null);
  const [slideIndex, setSlideIndex] = useState(0);
  const [activeHotspotId, setActiveHotspotId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<VerifyResult | null>(null);
  const [quizResult, setQuizResult] = useState<QuizSubmitResult | null>(null);

  const loadLesson = useCallback(async () => {
    if (!lessonId) {
      return;
    }
    const data = await getLesson(lessonId);
    setLesson(data);
    if (isPreview) {
      return;
    }
    const state = data.lesson_states.find((item) => item.lesson_id === lessonId);
    if (state?.status === "active" && !state.completed_at) {
      await startLesson(lessonId).catch(() => undefined);
    }
  }, [isPreview, lessonId]);

  useEffect(() => {
    if (!lessonId) {
      navigate("/dashboard", { replace: true });
      return;
    }

    setLoading(true);
    loadLesson()
      .catch((err: unknown) => {
        if (err instanceof LearnApiError) {
          setError(err.message);
        } else {
          setError("Не удалось загрузить урок");
        }
      })
      .finally(() => setLoading(false));
  }, [lessonId, loadLesson, navigate]);

  useEffect(() => {
    if (!lessonId || !lesson?.slides.length) {
      return;
    }
    const saved = sessionStorage.getItem(slideStorageKey(lessonId));
    if (saved) {
      const index = Number.parseInt(saved, 10);
      if (!Number.isNaN(index)) {
        setSlideIndex(Math.max(0, Math.min(index, lesson.slides.length - 1)));
      }
    }
  }, [lessonId, lesson?.slides.length]);

  useEffect(() => {
    if (!lessonId) {
      return;
    }
    sessionStorage.setItem(slideStorageKey(lessonId), String(slideIndex));
  }, [lessonId, slideIndex]);

  useEffect(() => {
    setActiveHotspotId(null);
  }, [slideIndex]);

  const verifyFn = useCallback(async () => {
    if (!lessonId) {
      throw new Error("Урок не найден");
    }
    return verifyLesson(lessonId);
  }, [lessonId]);

  const handleVerifyPassed = useCallback(async () => {
    await loadLesson();
    setFeedback(null);
    setBusy(false);
  }, [loadLesson]);

  const handleVerifyFailed = useCallback((result: VerifyResult) => {
    setFeedback(result);
    setBusy(false);
  }, []);

  const { polling, startPolling, stopPolling } = useVerifyPolling(verifyFn, {
    onPassed: handleVerifyPassed,
    onFailed: handleVerifyFailed,
  });

  const handleVerify = useCallback(async () => {
    if (!lessonId || isPreview) {
      return;
    }
    setBusy(true);
    setFeedback(null);
    stopPolling();
    try {
      const result = await verifyLesson(lessonId);
      setFeedback(result);
      if (result.status === "passed") {
        await loadLesson();
        setFeedback(null);
        setBusy(false);
        return;
      }
      if (result.status === "pending" && result.retry_after_seconds != null) {
        startPolling();
        return;
      }
      setBusy(false);
    } catch (err) {
      setFeedback({
        status: "failed",
        message: err instanceof Error ? err.message : "Не удалось проверить урок",
      });
      setBusy(false);
    }
  }, [isPreview, lessonId, loadLesson, startPolling, stopPolling]);

  useEffect(() => {
    if (!lesson) {
      return;
    }
    return listenForLearnStepDone((message) => {
      if (isPreview) {
        return;
      }
      const step = lesson.verify.config?.learn_step;
      if (typeof step === "string" && message.step === step) {
        void handleVerify();
      }
    });
  }, [handleVerify, isPreview, lesson]);

  const lessonState = lesson?.lesson_states.find((item) => item.lesson_id === lesson?.id);
  const isQuizLesson = lesson?.verify.type === "quiz_passed";

  async function handleOpenDemo() {
    if (!lesson || !lessonId) {
      return;
    }
    const deepLink = buildDeepLink(lesson.deep_link, {
      returnUrl: lessonReturnUrl(lessonId),
      projectId: lesson.project_id,
    });
    if (!deepLink) {
      return;
    }
    setBusy(true);
    try {
      if (!isPreview) {
        await startLesson(lessonId);
      }
      window.open(deepLink, "_blank", "noopener,noreferrer");
      if (!isPreview) {
        await loadLesson();
      }
    } catch (err) {
      setFeedback({
        status: "failed",
        message: err instanceof Error ? err.message : "Не удалось открыть демо",
      });
    } finally {
      setBusy(false);
    }
  }

  async function handleQuizSubmit(answers: Record<string, string[]>) {
    if (!lesson || !lessonId || !lesson.quiz) {
      return;
    }
    if (isPreview) {
      setFeedback({
        status: "pending",
        message: "В режиме предпросмотра квиз не засчитывается — откройте урок из каталога ученика.",
      });
      return;
    }
    setBusy(true);
    setQuizResult(null);
    try {
      await startLesson(lessonId);
      const payload = lesson.quiz.questions.map((question) => ({
        question_id: question.id,
        selected_option_ids: answers[question.id] ?? [],
      }));
      const result = await submitQuiz(lesson.module_id, payload, lessonId);
      setQuizResult(result);
      if (result.lesson_completed) {
        await loadLesson();
      }
    } catch (err) {
      setFeedback({
        status: "failed",
        message: err instanceof Error ? err.message : "Не удалось отправить квиз",
      });
    } finally {
      setBusy(false);
    }
  }

  if (loading) {
    return (
      <LessonShell>
        <PageLoading />
      </LessonShell>
    );
  }

  if (error || !lesson) {
    return (
      <LessonShell>
        <PageError message={error ?? "Урок не найден"} />
        <Link to="/dashboard" className="back-link">
          ← К каталогу уроков
        </Link>
      </LessonShell>
    );
  }

  const totalLessons = lesson.module_lessons.length;
  const verifyBusy = busy || polling;

  return (
    <LessonShell>
      {isPreview && (
        <div className="preview-banner" role="status">
          <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
            <path
              fill="currentColor"
              d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"
            />
          </svg>
          <span>
            <strong>Режим предпросмотра.</strong> Прогресс и проверки не сохраняются — так увидит ученик
            содержимое урока.
          </span>
        </div>
      )}

      <header className="lesson-page-header">
        <Link to="/dashboard" className="back-link">
          ← К каталогу уроков
        </Link>
        <div className="lesson-page-title">
          <span className="meta">
            Урок {lesson.order} из {totalLessons} · {lesson.module_title}
          </span>
          <h1>{lesson.title}</h1>
          {(lesson.tags?.length ?? 0) > 0 && (
            <HashtagList tags={lesson.tags ?? []} linkBase="/dashboard" className="lesson-page-tags" />
          )}
          {lesson.summary && <p className="subtitle">{lesson.summary}</p>}
          {isPreview ? (
            <span className="badge badge-preview">Предпросмотр</span>
          ) : (
            <span className="badge">{lesson.progress_percent}%</span>
          )}
        </div>
      </header>

      <div className="lesson-body">
        <div className="lesson-main">
          {isQuizLesson && lesson.quiz ? (
            <QuizPanel
              quiz={lesson.quiz}
              busy={verifyBusy}
              result={quizResult}
              isPreview={isPreview}
              onSubmit={handleQuizSubmit}
            />
          ) : (
            <SlideCarousel
              slides={lesson.slides}
              currentIndex={slideIndex}
              onChange={setSlideIndex}
              activeHotspotId={activeHotspotId}
              onHotspotSelect={setActiveHotspotId}
            />
          )}

          {!isQuizLesson && (
            <LessonActions
              lesson={lesson}
              lessonState={lessonState}
              busy={verifyBusy}
              feedback={feedback}
              isPreview={isPreview}
              onOpenDemo={handleOpenDemo}
              onVerify={handleVerify}
            />
          )}

          {isQuizLesson && lessonState?.status === "completed" && (
            <p className="step-status step-status-passed">Урок выполнен</p>
          )}
        </div>

        <LessonReferencePanel
          lesson={lesson}
          slide={lesson.slides[slideIndex] ?? null}
          slideIndex={slideIndex}
          slideTotal={lesson.slides.length}
          activeHotspotId={activeHotspotId}
          onHotspotSelect={setActiveHotspotId}
        />
      </div>
    </LessonShell>
  );
}
