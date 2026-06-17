const API_BASE = import.meta.env.VITE_API_URL ?? "";
const REQUEST_TIMEOUT_MS = 20_000;

export type User = {
  id: string;
  email: string;
  display_name: string;
  role?: string;
};

export type LessonListItem = {
  id: string;
  order: number;
  title: string;
  summary: string | null;
  tags: string[];
  status: "locked" | "active" | "completed" | "not_started";
  slide_count: number;
};

export type ModuleDashboardItem = {
  id: string;
  title: string;
  description: string | null;
  status: string;
  progress_percent: number;
  total_lessons: number;
  completed_lessons: number;
  lessons: LessonListItem[];
};

export type DashboardResponse = {
  modules: ModuleDashboardItem[];
};

export type HotspotItem = {
  id: string;
  label: string;
  x_pct: number;
  y_pct: number;
  width_pct: number;
  height_pct: number;
  pulse?: boolean;
  description_html?: string;
};
export type LessonSlide = {
  id: string;
  order: number;
  title: string;
  caption_html: string;
  expected_result_html: string;
  image_path: string;
  hotspots: HotspotItem[];
};

export type LessonStateItem = {
  lesson_id: string;
  status: "locked" | "active" | "completed";
  completed_at: string | null;
  verify_result: Record<string, unknown> | null;
};

export type ModuleLessonOutlineItem = {
  id: string;
  order: number;
  title: string;
  status: string;
};

export type QuizOption = {
  id: string;
  text: string;
};

export type LessonDetail = {
  id: string;
  module_id: string;
  module_title: string;
  order: number;
  title: string;
  summary: string | null;
  tags: string[];
  instruction_html: string;
  deep_link: string | null;
  verify: { type: string; config: Record<string, unknown> };
  progress_percent: number;
  project_id: string | null;
  lesson_states: LessonStateItem[];
  module_lessons: ModuleLessonOutlineItem[];
  slides: LessonSlide[];
  quiz: QuizModule | null;
};

export type QuizQuestion = {
  id: string;
  order: number;
  prompt_html: string;
  options: QuizOption[];
  allow_multiple: boolean;
};

export type QuizModule = {
  module_id: string;
  pass_threshold_percent: number;
  questions: QuizQuestion[];
};

export type QuizSubmitResult = {
  passed: boolean;
  score_percent: number;
  pass_threshold_percent: number;
  results: { question_id: string; correct: boolean }[];
  lesson_completed: boolean;
};

export type VerifyResult = {
  status: "pending" | "passed" | "failed";
  message: string;
  retry_after_seconds?: number | null;
  hint_lesson_id?: string;
  hint_step_id?: string;
  data?: Record<string, unknown>;
};

type ApiError = {
  detail?: string | { detail?: string; message?: string };
  message?: string;
};

function parseApiError(payload: ApiError): { message: string; code?: string } {
  if (payload.message) {
    const code =
      typeof payload.detail === "string"
        ? payload.detail
        : typeof payload.detail === "object" && payload.detail?.detail
          ? payload.detail.detail
          : undefined;
    return { message: payload.message, code };
  }
  if (payload.detail && typeof payload.detail === "object") {
    return {
      message: payload.detail.message ?? "Не удалось выполнить запрос",
      code: payload.detail.detail,
    };
  }
  if (typeof payload.detail === "string") {
    if (payload.detail === "invalid_credentials") {
      return { message: "Неверный email или пароль", code: payload.detail };
    }
    return { message: payload.detail, code: payload.detail };
  }
  return { message: "Не удалось выполнить запрос" };
}

class LearnApiError extends Error {
  status: number;
  code?: string;

  constructor(status: number, message: string, code?: string) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

function normalizeLessonTags<T extends { tags?: string[] }>(lesson: T): T & { tags: string[] } {
  return { ...lesson, tags: lesson.tags ?? [] };
}

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
    let payload: ApiError = {};
    try {
      payload = await response.json();
    } catch {
      payload = {};
    }
    const { message, code } = parseApiError(payload);
    throw new LearnApiError(response.status, message, code);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
}

export async function login(email: string, password: string) {
  return request<{
    access_token: string;
    token_type: string;
    user: User;
  }>("/api/v1/learn/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
}

export async function getMe() {
  return request<User>("/api/v1/learn/auth/me");
}

export async function getDashboard() {
  const data = await request<DashboardResponse>("/api/v1/learn/dashboard");
  return {
    modules: data.modules.map((module) => ({
      ...module,
      lessons: module.lessons.map((lesson) => normalizeLessonTags(lesson)),
    })),
  };
}

export async function getLesson(lessonId: string) {
  const data = await request<LessonDetail>(`/api/v1/learn/lessons/${lessonId}`);
  return normalizeLessonTags(data);
}

export async function startLesson(lessonId: string) {
  return request<{ lesson_id: string; started_at: string }>(
    `/api/v1/learn/lessons/${lessonId}/start`,
    { method: "POST", body: "{}" },
  );
}

export async function verifyLesson(lessonId: string) {
  return request<VerifyResult>(`/api/v1/learn/lessons/${lessonId}/verify`, {
    method: "POST",
    body: "{}",
  });
}

export async function submitQuiz(
  moduleId: string,
  answers: { question_id: string; selected_option_ids: string[] }[],
  lessonId?: string,
) {
  return request<QuizSubmitResult>(`/api/v1/learn/modules/${moduleId}/quiz/submit`, {
    method: "POST",
    body: JSON.stringify({ answers, lesson_id: lessonId }),
  });
}

export { LearnApiError, parseApiError as parseApiErrorForTest };
