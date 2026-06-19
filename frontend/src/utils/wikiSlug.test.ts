import { describe, expect, it } from "vitest";

import { formatTagsInput, parseTagsInput, slugFromTitle } from "../utils/wikiSlug";

describe("wikiSlug", () => {
  it("transliterates Russian title to slug", () => {
    expect(slugFromTitle("Учебный аккаунт")).toBe("uchebnyy-akkaunt");
  });

  it("keeps latin words in slug", () => {
    expect(slugFromTitle("Learn Portal")).toBe("learn-portal");
  });

  it("parses and formats tags", () => {
    expect(parseTagsInput("#Демо, Старт")).toEqual(["Демо", "Старт"]);
    expect(formatTagsInput(["Карта", "Демо"])).toBe("Карта, Демо");
  });
});
