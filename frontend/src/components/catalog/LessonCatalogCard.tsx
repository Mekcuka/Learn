import { type MouseEvent } from "react";
import { Link } from "react-router-dom";

import type { LessonListItem } from "../../api/learnApi";
import HashtagList from "../HashtagList";

const CARD_THEMES = [
  { bg: "#f3e8d8", accent: "#c4a574", icon: "login" },
  { bg: "#d8f3e8", accent: "#5cb88a", icon: "project" },
  { bg: "#fde8f0", accent: "#e879a9", icon: "map" },
  { bg: "#e8eefd", accent: "#6b8cff", icon: "journal" },
  { bg: "#fef6dc", accent: "#d4a017", icon: "quiz" },
] as const;

function CardIllustration({ type }: { type: (typeof CARD_THEMES)[number]["icon"] }) {
  switch (type) {
    case "login":
      return (
        <svg viewBox="0 0 120 120" className="catalog-card-art" aria-hidden="true">
          <rect x="20" y="30" width="80" height="60" rx="8" fill="currentColor" opacity="0.25" />
          <circle cx="60" cy="52" r="12" fill="currentColor" opacity="0.5" />
          <rect x="40" y="72" width="40" height="6" rx="3" fill="currentColor" opacity="0.4" />
        </svg>
      );
    case "project":
      return (
        <svg viewBox="0 0 120 120" className="catalog-card-art" aria-hidden="true">
          <path d="M30 85 L60 25 L90 85 Z" fill="currentColor" opacity="0.3" />
          <rect x="45" y="55" width="30" height="30" rx="4" fill="currentColor" opacity="0.5" />
        </svg>
      );
    case "map":
      return (
        <svg viewBox="0 0 120 120" className="catalog-card-art" aria-hidden="true">
          <circle cx="60" cy="60" r="35" fill="none" stroke="currentColor" strokeWidth="6" opacity="0.35" />
          <circle cx="60" cy="60" r="8" fill="currentColor" opacity="0.55" />
        </svg>
      );
    case "journal":
      return (
        <svg viewBox="0 0 120 120" className="catalog-card-art" aria-hidden="true">
          <rect x="35" y="25" width="50" height="70" rx="6" fill="currentColor" opacity="0.3" />
          <rect x="45" y="40" width="30" height="4" rx="2" fill="currentColor" opacity="0.5" />
          <rect x="45" y="52" width="24" height="4" rx="2" fill="currentColor" opacity="0.4" />
          <rect x="45" y="64" width="28" height="4" rx="2" fill="currentColor" opacity="0.4" />
        </svg>
      );
    default:
      return (
        <svg viewBox="0 0 120 120" className="catalog-card-art" aria-hidden="true">
          <rect x="25" y="35" width="70" height="50" rx="8" fill="currentColor" opacity="0.3" />
          <text x="60" y="68" textAnchor="middle" fontSize="28" fill="currentColor" opacity="0.6">
            ?
          </text>
        </svg>
      );
  }
}

type LessonCatalogCardProps = {
  lesson: LessonListItem;
  moduleTitle: string;
  activeTag?: string | null;
  onTagClick?: (tag: string, event: MouseEvent) => void;
};

export default function LessonCatalogCard({
  lesson,
  moduleTitle,
  activeTag,
  onTagClick,
}: LessonCatalogCardProps) {
  const theme = CARD_THEMES[(lesson.order - 1) % CARD_THEMES.length];
  const locked = lesson.status === "locked";
  const completed = lesson.status === "completed";

  const content = (
    <>
      <div className="catalog-card-content">
        <span className="catalog-card-label">{moduleTitle}</span>
        <h3 className="catalog-card-title">{lesson.title}</h3>
        {(lesson.tags?.length ?? 0) > 0 && (
          <HashtagList
            tags={lesson.tags ?? []}
            activeTag={activeTag}
            onTagClick={onTagClick}
            className="catalog-card-tags"
          />
        )}
        <p className="catalog-card-meta">
          {lesson.slide_count > 0 ? `${lesson.slide_count} слайда` : "Теория"}
          {completed && <span className="catalog-card-done"> · Пройден</span>}
        </p>
      </div>
      <div className="catalog-card-visual" style={{ color: theme.accent }}>
        <CardIllustration type={theme.icon} />
      </div>
      {lesson.status === "active" && <span className="catalog-card-badge">Текущий</span>}
      {locked && <span className="catalog-card-lock" title="Сначала завершите предыдущий урок" />}
    </>
  );

  if (locked) {
    return (
      <article
        className="catalog-card catalog-card-locked"
        style={{ backgroundColor: theme.bg }}
        title="Сначала завершите предыдущий урок"
      >
        {content}
      </article>
    );
  }

  return (
    <Link
      to={`/lessons/${lesson.id}`}
      className="catalog-card catalog-card-link"
      style={{ backgroundColor: theme.bg }}
    >
      {content}
    </Link>
  );
}
