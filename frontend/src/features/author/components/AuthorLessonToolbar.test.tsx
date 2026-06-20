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
              toolbarAction={null}
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

  it("calls onPublish when publish button is clicked", () => {
    const onPublish = vi.fn();
    act(() => {
      root.render(
        <MemoryRouter>
          <AppTheme>
            <AuthorLessonToolbar
              lesson={lessonFixture}
              toolbarAction={null}
              validationHint={null}
              activeSlide={false}
              importInputRef={createRef<HTMLInputElement>()}
              moreMenuAnchor={null}
              onMoreMenuOpen={noop}
              onMoreMenuClose={noop}
              onSaveLesson={noop}
              onSaveSlide={noop}
              onPublish={onPublish}
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

    const publishButton = Array.from(container.querySelectorAll("button")).find((button) =>
      button.textContent?.includes("Опубликовать"),
    );
    expect(publishButton).toBeDefined();
    act(() => {
      publishButton?.click();
    });
    expect(onPublish).toHaveBeenCalledTimes(1);
  });

  it("does not call onPublish while toolbar action is in progress", () => {
    const onPublish = vi.fn();
    act(() => {
      root.render(
        <MemoryRouter>
          <AppTheme>
            <AuthorLessonToolbar
              lesson={lessonFixture}
              toolbarAction="lesson"
              validationHint={null}
              activeSlide={false}
              importInputRef={createRef<HTMLInputElement>()}
              moreMenuAnchor={null}
              onMoreMenuOpen={noop}
              onMoreMenuClose={noop}
              onSaveLesson={noop}
              onSaveSlide={noop}
              onPublish={onPublish}
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

    const publishButton = Array.from(container.querySelectorAll("button")).find((button) =>
      button.textContent?.includes("Опубликовать"),
    );
    act(() => {
      publishButton?.click();
    });
    expect(onPublish).not.toHaveBeenCalled();
  });
});
