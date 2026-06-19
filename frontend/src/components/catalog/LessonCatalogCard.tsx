import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import Card from "@mui/material/Card";
import CardActionArea from "@mui/material/CardActionArea";
import Chip from "@mui/material/Chip";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { type MouseEvent, type ReactNode } from "react";
import { Link } from "react-router-dom";

import type { LessonListItem } from "../../types/lesson";
import { lessonStatusLabel, slideCountLabel } from "../../utils/lessonUi";
import HashtagList from "../HashtagList";

const CARD_THEMES = [
  { bg: "var(--color-bg-soft)", accent: "var(--color-typo-caution)", icon: "login" },
  { bg: "var(--color-bg-success)", accent: "var(--color-typo-success)", icon: "project" },
  { bg: "var(--color-bg-alert)", accent: "var(--color-typo-alert)", icon: "map" },
  { bg: "var(--color-bg-link)", accent: "var(--color-typo-link)", icon: "journal" },
  { bg: "var(--color-bg-warning)", accent: "var(--color-typo-warning)", icon: "quiz" },
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

function statusChipProps(status: LessonListItem["status"]) {
  switch (status) {
    case "active":
      return { color: "primary" as const, variant: "filled" as const };
    case "completed":
      return { color: "success" as const, variant: "filled" as const };
    case "locked":
      return { color: "default" as const, variant: "outlined" as const };
    case "not_started":
      return { color: "default" as const, variant: "outlined" as const };
  }
}

type LessonCatalogCardProps = {
  lesson: LessonListItem;
  moduleTitle?: string;
  activeTag?: string | null;
  onTagClick?: (tag: string, event: MouseEvent) => void;
};

function LessonCardBody({
  lesson,
  moduleTitle,
  activeTag,
  onTagClick,
  theme,
}: {
  lesson: LessonListItem;
  moduleTitle?: string;
  activeTag?: string | null;
  onTagClick?: (tag: string, event: MouseEvent) => void;
  theme: (typeof CARD_THEMES)[number];
}) {
  const statusChip = statusChipProps(lesson.status);

  return (
    <>
      <div className="catalog-card-content">
        <Stack spacing={0.75}>
          {moduleTitle && (
            <Typography variant="caption" color="text.secondary" className="catalog-card-label">
              {moduleTitle}
            </Typography>
          )}
          <Typography variant="h6" fontWeight={700} component="h3" className="catalog-card-title">
            {lesson.title}
          </Typography>
          <Stack direction="row" flexWrap="wrap" gap={0.5} useFlexGap alignItems="center">
            <Chip
              size="small"
              label={lessonStatusLabel(lesson.status)}
              icon={lesson.status === "locked" ? <LockOutlinedIcon /> : undefined}
              {...statusChip}
            />
            <Typography variant="caption" color="text.secondary" className="catalog-card-meta">
              {slideCountLabel(lesson.slide_count)}
            </Typography>
          </Stack>
          {(lesson.tags?.length ?? 0) > 0 && (
            <HashtagList
              tags={lesson.tags ?? []}
              activeTag={activeTag}
              onTagClick={onTagClick}
              className="catalog-card-tags"
            />
          )}
        </Stack>
      </div>
      <div className="catalog-card-visual" style={{ color: theme.accent }}>
        <CardIllustration type={theme.icon} />
      </div>
    </>
  );
}

function LessonCardInner({ children }: { children: ReactNode }) {
  return <div className="catalog-card-inner">{children}</div>;
}

function LessonCardShell({
  locked,
  backgroundColor,
  children,
  linkTo,
}: {
  locked: boolean;
  backgroundColor: string;
  children: ReactNode;
  linkTo?: string;
}) {
  const inner = <LessonCardInner>{children}</LessonCardInner>;

  if (locked) {
    return (
      <Card
        component="article"
        variant="outlined"
        className="catalog-card catalog-card-locked"
        style={{ backgroundColor }}
        title="Сначала завершите предыдущий урок"
      >
        {inner}
      </Card>
    );
  }

  return (
    <Card variant="outlined" className="catalog-card catalog-card-link" style={{ backgroundColor }}>
      <CardActionArea
        component={Link}
        to={linkTo!}
        className="catalog-card-action"
        disableRipple
        sx={{ p: 0, height: "100%", display: "block" }}
      >
        {inner}
      </CardActionArea>
    </Card>
  );
}

export default function LessonCatalogCard({
  lesson,
  moduleTitle,
  activeTag,
  onTagClick,
}: LessonCatalogCardProps) {
  const theme = CARD_THEMES[(lesson.order - 1) % CARD_THEMES.length];
  const locked = lesson.status === "locked";

  return (
    <LessonCardShell
      locked={locked}
      backgroundColor={theme.bg}
      linkTo={locked ? undefined : `/lessons/${lesson.id}`}
    >
      <LessonCardBody
        lesson={lesson}
        moduleTitle={moduleTitle}
        activeTag={activeTag}
        onTagClick={onTagClick}
        theme={theme}
      />
    </LessonCardShell>
  );
}
