export const VERIFY_TYPE_VALUES = ["manual", "quiz_passed"] as const;

export type VerifyType = (typeof VERIFY_TYPE_VALUES)[number];

/** Подписи типов проверки для UI автора (значения API остаются на английском). */
export const VERIFY_TYPE_LABELS: Record<VerifyType, string> = {
  manual: "Вручную («Я выполнил»)",
  quiz_passed: "Мини-квиз",
};

export function verifyTypeLabel(type: string): string {
  return type in VERIFY_TYPE_LABELS
    ? VERIFY_TYPE_LABELS[type as VerifyType]
    : type;
}
