/** Shared CSS custom properties and class names for the 3-column lesson grid. */
export const LESSON_LAYOUT_VARS = {
  refWidth: "--lesson-ref-width",
  hintsWidth: "--lesson-hints-width",
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

