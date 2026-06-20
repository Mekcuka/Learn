import { getCached, invalidateApiCache, setCached } from "./apiCache";
import { httpRequest, LearnApiError } from "./httpClient";
import type { VerifyResult } from "../types/api";

export type { VerifyResult };
export { LearnApiError, invalidateApiCache };
export { parseApiError as parseApiErrorForTest } from "./httpClient";

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

export type HotspotKind = "region" | "zoom" | "pin";

export type HotspotFillColor = "yellow" | "blue" | "green" | "red" | "orange";

export type CalloutWidth = "compact" | "normal" | "wide";

export type CalloutSide = "auto" | "left" | "right" | "top" | "bottom";

export type ResolvedCalloutSide = "left" | "right" | "top" | "bottom";

export type HotspotItem = {
  id: string;
  label: string;
  x_pct: number;
  y_pct: number;
  width_pct: number;
  height_pct: number;
  kind?: HotspotKind;
  pulse?: boolean;
  fill_enabled?: boolean;
  fill_color?: HotspotFillColor;
  description_html?: string;
  callout_width?: CalloutWidth;
  callout_side?: CalloutSide;
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

function normalizeLessonTags<T extends { tags?: string[] }>(lesson: T): T & { tags: string[] } {
  return { ...lesson, tags: lesson.tags ?? [] };
}

export async function login(email: string, password: string) {
  return httpRequest<{
    access_token: string;
    token_type: string;
    user: User;
  }>("/api/v1/learn/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
    auth: false,
  });
}

export async function getMe() {
  return httpRequest<User>("/api/v1/learn/auth/me");
}

export async function getDashboard() {
  const cacheKey = "learn:dashboard";
  const cached = getCached<DashboardResponse>(cacheKey);
  if (cached) {
    return {
      modules: cached.modules.map((module) => ({
        ...module,
        lessons: module.lessons.map((lesson) => normalizeLessonTags(lesson)),
      })),
    };
  }

  const data = await httpRequest<DashboardResponse>("/api/v1/learn/dashboard");
  setCached(cacheKey, data);
  return {
    modules: data.modules.map((module) => ({
      ...module,
      lessons: module.lessons.map((lesson) => normalizeLessonTags(lesson)),
    })),
  };
}

export async function getLesson(
  lessonId: string,
  options?: { draft?: boolean; fields?: "meta"; include?: string },
) {
  const params = new URLSearchParams();
  if (options?.draft) {
    params.set("draft", "1");
  }
  if (options?.fields) {
    params.set("fields", options.fields);
  }
  if (options?.include) {
    params.set("include", options.include);
  }
  const query = params.toString() ? `?${params.toString()}` : "";
  const data = await httpRequest<LessonDetail>(`/api/v1/learn/lessons/${lessonId}${query}`);
  return normalizeLessonTags(data);
}

export async function startLesson(lessonId: string) {
  invalidateApiCache("learn:dashboard");
  return httpRequest<{ lesson_id: string; started_at: string }>(
    `/api/v1/learn/lessons/${lessonId}/start`,
    { method: "POST", body: "{}" },
  );
}

export async function verifyLesson(lessonId: string) {
  invalidateApiCache("learn:dashboard");
  return httpRequest<VerifyResult>(`/api/v1/learn/lessons/${lessonId}/verify`, {
    method: "POST",
    body: "{}",
  });
}

export async function submitQuiz(
  moduleId: string,
  answers: { question_id: string; selected_option_ids: string[] }[],
  lessonId?: string,
) {
  invalidateApiCache("learn:dashboard");
  return httpRequest<QuizSubmitResult>(`/api/v1/learn/modules/${moduleId}/quiz/submit`, {
    method: "POST",
    body: JSON.stringify({ answers, lesson_id: lessonId }),
  });
}

export type ResetProgressResponse = {
  message: string;
  modules_reset: number;
};

export async function resetProgress() {
  invalidateApiCache("learn:dashboard");
  return httpRequest<ResetProgressResponse>("/api/v1/learn/profile/reset-progress", {
    method: "POST",
    body: "{}",
  });
}
