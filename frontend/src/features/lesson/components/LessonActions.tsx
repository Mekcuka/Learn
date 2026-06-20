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

  const feedbackColor =
    feedback?.status === "passed"
      ? "success.main"
      : feedback?.status === "failed"
        ? "error.main"
        : "warning.main";

  return (
    <section className="lesson-actions" aria-label="Задание" aria-live="polite">
      <div className="lesson-actions-card">
        {hasInstruction && (
          <div className="lesson-actions-assignment">
            <Typography
              variant="overline"
              color="text.primary"
              fontWeight="bold"
              component="h3"
              className="lesson-actions-assignment-title"
            >
              Задание
            </Typography>
            <ContentHtml html={lesson.instruction_html} className="lesson-actions-assignment-body" />
          </div>
        )}

        {hasExpected && slide && <ExpectedResult html={slide.expected_result_html} />}

        {feedback && (
          <Typography color={feedbackColor} className={`step-status step-status-${feedback.status}`}>
            {feedback.message}
            {feedback.status === "failed" && feedback.hint_lesson_id && (
              <>
                {" "}
                <Link to={`/lessons/${feedback.hint_lesson_id}`}>Перейти к подсказке</Link>
              </>
            )}
          </Typography>
        )}
      </div>
    </section>
  );
}

