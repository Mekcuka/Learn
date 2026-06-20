import { expect, test } from "@playwright/test";

test("header shows split button on final lesson step", async ({ page }) => {
  await page.goto("/lessons/lesson-01-login-context");
  await expect(page.getByRole("region", { name: "Слайды урока" })).toBeVisible({ timeout: 15_000 });

  const nextSlide = page.getByRole("button", { name: "Следующий слайд" });
  while (await nextSlide.isEnabled()) {
    await nextSlide.click();
  }

  const splitGroup = page.getByRole("group", { name: "Следующий урок и завершение" });
  await expect(splitGroup).toBeVisible({ timeout: 15_000 });
  await expect(splitGroup).toContainText("Следующий урок");
  await expect(splitGroup.getByRole("separator")).toBeVisible();

  const statusChip = page.locator(".lesson-page-status");
  const inProgress = (await statusChip.textContent())?.includes("В процессе");
  const nextHalf = splitGroup.getByRole("button", { name: /Следующий урок:/i });

  if (inProgress) {
    await expect(nextHalf).toBeDisabled();
    await expect(splitGroup.getByRole("button", { name: "Завершить урок" })).toBeEnabled();
  } else {
    await expect(nextHalf).toBeEnabled();
    await expect(splitGroup.getByRole("button", { name: "Выполнен" })).toBeDisabled();
  }

  await page.screenshot({
    path: "e2e/screenshots/lesson-header-split-before-complete.png",
    fullPage: false,
  });
});
