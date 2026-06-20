import Typography from "@mui/material/Typography";

import { Link } from "react-router-dom";

import type { LessonDetail, LessonSlide, LessonStateItem, VerifyResult } from "../../../types/lesson";

import ExpectedResult from "./ExpectedResult";
import ContentHtml from "../../wiki/components/ContentHtml";

type LessonActionsProps = {
  lesson: LessonDetail;
  slide: LessonSlide | null;
  lessonState: LessonStateItem | undefined;
  feedback: VerifyResult | null;
};

export default function LessonActions({
  lesson,
  slide,
  lessonState,
  feedback,
}: LessonActionsProps) {
  const isCompleted = lessonState?.status === "completed";
  const hasInstruction = Boolean(lesson.instruction_html?.trim());
  const hasExpected = Boolean(slide?.expected_result_html?.trim());

  if (isCompleted) {
    return null;
  }

  if (!hasInstruction && !hasExpected && !feedback) {
    return null;
  }

  const feedbackColor =
    feedback?.status === "passed"
      ? "success.main"
      : feedback?.status === "failed"
        ? "error.main"
        : "warning.main";

  return (
    <>
      {hasInstruction && (
        <section
          className="lesson-ref-section lesson-ref-section--primary lesson-actions-assignment"
          aria-label="Задание"
          aria-live="polite"
        >
          <Typography
            variant="overline"
            color="text.primary"
            fontWeight="bold"
            component="h3"
            className="lesson-ref-section-title"
          >
            Задание
          </Typography>
          <div className="lesson-ref-section-content">
            <ContentHtml html={lesson.instruction_html} className="lesson-ref-body" />
          </div>
        </section>
      )}

      {hasExpected && slide && <ExpectedResult html={slide.expected_result_html} />}

      {feedback && (
        <section className="lesson-ref-section lesson-actions-feedback" aria-live="polite">
          <Typography color={feedbackColor} className={`step-status step-status-${feedback.status}`}>
            {feedback.message}
            {feedback.status === "failed" && feedback.hint_lesson_id && (
              <>
                {" "}
                <Link to={`/lessons/${feedback.hint_lesson_id}`}>Перейти к подсказке</Link>
              </>
            )}
          </Typography>
        </section>
      )}
    </>
  );
}
