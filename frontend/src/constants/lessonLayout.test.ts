import { describe, expect, it } from "vitest";

import {
  lessonLayoutGridClasses,
  LESSON_BODY_GRID,
  LESSON_HEADER_GRID,
} from "./lessonLayout";

describe("lessonLayoutGridClasses", () => {
  it("returns 3-column classes when hints column is shown", () => {
    expect(lessonLayoutGridClasses(true)).toEqual({
      headerGrid: LESSON_HEADER_GRID.base,
      body: LESSON_BODY_GRID.base,
    });
  });

  it("returns 2-column classes when hints column is hidden", () => {
    expect(lessonLayoutGridClasses(false)).toEqual({
      headerGrid: `${LESSON_HEADER_GRID.base} ${LESSON_HEADER_GRID.noHints}`,
      body: `${LESSON_BODY_GRID.base} ${LESSON_BODY_GRID.noHints}`,
    });
  });
});
