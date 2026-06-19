import DOMPurify from "dompurify";
import type { CSSProperties } from "react";

import { sanitizeWikiHtml } from "../utils/wikiHtml";

type SafeHtmlProps = {
  html: string;
  className?: string;
  style?: CSSProperties;
  tag?: keyof HTMLElementTagNameMap;
  wiki?: boolean;
};

export default function SafeHtml({ html, className, style, tag: Tag = "div", wiki = false }: SafeHtmlProps) {
  if (!html?.trim()) {
    return null;
  }

  const sanitized = wiki
    ? sanitizeWikiHtml(html)
    : String(
        DOMPurify.sanitize(html, {
          USE_PROFILES: { html: true },
        }),
      );

  return <Tag className={className} style={style} dangerouslySetInnerHTML={{ __html: sanitized }} />;
}
