/**
 * @vitest-environment jsdom
 */
import { describe, expect, it } from "vitest";

import { nextFootnoteNumber, sanitizeLessonHtml, splitLessonHtml } from "./lessonHtml";

describe("sanitizeLessonHtml", () => {
  it("keeps lesson annotation tags and attributes", () => {
    const html =
      '<p>Текст <sup class="learn-footnote-ref" data-fn-num="1" data-footnote="Пояснение">1</sup></p>' +
      '<aside class="learn-callout learn-callout--info" data-callout-type="info">' +
      '<strong class="learn-callout-label">Подсказка</strong><div class="learn-callout-body"><p>Выноска</p></div></aside>' +
      '<span class="learn-popup" data-popup="Дополнительно" tabindex="0" role="button">термин</span>';

    const sanitized = sanitizeLessonHtml(html);
    expect(sanitized).toContain("learn-footnote-ref");
    expect(sanitized).toContain("data-footnote=");
    expect(sanitized).toContain("learn-callout");
    expect(sanitized).toContain("learn-popup");
    expect(sanitized).toContain("data-popup=");
  });

  it("strips unsafe script tags", () => {
    const sanitized = sanitizeLessonHtml('<p>ok</p><script>alert(1)</script>');
    expect(sanitized).not.toContain("script");
    expect(sanitized).toContain("ok");
  });
});

describe("splitLessonHtml", () => {
  it("builds footnotes footer with anchors", () => {
    const html =
      '<p>Термин<sup class="learn-footnote-ref" data-fn-num="1" data-footnote="Определение">1</sup></p>';
    const parts = splitLessonHtml(html);

    expect(parts.hasFootnotes).toBe(true);
    expect(parts.bodyHtml).toContain('href="#learn-fn-1"');
    expect(parts.footnotesHtml).toContain('id="learn-fn-1"');
    expect(parts.footnotesHtml).toContain("Определение");
    expect(parts.footnotesHtml).toContain("Сноски");
  });
});

describe("nextFootnoteNumber", () => {
  it("returns next index after existing footnotes", () => {
    const html =
      '<sup data-fn-num="1"></sup><sup data-fn-num="3"></sup>';
    expect(nextFootnoteNumber(html)).toBe(4);
  });

  it("starts from 1 when no footnotes", () => {
    expect(nextFootnoteNumber("<p>plain</p>")).toBe(1);
  });
});
