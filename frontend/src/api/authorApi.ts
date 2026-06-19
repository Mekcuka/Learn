import type { HotspotItem, LessonSlide } from "../types/lesson";
import { LearnApiError, parseApiErrorForTest as parseApiError } from "./learnApi";

export type AuthorModule = {
  id: string;
  title: string;
  description: string | null;
  sort_order: number;
  is_published: boolean;
  lesson_count: number;
};

export type AuthorLessonListItem = {
  id: string;
  order: number;
  title: string;
  summary: string | null;
  slide_count: number;
  verify_type: string;
  has_unpublished_changes?: boolean;
};

export type AuthorLessonDetail = {
  id: string;
  module_id: string;
  module_title: string;
  order: number;
  title: string;
  summary: string | null;
  tags: string[];
  instruction_html: string;
  deep_link_template: string | null;
  verify: { type: string; config: Record<string, unknown> };
  is_optional: boolean;
  slides: LessonSlide[];
  has_unpublished_changes?: boolean;
  published_at?: string | null;
};

export type AuthorQuizOption = {
  id: string;
  text: string;
};

export type AuthorQuizQuestion = {
  id: string;
  order: number;
  prompt_html: string;
  options: AuthorQuizOption[];
  correct_option_ids: string[];
};

export type AuthorQuiz = {
  module_id: string;
  pass_threshold_percent: number;
  questions: AuthorQuizQuestion[];
};

export type AuthorSlideUpdateResponse = {
  slide: LessonSlide;
  has_unpublished_changes: boolean;
};

export type LessonRevisionItem = {
  id: string;
  created_at: string;
  author_user_id: string | null;
  summary: string | null;
};

const API_BASE = import.meta.env.VITE_API_URL ?? "";

