import { LearnApiError, parseApiErrorForTest as parseApiError } from "./learnApi";
import { getCached, invalidateApiCache, setCached } from "./apiCache";

export type WikiArticleListItem = {
  id: string;
  order: number;
  title: string;
  summary: string;
  tags: string[];
};

export type WikiArticleDetail = WikiArticleListItem & {
  body_html: string;
  created_at?: string;
  updated_at?: string;
};

const API_BASE = import.meta.env.VITE_API_URL ?? "";

async function wikiRequest<T>(path: string, options: RequestInit = {}): Promise<T> {
  const headers = new Headers(options.headers);
  if (options.body && !(options.body instanceof FormData) && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
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

async function authorWikiRequest<T>(path: string, options: RequestInit = {}): Promise<T> {
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

export async function listWikiArticles() {
  const cacheKey = "wiki:articles";
  const cached = getCached<WikiArticleListItem[]>(cacheKey);
  if (cached) {
    return cached;
  }
  const data = await wikiRequest<WikiArticleListItem[]>("/api/v1/learn/wiki/articles");
  setCached(cacheKey, data);
  return data;
}

export async function getWikiArticle(articleId: string) {
  return wikiRequest<WikiArticleDetail>(`/api/v1/learn/wiki/articles/${articleId}`);
}

export async function listAuthorWikiArticles() {
  return authorWikiRequest<WikiArticleListItem[]>("/api/v1/learn/author/wiki/articles");
}

export async function getAuthorWikiArticle(articleId: string) {
  return authorWikiRequest<WikiArticleDetail>(`/api/v1/learn/author/wiki/articles/${articleId}`);
}

export async function createAuthorWikiArticle(body: {
  id?: string;
  title: string;
  summary?: string;
  body_html?: string;
  tags?: string[];
  sort_order?: number;
}) {
  invalidateApiCache("wiki:");
  return authorWikiRequest<WikiArticleDetail>("/api/v1/learn/author/wiki/articles", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export async function updateAuthorWikiArticle(
  articleId: string,
  body: Partial<{
    title: string;
    summary: string;
    body_html: string;
    tags: string[];
    sort_order: number;
  }>,
) {
  invalidateApiCache("wiki:");
  return authorWikiRequest<WikiArticleDetail>(`/api/v1/learn/author/wiki/articles/${articleId}`, {
    method: "PUT",
    body: JSON.stringify(body),
  });
}

export async function deleteAuthorWikiArticle(articleId: string) {
  invalidateApiCache("wiki:");
  return authorWikiRequest<void>(`/api/v1/learn/author/wiki/articles/${articleId}`, {
    method: "DELETE",
  });
}

export async function uploadWikiImage(file: File) {
  const form = new FormData();
  form.append("file", file);
  return authorWikiRequest<{ image_path: string }>("/api/v1/learn/author/wiki/upload", {
    method: "POST",
    body: form,
  });
}
