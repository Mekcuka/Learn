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

export function clampSlideIndex(index: number, total: number): number {
  if (total <= 0) {
    return 0;
  }
  return Math.max(0, Math.min(index, total - 1));
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

