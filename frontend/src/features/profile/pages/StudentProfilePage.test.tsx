/**
 * @vitest-environment jsdom
 */
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import AppTheme from "../../../components/mui/AppTheme";
import { LearnApiError, type DashboardResponse } from "../../../api/learnApi";

const getDashboard = vi.fn();
const resetProgress = vi.fn();

vi.mock("../../../api/learnApi", async () => {
  const actual = await vi.importActual<typeof import("../../../api/learnApi")>("../../../api/learnApi");
  return {
    ...actual,
    getDashboard: (...args: Parameters<typeof getDashboard>) => getDashboard(...args),
    resetProgress: (...args: Parameters<typeof resetProgress>) => resetProgress(...args),
  };
});

vi.mock("../../../components/PortalTopbar", () => ({
  default: () => <div data-testid="portal-topbar" />,
}));

vi.mock("../../../auth/AuthContext", () => ({
  useAuth: () => ({
    user: {
      id: "user-1",
      email: "student@training.local",
      display_name: "Ученик 1",
      role: "student",
    },
    loading: false,
    setSession: vi.fn(),
    logout: vi.fn(),
  }),
}));

import StudentProfilePage from "./StudentProfilePage";

const dashboardFixture: DashboardResponse = {
  modules: [
    {
      id: "orientation-v1",
      title: "Ориентация",
      description: null,
      status: "in_progress",
      progress_percent: 20,
      total_lessons: 5,
      completed_lessons: 1,
      lessons: [
        {
          id: "lesson-01",
          order: 1,
          title: "Первый урок",
          summary: null,
          tags: [],
          status: "completed",
          slide_count: 2,
        },
        {
          id: "lesson-02",
          order: 2,
          title: "Второй урок",
          summary: null,
          tags: [],
          status: "active",
          slide_count: 1,
        },
      ],
    },
  ],
};

describe("StudentProfilePage", () => {
  let container: HTMLDivElement;
  let root: Root;

  beforeEach(() => {
    vi.clearAllMocks();
    getDashboard.mockResolvedValue(dashboardFixture);
    resetProgress.mockResolvedValue({ message: "Статистика уроков сброшена", modules_reset: 1 });
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

  async function renderPage() {
    await act(async () => {
      root.render(
        <AppTheme>
          <MemoryRouter>
            <StudentProfilePage />
          </MemoryRouter>
        </AppTheme>,
      );
    });
    await act(async () => {
      await Promise.resolve();
    });
  }

  it("shows user info and progress stats", async () => {
    await renderPage();

    expect(container.textContent).toContain("Ученик 1");
    expect(container.textContent).toContain("student@training.local");
    expect(container.textContent).toContain("1 из 5 уроков");
    expect(container.textContent).toContain("Первый урок");
    expect(container.textContent).toContain("Сбросить статистику");
  });

  async function openConfirmModal() {
    const resetButton = Array.from(container.querySelectorAll("button")).find((button) =>
      button.textContent?.includes("Сбросить статистику"),
    );
    expect(resetButton).toBeTruthy();

    await act(async () => {
      resetButton!.click();
      await Promise.resolve();
    });

    expect(document.body.textContent).toContain("Сбросить статистику?");

    const confirmButton = Array.from(document.body.querySelectorAll("button")).find(
      (button) => button.textContent === "Сбросить",
    );
    expect(confirmButton).toBeTruthy();
    return confirmButton!;
  }

  it("opens confirm modal and resets stats", async () => {
    await renderPage();

    const confirmButton = await openConfirmModal();

    await act(async () => {
      confirmButton.click();
      await Promise.resolve();
    });

    expect(resetProgress).toHaveBeenCalledTimes(1);
    expect(getDashboard).toHaveBeenCalledTimes(2);
    expect(document.body.textContent).toContain("Статистика уроков сброшена");
  });

  it("shows reset error in confirm modal when API fails", async () => {
    resetProgress.mockRejectedValue(new LearnApiError(500, "Не удалось сбросить статистику"));
    await renderPage();

    const confirmButton = await openConfirmModal();

    await act(async () => {
      confirmButton.click();
      await Promise.resolve();
    });

    expect(resetProgress).toHaveBeenCalledTimes(1);
    expect(document.body.textContent).toContain("Не удалось сбросить статистику");
    expect(document.body.textContent).toContain("Сбросить статистику?");
  });
});
