import { useCallback, useEffect, useRef, useState } from "react";

import { updateAuthorSlide, type AuthorSlideUpdateResponse } from "../../../api/authorApi";
import type { LessonSlide } from "../../../types/lesson";
import { LearnApiError } from "../../../api/learnApi";

function slideSnapshot(slide: LessonSlide): string {
  return JSON.stringify({
    title: slide.title,
    caption_html: slide.caption_html,
    expected_result_html: slide.expected_result_html,
    image_path: slide.image_path,
    hotspots: slide.hotspots,
  });
}

/** @internal exported for unit tests */
export function isSlideDirty(slide: LessonSlide, baseline: string | null): boolean {
  if (!baseline) {
    return false;
  }
  return slideSnapshot(slide) !== baseline;
}

type UseAuthorSlideAutosaveOptions = {
  slide: LessonSlide | null;
  lessonId: string;
  debounceMs?: number;
  enabled?: boolean;
  onSaved: (slide: LessonSlide, hasUnpublishedChanges: boolean) => void;
  onError: (message: string) => void;
};

export function useAuthorSlideAutosave({
  slide,
  lessonId: _lessonId,
  debounceMs = 2000,
  enabled = true,
  onSaved,
  onError,
}: UseAuthorSlideAutosaveOptions) {
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const baselineRef = useRef<string | null>(null);
  const slideRef = useRef(slide);
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const onSavedRef = useRef(onSaved);
  const onErrorRef = useRef(onError);

  slideRef.current = slide;
  onSavedRef.current = onSaved;
  onErrorRef.current = onError;

  useEffect(() => {
    if (!slide) {
      baselineRef.current = null;
      setDirty(false);
      return;
    }
    baselineRef.current = slideSnapshot(slide);
    setDirty(false);
  }, [slide?.id]);

  useEffect(() => {
    if (!slide || !enabled) {
      setDirty(false);
      return;
    }
    const isDirty = slideSnapshot(slide) !== baselineRef.current;
    setDirty(isDirty);
  }, [slide, enabled]);

  const flush = useCallback(async (): Promise<AuthorSlideUpdateResponse | undefined> => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = null;
    }

    const current = slideRef.current;
    if (!current || !enabled) {
      return undefined;
    }

    if (slideSnapshot(current) === baselineRef.current) {
      setDirty(false);
      return undefined;
    }

    setSaving(true);
    try {
      const updated = await updateAuthorSlide(current.id, {
        title: current.title,
        caption_html: current.caption_html,
        expected_result_html: current.expected_result_html,
        image_path: current.image_path,
        hotspots: current.hotspots,
      });
      baselineRef.current = slideSnapshot(updated.slide);
      setDirty(false);
      onSavedRef.current(updated.slide, updated.has_unpublished_changes);
      return updated;
    } catch (err) {
      onErrorRef.current(
        err instanceof LearnApiError ? err.message : "Не удалось автосохранить слайд",
      );
      return undefined;
    } finally {
      setSaving(false);
    }
  }, [enabled]);

  const markClean = useCallback((savedSlide: LessonSlide) => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = null;
    }
    baselineRef.current = slideSnapshot(savedSlide);
    setDirty(false);
  }, []);

  useEffect(() => {
    if (!dirty || !enabled || !slide) {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
        debounceTimerRef.current = null;
      }
      return;
    }

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    debounceTimerRef.current = setTimeout(() => {
      debounceTimerRef.current = null;
      void flush();
    }, debounceMs);

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
        debounceTimerRef.current = null;
      }
    };
  }, [dirty, enabled, slide, debounceMs, flush]);

  useEffect(() => {
    if (!dirty) {
      return;
    }
    function handleBeforeUnload(event: BeforeUnloadEvent) {
      event.preventDefault();
      event.returnValue = "";
    }
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [dirty]);

  return { dirty, saving, flush, markClean };
}
