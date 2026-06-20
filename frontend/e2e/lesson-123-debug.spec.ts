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

  test("quiz step shows QuizPanel with visible questions in main area", async ({ page }) => {
    await page.goto("/lessons/lesson-123");
    await expect(page.getByRole("region", { name: "Слайды урока" })).toBeVisible({ timeout: 15_000 });

    await page.keyboard.press("ArrowRight");
    await page.keyboard.press("ArrowRight");

    const quizPanel = page.locator(".quiz-panel");
    await expect(quizPanel).toBeVisible({ timeout: 15_000 });
    await expect(page.getByRole("heading", { name: "Мини-квиз" })).toBeVisible();
    await expect(page.locator(".quiz-question")).toHaveCount(5);

    const reference = page.getByLabel("Справка по уроку");
    await expect(reference).toContainText("Квиз");
    await expect(reference).toContainText("Ответьте на 5 вопросов");

    const measurements = await page.evaluate(() => {
      const rect = (el: Element | null) => {
        if (!el) return null;
        const r = el.getBoundingClientRect();
        return { width: r.width, height: r.height };
      };

      return {
        sessionStorage: sessionStorage.getItem("learn:slide:lesson-123"),
        quizPanel: rect(document.querySelector(".quiz-panel")),
        main: rect(document.querySelector(".lesson-main")),
        hasCarousel: Boolean(document.querySelector(".slide-carousel")),
      };
    });

    console.log("MEASUREMENTS_QUIZ_STEP", JSON.stringify(measurements, null, 2));

    expect(measurements.sessionStorage).toBe("2");
    expect(measurements.hasCarousel).toBe(false);
    expect(measurements.quizPanel?.height ?? 0).toBeGreaterThan(120);
    expect(measurements.main?.height ?? 0).toBeGreaterThan(120);
  });

  test("quiz step stays visible on narrow viewport", async ({ page }) => {
    await page.setViewportSize({ width: 900, height: 700 });
    await page.goto("/lessons/lesson-123");
    await expect(page.getByRole("region", { name: "Слайды урока" })).toBeVisible({ timeout: 15_000 });

    await page.keyboard.press("ArrowRight");
    await page.keyboard.press("ArrowRight");

    await expect(page.locator(".quiz-panel")).toBeVisible({ timeout: 15_000 });
    await expect(page.locator(".quiz-question")).toHaveCount(5);

    const measurements = await page.evaluate(() => ({
      mainH: document.querySelector(".lesson-main")?.getBoundingClientRect().height ?? 0,
      quizH: document.querySelector(".quiz-panel")?.getBoundingClientRect().height ?? 0,
      bodyClass: document.querySelector(".lesson-body")?.className ?? "",
    }));

    console.log("MEASUREMENTS_QUIZ_NARROW", JSON.stringify(measurements, null, 2));

    expect(measurements.bodyClass).toContain("lesson-body--no-hints");
    expect(measurements.mainH).toBeGreaterThan(120);
    expect(measurements.quizH).toBeGreaterThan(120);
  });

  test("quiz submit sends answers and shows result", async ({ page }) => {
    await page.goto("/lessons/lesson-123");
    await expect(page.getByRole("region", { name: "Слайды урока" })).toBeVisible({ timeout: 15_000 });

    await page.keyboard.press("ArrowRight");
    await page.keyboard.press("ArrowRight");
    await expect(page.locator(".quiz-panel")).toBeVisible({ timeout: 15_000 });

    const questionCount = await page.locator(".quiz-question").count();
    for (let i = 0; i < questionCount; i += 1) {
      const question = page.locator(".quiz-question").nth(i);
      const radio = question.locator('input[type="radio"]').first();
      const checkbox = question.locator('input[type="checkbox"]').first();
      if (await radio.count()) {
        await radio.check({ force: true });
      } else if (await checkbox.count()) {
        await checkbox.check({ force: true });
      }
    }

    const submitButton = page.getByRole("button", { name: "Отправить ответы" });
    await expect(submitButton).toBeEnabled();

    const submitResponse = page.waitForResponse(
      (response) => response.url().includes("/quiz/submit") && response.request().method() === "POST",
      { timeout: 15_000 },
    );

    await submitButton.click();

    expect((await submitResponse).ok()).toBeTruthy();
    await expect(page.locator(".quiz-result")).toBeVisible({ timeout: 10_000 });
  });
});
