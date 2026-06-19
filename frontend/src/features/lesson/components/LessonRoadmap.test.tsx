/**

 * @vitest-environment jsdom

 */

import { act } from "react";

import { createRoot, type Root } from "react-dom/client";

import { MemoryRouter } from "react-router-dom";

import { afterEach, beforeEach, describe, expect, it } from "vitest";



import type { ModuleLessonOutlineItem } from "../../../types/lesson";

import AppTheme from "../../../components/mui/AppTheme";

import LessonRoadmap from "./LessonRoadmap";

import styles from "./LessonRoadmap.module.css";



const moduleLessons: ModuleLessonOutlineItem[] = [

  { id: "l1", order: 1, title: "Учебный аккаунт", status: "completed" },

  { id: "l2", order: 2, title: "Создание проекта", status: "active" },

  { id: "l3", order: 3, title: "Навигация", status: "locked" },

  { id: "l4", order: 4, title: "Журнал", status: "locked" },

  { id: "l5", order: 5, title: "Квиз", status: "locked" },

];



describe("LessonRoadmap", () => {

  let container: HTMLDivElement;

  let root: Root;



  beforeEach(() => {

    container = document.createElement("div");

    document.body.appendChild(container);

    root = createRoot(container);

  });



  afterEach(() => {

    act(() => {

      root.unmount();

    });

    container.remove();

  });



  it("renders chevron segments for each lesson", () => {

    act(() => {

      root.render(

        <AppTheme>

          <MemoryRouter>

            <LessonRoadmap

              lessons={moduleLessons}

              currentLessonId="l2"

              linkTo={(id) => `/lessons/${id}`}

            />

          </MemoryRouter>

        </AppTheme>,

      );

    });



    const segments = container.querySelectorAll(`.${styles.segment}`);

    expect(segments).toHaveLength(5);

    expect(container.querySelector(`.${styles.segmentCurrent}`)?.textContent).toContain(

      "Создание проекта",

    );

    expect(container.querySelector(`.${styles.segmentCompleted}`)).not.toBeNull();

    expect(container.querySelector(`.${styles.segmentLocked}`)).not.toBeNull();

  });



  it("abbreviates current segment label when requested", () => {

    act(() => {

      root.render(

        <AppTheme>

          <MemoryRouter>

            <LessonRoadmap

              lessons={moduleLessons}

              currentLessonId="l2"

              linkTo={(id) => `/lessons/${id}`}

              abbreviateCurrentLabel

            />

          </MemoryRouter>

        </AppTheme>,

      );

    });



    const current = container.querySelector(`.${styles.segmentCurrent}`);

    expect(current?.textContent).toContain("Урок 2");

    expect(current?.textContent).not.toContain("Создание проекта");

    expect(current?.querySelector("a")?.getAttribute("aria-label")).toBe(

      "Создание проекта, текущий урок",

    );

  });



  it("marks unlocked non-current lessons as upcoming", () => {

    const lessons: ModuleLessonOutlineItem[] = [

      { id: "l1", order: 1, title: "Первый", status: "completed" },

      { id: "l2", order: 2, title: "Второй", status: "active" },

      { id: "l3", order: 3, title: "Третий", status: "active" },

    ];



    act(() => {

      root.render(

        <AppTheme>

          <MemoryRouter>

            <LessonRoadmap lessons={lessons} currentLessonId="l2" linkTo={(id) => `/lessons/${id}`} />

          </MemoryRouter>

        </AppTheme>,

      );

    });



    expect(container.querySelectorAll(`.${styles.segmentUpcoming}`)).toHaveLength(1);

    expect(container.querySelector(`.${styles.segmentUpcoming}`)?.textContent).toContain("Третий");

  });

});


