import Accordion from "@mui/material/Accordion";
import AccordionDetails from "@mui/material/AccordionDetails";
import AccordionSummary from "@mui/material/AccordionSummary";
import Typography from "@mui/material/Typography";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import { type ReactNode, useState } from "react";
import type { LessonDetail, LessonSlide, LessonStateItem, VerifyResult } from "../../../types/lesson";
import LessonActions from "./LessonActions";
import LessonHtml from "./LessonHtml";

type LessonReferencePanelProps = {
  lesson: LessonDetail;
  slide: LessonSlide | null;
  slideIndex: number;
  slideTotal: number;
  lessonState?: LessonStateItem;
  busy?: boolean;
  feedback?: VerifyResult | null;
  isPreview?: boolean;
  onVerify?: () => void;
};

type ReferenceSectionProps = {
  title: string;
  children: ReactNode;
  className?: string;
  variant?: "default" | "primary";
  collapsible?: boolean;
  defaultOpen?: boolean;
};

function ReferenceSection({
  title,
  children,
  className,
  variant = "default",
  collapsible = false,
  defaultOpen = true,
}: ReferenceSectionProps) {
  const sectionClass = [
    "lesson-ref-section",
    variant === "primary" ? "lesson-ref-section--primary" : "",
    collapsible ? "lesson-ref-section--collapsible" : "",
    className ?? "",
  ]
    .filter(Boolean)
    .join(" ");

  const [isOpen, setIsOpen] = useState(defaultOpen);

  const titleEl = (
    <Typography
      variant="overline"
      color="text.primary"
      fontWeight="bold"
      className="lesson-ref-section-title"
    >
      {title}
    </Typography>
  );

  if (collapsible) {
    return (
      <section className={sectionClass}>
        <Accordion
          expanded={isOpen}
          onChange={(_, expanded) => setIsOpen(expanded)}
          disableGutters
          elevation={0}
          className="lesson-ref-accordion"
        >
          <AccordionSummary expandIcon={<ExpandMoreIcon fontSize="small" />}>{titleEl}</AccordionSummary>
          <AccordionDetails>
            <div className="lesson-ref-section-content">{children}</div>
          </AccordionDetails>
        </Accordion>
      </section>
    );
  }

  return (
    <section className={sectionClass}>
      <Typography
        variant="overline"
        color="text.primary"
        fontWeight="bold"
        component="h3"
        className="lesson-ref-section-title"
      >
        {title}
      </Typography>
      <div className="lesson-ref-section-content">{children}</div>
    </section>
  );
}

export default function LessonReferencePanel({
  lesson,
  slide,
  slideIndex,
  slideTotal,
  lessonState,
  busy = false,
  feedback = null,
  isPreview = false,
  onVerify,
}: LessonReferencePanelProps) {
  const isQuizLesson = lesson.verify.type === "quiz_passed";
  const showAssignment = !isQuizLesson && Boolean(onVerify);
  const hasCaption = Boolean(slide?.caption_html?.trim());
  const hasQuizRef = isQuizLesson && Boolean(lesson.quiz);
  const hasSlideContext = Boolean(slide && slideTotal > 0);
  const hasPrimaryContent = showAssignment || hasCaption || hasQuizRef;

  return (
    <aside className="lesson-reference-panel" aria-label="Справка по уроку">
      <div className="lesson-panel-header">
        <Typography
          variant="overline"
          color="primary"
          fontWeight="bold"
          className="lesson-panel-header-title"
        >
          Справка
        </Typography>
        {hasSlideContext && (
          <Typography variant="overline" color="text.secondary" className="lesson-panel-header-meta">
            Слайд {slideIndex + 1}/{slideTotal}
          </Typography>
        )}
      </div>

      {hasSlideContext && (
        <div className="lesson-ref-slide-bar">
          <Typography variant="body2" fontWeight={600} className="lesson-ref-slide-title">
            {slide!.title}
          </Typography>
        </div>
      )}

      {!hasPrimaryContent && (
        <div className="lesson-ref-empty">
          <Typography variant="body2" color="text.secondary">
            Для этого слайда нет дополнительной справки.
          </Typography>
        </div>
      )}

      {showAssignment && (
        <LessonActions
          lesson={lesson}
          slide={slide}
          lessonState={lessonState}
          busy={busy}
          feedback={feedback}
          isPreview={isPreview}
          onVerify={onVerify!}
        />
      )}

      {hasCaption && (
        <ReferenceSection title="Подсказка к слайду" collapsible defaultOpen={false}>
          <LessonHtml html={slide!.caption_html} className="lesson-ref-body" />
        </ReferenceSection>
      )}

      {hasQuizRef && (
        <ReferenceSection title="Квиз" collapsible defaultOpen>
          <Typography variant="body2" className="lesson-ref-body">
            Ответьте на {lesson.quiz!.questions.length} вопросов. Для зачёта нужно{" "}
            {lesson.quiz!.pass_threshold_percent}% правильных ответов.
          </Typography>
        </ReferenceSection>
      )}
    </aside>
  );
}
