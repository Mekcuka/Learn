import Button from "@mui/material/Button";
import Checkbox from "@mui/material/Checkbox";
import FormControlLabel from "@mui/material/FormControlLabel";
import FormGroup from "@mui/material/FormGroup";
import Radio from "@mui/material/Radio";
import RadioGroup from "@mui/material/RadioGroup";
import Typography from "@mui/material/Typography";
import { useMemo, useState } from "react";

import type { QuizModule, QuizSubmitResult } from "../types/lesson";
import SafeHtml from "./SafeHtml";

type QuizPanelProps = {
  quiz: QuizModule;
  busy: boolean;
  result: QuizSubmitResult | null;
  isPreview?: boolean;
  onSubmit: (answers: Record<string, string[]>) => void;
};

type QuizOptionItem = {
  id: string;
  label: string;
};

export default function QuizPanel({ quiz, busy, result, isPreview = false, onSubmit }: QuizPanelProps) {
  const [answers, setAnswers] = useState<Record<string, string[]>>({});

  const unanswered = useMemo(
    () => quiz.questions.filter((question) => !(answers[question.id]?.length > 0)).length,
    [answers, quiz.questions],
  );

  function handleSubmit() {
    onSubmit(answers);
  }

  return (
    <section className="quiz-panel" aria-label="Мини-квиз">
      <header className="quiz-panel-header">
        <Typography variant="h5" fontWeight="bold" component="h2">
          Мини-квиз
        </Typography>
        <Typography variant="body2" color="text.secondary" className="quiz-panel-meta">
          Порог прохождения: {quiz.pass_threshold_percent}% · вопросов: {quiz.questions.length}
        </Typography>
      </header>

      <ol className="quiz-questions">
        {quiz.questions.map((question) => {
          const questionResult = result?.results.find((item) => item.question_id === question.id);
          const optionItems: QuizOptionItem[] = question.options.map((option) => ({
            id: option.id,
            label: option.text,
          }));
          const selectedIds = answers[question.id] ?? [];

          return (
            <li
              key={question.id}
              className={`quiz-question ${questionResult ? (questionResult.correct ? "quiz-correct" : "quiz-wrong") : ""}`}
            >
              <SafeHtml html={question.prompt_html} className="quiz-prompt" tag="div" />
              <div className="quiz-options">
                {question.allow_multiple ? (
                  <FormGroup>
                    {optionItems.map((item) => (
                      <FormControlLabel
                        key={item.id}
                        control={
                          <Checkbox
                            checked={selectedIds.includes(item.id)}
                            disabled={busy}
                            onChange={(event) => {
                              const current = answers[question.id] ?? [];
                              const next = event.target.checked
                                ? [...current, item.id]
                                : current.filter((id) => id !== item.id);
                              setAnswers((prev) => ({ ...prev, [question.id]: next }));
                            }}
                          />
                        }
                        label={item.label}
                      />
                    ))}
                  </FormGroup>
                ) : (
                  <RadioGroup
                    value={selectedIds[0] ?? ""}
                    onChange={(event) => {
                      setAnswers((prev) => ({ ...prev, [question.id]: [event.target.value] }));
                    }}
                  >
                    {optionItems.map((item) => (
                      <FormControlLabel
                        key={item.id}
                        value={item.id}
                        control={<Radio disabled={busy} />}
                        label={item.label}
                      />
                    ))}
                  </RadioGroup>
                )}
              </div>
            </li>
          );
        })}
      </ol>

      {result && (
        <Typography
          fontWeight={600}
          color={result.passed ? "success.main" : "error.main"}
          className="quiz-result"
        >
          {result.passed
            ? `Квиз пройден: ${result.score_percent}%`
            : `Нужно набрать ${result.pass_threshold_percent}%. Сейчас: ${result.score_percent}%`}
        </Typography>
      )}

      <div className="step-actions">
        <Button
          variant="contained"
          disabled={busy || unanswered > 0 || isPreview}
          title={isPreview ? "Отправка недоступна в режиме предпросмотра" : undefined}
          onClick={handleSubmit}
        >
          {isPreview ? "Отправка недоступна" : busy ? "Проверка…" : "Отправить ответы"}
        </Button>
      </div>
    </section>
  );
}
