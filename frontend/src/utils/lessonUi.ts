import type { LessonListItem, ModuleLessonOutlineItem } from "../types/lesson";

export type NextLessonNavigation =
  | { kind: "lesson"; lessonId: string; title: string }
  | { kind: "catalog" };

export function resolveNextLessonNavigation(
  currentLessonId: string,
  currentLessonStatus: string | undefined,
  moduleLessons: ModuleLessonOutlineItem[],
): NextLessonNavigation | null {
  if (currentLessonStatus !== "completed") {
    return null;
  }

  const sorted = [...moduleLessons].sort((a, b) => a.order - b.order);
  const currentIndex = sorted.findIndex((item) => item.id === currentLessonId);
  if (currentIndex < 0) {
    return null;
  }

  for (let index = currentIndex + 1; index < sorted.length; index += 1) {
    const lesson = sorted[index];
    if (lesson.status !== "locked") {
      return { kind: "lesson", lessonId: lesson.id, title: lesson.title };
    }
  }

  return { kind: "catalog" };
}

export function isMixedQuizLesson(lesson: {
  verify: { type: string };
  slides: unknown[];
}): boolean {
  return lesson.verify.type === "quiz_passed" && lesson.slides.length > 0;
}

export function isQuizOnlyLesson(lesson: {
  verify: { type: string };
  slides: unknown[];
}): boolean {
  return lesson.verify.type === "quiz_passed" && lesson.slides.length === 0;
}

const LEGACY_MANUAL_VERIFY_TYPES = new Set(["resource_exists", "navigation", "job_completed"]);

export function isManualVerifyLesson(verifyType: string): boolean {
  return verifyType === "manual" || LEGACY_MANUAL_VERIFY_TYPES.has(verifyType);
}

export type CompleteLessonButtonContext = {
  lesson: LessonSlideNavLesson;
  slideIndex: number;
  lessonStatus?: string;
  isPreview: boolean;
  isOnQuizStep: boolean;
};

/** Whether the learner reached the last navigable step of the lesson. */
export function isOnFinalLessonStep(
  lesson: LessonSlideNavLesson,
  slideIndex: number,
  isOnQuizStep: boolean,
): boolean {
  if (isQuizOnlyLesson(lesson)) {
    return hasLoadedQuiz(lesson);
  }

  if (isMixedQuizLesson(lesson)) {
    if (!hasLoadedQuiz(lesson)) {
      return slideIndex >= lesson.slides.length - 1;
    }
    const onLastContentSlide = slideIndex >= lesson.slides.length - 1 && !isOnQuizStep;
    return isOnQuizStep || onLastContentSlide;
  }

  if (!isManualVerifyLesson(lesson.verify.type)) {
    return false;
  }

  return slideIndex >= maxLessonSlideIndex(lesson);
}

/** Whether the floating «Завершить урок» action should appear. */
export function shouldShowCompleteLessonButton({
  lesson,
  slideIndex,
  lessonStatus,
  isPreview,
  isOnQuizStep,
}: CompleteLessonButtonContext): boolean {
  if (isPreview || lessonStatus === "completed" || lessonStatus === "locked") {
    return false;
  }

  return isOnFinalLessonStep(lesson, slideIndex, isOnQuizStep);
}

export type LessonSlideNavLesson = {
  verify: { type: string };
  slides: unknown[];
  quiz?: { questions: unknown[] } | null;
};

export function hasLoadedQuiz(lesson: LessonSlideNavLesson): boolean {
  return Boolean(lesson.quiz && lesson.quiz.questions.length > 0);
}

/** Last navigable slide index (includes virtual quiz step for mixed lessons). */
export function maxLessonSlideIndex(lesson: LessonSlideNavLesson): number {
  const slideCount = lesson.slides.length;
  if (slideCount <= 0) {
    return 0;
  }
  if (!isMixedQuizLesson(lesson)) {
    return slideCount - 1;
  }
  return hasLoadedQuiz(lesson) ? slideCount : slideCount - 1;
}

export function clampSlideIndex(index: number, total: number): number {
  if (total <= 0) {
    return 0;
  }
  return Math.max(0, Math.min(index, total - 1));
}

export function clampLessonSlideIndex(index: number, lesson: LessonSlideNavLesson): number {
  const slideCount = lesson.slides.length;
  if (slideCount <= 0) {
    return 0;
  }
  return Math.max(0, Math.min(index, maxLessonSlideIndex(lesson)));
}

export function slideStorageKey(lessonId: string): string {
  return `learn:slide:${lessonId}`;
}

export function readStoredSlideIndex(lessonId: string): number | null {
  const saved = sessionStorage.getItem(slideStorageKey(lessonId));
  if (saved == null) {
    return null;
  }
  const index = Number.parseInt(saved, 10);
  return Number.isNaN(index) ? null : index;
}

export function writeStoredSlideIndex(lessonId: string, index: number): void {
  sessionStorage.setItem(slideStorageKey(lessonId), String(index));
}

/** Clamp and persist slide index; returns sanitized value. */
export function sanitizeStoredSlideIndex(
  lessonId: string,
  lesson: LessonSlideNavLesson,
  preferredIndex?: number,
  options?: { resetQuizStepForNotStarted?: boolean; lessonStatus?: string },
): number {
  const raw = preferredIndex ?? readStoredSlideIndex(lessonId) ?? 0;
  let index = raw;
  const shouldResetStoredQuizStep =
    options?.resetQuizStepForNotStarted &&
    options.lessonStatus !== "completed" &&
    isMixedQuizLesson(lesson) &&
    index >= lesson.slides.length;
  if (shouldResetStoredQuizStep) {
    index = 0;
  }
  const clamped = clampLessonSlideIndex(index, lesson);
  writeStoredSlideIndex(lessonId, clamped);
  return clamped;
}

export function moduleProgressLabel(completedLessons: number, totalLessons: number): string {
  if (totalLessons <= 0) {
    return "Нет уроков";
  }
  return `${completedLessons} из ${totalLessons} уроков`;
}

export function slideCountLabel(count: number): string {
  if (count <= 0) {
    return "Теория";
  }
  const mod10 = count % 10;
  const mod100 = count % 100;
  if (mod10 === 1 && mod100 !== 11) {
    return `${count} слайд`;
  }
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) {
    return `${count} слайда`;
  }
  return `${count} слайдов`;
}

export function lessonStatusLabel(status: LessonListItem["status"]): string {
  switch (status) {
    case "active":
      return "Текущий";
    case "completed":
      return "Пройден";
    case "locked":
      return "Заблокирован";
    case "not_started":
      return "Доступен";
  }
}

