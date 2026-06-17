import { describe, expect, it } from "vitest";

import { getWikiArticle, listWikiArticles } from "./wikiArticles";

describe("wikiArticles", () => {
  it("lists articles in order", () => {
    const articles = listWikiArticles();
    expect(articles.length).toBeGreaterThanOrEqual(4);
    expect(articles[0].order).toBeLessThanOrEqual(articles[1].order);
  });

  it("finds article by id", () => {
    expect(getWikiArticle("about-learn")?.title).toContain("Learn Portal");
    expect(getWikiArticle("missing")).toBeUndefined();
  });

  it("articles expose aligned hashtag tags", () => {
    const about = getWikiArticle("about-learn");
    expect(about?.tags).toContain("Learn");
    expect(getWikiArticle("navigation")?.tags).toEqual(["Интерфейс", "Демо"]);
  });
});
