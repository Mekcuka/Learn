/** Virtual slide id for quiz preview in author constructor. */
export const AUTHOR_QUIZ_SLIDE_ID = "__author-quiz-slide__";

export function isAuthorQuizSlideId(slideId: string | null | undefined): boolean {
  return slideId === AUTHOR_QUIZ_SLIDE_ID;
}
