/**
 * @vitest-environment jsdom
 */
import { describe, expect, it } from "vitest";

import { buildEditorExtensions } from "./buildEditorExtensions";

describe("buildEditorExtensions", () => {
  it("omits heavy extensions in lightweight mode", () => {
    const extensions = buildEditorExtensions({ mode: "lesson", enableImages: false, lightweight: true });
    const names = extensions.map((ext) => ext.name);

    expect(names).not.toContain("characterCount");
    expect(names).not.toContain("table");
    expect(names).not.toContain("taskList");
    expect(names).not.toContain("details");
  });

  it("keeps full extensions by default", () => {
    const extensions = buildEditorExtensions({ mode: "lesson", enableImages: false });
    const names = extensions.map((ext) => ext.name);

    expect(names).toContain("characterCount");
    expect(names).toContain("table");
    expect(names).toContain("taskList");
    expect(names).toContain("details");
  });
});
