import { useCallback, useLayoutEffect, useState, type RefObject } from "react";

import { getObjectFitContainRect, type ImageContentRect } from "../utils/imageContentRect";

type UseImageContentRectOptions = {
  resetKey?: string;
  /** Expected `src` — guards against stale `image.complete` after src swap. */
  imageSrc?: string;
};

const MAX_LAYOUT_RETRIES = 30;

export function imageMatchesSrc(image: HTMLImageElement, expectedSrc: string | undefined): boolean {
  if (!expectedSrc) {
    return true;
  }

  if (image.getAttribute("src") !== expectedSrc) {
    return false;
  }

  if (!image.currentSrc) {
    return true;
  }

  if (image.currentSrc.endsWith(expectedSrc)) {
    return true;
  }

  try {
    return image.currentSrc === new URL(expectedSrc, window.location.href).href;
  } catch {
    return false;
  }
}

export function computeImageContentRect(
  container: HTMLElement,
  image: HTMLImageElement,
  expectedSrc?: string,
): ImageContentRect | null {
  if (!imageMatchesSrc(image, expectedSrc)) {
    return null;
  }

  const { clientWidth, clientHeight } = container;
  const { naturalWidth, naturalHeight } = image;
  if (clientWidth <= 0 || clientHeight <= 0 || naturalWidth <= 0 || naturalHeight <= 0) {
    return null;
  }

  return getObjectFitContainRect(clientWidth, clientHeight, naturalWidth, naturalHeight);
}

export function useImageContentRect(
  containerRef: RefObject<HTMLElement | null>,
  imageRef: RefObject<HTMLImageElement | null>,
  { resetKey, imageSrc }: UseImageContentRectOptions = {},
) {
  const [contentRect, setContentRect] = useState<ImageContentRect | null>(null);

  const measure = useCallback((): boolean => {
    const container = containerRef.current;
    const image = imageRef.current;
    if (!container || !image) {
      setContentRect(null);
      return false;
    }

    const rect = computeImageContentRect(container, image, imageSrc);
    if (!rect) {
      setContentRect(null);
      return false;
    }

    setContentRect(rect);
    return true;
  }, [containerRef, imageRef, imageSrc]);

  useLayoutEffect(() => {
    setContentRect(null);

    let cancelled = false;
    let rafId = 0;
    let rafAttempts = 0;

    const tryMeasure = (): boolean => {
      if (cancelled) {
        return false;
      }
      return measure();
    };

    const scheduleLayoutRetries = () => {
      if (rafId || cancelled) {
        return;
      }

      const tick = () => {
        rafId = 0;
        if (cancelled) {
          return;
        }
        if (tryMeasure()) {
          return;
        }
        if (rafAttempts >= MAX_LAYOUT_RETRIES) {
          return;
        }
        rafAttempts += 1;
        rafId = requestAnimationFrame(tick);
      };

      rafId = requestAnimationFrame(tick);
    };

    const onImageReady = () => {
      if (!tryMeasure()) {
        scheduleLayoutRetries();
      }
    };

    const tryDecode = (image: HTMLImageElement) => {
      if (!imageMatchesSrc(image, imageSrc)) {
        return;
      }
      if (!image.complete) {
        return;
      }
      onImageReady();
      if (typeof image.decode === "function") {
        void image.decode().then(onImageReady).catch(() => undefined);
      }
    };

    tryMeasure();
    scheduleLayoutRetries();

    const container = containerRef.current;
    const image = imageRef.current;
    if (!container || !image) {
      return () => {
        cancelled = true;
        if (rafId) {
          cancelAnimationFrame(rafId);
        }
      };
    }

    const resizeObserver =
      typeof ResizeObserver !== "undefined" ? new ResizeObserver(onImageReady) : null;
    resizeObserver?.observe(container);
    resizeObserver?.observe(image);

    image.addEventListener("load", onImageReady);
    image.addEventListener("error", onImageReady);
    window.addEventListener("resize", onImageReady);

    tryDecode(image);

    return () => {
      cancelled = true;
      if (rafId) {
        cancelAnimationFrame(rafId);
      }
      resizeObserver?.disconnect();
      image.removeEventListener("load", onImageReady);
      image.removeEventListener("error", onImageReady);
      window.removeEventListener("resize", onImageReady);
    };
  }, [containerRef, imageRef, imageSrc, measure, resetKey]);

  return contentRect;
}
