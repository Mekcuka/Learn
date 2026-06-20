import Typography from "@mui/material/Typography";
import { useEffect, useState } from "react";

import { getAuthorQuiz, type AuthorQuiz } from "../../../api/authorApi";
import { LearnApiError } from "../../../api/learnApi";
import { PageLoading } from "../../../components/mui/PageStatus";
import { toStudentQuizPreview } from "../../../utils/quizEditor";
import QuizPanel from "../../lesson/components/QuizPanel";

type AuthorQuizSlidePreviewProps = {
  moduleId: string;
};

export default function AuthorQuizSlidePreview({ moduleId }: AuthorQuizSlidePreviewProps) {
  const [quiz, setQuiz] = useState<AuthorQuiz | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    getAuthorQuiz(moduleId)
      .then((data) => {
        if (!cancelled) {
          setQuiz(data);
        }
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setError(err instanceof LearnApiError ? err.message : "Не удалось загрузить квиз");
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [moduleId]);

  if (loading) {
    return <PageLoading label="Загрузка квиза…" />;
  }

  if (error) {
    return (
      <Typography color="error" variant="body2">
        {error}
      </Typography>
    );
  }

  if (!quiz || quiz.questions.length === 0) {
    return (
      <div className="author-quiz-slide-preview author-quiz-slide-preview--empty">
        <Typography variant="subtitle1" fontWeight={600} component="h2">
          Квиз
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Вопросов пока нет. Добавьте их во вкладке «Квиз».
        </Typography>
      </div>
    );
  }

  const previewQuiz = toStudentQuizPreview(quiz);

  return (
    <div className="author-quiz-slide-preview">
      <div className="slide-context-strip">
        <Typography variant="overline" color="primary" fontWeight="bold" className="slide-context-progress">
          Квиз
        </Typography>
        <Typography variant="body2" fontWeight={600} className="slide-context-title">
          {quiz.questions.length}{" "}
          {quiz.questions.length === 1
            ? "вопрос"
            : quiz.questions.length < 5
              ? "вопроса"
              : "вопросов"}{" "}
          · проходной балл {quiz.pass_threshold_percent}%
        </Typography>
      </div>
      <QuizPanel
        quiz={previewQuiz}
        busy={false}
        result={null}
        isPreview
        onSubmit={() => undefined}
      />
    </div>
  );
}
