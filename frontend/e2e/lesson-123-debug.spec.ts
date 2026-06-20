import { expect, test } from "@playwright/test";

test.describe("lesson-123 mixed lesson diagnostics", () => {
  test("fresh session shows slide carousel with visible screenshot", async ({ page }) => {
    await page.goto("/lessons/lesson-123");

    await expect(page.getByRole("region", { name: "Слайды урока" })).toBeVisible({ timeout: 15_000 });

    const reference = page.getByLabel("Справка по уроку");
    await expect(reference).toContainText("Слайд 1/2");
    await expect(reference).not.toContainText("Квиз");

    const carousel = page.locator(".slide-carousel");
    const frame = page.locator(".screenshot-frame");
    const img = page.getByRole("img", { name: /Слайд 1/i });

    await expect(frame).toBeVisible();
    await expect(img).toBeVisible();

    const measurements = await page.evaluate(() => {
      const carousel = document.querySelector(".slide-carousel");
      const frame = document.querySelector(".screenshot-frame");
      const img = document.querySelector(".screenshot-frame img");
      const main = document.querySelector(".lesson-main");
      const quizPanel = document.querySelector(".quiz-panel");
      const ref = document.querySelector(".lesson-reference-panel");
      const slideView = document.querySelector(".lesson-slide-view");
      const storage = sessionStorage.getItem("learn:slide:lesson-123");

      const rect = (el: Element | null) => {
        if (!el) return null;
        const r = el.getBoundingClientRect();
        return { width: r.width, height: r.height, top: r.top, left: r.left };
      };

      return {
        sessionStorage: storage,
        carousel: rect(carousel),
        frame: rect(frame),
        img: rect(img),
        main: rect(main),
        quizPanel: rect(quizPanel),
        reference: rect(ref),
        slideViewHtml: slideView?.innerHTML.slice(0, 200) ?? null,
        hasQuizPanel: Boolean(quizPanel),
        hasCarousel: Boolean(carousel),
        referenceText: ref?.textContent?.slice(0, 300) ?? null,
      };
    });

    console.log("MEASUREMENTS_FRESH", JSON.stringify(measurements, null, 2));

    expect(measurements.hasCarousel).toBe(true);
    expect(measurements.hasQuizPanel).toBe(false);
    expect(measurements.frame?.height ?? 0).toBeGreaterThan(80);
    expect(measurements.img?.height ?? 0).toBeGreaterThan(40);

    await page.screenshot({
      path: "e2e/screenshots/lesson-123-fixed-slide1.png",
      fullPage: false,
    });
  });

  test("stuck sessionStorage on quiz index resets to first slide for not_started lesson", async ({ page }) => {
    await page.addInitScript(() => {
      sessionStorage.setItem("learn:slide:lesson-123", "2");
    });
    await page.goto("/lessons/lesson-123");

    await expect(page.getByRole("region", { name: "Слайды урока" })).toBeVisible({ timeout: 15_000 });

    const measurements = await page.evaluate(() => {
      const quizPanel = document.querySelector(".quiz-panel");
      const carousel = document.querySelector(".slide-carousel");
      const main = document.querySelector(".lesson-main");
      const ref = document.querySelector(".lesson-reference-panel");

      const rect = (el: Element | null) => {
        if (!el) return null;
        const r = el.getBoundingClientRect();
        return { width: r.width, height: r.height };
      };

      return {
        sessionStorage: sessionStorage.getItem("learn:slide:lesson-123"),
        quizPanel: rect(quizPanel),
        carousel: rect(carousel),
        main: rect(main),
        hasQuizPanel: Boolean(quizPanel),
        hasCarousel: Boolean(carousel),
        referenceText: ref?.textContent?.slice(0, 300) ?? null,
      };
    });

    console.log("MEASUREMENTS_QUIZ_STEP_RESET", JSON.stringify(measurements, null, 2));

    expect(measurements.hasQuizPanel).toBe(false);
    expect(measurements.hasCarousel).toBe(true);
    expect(measurements.sessionStorage).toBe("0");
    expect(measurements.referenceText).toContain("Слайд 1/2");
    expect(measurements.referenceText).not.toContain("Квиз");
  });

  test("invalid sessionStorage index resets to first slide for not_started lesson", async ({ page }) => {
    await page.addInitScript(() => {
      sessionStorage.setItem("learn:slide:lesson-123", "99");
    });
    await page.goto("/lessons/lesson-123");

    await expect(page.getByRole("region", { name: "Слайды урока" })).toBeVisible({ timeout: 15_000 });

    const measurements = await page.evaluate(() => ({
      sessionStorage: sessionStorage.getItem("learn:slide:lesson-123"),
      hasCarousel: Boolean(document.querySelector(".slide-carousel")),
      hasQuizPanel: Boolean(document.querySelector(".quiz-panel")),
      referenceText: document.querySelector(".lesson-reference-panel")?.textContent ?? "",
    }));

    console.log("MEASUREMENTS_INVALID_INDEX", JSON.stringify(measurements, null, 2));

    expect(measurements.sessionStorage).toBe("0");
    expect(measurements.hasCarousel).toBe(true);
    expect(measurements.hasQuizPanel).toBe(false);
    expect(measurements.referenceText).toContain("Слайд 1/2");
  });
});
