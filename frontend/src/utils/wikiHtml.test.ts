/**
 * @vitest-environment jsdom
 */
import { describe, expect, it } from "vitest";

import { isAllowedWikiImageSrc, sanitizeWikiHtml } from "./wikiHtml";

describe("sanitizeWikiHtml", () => {
  it("keeps safe img tags with /content/ src", () => {
    const html =
      '<p>Текст</p><img src="/content/orientation-v1/lesson-01-login/slide-01.svg" alt="Вход в демо">';
    const sanitized = sanitizeWikiHtml(html);
    expect(sanitized).toContain('src="/content/orientation-v1/lesson-01-login/slide-01.svg"');
    expect(sanitized).toContain('alt="Вход в демо"');
  });

  it("keeps https image src", () => {
    const html = '<img src="https://example.com/pic.png" alt="Пример">';
    const sanitized = sanitizeWikiHtml(html);
    expect(sanitized).toContain('src="https://example.com/pic.png"');
  });

  it("strips javascript: image src", () => {
    const html = '<img src="javascript:alert(1)" alt="xss">';
    const sanitized = sanitizeWikiHtml(html);
    expect(sanitized).not.toContain("javascript:");
  });

  it("removes script tags", () => {
    const sanitized = sanitizeWikiHtml('<p>ok</p><script>alert(1)</script>');
    expect(sanitized).not.toContain("script");
    expect(sanitized).toContain("ok");
  });
});

describe("isAllowedWikiImageSrc", () => {
  it("allows /content/ and https paths", () => {
    expect(isAllowedWikiImageSrc("/content/wiki/abc.png")).toBe(true);
    expect(isAllowedWikiImageSrc("https://example.com/a.png")).toBe(true);
  });

  it("rejects javascript and relative paths", () => {
    expect(isAllowedWikiImageSrc("javascript:alert(1)")).toBe(false);
    expect(isAllowedWikiImageSrc("../secret.png")).toBe(false);
    expect(isAllowedWikiImageSrc("data:image/png;base64,abc")).toBe(false);
  });
});
