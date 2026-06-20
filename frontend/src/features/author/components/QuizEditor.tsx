import DragIndicatorIcon from "@mui/icons-material/DragIndicator";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import Accordion from "@mui/material/Accordion";
import AccordionDetails from "@mui/material/AccordionDetails";
import AccordionSummary from "@mui/material/AccordionSummary";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import FormControlLabel from "@mui/material/FormControlLabel";
import IconButton from "@mui/material/IconButton";
import Radio from "@mui/material/Radio";
import RadioGroup from "@mui/material/RadioGroup";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { useCallback, useEffect, useMemo, useState, type DragEvent, type MouseEvent } from "react";

import { getAuthorQuiz, updateAuthorQuiz } from "../../../api/authorApi";
import { LearnApiError } from "../../../api/learnApi";
import {
  createEmptyQuestion,
  createOptionId,
  normalizeQuestionOrder,
  promptToPlain,
  toStudentQuizPreview,
  validateQuizDraft,
  type AuthorQuiz,
  type AuthorQuizQuestion,
} from "../../../utils/quizEditor";
import QuizPanel from "../../lesson/components/QuizPanel";
import RichTextEditor from "./RichTextEditor";

type QuizEditorProps = {
  moduleId: string;
  disabled?: boolean;
  onSaved?: (quiz: AuthorQuiz) => void;
  onError?: (message: string) => void;
  onMessage?: (message: string) => void;
};

function questionPreview(question: AuthorQuizQuestion): string {
  const text = promptToPlain(question.prompt_html);
  if (!text) {
    return "Без текста";
  }
  return text.length > 72 ? `${text.slice(0, 72)}…` : text;
}

