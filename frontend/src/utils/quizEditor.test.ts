import { describe, expect, it } from "vitest";

import {
  createEmptyQuestion,
  normalizeQuestionOrder,
  plainToPrompt,
  promptToPlain,
  validateQuizDraft,
} from "./quizEditor";

describe("quizEditor utils", () => {
  it("converts plain text to prompt html", () => {
    expect(plainToPrompt("Где создаётся проект?")).toBe("<p>Где создаётся проект?</p>");
    expect(plainToPrompt("<p>Уже HTML</p>")).toBe("<p>Уже HTML</p>");
  });

  it("strips html to plain text", () => {
    expect(promptToPlain("<p>Текст вопроса</p>")).toBe("Текст вопроса");
  });

  it("validates quiz draft", () => {
    const question = createEmptyQuestion([]);
    expect(validateQuizDraft([], 80)).toBe("Добавьте хотя бы один вопрос");
    expect(validateQuizDraft([{ ...question, prompt_html: "" }], 80)).toMatch(/текст вопроса/);
    expect(
      validateQuizDraft(
        [
          {
            ...question,
            prompt_html: "<p>?</p>",
            options: [
              { id: "a", text: "A" },
              { id: "b", text: "B" },
            ],
            correct_option_ids: ["a"],
          },
        ],
        80,
      ),
    ).toBeNull();
  });

  it("normalizes question order", () => {
    const questions = normalizeQuestionOrder([
      { ...createEmptyQuestion([]), id: "q2", order: 5 },
      { ...createEmptyQuestion([]), id: "q3", order: 9 },
    ]);
    expect(questions.map((item) => item.order)).toEqual([1, 2]);
  });
});
