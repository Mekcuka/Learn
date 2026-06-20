import { expect, test } from "@playwright/test";

test("dashboard loads and lesson page opens", async ({ page }) => {
  await page.goto("/dashboard");
  await expect(page.getByRole("heading", { name: /обучение/i, level: 1 })).toBeVisible({
    timeout: 15_000,
  });

  const lessonLink = page.locator('a[href^="/lessons/"]').first();
  await expect(lessonLink).toBeVisible();
  await lessonLink.click();

  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await expect(page.getByLabel("Справка по уроку")).toBeVisible();
});

test("manual lesson verify completes", async ({ page }) => {
  await page.goto("/dashboard");
  const activeLesson = page
    .locator('a[href^="/lessons/"]')
    .filter({ hasText: /Текущий|Доступен/ })
    .first();
  await expect(activeLesson).toBeVisible({ timeout: 15_000 });
  await activeLesson.click();

  const verifyButton = page.getByRole("button", { name: "Выполнено" });
  await expect(verifyButton).toBeVisible({ timeout: 15_000 });
  await verifyButton.click();
  await expect(page.getByText("Выполнен", { exact: true })).toBeVisible({ timeout: 10_000 });
});

test("mixed slides+quiz lesson shows screenshot on first slide", async ({ page, request }) => {
  const apiBase = process.env.PLAYWRIGHT_API_URL ?? "http://127.0.0.1:8000";
  const lessonId = `lesson-e2e-mixed-${Date.now()}`;
  const moduleId = "orientation-v1";

  const create = await request.post(`${apiBase}/api/v1/learn/author/modules/${moduleId}/lessons`, {
    data: { id: lessonId, title: "E2E mixed", verify_type: "quiz_passed", verify_config: { pass_threshold_percent: 80 } },
  });
  expect(create.ok()).toBeTruthy();

  const slide = await request.post(`${apiBase}/api/v1/learn/author/lessons/${lessonId}/slides`, {
    data: { id: `${lessonId}-slide-01`, title: "Слайд 1" },
  });
  expect(slide.ok()).toBeTruthy();

  const publish = await request.post(`${apiBase}/api/v1/learn/author/lessons/${lessonId}/publish`);
  expect(publish.ok()).toBeTruthy();

  await page.goto(`/lessons/${lessonId}`);
  await expect(page.getByRole("region", { name: "Слайды урока" })).toBeVisible({ timeout: 15_000 });
  await expect(page.getByRole("img", { name: "Слайд 1" })).toBeVisible();

  const frame = page.locator(".screenshot-frame");
  await expect(frame).toBeVisible();
  const box = await frame.boundingBox();
  expect(box?.height ?? 0).toBeGreaterThan(80);

  const reference = page.getByLabel("Справка по уроку");
  await expect(reference).toContainText("Слайд 1/1");
  await expect(reference).not.toContainText("Квиз");

  await request.delete(`${apiBase}/api/v1/learn/author/lessons/${lessonId}`);
});

test("lesson-123 mixed slides+quiz shows carousel on first slide", async ({ page }) => {
  await page.goto("/lessons/lesson-123");
  await expect(page.getByRole("region", { name: "Слайды урока" })).toBeVisible({ timeout: 15_000 });
  await expect(page.getByRole("img", { name: /Слайд 1/i })).toBeVisible();

  const frame = page.locator(".screenshot-frame");
  await expect(frame).toBeVisible();
  const box = await frame.boundingBox();
  expect(box?.height ?? 0).toBeGreaterThan(80);

  const reference = page.getByLabel("Справка по уроку");
  await expect(reference).toContainText(/Слайд 1\/\d+/);
  await expect(reference).not.toContainText("Квиз");
});

test("screenshot zoom and hotspot selection", async ({ page }) => {
  await page.goto("/lessons/lesson-01-login-context");
  await expect(page.getByRole("toolbar", { name: "Инструменты просмотра скрина" })).toBeVisible({
    timeout: 15_000,
  });

  await page.getByRole("button", { name: "Увеличить" }).click();
  await expect(page.getByText("125%")).toBeVisible();

  const hotspot = page.getByRole("button", { name: /Поле email/ }).first();
  await hotspot.click();
  await expect(hotspot).toHaveAttribute("aria-pressed", "true");
  await expect(hotspot).toHaveClass(/hotspot-active/);
});
