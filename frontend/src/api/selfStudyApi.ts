import { LearnApiError, parseApiErrorForTest as parseApiError } from "./learnApi";

const API_BASE = import.meta.env.VITE_API_URL ?? "";
const REQUEST_TIMEOUT_MS = 20_000;

export type SelfStudyAssignmentListItem = {
  id: string;
  title: string;
  description: string | null;
  status: string;
  progress_percent: number;
  total_steps: number;
  completed_steps: number;
};

export type SelfStudyStep = {
  id: string;
  order: number;
  title: string;
  instruction_html: string;
  deep_link: string | null;
  verify: { type: string; config: Record<string, unknown> };
};

export type SelfStudyStepState = {
  step_id: string;
  status: "locked" | "active" | "completed";
  completed_at: string | null;
  verify_result: Record<string, unknown> | null;
};

export type SelfStudyAssignmentDetail = {
  id: string;
  title: string;
  description: string | null;
  status: string;
  progress_percent: number;
  current_step_id: string | null;
  project_id: string | null;
  steps: SelfStudyStep[];
  step_states: SelfStudyStepState[];
};

export type VerifyResult = {
  status: "pending" | "passed" | "failed";
  message: string;
  retry_after_seconds?: number | null;
  hint_step_id?: string;
  data?: Record<string, unknown>;
};

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const headers = new Headers(options.headers);
  if (options.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const token = localStorage.getItem("learn_token");
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  let response: Response;
  try {
    response = await fetch(`${API_BASE}${path}`, {
      ...options,
      headers,
      signal: options.signal ?? AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });
  } catch (err) {
    if (err instanceof DOMException && err.name === "TimeoutError") {
      throw new LearnApiError(
        0,
        "Сервер не отвечает. Запустите backend и выполните alembic upgrade head.",
      );
    }
    throw new LearnApiError(0, "Не удалось подключиться к серверу");
  }

  if (!response.ok) {
    let payload: { detail?: string | { detail?: string; message?: string }; message?: string } = {};
    try {
      payload = await response.json();
    } catch {
      payload = {};
    }
    const { message, code } = parseApiError(payload);
    throw new LearnApiError(response.status, message, code);
  }

  return response.json() as Promise<T>;
}

export async function getSelfStudyAssignments() {
  const data = await request<{ items: SelfStudyAssignmentListItem[] }>(
    "/api/v1/learn/self-study/assignments",
  );
  return data.items;
}

export async function getSelfStudyAssignment(assignmentId: string) {
  return request<SelfStudyAssignmentDetail>(
    `/api/v1/learn/self-study/assignments/${assignmentId}`,
  );
}

export async function startSelfStudyStep(assignmentId: string, stepId: string) {
  return request<{ step_id: string; started_at: string }>(
    `/api/v1/learn/self-study/assignments/${assignmentId}/steps/${stepId}/start`,
    { method: "POST", body: "{}" },
  );
}

export async function verifySelfStudyStep(assignmentId: string, stepId: string) {
  return request<VerifyResult>(
    `/api/v1/learn/self-study/assignments/${assignmentId}/steps/${stepId}/verify`,
    { method: "POST", body: "{}" },
  );
}

export async function completeSelfStudyStepManual(assignmentId: string, stepId: string) {
  return request<{ step_id: string; status: string }>(
    `/api/v1/learn/self-study/assignments/${assignmentId}/steps/${stepId}/complete-manual`,
    { method: "POST", body: "{}" },
  );
}

export { LearnApiError };
