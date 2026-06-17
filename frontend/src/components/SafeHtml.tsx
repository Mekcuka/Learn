import DOMPurify from "dompurify";

type SafeHtmlProps = {
  html: string;
  className?: string;
  tag?: keyof HTMLElementTagNameMap;
};

export default function SafeHtml({ html, className, tag: Tag = "div" }: SafeHtmlProps) {
  if (!html?.trim()) {
    return null;
  }

  const sanitized = DOMPurify.sanitize(html, {
    USE_PROFILES: { html: true },
  });

  return <Tag className={className} dangerouslySetInnerHTML={{ __html: sanitized }} />;
}
