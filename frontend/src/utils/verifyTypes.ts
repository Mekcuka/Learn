export const VERIFY_TYPE_VALUES = [
  "manual",
  "resource_exists",
  "navigation",
  "quiz_passed",
  "job_completed",
] as const;

export type VerifyType = (typeof VERIFY_TYPE_VALUES)[number];

/** Подписи типов проверки для UI автора (значения API остаются на английском). */
export const VERIFY_TYPE_LABELS: Record<VerifyType, string> = {
  manual: "Вручную («Я выполнил»)",
  resource_exists: "Ресурс в демо",
  navigation: "Навигация в демо",
  quiz_passed: "Мини-квиз",
  job_completed: "Задача в журнале",
};

export function verifyTypeLabel(type: string): string {
  return type in VERIFY_TYPE_LABELS
    ? VERIFY_TYPE_LABELS[type as VerifyType]
    : type;
}
