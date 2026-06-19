import { getCached, invalidateApiCache, setCached } from "./apiCache";
import { httpRequest } from "./httpClient";

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

export async function listWikiArticles() {
  const cacheKey = "wiki:articles";
  const cached = getCached<WikiArticleListItem[]>(cacheKey);
  if (cached) {
    return cached;
  }
  const data = await httpRequest<WikiArticleListItem[]>("/api/v1/learn/wiki/articles", {
    auth: false,
    timeout: false,
  });
  setCached(cacheKey, data);
  return data;
}

export async function getWikiArticle(articleId: string) {
  return httpRequest<WikiArticleDetail>(`/api/v1/learn/wiki/articles/${articleId}`, {
    auth: false,
    timeout: false,
  });
}

export async function listAuthorWikiArticles() {
  return httpRequest<WikiArticleListItem[]>("/api/v1/learn/author/wiki/articles", {
    timeout: false,
  });
}

export async function getAuthorWikiArticle(articleId: string) {
  return httpRequest<WikiArticleDetail>(`/api/v1/learn/author/wiki/articles/${articleId}`, {
    timeout: false,
  });
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
  return httpRequest<WikiArticleDetail>("/api/v1/learn/author/wiki/articles", {
    method: "POST",
    body: JSON.stringify(body),
    timeout: false,
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
  return httpRequest<WikiArticleDetail>(`/api/v1/learn/author/wiki/articles/${articleId}`, {
    method: "PUT",
    body: JSON.stringify(body),
    timeout: false,
  });
}

export async function deleteAuthorWikiArticle(articleId: string) {
  invalidateApiCache("wiki:");
  return httpRequest<void>(`/api/v1/learn/author/wiki/articles/${articleId}`, {
    method: "DELETE",
    timeout: false,
  });
}

export async function uploadWikiImage(file: File) {
  const form = new FormData();
  form.append("file", file);
  return httpRequest<{ image_path: string }>("/api/v1/learn/author/wiki/upload", {
    method: "POST",
    body: form,
    timeout: false,
  });
}
