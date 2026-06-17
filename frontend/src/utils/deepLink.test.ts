import { describe, expect, it } from "vitest";

import { buildDeepLink, lessonReturnUrl } from "./deepLink";

describe("deepLink", () => {
  it("builds demo url with return_url and project_id", () => {
    const url = buildDeepLink("https://demo.example/projects/{project_id}?learn_step=nav", {
      returnUrl: "http://localhost:5173/lessons/lesson-01",
      projectId: "proj-1",
    });
    expect(url).toContain("learn_step=nav");
    expect(url).toContain("return_url=");
    expect(url).toContain("proj-1");
  });

  it("lessonReturnUrl points to lesson route", () => {
    expect(lessonReturnUrl("lesson-02")).toContain("/lessons/lesson-02");
  });
});
