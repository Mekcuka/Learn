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
  clampSlideIndex,
  readStoredSlideIndex,
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

    const meta = await metaPromise;
    setLesson(meta);
    setLoading(false);

    const media = await mediaPromise;
    setLesson((current) => (current ? { ...current, slides: media.slides, quiz: media.quiz } : media));

    if (isPreview) {
      return;
    }

    const state = meta.lesson_states.find((item) => item.lesson_id === lessonId);
    if (state?.status === "active" && !state.completed_at) {
      await startLesson(lessonId).catch(() => undefined);
    }
  }, [isDraftPreview, isPreview, lessonId]);

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
    onLessonReload: loadLesson,
  });

  useEffect(() => {
    if (!lessonId) {
      return;
    }

    let cancelled = false;

    setLoading(true);
    setError(null);

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
    setSlideIndex(0);
  }, [lessonId]);

  useEffect(() => {
    if (!lessonId || !lesson?.slides.length) {
      return;
    }

    const storedIndex = readStoredSlideIndex(lessonId);
    setSlideIndex(clampSlideIndex(storedIndex ?? 0, lesson.slides.length));
    slideStorageHydratedRef.current = true;
  }, [lessonId, lesson?.slides.length]);

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
      if (!lesson?.slides.length) {
        return;
      }
      setSlideIndex(clampSlideIndex(index, lesson.slides.length));
    },
    [lesson?.slides.length],
  );

  const nextSlide = useCallback(() => {
    goToSlide(slideIndex + 1);
  }, [goToSlide, slideIndex]);

  const prevSlide = useCallback(() => {
    goToSlide(slideIndex - 1);
  }, [goToSlide, slideIndex]);

  const lessonState = lesson?.lesson_states.find((item) => item.lesson_id === lesson.id);

  const phase: LessonProgressPhase = loading
    ? "loading"
    : error || !lesson
      ? "error"
      : lessonState?.status === "completed"
        ? "completed"
        : isVerifying
          ? "verifying"
          : "active";

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
    nextSlide,
    prevSlide,
    goToSlide,
    selectHotspot,
    handleQuizSubmit,
  };
}
