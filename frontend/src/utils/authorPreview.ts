/** URL предпросмотра урока в новой вкладке. */
export function authorLessonPreviewUrl(lessonId: string, options?: { draft?: boolean }): string {
  const params = new URLSearchParams({ preview: "1" });
  if (options?.draft !== false) {
    params.set("draft", "1");
  }
  return `/lessons/${lessonId}?${params.toString()}`;
}

export function draftSaveMessage(base: string, hasUnpublishedChanges?: boolean): string {
  if (hasUnpublishedChanges) {
    return `${base}. Опубликуйте, чтобы ученики увидели изменения`;
  }
  return base;
}