export default function QuizEditor({
  moduleId,
  disabled = false,
  onSaved,
  onError,
  onMessage,
}: QuizEditorProps) {
  const [quiz, setQuiz] = useState<AuthorQuiz | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [overIndex, setOverIndex] = useState<number | null>(null);
  const [expandedId, setExpandedId] = useState<string | false>(false);

  const loadQuiz = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getAuthorQuiz(moduleId);
      setQuiz(data);
    } catch (err) {
      onError?.(err instanceof LearnApiError ? err.message : "Не удалось загрузить квиз");
    } finally {
      setLoading(false);
    }
  }, [moduleId, onError]);

  useEffect(() => {
    void loadQuiz();
  }, [loadQuiz]);

  const validationError = useMemo(() => {
    if (!quiz) {
      return null;
    }
    return validateQuizDraft(quiz.questions, quiz.pass_threshold_percent);
  }, [quiz]);

  function patchQuestions(nextQuestions: AuthorQuizQuestion[]) {
    setQuiz((current) =>
      current
        ? {
            ...current,
            questions: normalizeQuestionOrder(nextQuestions),
          }
        : current,
    );
  }

  function handleAddQuestion() {
    if (!quiz) {
      return;
    }
    const next = createEmptyQuestion(quiz.questions);
    patchQuestions([...quiz.questions, next]);
    setExpandedId(next.id);
  }

  function handleRemoveQuestion(questionId: string, event?: MouseEvent) {
    event?.stopPropagation();
    if (!quiz) {
      return;
    }
    patchQuestions(quiz.questions.filter((question) => question.id !== questionId));
    if (expandedId === questionId) {
      setExpandedId(false);
    }
  }

  function handleQuestionPromptChange(questionId: string, prompt_html: string) {
    if (!quiz) {
      return;
    }
    patchQuestions(
      quiz.questions.map((question) =>
        question.id === questionId ? { ...question, prompt_html } : question,
      ),
    );
  }

  function handleOptionTextChange(questionId: string, optionId: string, text: string) {
    if (!quiz) {
      return;
    }
    patchQuestions(
      quiz.questions.map((question) =>
        question.id === questionId
          ? {
              ...question,
              options: question.options.map((option) =>
                option.id === optionId ? { ...option, text } : option,
              ),
            }
          : question,
      ),
    );
  }

  function handleCorrectAnswerChange(questionId: string, optionId: string) {
    if (!quiz) {
      return;
    }
    patchQuestions(
      quiz.questions.map((question) =>
        question.id === questionId ? { ...question, correct_option_ids: [optionId] } : question,
      ),
    );
  }

  function handleAddOption(questionId: string) {
    if (!quiz) {
      return;
    }
    patchQuestions(
      quiz.questions.map((question) => {
        if (question.id !== questionId) {
          return question;
        }
        const optionId = createOptionId(question.options);
        return {
          ...question,
          options: [...question.options, { id: optionId, text: "" }],
        };
      }),
    );
  }

  function handleRemoveOption(questionId: string, optionId: string) {
    if (!quiz) {
      return;
    }
    patchQuestions(
      quiz.questions.map((question) => {
        if (question.id !== questionId) {
          return question;
        }
        const options = question.options.filter((option) => option.id !== optionId);
        const correct = question.correct_option_ids.filter((id) => id !== optionId);
        return {
          ...question,
          options,
          correct_option_ids: correct.length > 0 ? correct : options[0] ? [options[0].id] : [],
        };
      }),
    );
  }

  function handleDragStart(index: number, event: DragEvent) {
    if (disabled || busy) {
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
    if (!quiz || dragIndex === null || dragIndex === index) {
      setDragIndex(null);
      setOverIndex(null);
      return;
    }
    const ids = quiz.questions.map((question) => question.id);
    const [moved] = ids.splice(dragIndex, 1);
    ids.splice(index, 0, moved);
    const questionMap = new Map(quiz.questions.map((question) => [question.id, question]));
    patchQuestions(ids.map((id) => questionMap.get(id)!));
    setDragIndex(null);
    setOverIndex(null);
  }

  function handleDragEnd() {
    setDragIndex(null);
    setOverIndex(null);
  }

  async function handleSave() {
    if (!quiz) {
      return;
    }
    const error = validateQuizDraft(quiz.questions, quiz.pass_threshold_percent);
    if (error) {
      onError?.(error);
      return;
    }

    setBusy(true);
    try {
      const payload = {
        pass_threshold_percent: quiz.pass_threshold_percent,
        questions: normalizeQuestionOrder(quiz.questions),
      };
      const saved = await updateAuthorQuiz(moduleId, payload);
      setQuiz(saved);
      onSaved?.(saved);
      onMessage?.("Квиз сохранён");
    } catch (err) {
      onError?.(err instanceof LearnApiError ? err.message : "Не удалось сохранить квиз");
    } finally {
      setBusy(false);
    }
  }

  if (loading) {
    return (
      <Typography variant="body2" color="text.secondary">
        Загрузка квиза…
      </Typography>
    );
  }

  if (!quiz) {
    return (
      <Typography variant="body2" color="error">
        Квиз недоступен
      </Typography>
    );
  }

  const previewQuiz = toStudentQuizPreview(quiz);

  return (
    <div className="author-quiz-editor">
      <Typography variant="caption" color="text.secondary" className="author-quiz-note">
        Квиз привязан к модулю «{quiz.module_id}» и общий для всех уроков с проверкой «Квиз пройден».
      </Typography>

      <div className="author-quiz-toolbar">
        <Typography variant="subtitle2" fontWeight={600} component="h3" className="author-quiz-toolbar-title">
          Вопросы ({quiz.questions.length})
        </Typography>
        <TextField
          label="Порог, %"
          type="number"
          size="small"
          value={quiz.pass_threshold_percent}
          onChange={(event) =>
            setQuiz({
              ...quiz,
              pass_threshold_percent: Number(event.target.value),
            })
          }
          inputProps={{ min: 0, max: 100 }}
          disabled={disabled || busy}
          className="author-quiz-threshold"
        />
        <Button
          size="small"
          variant="outlined"
          disabled={disabled || busy}
          onClick={handleAddQuestion}
          className="author-quiz-add-btn"
        >
          + Вопрос
        </Button>
      </div>

      {quiz.questions.length === 0 && (
        <Typography variant="body2" color="text.secondary" className="author-quiz-empty">
          Вопросов пока нет. Нажмите «+ Вопрос» или «Добавить квиз», чтобы начать.
        </Typography>
      )}

      <ul className="author-quiz-questions" aria-label="Список вопросов квиза">
        {quiz.questions.map((question, index) => {
          const correctId = question.correct_option_ids[0] ?? "";
          const isDragging = dragIndex === index;
          const isOver = overIndex === index && dragIndex !== index;
          const isExpanded = expandedId === question.id;

          return (
            <li
              key={question.id}
              className={`author-quiz-question${isDragging ? " dnd-dragging" : ""}${isOver ? " dnd-drop-target" : ""}`}
              draggable={!disabled && !busy}
              onDragStart={(event) => handleDragStart(index, event)}
              onDragOver={(event) => handleDragOver(index, event)}
              onDrop={(event) => handleDrop(index, event)}
              onDragEnd={handleDragEnd}
            >
              <Accordion
                expanded={isExpanded}
                onChange={(_, expanded) => setExpandedId(expanded ? question.id : false)}
                disableGutters
                elevation={0}
                className="author-quiz-accordion"
              >
                <AccordionSummary
                  expandIcon={<ExpandMoreIcon fontSize="small" />}
                  className="author-quiz-accordion-summary"
                >
                  <span className="author-slide-reorder-handle" aria-hidden="true">
                    <DragIndicatorIcon sx={{ fontSize: 18 }} />
                  </span>
                  <Typography variant="caption" color="text.secondary" className="author-quiz-question-num">
                    {index + 1}.
                  </Typography>
                  <Typography
                    variant="body2"
                    component="span"
                    className="author-quiz-question-preview"
                    color={promptToPlain(question.prompt_html) ? "text.primary" : "text.secondary"}
                  >
                    {questionPreview(question)}
                  </Typography>
                  <IconButton
                    size="small"
                    color="error"
                    aria-label={`Удалить вопрос ${index + 1}`}
                    disabled={disabled || busy}
                    onClick={(event) => handleRemoveQuestion(question.id, event)}
                    className="author-quiz-question-delete"
                  >
                    ×
                  </IconButton>
                </AccordionSummary>

                <AccordionDetails className="author-quiz-accordion-details">
                  <RichTextEditor
                    label="Текст вопроса"
                    value={question.prompt_html}
                    onChange={(prompt_html) => handleQuestionPromptChange(question.id, prompt_html)}
                    rows={2}
                    editorMode="lesson"
                    compact
                    toolbarMode="bubble"
                  />

                  <Typography variant="caption" color="text.secondary" className="author-quiz-options-label">
                    Варианты ответа (отметьте правильный)
                  </Typography>

                  <RadioGroup
                    value={correctId}
                    onChange={(event) => handleCorrectAnswerChange(question.id, event.target.value)}
                    className="author-quiz-options"
                  >
                    {question.options.map((option) => (
                      <Box key={option.id} className="author-quiz-option-row">
                        <FormControlLabel
                          value={option.id}
                          control={<Radio size="small" disabled={disabled || busy} />}
                          label=""
                          sx={{ mr: 0, ml: 0 }}
                        />
                        <TextField
                          label={`Вариант ${option.id}`}
                          value={option.text}
                          onChange={(event) =>
                            handleOptionTextChange(question.id, option.id, event.target.value)
                          }
                          fullWidth
                          disabled={disabled || busy}
                          size="small"
                          margin="dense"
                        />
                        <IconButton
                          size="small"
                          aria-label="Удалить вариант"
                          disabled={disabled || busy || question.options.length <= 2}
                          onClick={() => handleRemoveOption(question.id, option.id)}
                        >
                          ×
                        </IconButton>
                      </Box>
                    ))}
                  </RadioGroup>

                  <Button
                    size="small"
                    variant="text"
                    disabled={disabled || busy}
                    onClick={() => handleAddOption(question.id)}
                    className="author-quiz-add-option"
                  >
                    + Вариант
                  </Button>
                </AccordionDetails>
              </Accordion>
            </li>
          );
        })}
      </ul>

      {validationError && (
        <Typography color="warning.main" variant="caption" className="author-quiz-validation">
          {validationError}
        </Typography>
      )}

      <div className="step-actions author-quiz-actions">
        <Button
          size="small"
          variant="contained"
          disabled={disabled || busy || Boolean(validationError)}
          onClick={handleSave}
        >
          {busy ? "Сохранение…" : "Сохранить квиз"}
        </Button>
        <Button
          size="small"
          variant="outlined"
          disabled={quiz.questions.length === 0}
          onClick={() => setShowPreview((v) => !v)}
        >
          {showPreview ? "Скрыть превью" : "Превью для ученика"}
        </Button>
      </div>

      {showPreview && quiz.questions.length > 0 && (
        <div className="author-quiz-preview">
          <QuizPanel quiz={previewQuiz} busy={false} result={null} isPreview onSubmit={() => undefined} />
        </div>
      )}
    </div>
  );
}
