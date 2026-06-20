import { useCallback, useEffect, useRef, useState } from "react";

import {
  getLesson,
  LearnApiError,
  startLesson,
  submitQuiz,
  type QuizSubmitResult,
} from "../../../api/learnApi";
import type { LessonDetail } from "../../../types/lesson";
import {
  clampLessonSlideIndex,
  isMixedQuizLesson,
  patchLessonCompleted,
  resolveCompleteLessonAction,
  sanitizeStoredSlideIndex,
  slideStorageKey,
} from "../../../utils/lessonUi";

import { useLessonVerify } from "./useLessonVerify";

export type LessonProgressPhase = "loading" | "active" | "verifying" | "completed" | "error";

type UseLessonProgressOptions = {
  lessonId: string | undefined;
  isPreview: boolean;
  isDraftPreview: boolean;
};

export function useLessonProgress({ lessonId, isPreview, isDraftPreview }: UseLessonProgressOptions) {
  const [lesson, setLesson] = useState<LessonDetail | null>(null);
  const [slideIndex, setSlideIndex] = useState(0);
  const slideStorageHydratedRef = useRef(false);
  const slideHydrationKeyRef = useRef<string | null>(null);
  const [activeHotspotId, setActiveHotspotId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [quizResult, setQuizResult] = useState<QuizSubmitResult | null>(null);

  const loadLesson = useCallback(async () => {
    if (!lessonId) {
      return;
    }

    if (isDraftPreview) {
      const data = await getLesson(lessonId, { draft: true });
      setLesson(data);
      return;
    }

    const metaPromise = getLesson(lessonId, { fields: "meta" });
    const mediaPromise = getLesson(lessonId, { include: "slides,quiz" });

    const [meta, media] = await Promise.all([metaPromise, mediaPromise]);
    setLesson({ ...meta, slides: media.slides, quiz: media.quiz });

    if (isPreview) {
      return;
    }

    const state = meta.lesson_states.find((item) => item.lesson_id === lessonId);
    if (state?.status === "active" && !state.completed_at) {
      await startLesson(lessonId).catch(() => undefined);
    }
  }, [isDraftPreview, isPreview, lessonId]);

  const reloadLessonAfterVerify = useCallback(async () => {
    if (lessonId) {
      setLesson((prev) => (prev ? patchLessonCompleted(prev, lessonId) : prev));
    }
    await loadLesson();
  }, [lessonId, loadLesson]);

  const {
    feedback,
    verifyBusy,
    isVerifying,
    startVerify,
    completeManual,
    setFeedback,
    setBusy,
  } = useLessonVerify({
    lessonId,
    isPreview,
    onLessonReload: reloadLessonAfterVerify,
  });

  useEffect(() => {
    if (!lessonId) {
      return;
    }

    let cancelled = false;

    setLoading(true);
    setError(null);
    setLesson(null);

    loadLesson()
      .catch((err: unknown) => {
        if (cancelled) {
          return;
        }
        if (err instanceof LearnApiError) {
          setError(err.message);
        } else {
          setError("Не удалось загрузить урок");
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [lessonId, loadLesson]);

  useEffect(() => {
    slideStorageHydratedRef.current = false;
    slideHydrationKeyRef.current = null;
    setSlideIndex(0);
  }, [lessonId]);

  useEffect(() => {
    if (!lessonId || !lesson?.slides.length) {
      return;
    }

    const hydrationKey = `${lessonId}:${lesson.slides.length}:${lesson.verify.type}:${lesson.quiz?.questions.length ?? 0}`;
    if (slideHydrationKeyRef.current === hydrationKey) {
      return;
    }

    const lessonState = lesson.lesson_states.find((item) => item.lesson_id === lessonId);
    const outlineStatus = lesson.module_lessons.find((item) => item.id === lessonId)?.status;
    const clamped = sanitizeStoredSlideIndex(lessonId, lesson, undefined, {
      resetQuizStepForNotStarted: true,
      lessonStatus: lessonState?.status ?? outlineStatus,
    });
    setSlideIndex(clamped);
    slideStorageHydratedRef.current = true;
    slideHydrationKeyRef.current = hydrationKey;
  }, [lessonId, lesson]);

  useEffect(() => {
    if (!lessonId || !lesson?.slides.length || !slideStorageHydratedRef.current) {
      return;
    }

    setSlideIndex((current) => {
      const clamped = clampLessonSlideIndex(current, lesson);
      if (clamped !== current) {
        sessionStorage.setItem(slideStorageKey(lessonId), String(clamped));
      }
      return clamped;
    });
  }, [lessonId, lesson?.slides.length, lesson?.verify.type, lesson?.quiz?.questions.length]);

  useEffect(() => {
    if (!lessonId || !slideStorageHydratedRef.current) {
      return;
    }

    sessionStorage.setItem(slideStorageKey(lessonId), String(slideIndex));
  }, [lessonId, slideIndex]);

  useEffect(() => {
    setActiveHotspotId(null);
  }, [slideIndex]);

  const selectHotspot = useCallback((hotspotId: string | null) => {
    setActiveHotspotId(hotspotId);
  }, []);

  const goToSlide = useCallback(
    (index: number) => {
      if (!lesson || lesson.slides.length === 0) {
        return;
      }
      setSlideIndex(clampLessonSlideIndex(index, lesson));
    },
    [lesson],
  );

  const nextSlide = useCallback(() => {
    goToSlide(slideIndex + 1);
  }, [goToSlide, slideIndex]);

  const prevSlide = useCallback(() => {
    goToSlide(slideIndex - 1);
  }, [goToSlide, slideIndex]);

  const lessonState = lesson?.lesson_states.find(
    (item) => item.lesson_id === (lessonId ?? lesson.id),
  );

  const phase: LessonProgressPhase = loading
    ? "loading"
    : error || !lesson
      ? "error"
      : lessonState?.status === "completed"
        ? "completed"
        : isVerifying
          ? "verifying"
          : "active";

  const completeLesson = useCallback(async () => {
    if (!lesson || !lessonId || isPreview) {
      return;
    }

    const action = resolveCompleteLessonAction({
      lesson,
      slideIndex,
      isOnQuizStep: isMixedQuizLesson(lesson) && slideIndex >= lesson.slides.length,
      lessonStatus: lessonState?.status,
      quizPassed: Boolean(quizResult?.passed),
    });

    switch (action.type) {
      case "goToQuiz":
        setFeedback({ status: "failed", message: action.message });
        goToSlide(lesson.slides.length);
        return;
      case "requireQuiz":
        setFeedback({ status: "failed", message: action.message });
        return;
      case "reload":
        await loadLesson();
        setQuizResult(null);
        return;
      case "verify":
        await startVerify();
        return;
      case "noop":
        return;
    }
  }, [
    goToSlide,
    isPreview,
    lesson,
    lessonId,
    lessonState?.status,
    loadLesson,
    quizResult?.passed,
    setFeedback,
    slideIndex,
    startVerify,
  ]);

  async function handleQuizSubmit(answers: Record<string, string[]>) {
    if (!lesson || !lessonId || !lesson.quiz) {
      return;
    }

    if (isPreview) {
      setFeedback({
        status: "pending",
        message:
          "В режиме предпросмотра квиз не засчитывается — откройте урок из каталога ученика.",
      });
      return;
    }

    setBusy(true);
    setQuizResult(null);
    setFeedback(null);

    try {
      await startLesson(lessonId);

      const payload = lesson.quiz.questions.map((question) => ({
        question_id: question.id,
        selected_option_ids: answers[question.id] ?? [],
      }));

      const result = await submitQuiz(lesson.module_id, payload, lessonId);
      setQuizResult(result);
    } catch (err) {
      setFeedback({
        status: "failed",
        message: err instanceof Error ? err.message : "Не удалось отправить квиз",
      });
    } finally {
      setBusy(false);
    }
  }

  return {
    phase,
    lesson,
    lessonState,
    error,
    slideIndex,
    activeHotspotId,
    feedback,
    quizResult,
    verifyBusy,
    loadLesson,
    startVerify,
    completeManual,
    completeLesson,
    nextSlide,
    prevSlide,
    goToSlide,
    selectHotspot,
    handleQuizSubmit,
    setFeedback,
  };
}
