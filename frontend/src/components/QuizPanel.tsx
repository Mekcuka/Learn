import { useMemo, useState } from "react";

import type { QuizModule, QuizSubmitResult } from "../api/learnApi";
import SafeHtml from "./SafeHtml";

type QuizPanelProps = {
  quiz: QuizModule;
  busy: boolean;
  result: QuizSubmitResult | null;
  isPreview?: boolean;
  onSubmit: (answers: Record<string, string[]>) => void;
};

export default function QuizPanel({ quiz, busy, result, isPreview = false, onSubmit }: QuizPanelProps) {
  const [answers, setAnswers] = useState<Record<string, string[]>>({});

  const unanswered = useMemo(
    () => quiz.questions.filter((question) => !(answers[question.id]?.length > 0)).length,
    [answers, quiz.questions],
  );

  function toggleOption(questionId: string, optionId: string, allowMultiple: boolean) {
    setAnswers((prev) => {
      const current = prev[questionId] ?? [];
      if (allowMultiple) {
        const next = current.includes(optionId)
          ? current.filter((id) => id !== optionId)
          : [...current, optionId];
        return { ...prev, [questionId]: next };
      }
      return { ...prev, [questionId]: [optionId] };
    });
  }

  function handleSubmit() {
    onSubmit(answers);
  }

  return (
    <section className="quiz-panel" aria-label="Мини-квиз">
      <header className="quiz-panel-header">
        <h2>Мини-квиз</h2>
        <p className="quiz-panel-meta">
          Порог прохождения: {quiz.pass_threshold_percent}% · вопросов: {quiz.questions.length}
        </p>
      </header>

      <ol className="quiz-questions">
        {quiz.questions.map((question) => {
          const questionResult = result?.results.find((item) => item.question_id === question.id);
          return (
            <li
              key={question.id}
              className={`quiz-question ${questionResult ? (questionResult.correct ? "quiz-correct" : "quiz-wrong") : ""}`}
            >
              <SafeHtml html={question.prompt_html} className="quiz-prompt" tag="div" />
              <ul className="quiz-options">
                {question.options.map((option) => {
                  const selected = answers[question.id]?.includes(option.id) ?? false;
                  const inputType = question.allow_multiple ? "checkbox" : "radio";
                  return (
                    <li key={option.id}>
                      <label className={`quiz-option ${selected ? "selected" : ""}`}>
                        <input
                          type={inputType}
                          name={`quiz-${question.id}`}
                          checked={selected}
                          disabled={busy}
                          onChange={() =>
                            toggleOption(question.id, option.id, question.allow_multiple)
                          }
                        />
                        <span>{option.text}</span>
                      </label>
                    </li>
                  );
                })}
              </ul>
            </li>
          );
        })}
      </ol>

      {result && (
        <p className={`quiz-result quiz-result-${result.passed ? "passed" : "failed"}`}>
          {result.passed
            ? `Квиз пройден: ${result.score_percent}%`
            : `Нужно набрать ${result.pass_threshold_percent}%. Сейчас: ${result.score_percent}%`}
        </p>
      )}

      <div className="step-actions">
        <button
          type="button"
          onClick={handleSubmit}
          disabled={busy || unanswered > 0 || isPreview}
          title={isPreview ? "Отправка недоступна в режиме предпросмотра" : undefined}
        >
          {isPreview ? "Отправка недоступна" : busy ? "Проверка…" : "Отправить ответы"}
        </button>
      </div>
    </section>
  );
}
