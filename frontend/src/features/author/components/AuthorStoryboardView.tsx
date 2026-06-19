import Typography from "@mui/material/Typography";

import type { AuthorLessonDetail } from "../../../api/authorApi";

function stripHtmlToText(html: string): string {
  return html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

type AuthorStoryboardViewProps = {
  lesson: AuthorLessonDetail;
  activeSlideId: string | null;
  onSelectSlide: (slideId: string) => void;
};

export default function AuthorStoryboardView({
  lesson,
  activeSlideId,
  onSelectSlide,
}: AuthorStoryboardViewProps) {
  if (lesson.slides.length === 0) {
    return (
      <Typography variant="body2" color="text.secondary" className="author-storyboard-empty">
        Нет слайдов для раскадровки.
      </Typography>
    );
  }

  return (
    <div className="author-storyboard-grid" role="list" aria-label="Раскадровка слайдов">
      {lesson.slides.map((slide, index) => {
        const captionPreview = stripHtmlToText(slide.caption_html).trim();
        const isActive = slide.id === activeSlideId;
        return (
          <button
            key={slide.id}
            type="button"
            role="listitem"
            className={`author-storyboard-card${isActive ? " author-storyboard-card--active" : ""}`}
            onClick={() => onSelectSlide(slide.id)}
          >
            <span className="author-storyboard-order">{index + 1}</span>
            <img
              src={slide.image_path}
              alt=""
              className="author-storyboard-thumb"
              loading="lazy"
            />
            <Typography variant="caption" component="span" className="author-storyboard-title">
              {slide.title}
            </Typography>
            <Typography variant="caption" color="text.secondary" className="author-storyboard-caption">
              {captionPreview || "Без подписи"}
            </Typography>
          </button>
        );
      })}
    </div>
  );
}