async function authorRequest<T>(path: string, options: RequestInit = {}): Promise<T> {
  const headers = new Headers(options.headers);
  if (options.body && !(options.body instanceof FormData) && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const token = localStorage.getItem("learn_token");
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const response = await fetch(`${API_BASE}${path}`, { ...options, headers });
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

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
}

export async function getAuthorModules() {
  return authorRequest<AuthorModule[]>("/api/v1/learn/author/modules");
}

export async function getAuthorModuleLessons(moduleId: string) {
  return authorRequest<AuthorLessonListItem[]>(`/api/v1/learn/author/modules/${moduleId}/lessons`);
}

export async function getAuthorLesson(lessonId: string) {
  return authorRequest<AuthorLessonDetail>(`/api/v1/learn/author/lessons/${lessonId}`);
}

export async function createAuthorLesson(
  moduleId: string,
  body: {
    id?: string;
    title: string;
    summary?: string;
    tags?: string[];
    instruction_html?: string;
    deep_link_template?: string;
    verify_type?: string;
    verify_config?: Record<string, unknown>;
  },
) {
  return authorRequest<AuthorLessonDetail>(`/api/v1/learn/author/modules/${moduleId}/lessons`, {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export async function updateAuthorLesson(
  lessonId: string,
  body: Partial<{
    title: string;
    summary: string;
    tags: string[];
    instruction_html: string;
    deep_link_template: string;
    verify_type: string;
    verify_config: Record<string, unknown>;
    sort_order: number;
  }>,
) {
  return authorRequest<AuthorLessonDetail>(`/api/v1/learn/author/lessons/${lessonId}`, {
    method: "PUT",
    body: JSON.stringify(body),
  });
}

export async function deleteAuthorLesson(lessonId: string) {
  return authorRequest<void>(`/api/v1/learn/author/lessons/${lessonId}`, { method: "DELETE" });
}

export async function createAuthorSlide(
  lessonId: string,
  body: {
    title: string;
    caption_html?: string;
    expected_result_html?: string;
    image_path?: string;
    hotspots?: HotspotItem[];
  },
) {
  return authorRequest<AuthorLessonDetail>(`/api/v1/learn/author/lessons/${lessonId}/slides`, {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export async function updateAuthorSlide(
  slideId: string,
  body: Partial<{
    title: string;
    caption_html: string;
    expected_result_html: string;
    image_path: string;
    hotspots: HotspotItem[];
    sort_order: number;
  }>,
) {
  return authorRequest<AuthorSlideUpdateResponse>(`/api/v1/learn/author/slides/${slideId}`, {
    method: "PUT",
    body: JSON.stringify(body),
  });
}

export async function deleteAuthorSlide(slideId: string) {
  return authorRequest<AuthorLessonDetail>(`/api/v1/learn/author/slides/${slideId}`, {
    method: "DELETE",
  });
}

export async function reorderAuthorSlides(lessonId: string, slideIds: string[]) {
  return authorRequest<AuthorLessonDetail>(`/api/v1/learn/author/lessons/${lessonId}/slides/reorder`, {
    method: "PATCH",
    body: JSON.stringify({ slide_ids: slideIds }),
  });
}

export async function reorderAuthorLessons(moduleId: string, lessonIds: string[]) {
  return authorRequest<AuthorLessonListItem[]>(
    `/api/v1/learn/author/modules/${moduleId}/lessons/reorder`,
    {
      method: "PATCH",
      body: JSON.stringify({ lesson_ids: lessonIds }),
    },
  );
}

export async function uploadSlideImage(slideId: string, file: File) {
  const form = new FormData();
  form.append("file", file);
  return authorRequest<{ image_path: string }>(`/api/v1/learn/author/slides/${slideId}/upload`, {
    method: "POST",
    body: form,
  });
}

export async function exportAuthorLesson(lessonId: string) {
  return authorRequest<Record<string, unknown>>(`/api/v1/learn/author/lessons/${lessonId}/export`);
}

export async function importAuthorLesson(moduleId: string, lesson: Record<string, unknown>) {
  return authorRequest<AuthorLessonDetail>(`/api/v1/learn/author/modules/${moduleId}/lessons/import`, {
    method: "POST",
    body: JSON.stringify({ lesson }),
  });
}

export async function duplicateAuthorLesson(
  lessonId: string,
  body?: { new_id?: string; title_suffix?: string },
) {
  return authorRequest<AuthorLessonDetail>(`/api/v1/learn/author/lessons/${lessonId}/duplicate`, {
    method: "POST",
    body: JSON.stringify(body ?? {}),
  });
}

export async function getAuthorLessonRevisions(lessonId: string) {
  return authorRequest<{ items: LessonRevisionItem[] }>(
    `/api/v1/learn/author/lessons/${lessonId}/revisions`,
  );
}

export async function createAuthorLessonRevision(lessonId: string, label?: string) {
  return authorRequest<LessonRevisionItem>(`/api/v1/learn/author/lessons/${lessonId}/revisions`, {
    method: "POST",
    body: JSON.stringify({ label: label ?? null }),
  });
}

export async function rollbackAuthorLessonRevision(lessonId: string, revisionId: string) {
  return authorRequest<AuthorLessonDetail>(
    `/api/v1/learn/author/lessons/${lessonId}/revisions/${revisionId}/rollback`,
    { method: "POST" },
  );
}

export async function publishAuthorLesson(lessonId: string) {
  return authorRequest<AuthorLessonDetail>(`/api/v1/learn/author/lessons/${lessonId}/publish`, {
    method: "POST",
  });
}

export async function getAuthorQuiz(moduleId: string) {
  return authorRequest<AuthorQuiz>(`/api/v1/learn/author/modules/${moduleId}/quiz`);
}

export async function updateAuthorQuiz(
  moduleId: string,
  body: {
    pass_threshold_percent?: number;
    questions: AuthorQuizQuestion[];
  },
) {
  return authorRequest<AuthorQuiz>(`/api/v1/learn/author/modules/${moduleId}/quiz`, {
    method: "PUT",
    body: JSON.stringify(body),
  });
}
