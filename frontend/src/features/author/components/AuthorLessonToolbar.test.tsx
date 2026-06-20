/**
 * @vitest-environment jsdom
 */
import { act } from "react";
import { createRef } from "react";
import { createRoot, type Root } from "react-dom/client";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { AuthorLessonDetail } from "../../../api/authorApi";
import AppTheme from "../../../components/mui/AppTheme";
import AuthorLessonToolbar from "./AuthorLessonToolbar";

const lessonFixture: AuthorLessonDetail = {
  id: "lesson-01",
  module_id: "orientation-v1",
  module_title: "Основной интерфейс",
  order: 1,
  title: "Вход",
  summary: null,
  tags: [],
  instruction_html: "",
  deep_link_template: null,
  verify: { type: "manual", config: {} },
  is_optional: false,
  slides: [],
};

const noop = vi.fn();

describe("AuthorLessonToolbar", () => {
  let container: HTMLDivElement;
  let root: Root;

  beforeEach(() => {
    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);
  });

  afterEach(() => {
    act(() => root.unmount());
    container.remove();
  });

  it("does not show module title in lesson header", () => {
    act(() => {
      root.render(
        <MemoryRouter>
          <AppTheme>
            <AuthorLessonToolbar
              lesson={lessonFixture}
              busy={false}
              autosaveDirty={false}
              autosaveSaving={false}
              validationHint={null}
              activeSlide={false}
              importInputRef={createRef<HTMLInputElement>()}
              moreMenuAnchor={null}
              onMoreMenuOpen={noop}
              onMoreMenuClose={noop}
              onSaveLesson={noop}
              onSaveSlide={noop}
              onPublish={noop}
              onToggleStoryboard={noop}
              onExport={noop}
              onDeleteLesson={noop}
              onImport={noop}
              storyboardMode={false}
            />
          </AppTheme>
        </MemoryRouter>,
      );
    });

    const heading = container.querySelector(".author-lesson-heading");
    expect(heading).not.toBeNull();
    expect(heading?.querySelector(".meta")).toBeNull();
    expect(heading?.textContent).toContain("Вход");
    expect(heading?.textContent).not.toContain("Основной интерфейс");
  });
});
