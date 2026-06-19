import DragIndicatorIcon from "@mui/icons-material/DragIndicator";
import Chip from "@mui/material/Chip";
import Typography from "@mui/material/Typography";
import { useState, type DragEvent } from "react";

import type { LessonSlide } from "../../../types/lesson";

const PLACEHOLDER_SLIDE = "/content/placeholder-slide.svg";

type SlideReorderListProps = {
  slides: LessonSlide[];
  activeSlideId: string | null;
  disabled?: boolean;
  onSelect: (slideId: string) => void;
  onReorder: (slideIds: string[]) => void;
};

export default function SlideReorderList({
  slides,
  activeSlideId,
  disabled = false,
  onSelect,
  onReorder,
}: SlideReorderListProps) {
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [overIndex, setOverIndex] = useState<number | null>(null);

  function handleDragStart(index: number, event: DragEvent) {
    if (disabled) {
      event.preventDefault();
      return;
    }
    setDragIndex(index);
    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData("text/plain", String(index));
  }

  function handleDragOver(index: number, event: DragEvent) {
    event.preventDefault();
    if (dragIndex === null || dragIndex === index) {
      return;
    }
    setOverIndex(index);
  }

  function handleDrop(index: number, event: DragEvent) {
    event.preventDefault();
    if (dragIndex === null || dragIndex === index) {
      setDragIndex(null);
      setOverIndex(null);
      return;
    }
    const ids = slides.map((slide) => slide.id);
    const [moved] = ids.splice(dragIndex, 1);
    ids.splice(index, 0, moved);
    onReorder(ids);
    setDragIndex(null);
    setOverIndex(null);
  }

  function handleDragEnd() {
    setDragIndex(null);
    setOverIndex(null);
  }

  if (slides.length < 2) {
    return null;
  }

  return (
    <ul className="author-slide-reorder" aria-label="Пользовательский порядок слайдов">
      {slides.map((slide, index) => {
        const isActive = slide.id === activeSlideId;
        const isDragging = dragIndex === index;
        const isOver = overIndex === index && dragIndex !== index;
        const hotspotCount = slide.hotspots?.length ?? 0;
        const thumbSrc = slide.image_path?.trim() || PLACEHOLDER_SLIDE;

        return (
          <li
            key={slide.id}
            className={`author-slide-reorder-item${isActive ? " author-slide-reorder-item-active" : ""}${isDragging ? " author-slide-reorder-item-dragging" : ""}${isOver ? " author-slide-reorder-item-over" : ""}`}
            draggable={!disabled}
            onDragStart={(event) => handleDragStart(index, event)}
            onDragOver={(event) => handleDragOver(index, event)}
            onDrop={(event) => handleDrop(index, event)}
            onDragEnd={handleDragEnd}
          >
            <span className="author-slide-reorder-handle" aria-hidden="true">
              <DragIndicatorIcon fontSize="small" />
            </span>
            <img
              src={thumbSrc}
              alt=""
              className="author-slide-reorder-thumb"
              loading="lazy"
            />
            <button
              type="button"
              className="author-slide-reorder-label"
              disabled={disabled}
              onClick={() => onSelect(slide.id)}
            >
              <Typography variant="body2" component="span">
                {slide.order}. {slide.title}
              </Typography>
            </button>
            {hotspotCount > 0 && (
              <Chip
                size="small"
                label={hotspotCount}
                className="author-slide-reorder-hotspot-badge"
                title={`Зон на слайде: ${hotspotCount}`}
              />
            )}
          </li>
        );
      })}
    </ul>
  );
}
