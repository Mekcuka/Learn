import { describe, expect, it } from "vitest";

import { appTheme } from "../components/mui/theme";
import {
  designBreakpoints,
  designColors,
  designRadius,
  designTypography,
  getDesignTokenCssVariables,
} from "./tokens";

describe("design tokens sync", () => {
  const cssVars = getDesignTokenCssVariables();

  it("maps MUI primary palette to CSS accent variables", () => {
    expect(appTheme.palette.primary.main).toBe(designColors.accent);
    expect(cssVars["--accent"]).toBe(designColors.accent);
    expect(cssVars["--color-typo-brand"]).toBe(designColors.accent);
    expect(cssVars["--color-typo-link"]).toBe(designColors.accent);
  });

  it("maps MUI text.secondary to --text-muted", () => {
    expect(appTheme.palette.text?.secondary).toBe(designColors.textSecondary);
    expect(cssVars["--text-muted"]).toBe(designColors.textSecondary);
    expect(cssVars["--color-typo-secondary"]).toBe(designColors.textSecondary);
  });

  it("maps MUI divider to --border", () => {
    expect(appTheme.palette.divider).toBe(designColors.border);
    expect(cssVars["--border"]).toBe(designColors.border);
    expect(cssVars["--color-bg-border"]).toBe(designColors.border);
  });

  it("maps MUI shape.borderRadius to --control-radius", () => {
    expect(appTheme.shape.borderRadius).toBe(designRadius.control);
    expect(cssVars["--control-radius"]).toBe(`${designRadius.control}px`);
  });

  it("maps semantic palette colors to CSS variables", () => {
    expect(appTheme.palette.success?.main).toBe(designColors.success);
    expect(cssVars["--color-typo-success"]).toBe(designColors.success);
    expect(appTheme.palette.warning?.main).toBe(designColors.warning);
    expect(cssVars["--color-typo-warning"]).toBe(designColors.warning);
    expect(appTheme.palette.error?.main).toBe(designColors.error);
    expect(cssVars["--color-typo-alert"]).toBe(designColors.error);
  });

  it("maps typography tokens", () => {
    expect(appTheme.typography.fontFamily).toBe(designTypography.fontFamily);
    expect(cssVars["--font-family-base"]).toBe(designTypography.fontFamily);
    expect(cssVars["--line-height-base"]).toBe(String(designTypography.lineHeight));
  });

  it("documents catalog stack breakpoint in CSS variables", () => {
    expect(cssVars["--catalog-stack-breakpoint"]).toBe(
      `${designBreakpoints.catalogStack}px`,
    );
  });
});
