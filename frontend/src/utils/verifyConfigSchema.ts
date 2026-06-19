import type { VerifyType } from "./verifyTypes";

export type VerifyConfig = Record<string, unknown>;

export function defaultVerifyConfig(verifyType: VerifyType): VerifyConfig {
  switch (verifyType) {
    case "manual":
      return {};
    case "quiz_passed":
      return { pass_threshold_percent: 80 };
    default:
      return {};
  }
}

/** Merge preset defaults when verify type changes; keep unknown keys from existing config. */
export function mergeVerifyConfigOnTypeChange(
  verifyType: VerifyType,
  existing: VerifyConfig,
): VerifyConfig {
  const defaults = defaultVerifyConfig(verifyType);
  return { ...existing, ...defaults };
}

export function validateVerifyConfig(
  verifyType: VerifyType,
  config: VerifyConfig,
): string | null {
  if (verifyType === "quiz_passed") {
    const threshold = config.pass_threshold_percent;
    if (
      typeof threshold !== "number" ||
      Number.isNaN(threshold) ||
      threshold < 0 ||
      threshold > 100
    ) {
      return "Порог квиза должен быть от 0 до 100";
    }
  }
  return null;
}

export function parseAdvancedVerifyJson(json: string): { config: VerifyConfig; error: string | null } {
  try {
    const parsed = JSON.parse(json) as unknown;
    if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
      return { config: {}, error: "Невалидный JSON в расширенном режиме verify" };
    }
    return { config: parsed as VerifyConfig, error: null };
  } catch {
    return { config: {}, error: "Невалидный JSON в расширенном режиме verify" };
  }
}
