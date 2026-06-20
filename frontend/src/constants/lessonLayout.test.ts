import { describe, expect, it } from "vitest";

import {
  LESSON_HEADER_GRID_VARS,
  lessonHeaderGridStyle,
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

describe("lessonHeaderGridStyle", () => {
  it("sets flex columns equal to roadmap segments when next column is hidden", () => {
    expect(lessonHeaderGridStyle(5, false)).toEqual({
      [LESSON_HEADER_GRID_VARS.roadmapSegments]: 5,
      [LESSON_HEADER_GRID_VARS.flexColumns]: 5,
    });
  });

  it("adds one flex column when next column is shown", () => {
    expect(lessonHeaderGridStyle(2, true)).toEqual({
      [LESSON_HEADER_GRID_VARS.roadmapSegments]: 2,
      [LESSON_HEADER_GRID_VARS.flexColumns]: 3,
    });
  });

  it("uses at least one segment when module has no lessons", () => {
    expect(lessonHeaderGridStyle(0, true)).toEqual({
      [LESSON_HEADER_GRID_VARS.roadmapSegments]: 1,
      [LESSON_HEADER_GRID_VARS.flexColumns]: 2,
    });
  });
});
