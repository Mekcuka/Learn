import { describe, expect, it } from "vitest";

import {
  aggregateTagCounts,
  buildTagHref,
  formatHashtag,
  formatTagsInput,
  lessonHasTag,
  matchTag,
  normalizeTag,
  parseTagsInput,
} from "./hashtags";

describe("hashtags", () => {
  it("normalizes and formats tags", () => {
    expect(normalizeTag("  #Демо  ")).toBe("Демо");
    expect(formatHashtag("Демо")).toBe("#Демо");
    expect(matchTag("#демо", "Демо")).toBe(true);
  });

  it("filters lessons by tag", () => {
    expect(lessonHasTag(["Старт", "Демо"], "демо")).toBe(true);
    expect(lessonHasTag(["Старт"], "Карта")).toBe(false);
    expect(lessonHasTag(["Старт"], null)).toBe(true);
  });

  it("aggregates tag counts", () => {
    const counts = aggregateTagCounts([
      { tags: ["Демо", "Старт"] },
      { tags: ["#Демо", "Карта"] },
    ]);
    expect(counts[0]).toEqual({ tag: "Демо", count: 2 });
  });

  it("parses and formats author input", () => {
    expect(parseTagsInput("Старт, #Демо; Карта")).toEqual(["Старт", "Демо", "Карта"]);
    expect(formatTagsInput(["Старт", "Демо"])).toBe("Старт, Демо");
  });

  it("builds tag href", () => {
    expect(buildTagHref("/dashboard", "Демо")).toBe("/dashboard?tag=%D0%94%D0%B5%D0%BC%D0%BE");
  });
});
