import Typography from "@mui/material/Typography";

type LessonPreviewBannerProps = {
  isDraftPreview: boolean;
};

export default function LessonPreviewBanner({ isDraftPreview }: LessonPreviewBannerProps) {
  return (
    <div className="preview-banner" role="status">
      <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
        <path
          fill="currentColor"
          d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"
        />
      </svg>
      <Typography variant="body2">
        <Typography component="span" fontWeight="bold">
          Режим предпросмотра.
        </Typography>{" "}
        {isDraftPreview
          ? "Показан черновик методиста — так увидят ученики после публикации. Прогресс не сохраняется."
          : "Показана опубликованная версия для учеников. Несохранённые в черновике правки здесь не видны."}
      </Typography>
    </div>
  );
}
