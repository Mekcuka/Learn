import type { HotspotItem, LessonSlide } from "../types/lesson";
import { httpRequest } from "./httpClient";

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

export async function getAuthorModules() {
  return httpRequest<AuthorModule[]>("/api/v1/learn/author/modules", { timeout: false });
}

export async function getAuthorModuleLessons(moduleId: string) {
  return httpRequest<AuthorLessonListItem[]>(
    `/api/v1/learn/author/modules/${moduleId}/lessons`,
    { timeout: false },
  );
}

export async function getAuthorLesson(lessonId: string) {
  return httpRequest<AuthorLessonDetail>(`/api/v1/learn/author/lessons/${lessonId}`, {
    timeout: false,
  });
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
  return httpRequest<AuthorLessonDetail>(`/api/v1/learn/author/modules/${moduleId}/lessons`, {
    method: "POST",
    body: JSON.stringify(body),
    timeout: false,
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
  return httpRequest<AuthorLessonDetail>(`/api/v1/learn/author/lessons/${lessonId}`, {
    method: "PUT",
    body: JSON.stringify(body),
    timeout: false,
  });
}

export async function deleteAuthorLesson(lessonId: string) {
  return httpRequest<void>(`/api/v1/learn/author/lessons/${lessonId}`, {
    method: "DELETE",
    timeout: false,
  });
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
  return httpRequest<AuthorLessonDetail>(`/api/v1/learn/author/lessons/${lessonId}/slides`, {
    method: "POST",
    body: JSON.stringify(body),
    timeout: false,
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
  return httpRequest<AuthorSlideUpdateResponse>(`/api/v1/learn/author/slides/${slideId}`, {
    method: "PUT",
    body: JSON.stringify(body),
    timeout: false,
  });
}

export async function deleteAuthorSlide(slideId: string) {
  return httpRequest<AuthorLessonDetail>(`/api/v1/learn/author/slides/${slideId}`, {
    method: "DELETE",
    timeout: false,
  });
}

export async function reorderAuthorSlides(lessonId: string, slideIds: string[]) {
  return httpRequest<AuthorLessonDetail>(
    `/api/v1/learn/author/lessons/${lessonId}/slides/reorder`,
    {
      method: "PATCH",
      body: JSON.stringify({ slide_ids: slideIds }),
      timeout: false,
    },
  );
}

export async function reorderAuthorLessons(moduleId: string, lessonIds: string[]) {
  return httpRequest<AuthorLessonListItem[]>(
    `/api/v1/learn/author/modules/${moduleId}/lessons/reorder`,
    {
      method: "PATCH",
      body: JSON.stringify({ lesson_ids: lessonIds }),
      timeout: false,
    },
  );
}

export async function uploadSlideImage(slideId: string, file: File) {
  const form = new FormData();
  form.append("file", file);
  return httpRequest<{ image_path: string }>(`/api/v1/learn/author/slides/${slideId}/upload`, {
    method: "POST",
    body: form,
    timeout: false,
  });
}

export async function exportAuthorLesson(lessonId: string) {
  return httpRequest<Record<string, unknown>>(`/api/v1/learn/author/lessons/${lessonId}/export`, {
    timeout: false,
  });
}

export async function importAuthorLesson(moduleId: string, lesson: Record<string, unknown>) {
  return httpRequest<AuthorLessonDetail>(
    `/api/v1/learn/author/modules/${moduleId}/lessons/import`,
    {
      method: "POST",
      body: JSON.stringify({ lesson }),
      timeout: false,
    },
  );
}

export async function duplicateAuthorLesson(
  lessonId: string,
  body?: { new_id?: string; title_suffix?: string },
) {
  return httpRequest<AuthorLessonDetail>(`/api/v1/learn/author/lessons/${lessonId}/duplicate`, {
    method: "POST",
    body: JSON.stringify(body ?? {}),
    timeout: false,
  });
}

export async function getAuthorLessonRevisions(lessonId: string) {
  return httpRequest<{ items: LessonRevisionItem[] }>(
    `/api/v1/learn/author/lessons/${lessonId}/revisions`,
    { timeout: false },
  );
}

export async function createAuthorLessonRevision(lessonId: string, label?: string) {
  return httpRequest<LessonRevisionItem>(`/api/v1/learn/author/lessons/${lessonId}/revisions`, {
    method: "POST",
    body: JSON.stringify({ label: label ?? null }),
    timeout: false,
  });
}

export async function rollbackAuthorLessonRevision(lessonId: string, revisionId: string) {
  return httpRequest<AuthorLessonDetail>(
    `/api/v1/learn/author/lessons/${lessonId}/revisions/${revisionId}/rollback`,
    { method: "POST", timeout: false },
  );
}

export async function publishAuthorLesson(lessonId: string) {
  return httpRequest<AuthorLessonDetail>(`/api/v1/learn/author/lessons/${lessonId}/publish`, {
    method: "POST",
    timeout: false,
  });
}

export async function getAuthorQuiz(moduleId: string) {
  return httpRequest<AuthorQuiz>(`/api/v1/learn/author/modules/${moduleId}/quiz`, {
    timeout: false,
  });
}

export async function updateAuthorQuiz(
  moduleId: string,
  body: {
    pass_threshold_percent?: number;
    questions: AuthorQuizQuestion[];
  },
) {
  return httpRequest<AuthorQuiz>(`/api/v1/learn/author/modules/${moduleId}/quiz`, {
    method: "PUT",
    body: JSON.stringify(body),
    timeout: false,
  });
}
