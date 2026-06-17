import type { LessonSlide } from "../api/learnApi";
import ScreenshotGuide from "./ScreenshotGuide";

type SlideCarouselProps = {
  slides: LessonSlide[];
  currentIndex: number;
  onChange: (index: number) => void;
  activeHotspotId?: string | null;
  onHotspotSelect?: (hotspotId: string | null) => void;
};

export default function SlideCarousel({
  slides,
  currentIndex,
  onChange,
  activeHotspotId,
  onHotspotSelect,
}: SlideCarouselProps) {
  if (slides.length === 0) {
    return (
      <div className="slide-empty">
        <p>Для этого урока нет иллюстраций — перейдите к действиям ниже.</p>
      </div>
    );
  }

  const slide = slides[currentIndex];
  const total = slides.length;

  return (
    <section className="slide-carousel">
      <div className="slide-carousel-header">
        <span>
          Слайд {currentIndex + 1} из {total}
        </span>
        <strong>{slide.title}</strong>
      </div>

      <ScreenshotGuide
        imagePath={slide.image_path}
        alt={slide.title}
        hotspots={slide.hotspots}
        viewportResetKey={slide.id}
        activeHotspotId={activeHotspotId}
        onHotspotSelect={onHotspotSelect}
      />

      {total > 1 && (
        <div className="slide-nav">
          <button
            type="button"
            className="secondary"
            disabled={currentIndex === 0}
            onClick={() => onChange(currentIndex - 1)}
          >
            Назад
          </button>
          <div className="slide-dots">
            {slides.map((item, index) => (
              <button
                key={item.id}
                type="button"
                className={`slide-dot ${index === currentIndex ? "active" : ""}`}
                aria-label={`Слайд ${index + 1}`}
                onClick={() => onChange(index)}
              />
            ))}
          </div>
          <button
            type="button"
            className="secondary"
            disabled={currentIndex >= total - 1}
            onClick={() => onChange(currentIndex + 1)}
          >
            Далее
          </button>
        </div>
      )}
    </section>
  );
}
