import type { LessonListItem, ModuleDashboardItem } from "../types/lesson";
import { lessonHasTag } from "./hashtags";

export type StatusFilter = "all" | "available" | "completed";

export type ModuleLessonGroup = {
  module: ModuleDashboardItem;
  lessons: LessonListItem[];
};

export function lessonMatchesFilters(
  lesson: LessonListItem,
  statusFilter: StatusFilter,
  activeTag: string | null,
): boolean {
  if (activeTag && !lessonHasTag(lesson.tags, activeTag)) {
    return false;
  }
  if (statusFilter === "completed") {
    return lesson.status === "completed";
  }
  if (statusFilter === "available") {
    return lesson.status !== "locked";
  }
  return true;
}

export function getFilteredModuleGroups(
  modules: ModuleDashboardItem[],
  selectedModuleId: string,
  statusFilter: StatusFilter,
  activeTag: string | null,
): ModuleLessonGroup[] {
  const sourceModules =
    selectedModuleId === "all" ? modules : modules.filter((module) => module.id === selectedModuleId);

  return sourceModules
    .map((module) => ({
      module,
      lessons: module.lessons.filter((lesson) => lessonMatchesFilters(lesson, statusFilter, activeTag)),
    }))
    .filter((group) => group.lessons.length > 0);
}

export function countVisibleLessons(groups: ModuleLessonGroup[]): number {
  return groups.reduce((sum, group) => sum + group.lessons.length, 0);
}
