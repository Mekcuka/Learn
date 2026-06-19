import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Typography from "@mui/material/Typography";

import LessonHtml from "../features/lesson/components/LessonHtml";

type ExpectedResultProps = {
  html: string;
};

export default function ExpectedResult({ html }: ExpectedResultProps) {
  if (!html?.trim()) {
    return null;
  }

  return (
    <Card className="expected-result" variant="outlined" sx={{ borderColor: "success.light", bgcolor: "success.light" }}>
      <CardContent>
        <Typography variant="body2" fontWeight={600} color="success.main" component="h3">
          Ожидаемый результат
        </Typography>
        <LessonHtml html={html} />
      </CardContent>
    </Card>
  );
}
