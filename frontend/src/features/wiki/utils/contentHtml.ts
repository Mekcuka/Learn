import DOMPurify from "dompurify";

export const CONTENT_HTML_CONFIG = {
  USE_PROFILES: { html: true },
  ADD_TAGS: [
    "aside",
    "sup",
    "nav",
    "details",
    "summary",
    "table",
    "thead",
    "tbody",
    "tr",
    "th",
    "td",
    "figure",
    "figcaption",
    "mark",
  ],
  ADD_ATTR: [
    "data-footnote",
    "data-fn-num",
    "data-popup",
    "data-callout-type",
    "data-caption",
    "data-width",
    "data-wiki-toc",
    "data-type",
    "data-checked",
    "tabindex",
    "role",
    "aria-haspopup",
    "aria-expanded",
    "aria-label",
    "id",
    "href",
    "target",
    "rel",
    "colspan",
    "rowspan",
    "style",
    "class",
    "alt",
    "open",
  ],
  ALLOWED_URI_REGEXP: /^(?:(?:https?):|\/(?:content|wiki)\/|#)/i,
};

export function isAllowedContentImageSrc(src: string): boolean {
  const trimmed = src.trim();
  if (!trimmed || /^javascript:/i.test(trimmed)) {
    return false;
  }
  return trimmed.startsWith("/content/") || /^https:\/\//i.test(trimmed);
}

export function isAllowedContentLinkHref(href: string): boolean {
  const trimmed = href.trim();
  if (!trimmed || /^javascript:/i.test(trimmed)) {
    return false;
  }
  if (trimmed.startsWith("#")) {
    return true;
  }
  return trimmed.startsWith("/content/") || trimmed.startsWith("/wiki/") || /^https:\/\//i.test(trimmed);
}

export function sanitizeContentHtml(html: string): string {
  if (!html?.trim()) {
    return "";
  }
  return String(DOMPurify.sanitize(html, CONTENT_HTML_CONFIG));
}

export type ContentHtmlParts = {
  bodyHtml: string;
  footnotesHtml: string;
  hasFootnotes: boolean;
};

export function splitContentHtml(html: string): ContentHtmlParts {
  const bodyHtml = sanitizeContentHtml(html);
  if (!bodyHtml) {
    return { bodyHtml: "", footnotesHtml: "", hasFootnotes: false };
  }

  const doc = new DOMParser().parseFromString(`<div id="root">${bodyHtml}</div>`, "text/html");
  const root = doc.getElementById("root");
  if (!root) {
    return { bodyHtml, footnotesHtml: "", hasFootnotes: false };
  }

  const refs = Array.from(root.querySelectorAll("sup.learn-footnote-ref"));
  if (refs.length === 0) {
    return { bodyHtml, footnotesHtml: "", hasFootnotes: false };
  }

  const items: string[] = [];
  refs.forEach((ref) => {
    const num = ref.getAttribute("data-fn-num") ?? "1";
    const text = ref.getAttribute("data-footnote") ?? "";
    const anchorId = `learn-fn-${num}`;
    ref.setAttribute("id", `learn-fn-ref-${num}`);
    ref.innerHTML = `<a href="#${anchorId}" class="learn-footnote-link">${num}</a>`;
    items.push(
      `<li id="${anchorId}" class="learn-footnote-item"><span class="learn-footnote-marker">${num}.</span> ${escapeHtml(text)}</li>`,
    );
  });

  const footnotesHtml = `<footer class="learn-footnotes"><h4 class="learn-footnotes-title">Сноски</h4><ol class="learn-footnotes-list">${items.join("")}</ol></footer>`;

  return {
    bodyHtml: root.innerHTML,
    footnotesHtml,
    hasFootnotes: true,
  };
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

export function nextFootnoteNumber(html: string): number {
  const matches = html.matchAll(/data-fn-num="(\d+)"/g);
  let max = 0;
  for (const match of matches) {
    max = Math.max(max, Number(match[1]));
  }
  return max + 1;
}

export type TocEntry = {
  id: string;
  text: string;
  level: 2 | 3;
};

export function slugifyHeading(text: string): string {
  return text
    .trim()
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s-]/gu, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 80);
}

export function extractTocEntries(html: string): TocEntry[] {
  const sanitized = sanitizeContentHtml(html);
  if (!sanitized) {
    return [];
  }
  const doc = new DOMParser().parseFromString(`<div id="root">${sanitized}</div>`, "text/html");
  const root = doc.getElementById("root");
  if (!root) {
    return [];
  }

  const entries: TocEntry[] = [];
  const usedIds = new Set<string>();

  root.querySelectorAll("h2, h3").forEach((heading) => {
    const level = heading.tagName === "H2" ? 2 : 3;
    const text = heading.textContent?.trim() ?? "";
    if (!text) {
      return;
    }
    let id = heading.id || slugifyHeading(text);
    if (!id) {
      id = `heading-${entries.length + 1}`;
    }
    while (usedIds.has(id)) {
      id = `${id}-${entries.length + 1}`;
    }
    usedIds.add(id);
    heading.id = id;
    entries.push({ id, text, level });
  });

  return entries;
}

export function addHeadingIds(html: string): string {
  const sanitized = sanitizeContentHtml(html);
  if (!sanitized) {
    return "";
  }
  const doc = new DOMParser().parseFromString(`<div id="root">${sanitized}</div>`, "text/html");
  const root = doc.getElementById("root");
  if (!root) {
    return sanitized;
  }

  const usedIds = new Set<string>();
  root.querySelectorAll("h2, h3").forEach((heading) => {
    if (heading.id) {
      usedIds.add(heading.id);
      return;
    }
    const text = heading.textContent?.trim() ?? "";
    let id = slugifyHeading(text);
    if (!id) {
      id = `heading-${usedIds.size + 1}`;
    }
    while (usedIds.has(id)) {
      id = `${id}-${usedIds.size + 1}`;
    }
    usedIds.add(id);
    heading.id = id;
  });

  return root.innerHTML;
}
