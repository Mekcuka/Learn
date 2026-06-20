import { expect, test } from "@playwright/test";

test("roadmap width aligns with lesson main column", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/lessons/lesson-01-login-context");
  await expect(page.getByRole("region", { name: "Слайды урока" })).toBeVisible({ timeout: 15_000 });

  const roadmap = page.locator(".lesson-page-header__roadmap");
  const lessonMain = page.locator(".lesson-main");
  const screenshot = page.locator(".lesson-main .screenshot-frame img").first();

  await expect(roadmap).toBeVisible();
  await expect(lessonMain).toBeVisible();
  await expect(screenshot).toBeVisible();

  const roadmapBox = await roadmap.boundingBox();
  const mainBox = await lessonMain.boundingBox();
  const screenshotBox = await screenshot.boundingBox();

  expect(roadmapBox).not.toBeNull();
  expect(mainBox).not.toBeNull();
  expect(screenshotBox).not.toBeNull();

  expect(Math.abs(roadmapBox!.x - mainBox!.x)).toBeLessThan(3);
  expect(Math.abs(roadmapBox!.width - mainBox!.width)).toBeLessThan(3);
  expect(Math.abs(roadmapBox!.width - screenshotBox!.width)).toBeLessThan(6);
});
