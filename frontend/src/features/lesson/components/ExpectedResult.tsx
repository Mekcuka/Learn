import Typography from "@mui/material/Typography";

import ContentHtml from "../../wiki/components/ContentHtml";

type ExpectedResultProps = {
  html: string;
  className?: string;
};

export default function ExpectedResult({ html, className }: ExpectedResultProps) {
  if (!html?.trim()) {
    return null;
  }

  const blockClass = ["expected-result", "lesson-actions-block", className].filter(Boolean).join(" ");

  return (
    <div className={blockClass}>
      <Typography
        variant="overline"
        color="text.primary"
        fontWeight="bold"
        component="h3"
        className="expected-result-title"
      >
        Ожидаемый результат
      </Typography>
      <ContentHtml html={html} className="lesson-actions-expected-body" />
    </div>
  );
}
