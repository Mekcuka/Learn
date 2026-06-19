import { describe, expect, it } from "vitest";

function stripHtmlToText(html: string): string {
  return html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

describe("AuthorStoryboardView helpers", () => {
  it("strips html for caption preview", () => {
    expect(stripHtmlToText("<p>Шаг <strong>1</strong></p>")).toBe("Шаг 1");
    expect(stripHtmlToText("")).toBe("");
  });
});
