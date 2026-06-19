export type VerifyResult = {
  status: "pending" | "passed" | "failed";
  message: string;
  retry_after_seconds?: number | null;
  hint_lesson_id?: string;
  hint_step_id?: string;
  data?: Record<string, unknown>;
};

export type ApiErrorPayload = {
  detail?: string | { detail?: string; message?: string };
  message?: string;
  request_id?: string;
};
