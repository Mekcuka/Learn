import Button from "@mui/material/Button";
import IconButton from "@mui/material/IconButton";
import Typography from "@mui/material/Typography";
import { useCallback, useEffect, useState, type ReactNode } from "react";

import type { LessonSlide } from "../../../types/lesson";
import ScreenshotGuide from "./ScreenshotGuide";
import ScreenshotToolbar, { type ScreenshotToolbarProps } from "../../author/components/ScreenshotToolbar";

type SlideCarouselProps = {
  slides: LessonSlide[];
  currentIndex: number;
  onChange: (index: number) => void;
  activeHotspotId?: string | null;
  onHotspotSelect?: (hotspotId: string | null) => void;
  /** When true, «Далее» on the last slide opens the quiz step. */
  hasTrailingQuiz?: boolean;
  /** Replaces slide screenshot when on the trailing quiz step. */
  children?: ReactNode;
};

export default function SlideCarousel({
  slides,
  currentIndex,
  onChange,
  activeHotspotId,
  onHotspotSelect,
  hasTrailingQuiz = false,
  children,
}: SlideCarouselProps) {
  const total = slides.length;
  const maxIndex = hasTrailingQuiz ? total : total - 1;
  const isOnQuizStep = hasTrailingQuiz && currentIndex >= total;
  const [toolbarProps, setToolbarProps] = useState<ScreenshotToolbarProps | null>(null);

  const handleToolbarPropsChange = useCallback((props: ScreenshotToolbarProps) => {
    setToolbarProps(props);
  }, []);

  const goTo = useCallback(
    (index: number) => {
      onChange(Math.max(0, Math.min(index, maxIndex)));
    },
    [maxIndex, onChange],
  );

  useEffect(() => {
    if (isOnQuizStep) {
      return;
    }
    const nextSlide = slides[currentIndex + 1];
    if (!nextSlide?.image_path) {
      return;
    }
    const link = document.createElement("link");
    link.rel = "prefetch";
    link.as = "image";
    link.href = nextSlide.image_path;
    document.head.appendChild(link);
    return () => {
      link.remove();
    };
  }, [currentIndex, isOnQuizStep, slides]);

  useEffect(() => {
    function isEditableTarget(target: EventTarget | null): boolean {
      if (!(target instanceof HTMLElement)) {
        return false;
      }
      const tag = target.tagName;
      return tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || target.isContentEditable;
    }

    function onKeyDown(event: KeyboardEvent) {
      if (isEditableTarget(event.target) || (total <= 1 && !hasTrailingQuiz)) {
        return;
      }
      if (event.key === "ArrowLeft") {
        event.preventDefault();
        goTo(currentIndex - 1);
      }
      if (event.key === "ArrowRight") {
        event.preventDefault();
        goTo(currentIndex + 1);
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [currentIndex, goTo, hasTrailingQuiz, total]);

  if (slides.length === 0) {
    return (
      <div className="slide-empty">
        <Typography color="text.secondary">
          Для этого урока нет иллюстраций — перейдите к действиям выше.
        </Typography>
      </div>
    );
  }

  const slide = isOnQuizStep ? null : slides[currentIndex];
  if (!slide && !isOnQuizStep) {
    return (
      <div className="slide-empty">
        <Typography color="text.secondary">Слайд не найден.</Typography>
      </div>
    );
  }

  const progressLabel = isOnQuizStep ? "Квиз" : `Слайд ${currentIndex + 1} из ${total}`;
  const titleLabel = isOnQuizStep ? "Квиз" : slide!.title;

  return (
    <section className="slide-carousel" aria-label="Слайды урока">
      <div className="slide-context-strip">
        <Typography
          variant="overline"
          color="primary"
          fontWeight="bold"
          className="slide-context-progress"
        >
          {progressLabel}
        </Typography>
        <Typography variant="body2" fontWeight={600} className="slide-context-title">
          {titleLabel}
        </Typography>
      </div>

      <div className="slide-carousel-header">
        <Typography variant="body2" color="text.secondary">
          {progressLabel}
        </Typography>
        <Typography variant="body2" fontWeight={600}>
          {titleLabel}
        </Typography>
      </div>

      {isOnQuizStep ? (
        children ?? (
          <div className="slide-empty">
            <Typography color="text.secondary">Содержимое квиза недоступно.</Typography>
          </div>
        )
      ) : (
        <ScreenshotGuide
          imagePath={slide!.image_path}
          alt={slide!.title}
          hotspots={slide!.hotspots}
          viewportResetKey={slide!.id}
          activeHotspotId={activeHotspotId}
          onHotspotSelect={onHotspotSelect}
          hideToolbar
          enableToolbarFullscreen={false}
          onToolbarPropsChange={handleToolbarPropsChange}
        />
      )}

      <nav className="slide-nav" aria-label="Навигация по слайдам и просмотр">
        <div className="slide-nav-toolbar">
          {!isOnQuizStep && toolbarProps ? (
            <ScreenshotToolbar {...toolbarProps} showZoomControls={false} showFullscreen={false} />
          ) : null}
        </div>

        {total > 1 || hasTrailingQuiz ? (
          <div className="slide-nav-controls">
            <Button
              type="button"
              className="slide-nav-btn"
              variant="outlined"
              size="small"
              disabled={currentIndex === 0}
              aria-label="Предыдущий слайд"
              onClick={() => goTo(currentIndex - 1)}
            >
              Назад
            </Button>
            <div className="slide-nav-center">
              <div className="slide-dots-pill">
                <Typography variant="caption" color="text.secondary" className="slide-nav-counter">
                  {hasTrailingQuiz && currentIndex >= total
                    ? "Квиз"
                    : `${currentIndex + 1} / ${total}${hasTrailingQuiz ? "+" : ""}`}
                </Typography>
                <div
                  className={`slide-dots${total <= 6 ? " slide-dots--connected" : ""}`}
                  role="tablist"
                  aria-label="Слайды"
                >
                  {slides.map((item, index) => (
                    <IconButton
                      key={item.id}
                      type="button"
                      size="small"
                      disableRipple
                      className={`slide-dot ${index === currentIndex ? "active" : ""}`}
                      aria-label={`Слайд ${index + 1}: ${item.title}`}
                      aria-selected={index === currentIndex}
                      role="tab"
                      onClick={() => goTo(index)}
                    >
                      <span className="slide-dot-sr">{index + 1}</span>
                    </IconButton>
                  ))}
                  {hasTrailingQuiz && (
                    <IconButton
                      type="button"
                      size="small"
                      disableRipple
                      className={`slide-dot slide-dot--quiz ${currentIndex >= total ? "active" : ""}`}
                      aria-label="Квиз"
                      aria-selected={currentIndex >= total}
                      role="tab"
                      onClick={() => goTo(total)}
                    >
                      <span className="slide-dot-sr">К</span>
                    </IconButton>
                  )}
                </div>
              </div>
            </div>
            <Button
              type="button"
              className="slide-nav-btn"
              variant="outlined"
              size="small"
              disabled={currentIndex >= maxIndex}
              aria-label={currentIndex >= total - 1 && hasTrailingQuiz ? "Перейти к квизу" : "Следующий слайд"}
              onClick={() => goTo(currentIndex + 1)}
            >
              {currentIndex >= total - 1 && hasTrailingQuiz ? "К квизу" : "Далее"}
            </Button>
          </div>
        ) : (
          <div className="slide-nav-controls slide-nav-controls--solo" aria-hidden="true" />
        )}

        <div className="slide-nav-end" aria-hidden="true" />
      </nav>
    </section>
  );
}
