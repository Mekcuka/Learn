/**
 * @vitest-environment jsdom
 */
import { describe, expect, it } from "vitest";

import {
  addHeadingIds,
  extractTocEntries,
  sanitizeContentHtml,
  splitContentHtml,
} from "./contentHtml";

describe("sanitizeContentHtml", () => {
  it("keeps lesson annotation tags", () => {
    const html =
      '<p>Текст <sup class="learn-footnote-ref" data-fn-num="1" data-footnote="Пояснение">1</sup></p>' +
      '<aside class="learn-callout learn-callout--info" data-callout-type="info">' +
      '<strong class="learn-callout-label">Подсказка</strong><div class="learn-callout-body"><p>Выноска</p></div></aside>' +
      '<span class="learn-popup" data-popup="Дополнительно" tabindex="0" role="button">термин</span>';

    const sanitized = sanitizeContentHtml(html);
    expect(sanitized).toContain("learn-footnote-ref");
    expect(sanitized).toContain("learn-callout");
    expect(sanitized).toContain("learn-popup");
  });

  it("keeps tables and wiki links", () => {
    const html =
      '<table><thead><tr><th>A</th></tr></thead><tbody><tr><td>B</td></tr></tbody></table>' +
      '<a href="/wiki/demo">Wiki</a><a href="https://example.com">Ext</a>';
    const sanitized = sanitizeContentHtml(html);
    expect(sanitized).toContain("<table");
    expect(sanitized).toContain('href="/wiki/demo"');
    expect(sanitized).toContain('href="https://example.com"');
  });

  it("keeps details and task lists", () => {
    const html =
      '<details><summary>Заголовок</summary><p>Скрыто</p></details>' +
      '<ul data-type="taskList"><li data-type="taskItem" data-checked="false">Пункт</li></ul>';
    const sanitized = sanitizeContentHtml(html);
    expect(sanitized).toContain("<details");
    expect(sanitized).toContain('data-type="taskList"');
  });

  it("strips script tags", () => {
    const sanitized = sanitizeContentHtml('<p>ok</p><script>alert(1)</script>');
    expect(sanitized).not.toContain("script");
    expect(sanitized).toContain("ok");
  });
});

describe("splitContentHtml", () => {
  it("builds footnotes footer with anchors", () => {
    const html =
      '<p>Термин<sup class="learn-footnote-ref" data-fn-num="1" data-footnote="Определение">1</sup></p>';
    const parts = splitContentHtml(html);

    expect(parts.hasFootnotes).toBe(true);
    expect(parts.bodyHtml).toContain('href="#learn-fn-1"');
    expect(parts.footnotesHtml).toContain("Определение");
  });
});

describe("extractTocEntries", () => {
  it("extracts h2 and h3 headings", () => {
    const html = "<h2>Раздел</h2><p>текст</p><h3>Подраздел</h3>";
    const entries = extractTocEntries(html);
    expect(entries).toHaveLength(2);
    expect(entries[0]?.text).toBe("Раздел");
    expect(entries[1]?.level).toBe(3);
  });
});

describe("addHeadingIds", () => {
  it("adds ids to headings without id", () => {
    const html = "<h2>Введение</h2>";
    const result = addHeadingIds(html);
    expect(result).toContain('id="');
    expect(result).toContain("Введение");
  });
});
