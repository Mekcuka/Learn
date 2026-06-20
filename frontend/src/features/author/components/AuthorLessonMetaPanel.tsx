import Accordion from "@mui/material/Accordion";
import AccordionDetails from "@mui/material/AccordionDetails";
import AccordionSummary from "@mui/material/AccordionSummary";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import Button from "@mui/material/Button";
import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import MenuItem from "@mui/material/MenuItem";
import Select from "@mui/material/Select";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";

import type { AuthorLessonDetail } from "../../../api/authorApi";
import { AUTHOR_QUIZ_SLIDE_ID } from "../constants";
import { formatTagsInput, parseTagsInput } from "../../../utils/hashtags";
import {
  mergeVerifyConfigOnTypeChange,
} from "../../../utils/verifyConfigSchema";
import { VERIFY_TYPE_VALUES, verifyTypeLabel, type VerifyType } from "../../../utils/verifyTypes";
import VerifyConfigForm from "./VerifyConfigForm";
import SlideReorderList from "./SlideReorderList";

type VerifyTypeItem = { id: string; label: string };

const VERIFY_TYPE_ITEMS: VerifyTypeItem[] = VERIFY_TYPE_VALUES.map((type) => ({
  id: type,
  label: verifyTypeLabel(type),
}));

type AuthorLessonMetaPanelProps = {
  lesson: AuthorLessonDetail;
  selectedVerifyType: VerifyTypeItem | null;
  onLessonChange: (lesson: AuthorLessonDetail) => void;
  onVerifyTypeChange: (item: VerifyTypeItem | null) => void;
  activeSlideId: string | null;
  onSelectSlide: (id: string) => void;
  onReorderSlides: (slideIds: string[]) => void;
  onAddSlide: () => void;
  onEnableQuiz: () => void;
  onRemoveQuiz: () => void;
  onDeleteSlide: (slideId: string) => void;
  busy: boolean;
  metaExpanded: boolean;
  onMetaExpandedChange: (expanded: boolean) => void;
};

export default function AuthorLessonMetaPanel({
  lesson,
  selectedVerifyType,
  onLessonChange,
  onVerifyTypeChange,
  activeSlideId,
  onSelectSlide,
  onReorderSlides,
  onAddSlide,
  onEnableQuiz,
  onRemoveQuiz,
  onDeleteSlide,
  busy,
  metaExpanded,
  onMetaExpandedChange,
}: AuthorLessonMetaPanelProps) {
  const isQuizLesson = selectedVerifyType?.id === "quiz_passed";

  return (
    <div className="author-meta-panel">
      <Accordion
        expanded={metaExpanded}
        onChange={(_, expanded) => onMetaExpandedChange(expanded)}
        className="author-section-accordion author-meta-accordion"
        disableGutters
      >
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography variant="subtitle1" fontWeight={700}>
            Основное
          </Typography>
        </AccordionSummary>
        <AccordionDetails className="author-meta-accordion-body">
          <TextField
            label="Название"
            value={lesson.title}
            onChange={(event) => onLessonChange({ ...lesson, title: event.target.value })}
            fullWidth
            size="small"
            margin="dense"
          />
          <TextField
            label="Краткое описание"
            value={lesson.summary ?? ""}
            onChange={(event) => onLessonChange({ ...lesson, summary: event.target.value })}
            fullWidth
            size="small"
            margin="dense"
          />
          <TextField
            label="Хештеги"
            value={formatTagsInput(lesson.tags ?? [])}
            placeholder="Старт, Демо, Карта"
            onChange={(event) =>
              onLessonChange({ ...lesson, tags: parseTagsInput(event.target.value) })
            }
            fullWidth
            size="small"
            margin="dense"
          />
          <FormControl fullWidth margin="dense" size="small">
            <InputLabel id="verify-type-label-meta">Тип проверки</InputLabel>
            <Select
              labelId="verify-type-label-meta"
              label="Тип проверки"
              value={selectedVerifyType?.id ?? ""}
              onChange={(event) => {
                const item = VERIFY_TYPE_ITEMS.find((v) => v.id === event.target.value) ?? null;
                onVerifyTypeChange(item);
                if (item) {
                  const nextConfig = mergeVerifyConfigOnTypeChange(
                    item.id as VerifyType,
                    lesson.verify.config ?? {},
                  );
                  onLessonChange({
                    ...lesson,
                    verify: { type: item.id, config: nextConfig },
                  });
                }
              }}
            >
              {VERIFY_TYPE_ITEMS.map((item) => (
                <MenuItem key={item.id} value={item.id}>
                  {item.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          {selectedVerifyType && (
            <VerifyConfigForm
              verifyType={selectedVerifyType.id as VerifyType}
              value={lesson.verify.config ?? {}}
              onChange={(config) =>
                onLessonChange({ ...lesson, verify: { ...lesson.verify, config } })
              }
              disabled={busy}
            />
          )}
        </AccordionDetails>
      </Accordion>

      <div className="author-meta-slides">
        <div className="author-section-header">
          <Typography variant="subtitle1" fontWeight={700}>
            Слайды
          </Typography>
          <div className="author-meta-slides-actions">
            <Button variant="outlined" size="small" disabled={busy} onClick={onAddSlide}>
              + Слайд
            </Button>
            <Button variant="outlined" size="small" disabled={busy || isQuizLesson} onClick={onEnableQuiz}>
              + Квиз
            </Button>
          </div>
        </div>
        {isQuizLesson && (
          <Typography variant="body2" color="text.secondary" className="author-meta-quiz-hint">
            Редактируйте вопросы во вкладке «Квиз».
          </Typography>
        )}
        <SlideReorderList
          slides={lesson.slides}
          activeSlideId={activeSlideId}
          disabled={busy}
          quizSlide={isQuizLesson ? { id: AUTHOR_QUIZ_SLIDE_ID, title: "Квиз" } : null}
          onSelect={onSelectSlide}
          onReorder={onReorderSlides}
          onDeleteSlide={onDeleteSlide}
          onDeleteQuizSlide={isQuizLesson ? onRemoveQuiz : undefined}
        />
      </div>
    </div>
  );
}
