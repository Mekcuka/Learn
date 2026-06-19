export type AuthorQuizOption = {
  id: string;
  text: string;
};

export type AuthorQuizQuestion = {
  id: string;
  order: number;
  prompt_html: string;
  options: AuthorQuizOption[];
  correct_option_ids: string[];
};

export type AuthorQuiz = {
  module_id: string;
  pass_threshold_percent: number;
  questions: AuthorQuizQuestion[];
};

const OPTION_ID_ALPHABET = "abcdefghijklmnopqrstuvwxyz";

export function promptToPlain(html: string): string {
  return html
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/\n+/g, " ")
    .trim();
}

export function plainToPrompt(text: string): string {
  const trimmed = text.trim();
  if (!trimmed) {
    return "";
  }
  if (trimmed.startsWith("<")) {
    return trimmed;
  }
  return `<p>${trimmed}</p>`;
}

export function createQuestionId(existing: AuthorQuizQuestion[]): string {
  let index = existing.length + 1;
  let candidate = `q${index}`;
  const ids = new Set(existing.map((item) => item.id));
  while (ids.has(candidate)) {
    index += 1;
    candidate = `q${index}`;
  }
  return candidate;
}

export function createOptionId(existing: AuthorQuizOption[]): string {
  for (const letter of OPTION_ID_ALPHABET) {
    if (!existing.some((item) => item.id === letter)) {
      return letter;
    }
  }
  let index = existing.length + 1;
  let candidate = `opt-${index}`;
  const ids = new Set(existing.map((item) => item.id));
  while (ids.has(candidate)) {
    index += 1;
    candidate = `opt-${index}`;
  }
  return candidate;
}

export function createEmptyQuestion(existing: AuthorQuizQuestion[]): AuthorQuizQuestion {
  const optionA: AuthorQuizOption = { id: "a", text: "" };
  const optionB: AuthorQuizOption = { id: "b", text: "" };
  return {
    id: createQuestionId(existing),
    order: existing.length + 1,
    prompt_html: "",
    options: [optionA, optionB],
    correct_option_ids: ["a"],
  };
}

export function normalizeQuestionOrder(questions: AuthorQuizQuestion[]): AuthorQuizQuestion[] {
  return questions.map((question, index) => ({
    ...question,
    order: index + 1,
  }));
}

export function validateQuizDraft(
  questions: AuthorQuizQuestion[],
  passThresholdPercent: number,
): string | null {
  if (questions.length === 0) {
    return "Добавьте хотя бы один вопрос";
  }
  if (passThresholdPercent < 0 || passThresholdPercent > 100) {
    return "Порог прохождения должен быть от 0 до 100";
  }

  for (const [index, question] of questions.entries()) {
    const label = `Вопрос ${index + 1}`;
    if (!promptToPlain(question.prompt_html)) {
      return `${label}: укажите текст вопроса`;
    }
    if (question.options.length < 2) {
      return `${label}: нужно минимум 2 варианта ответа`;
    }
    if (question.options.some((option) => !option.text.trim())) {
      return `${label}: заполните все варианты ответа`;
    }
    if (question.correct_option_ids.length === 0) {
      return `${label}: отметьте правильный ответ`;
    }
    const optionIds = new Set(question.options.map((option) => option.id));
    if (question.correct_option_ids.some((id) => !optionIds.has(id))) {
      return `${label}: выбран несуществующий правильный ответ`;
    }
  }

  return null;
}

export function toStudentQuizPreview(quiz: AuthorQuiz) {
  return {
    module_id: quiz.module_id,
    pass_threshold_percent: quiz.pass_threshold_percent,
    questions: quiz.questions.map((question) => ({
      id: question.id,
      order: question.order,
      prompt_html: question.prompt_html,
      options: question.options.map((option) => ({ id: option.id, text: option.text })),
      allow_multiple: question.correct_option_ids.length > 1,
    })),
  };
}
