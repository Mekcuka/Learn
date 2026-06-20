import Typography from "@mui/material/Typography";

import ContentHtml from "../../wiki/components/ContentHtml";

type ExpectedResultProps = {
  html: string;
};

export default function ExpectedResult({ html }: ExpectedResultProps) {
  if (!html?.trim()) {
    return null;
  }

  return (
    <section
      className="lesson-ref-section lesson-ref-section--expected lesson-actions-expected"
      aria-label="Ожидаемый результат"
    >
      <Typography
        variant="overline"
        color="text.primary"
        fontWeight="bold"
        component="h3"
        className="lesson-ref-section-title"
      >
        Ожидаемый результат
      </Typography>
      <div className="lesson-ref-section-content">
        <ContentHtml html={html} className="lesson-ref-body" />
      </div>
    </section>
  );
}
