/**
 * Single source of truth for Learn Portal design tokens.
 * Consumed by MUI theme (components/mui/theme.ts) and injected as CSS custom properties at bootstrap.
 * Layout-only variables remain in styles/tokens.css.
 */

export const designColors = {
  accent: "#0078d2",
  accentSoft: "#e8f4fd",
  accentDark: "#005a9e",
  secondary: "#7b61ff",
  textPrimary: "#1a1a1a",
  textSecondary: "#6b7280",
  textGhost: "#9ca3af",
  textCaution: "#d97706",
  bgDefault: "#ffffff",
  bgSecondary: "#f9fafb",
  bgSoft: "#f3f4f6",
  bgBrand: "#e8f4fd",
  bgSuccess: "#f0fdf4",
  bgAlert: "#fef2f2",
  bgLink: "#eff6ff",
  bgWarning: "#fffbeb",
  border: "#e8e8e8",
  success: "#22a06b",
  warning: "#f5a623",
  error: "#e5484d",
} as const;

export const designRadius = {
  control: 12,
  sm: 6,
  card: 16,
  pill: 999,
} as const;

export const designTypography = {
  fontFamily: '"Manrope", system-ui, sans-serif',
  lineHeight: 1.5,
} as const;

/** Documented breakpoints referenced by layout CSS (not MUI breakpoints). */
export const designBreakpoints = {
  /** catalog.css — stack module cards below this width */
  catalogStack: 900,
} as const;

/** CSS custom property names → values injected on :root at bootstrap. */
export function getDesignTokenCssVariables(): Record<string, string> {
  const { accent, accentSoft, textPrimary, textSecondary, textGhost, textCaution } =
    designColors;

  return {
    "--font-family-base": designTypography.fontFamily,
    "--line-height-base": String(designTypography.lineHeight),
    "--accent": accent,
    "--accent-soft": accentSoft,
    "--border": designColors.border,
    "--text-muted": textSecondary,
    "--color-bg-default": designColors.bgDefault,
    "--color-bg-secondary": designColors.bgSecondary,
    "--color-bg-border": designColors.border,
    "--color-typo-primary": textPrimary,
    "--color-typo-secondary": textSecondary,
    "--color-typo-brand": accent,
    "--color-bg-brand": accentSoft,
    "--color-bg-soft": designColors.bgSoft,
    "--color-bg-success": designColors.bgSuccess,
    "--color-bg-alert": designColors.bgAlert,
    "--color-bg-link": designColors.bgLink,
    "--color-bg-warning": designColors.bgWarning,
    "--color-typo-success": designColors.success,
    "--color-typo-alert": designColors.error,
    "--color-typo-link": accent,
    "--color-typo-warning": designColors.warning,
    "--color-typo-caution": textCaution,
    "--color-typo-ghost": textGhost,
    "--control-radius": `${designRadius.control}px`,
    "--radius-sm": `${designRadius.sm}px`,
    "--radius-pill": `${designRadius.pill}px`,
    "--radius-card": `${designRadius.card}px`,
    "--catalog-stack-breakpoint": `${designBreakpoints.catalogStack}px`,
  };
}

export function injectDesignTokenCssVariables(
  root: HTMLElement = document.documentElement,
): void {
  const variables = getDesignTokenCssVariables();
  for (const [name, value] of Object.entries(variables)) {
    root.style.setProperty(name, value);
  }
  root.style.fontFamily = designTypography.fontFamily;
  root.style.lineHeight = String(designTypography.lineHeight);
  root.style.color = designColors.textPrimary;
  root.style.background = designColors.bgDefault;
}
