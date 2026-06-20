import type { CSSProperties } from "react";

/** Shared CSS custom properties and class names for the 3-column lesson grid. */
export const LESSON_LAYOUT_VARS = {
  refWidth: "--lesson-ref-width",
  hintsWidth: "--lesson-hints-width",
} as const;

/** Header grid: roadmap segment count and total flexible columns (roadmap + optional next). */
export const LESSON_HEADER_GRID_VARS = {
  roadmapSegments: "--lesson-header-roadmap-segments",
  flexColumns: "--lesson-header-flex-columns",
} as const;

export const LESSON_HEADER_GRID = {
  base: "lesson-page-header-grid",
  noHints: "lesson-page-header-grid--no-hints",
} as const;

export const LESSON_BODY_GRID = {
  base: "lesson-body",
  noHints: "lesson-body--no-hints",
} as const;

export function lessonLayoutGridClasses(showHintsColumn: boolean) {
  return {
    headerGrid: showHintsColumn
      ? LESSON_HEADER_GRID.base
      : `${LESSON_HEADER_GRID.base} ${LESSON_HEADER_GRID.noHints}`,
    body: showHintsColumn
      ? LESSON_BODY_GRID.base
      : `${LESSON_BODY_GRID.base} ${LESSON_BODY_GRID.noHints}`,
  };
}

export function lessonHeaderGridStyle(totalLessons: number, showNextColumn: boolean): CSSProperties {
  const segments = Math.max(totalLessons, 1);
  const flexColumns = showNextColumn ? segments + 1 : segments;

  return {
    [LESSON_HEADER_GRID_VARS.roadmapSegments]: segments,
    [LESSON_HEADER_GRID_VARS.flexColumns]: flexColumns,
  } as CSSProperties;
}
