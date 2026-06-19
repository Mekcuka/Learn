import {
  isAllowedContentImageSrc,
  isAllowedContentLinkHref,
  sanitizeContentHtml,
} from "./contentHtml";

export function isAllowedWikiImageSrc(src: string): boolean {
  return isAllowedContentImageSrc(src);
}

export function isAllowedWikiLinkHref(href: string): boolean {
  return isAllowedContentLinkHref(href);
}

export function sanitizeWikiHtml(html: string): string {
  return sanitizeContentHtml(html);
}
