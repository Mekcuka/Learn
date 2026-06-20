/** URL предпросмотра опубликованного урока для ученика в новой вкладке. */
export function authorLessonPreviewUrl(lessonId: string): string {
  return `/lessons/${lessonId}?preview=1`;
}

export function draftSaveMessage(base: string, hasUnpublishedChanges?: boolean): string {
  if (hasUnpublishedChanges) {
    return `${base}. Опубликуйте, чтобы ученики увидели изменения`;
  }
  return base;
}
