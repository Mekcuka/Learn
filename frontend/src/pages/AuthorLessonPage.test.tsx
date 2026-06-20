/**
 * @vitest-environment jsdom
 */
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { AuthorLessonDetail } from "../api/authorApi";
import AppTheme from "../components/mui/AppTheme";

const getAuthorLesson = vi.fn();
const getAuthorQuiz = vi.fn();

vi.mock("../api/authorApi", async () => {
  const actual = await vi.importActual<typeof import("../api/authorApi")>("../api/authorApi");
  return {
    ...actual,
    getAuthorLesson: (...args: Parameters<typeof getAuthorLesson>) => getAuthorLesson(...args),
    getAuthorQuiz: (...args: Parameters<typeof getAuthorQuiz>) => getAuthorQuiz(...args),
  };
});

vi.mock("../features/author/components/AuthorConstructorLayout", () => ({
  default: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));
vi.mock("../features/author/components/AuthorLessonToolbar", () => ({
  default: ({ onPublish }: { onPublish: () => void }) => (
    <button type="button" onClick={onPublish}>
      Опубликовать
    </button>
  ),
}));
vi.mock("../features/author/components/AuthorLessonMetaPanel", () => ({ default: () => null }));
vi.mock("../features/author/components/AuthorStoryboardView", () => ({ default: () => null }));
vi.mock("../features/author/components/HotspotEditor", () => ({ default: () => null }));
vi.mock("../features/lesson/components/LessonScreenshotHintsPanel", () => ({ default: () => null }));
vi.mock("../features/lesson/components/LessonSlideView", () => ({ default: () => null }));
const { RichTextEditorMock } = vi.hoisted(() => ({
  RichTextEditorMock: vi.fn(() => null),
}));

vi.mock("../features/author/components/RichTextEditor", () => ({ default: RichTextEditorMock }));

import AuthorLessonPage from "./AuthorLessonPage";

const lessonFixture: AuthorLessonDetail = {
  id: "lesson-01",
  module_id: "orientation-v1",
  module_title: "Ориентация",
  order: 1,
  title: "Вход",
  summary: null,
  tags: [],
  instruction_html: "",
  deep_link_template: null,
  verify: { type: "manual", config: {} },
  is_optional: false,
  slides: [
    {
      id: "s1",
      order: 1,
      title: "Слайд",
      caption_html: "",
      expected_result_html: "",
      image_path: "/content/placeholder-slide.svg",
      hotspots: [],
    },
  ],
};

describe("AuthorLessonPage", () => {
  let container: HTMLDivElement;
  let root: Root;

  beforeEach(() => {
    vi.clearAllMocks();
    getAuthorLesson.mockResolvedValue(lessonFixture);
    getAuthorQuiz.mockResolvedValue(null);
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

  it("loads lesson once without refetch loop", async () => {
    await act(async () => {
      root.render(
        <AppTheme>
          <MemoryRouter initialEntries={["/author/lessons/lesson-01"]}>
            <Routes>
              <Route path="/author/lessons/:lessonId" element={<AuthorLessonPage />} />
            </Routes>
          </MemoryRouter>
        </AppTheme>,
      );
    });

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 50));
    });

    expect(getAuthorLesson).toHaveBeenCalledTimes(1);
    expect(getAuthorLesson).toHaveBeenCalledWith("lesson-01");
  });

  it("switches between slide and hotspots constructor views", async () => {
    await act(async () => {
      root.render(
        <AppTheme>
          <MemoryRouter initialEntries={["/author/lessons/lesson-01"]}>
            <Routes>
              <Route path="/author/lessons/:lessonId" element={<AuthorLessonPage />} />
            </Routes>
          </MemoryRouter>
        </AppTheme>,
      );
    });

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 50));
    });

    const slideToggle = container.querySelector(
      '.author-constructor-view-toggle button[value="slide"]',
    ) as HTMLButtonElement | null;
    const editToggle = container.querySelector(
      '.author-constructor-view-toggle button[value="quiz"]',
    ) as HTMLButtonElement | null;
    const hotspotsToggle = container.querySelector(
      '.author-constructor-view-toggle button[value="hotspots"]',
    ) as HTMLButtonElement | null;

    expect(slideToggle).not.toBeNull();
    expect(editToggle).toBeNull();
    expect(hotspotsToggle).not.toBeNull();
    expect(slideToggle?.textContent).toContain("Слайд");
    expect(hotspotsToggle?.textContent).toContain("Метки");
    expect(container.querySelector(".author-constructor-main")).not.toBeNull();
    expect(container.querySelector(".author-constructor-hotspots")).toBeNull();

    await act(async () => {
      hotspotsToggle?.click();
    });

    expect(container.querySelector(".author-constructor-main")).toBeNull();
    expect(container.querySelector(".author-constructor-hotspots")).not.toBeNull();

    await act(async () => {
      slideToggle?.click();
    });

    expect(container.querySelector(".author-constructor-main")).not.toBeNull();
    expect(container.querySelector(".author-constructor-hotspots")).toBeNull();
  });

  it("shows validation errors as bottom-right toast instead of inline page error", async () => {
    getAuthorLesson.mockResolvedValue({ ...lessonFixture, slides: [] });

    await act(async () => {
      root.render(
        <AppTheme>
          <MemoryRouter initialEntries={["/author/lessons/lesson-01"]}>
            <Routes>
              <Route path="/author/lessons/:lessonId" element={<AuthorLessonPage />} />
            </Routes>
          </MemoryRouter>
        </AppTheme>,
      );
    });

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 50));
    });

    const publishButton = container.querySelector("button");
    expect(publishButton?.textContent).toContain("Опубликовать");

    await act(async () => {
      publishButton?.click();
    });

    const alert = document.body.querySelector('[role="alert"]');
    expect(alert).not.toBeNull();
    expect(alert?.textContent).toContain("Добавьте хотя бы один слайд");
    expect(container.querySelector(".page-status-error")).toBeNull();
  });

  it("does not enable rich text preview in slide editor fields", async () => {
    await act(async () => {
      root.render(
        <AppTheme>
          <MemoryRouter initialEntries={["/author/lessons/lesson-01"]}>
            <Routes>
              <Route path="/author/lessons/:lessonId" element={<AuthorLessonPage />} />
            </Routes>
          </MemoryRouter>
        </AppTheme>,
      );
    });

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 50));
    });

    const slideFieldCalls = RichTextEditorMock.mock.calls.filter(([props]) =>
      ["Подсказка", "Ожидаемый результат"].includes(props.label),
    );

    expect(slideFieldCalls).toHaveLength(2);
    for (const [props] of slideFieldCalls) {
      expect(props.showPreview).toBeFalsy();
      expect(props.toolbarMode).toBe("full");
      expect(props.compact).toBe(true);
    }
  });
});
