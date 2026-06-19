import { describe, expect, it } from "vitest";

import type { LessonListItem, ModuleDashboardItem } from "../types/lesson";
import {
  countVisibleLessons,
  getFilteredModuleGroups,
  lessonMatchesFilters,
} from "./catalogGrouping";

function lesson(id: string, status: LessonListItem["status"], tags: string[] = []): LessonListItem {
  return {
    id,
    order: 1,
    title: `Lesson ${id}`,
    summary: null,
    tags,
    status,
    slide_count: 2,
  };
}

function moduleItem(id: string, lessons: LessonListItem[]): ModuleDashboardItem {
  const completed = lessons.filter((item) => item.status === "completed").length;
  return {
    id,
    title: `Module ${id}`,
    description: null,
    status: "active",
    progress_percent: lessons.length ? Math.round((completed / lessons.length) * 100) : 0,
    total_lessons: lessons.length,
    completed_lessons: completed,
    lessons,
  };
}

describe("catalogGrouping", () => {
  const modules = [
    moduleItem("m1", [
      lesson("l1", "completed", ["Демо"]),
      lesson("l2", "active", ["Старт"]),
    ]),
    moduleItem("m2", [lesson("l3", "locked", ["Карта"])]),
  ];

  it("filters lessons by status and tag", () => {
    expect(lessonMatchesFilters(lesson("x", "locked"), "available", null)).toBe(false);
    expect(lessonMatchesFilters(lesson("x", "completed", ["Демо"]), "completed", "демо")).toBe(true);
    expect(lessonMatchesFilters(lesson("x", "active", ["Старт"]), "all", "Карта")).toBe(false);
  });

  it("groups lessons by module and hides empty groups", () => {
    const groups = getFilteredModuleGroups(modules, "all", "completed", null);
    expect(groups).toHaveLength(1);
    expect(groups[0]?.module.id).toBe("m1");
    expect(groups[0]?.lessons.map((item) => item.id)).toEqual(["l1"]);
  });

  it("limits groups to selected module", () => {
    const groups = getFilteredModuleGroups(modules, "m2", "all", null);
    expect(groups).toHaveLength(1);
    expect(groups[0]?.module.id).toBe("m2");
    expect(groups[0]?.lessons.map((item) => item.id)).toEqual(["l3"]);
  });

  it("counts visible lessons across groups", () => {
    const groups = getFilteredModuleGroups(modules, "all", "all", null);
    expect(countVisibleLessons(groups)).toBe(3);
  });
});
