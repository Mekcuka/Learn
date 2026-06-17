export function normalizeTag(value: string): string {
  let tag = value.trim();
  if (tag.startsWith("#")) {
    tag = tag.slice(1).trim();
  }
  return tag;
}

export function formatHashtag(value: string): string {
  const tag = normalizeTag(value);
  return tag ? `#${tag}` : "";
}

export function matchTag(a: string, b: string): boolean {
  return normalizeTag(a).localeCompare(normalizeTag(b), "ru", { sensitivity: "accent" }) === 0;
}

export function lessonHasTag(tags: string[] | undefined, activeTag: string | null | undefined): boolean {
  if (!activeTag) {
    return true;
  }
  return (tags ?? []).some((tag) => matchTag(tag, activeTag));
}

export type TagCount = {
  tag: string;
  count: number;
};

export function aggregateTagCounts(items: { tags?: string[] }[]): TagCount[] {
  const counts = new Map<string, TagCount>();

  for (const item of items) {
    for (const raw of item.tags ?? []) {
      const tag = normalizeTag(raw);
      if (!tag) {
        continue;
      }
      const key = tag.toLocaleLowerCase("ru");
      const existing = counts.get(key);
      if (existing) {
        existing.count += 1;
      } else {
        counts.set(key, { tag, count: 1 });
      }
    }
  }

  return [...counts.values()].sort(
    (a, b) => b.count - a.count || a.tag.localeCompare(b.tag, "ru"),
  );
}

export function parseTagsInput(value: string): string[] {
  return value
    .split(/[,;\n]+/)
    .map(normalizeTag)
    .filter(Boolean);
}

export function formatTagsInput(tags: string[]): string {
  return tags.map(normalizeTag).filter(Boolean).join(", ");
}

export function buildTagHref(basePath: "/dashboard" | "/wiki", tag: string): string {
  const normalized = normalizeTag(tag);
  if (!normalized) {
    return basePath;
  }
  const params = new URLSearchParams({ tag: normalized });
  return `${basePath}?${params.toString()}`;
}
