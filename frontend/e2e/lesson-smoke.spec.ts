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
  await expect(page.getByLabel("Справочная информация")).toBeVisible();
});

test("manual lesson verify completes", async ({ page }) => {
  await page.goto("/dashboard");
  const activeLesson = page
    .locator('a[href^="/lessons/"]')
    .filter({ hasText: /Текущий|Доступен/ })
    .first();
  await expect(activeLesson).toBeVisible({ timeout: 15_000 });
  await activeLesson.click();

  const verifyButton = page.getByRole("button", { name: "Я выполнил" });
  await expect(verifyButton).toBeVisible({ timeout: 15_000 });
  await verifyButton.click();
  await expect(page.getByText("Выполнен", { exact: true })).toBeVisible({ timeout: 10_000 });
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
  await expect(page.getByRole("status").filter({ hasText: "Поле email" })).toBeVisible();
  await expect(hotspot).toHaveAttribute("aria-pressed", "true");
});
