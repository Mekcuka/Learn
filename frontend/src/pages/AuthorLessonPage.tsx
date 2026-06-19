import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import Accordion from "@mui/material/Accordion";
import AccordionDetails from "@mui/material/AccordionDetails";
import AccordionSummary from "@mui/material/AccordionSummary";
import Button from "@mui/material/Button";
import ToggleButton from "@mui/material/ToggleButton";
import ToggleButtonGroup from "@mui/material/ToggleButtonGroup";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import "../styles/author.css";
import "../styles/quiz-editor.css";
import "../styles/screenshot.css";

import {
  createAuthorSlide,
  deleteAuthorLesson,
  deleteAuthorSlide,
  exportAuthorLesson,
  getAuthorLesson,
  importAuthorLesson,
  publishAuthorLesson,
  reorderAuthorSlides,
  updateAuthorLesson,
  updateAuthorSlide,
  uploadSlideImage,
  type AuthorLessonDetail,
} from "../api/authorApi";
import AuthorConstructorLayout from "../components/author/AuthorConstructorLayout";
import AuthorLessonToolbar from "../components/author/AuthorLessonToolbar";
import AuthorRevisionHistoryPanel from "../components/author/AuthorRevisionHistoryPanel";
import AuthorStoryboardView from "../components/author/AuthorStoryboardView";
import type { HotspotItem, LessonSlide } from "../types/lesson";
import { LearnApiError } from "../api/learnApi";
import AuthorLessonMetaPanel from "../components/author/AuthorLessonMetaPanel";
import HotspotEditor from "../components/author/HotspotEditor";
import LessonScreenshotHintsPanel from "../components/LessonScreenshotHintsPanel";
import LessonSlideView from "../components/LessonSlideView";
import { PageError, PageLoading } from "../components/mui/PageStatus";
import RichTextEditor from "../components/author/RichTextEditor";
import { ConfirmModal } from "../components/mui/ConfirmModal";
import { useAuthorSlideAutosave } from "../hooks/useAuthorSlideAutosave";
import { draftSaveMessage } from "../utils/authorPreview";
import { clampSlideIndex } from "../utils/lessonUi";
import {
  mergeVerifyConfigOnTypeChange,
  validateVerifyConfig,
} from "../utils/verifyConfigSchema";
import { VERIFY_TYPE_VALUES, verifyTypeLabel, type VerifyType } from "../utils/verifyTypes";

type VerifyTypeItem = {
  id: string;
  label: string;
};

const VERIFY_TYPE_ITEMS: VerifyTypeItem[] = VERIFY_TYPE_VALUES.map((type) => ({
  id: type,
  label: verifyTypeLabel(type),
}));

type PendingConfirm = "slide" | "lesson" | null;
type ConstructorViewMode = "slide" | "hotspots";

export default function AuthorLessonPage() {
  const { lessonId } = useParams<{ lessonId: string }>();
  const navigate = useNavigate();
  const uploadInputRef = useRef<HTMLInputElement>(null);
  const importInputRef = useRef<HTMLInputElement>(null);
  const [lesson, setLesson] = useState<AuthorLessonDetail | null>(null);
  const [activeSlideId, setActiveSlideId] = useState<string | null>(null);
  const [previewHotspotId, setPreviewHotspotId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [pendingConfirm, setPendingConfirm] = useState<PendingConfirm>(null);
  const [selectedVerifyType, setSelectedVerifyType] = useState<VerifyTypeItem | null>(null);
  const [metaExpanded, setMetaExpanded] = useState(true);
  const [quizExpanded, setQuizExpanded] = useState(false);
  const [storyboardMode, setStoryboardMode] = useState(false);
  const [constructorViewMode, setConstructorViewMode] = useState<ConstructorViewMode>("slide");
  const [moreMenuAnchor, setMoreMenuAnchor] = useState<null | HTMLElement>(null);
  const lessonRef = useRef<AuthorLessonDetail | null>(null);
  lessonRef.current = lesson;

  const mergeSavedSlide = useCallback((slide: LessonSlide, hasUnpublishedChanges: boolean) => {
    setLesson((current) => {
      if (!current) {
        return current;
      }
      return {
        ...current,
        has_unpublished_changes: hasUnpublishedChanges,
        slides: current.slides.map((item) => (item.id === slide.id ? slide : item)),
      };
    });
  }, []);

  const loadLesson = useCallback(async () => {
    if (!lessonId) {
      return;
    }
    const data = await getAuthorLesson(lessonId);

    setLesson(data);
    setSelectedVerifyType(
      VERIFY_TYPE_ITEMS.find((item) => item.id === data.verify.type) ?? VERIFY_TYPE_ITEMS[0],
    );
    setActiveSlideId((current) => current ?? data.slides[0]?.id ?? null);
  }, [lessonId]);

  useEffect(() => {
    if (!lessonId) {
      navigate("/author", { replace: true });
      return;
    }
    let cancelled = false;
    setLoading(true);
    loadLesson()
      .catch((err: unknown) => {
        if (!cancelled) {
          setError(err instanceof LearnApiError ? err.message : "Не удалось загрузить урок");
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [lessonId, loadLesson, navigate]);

  const activeSlide = useMemo(
    () => lesson?.slides.find((slide) => slide.id === activeSlideId) ?? null,
    [lesson, activeSlideId],
  );

  const slideIndex = useMemo(() => {
    if (!lesson || !activeSlideId) {
      return 0;
    }
    const index = lesson.slides.findIndex((slide) => slide.id === activeSlideId);
    return index >= 0 ? index : 0;
  }, [lesson, activeSlideId]);

  const validationHint = useMemo(() => {
    if (!lesson || !selectedVerifyType) {
      return null;
    }
    const verifyType = selectedVerifyType.id as VerifyType;
    const configError = validateVerifyConfig(verifyType, lesson.verify.config ?? {});
    if (configError) {
      return configError;
    }
    if (lesson.slides.length === 0 && verifyType !== "quiz_passed") {
      return "Добавьте хотя бы один слайд";
    }
    return null;
  }, [lesson, selectedVerifyType]);

  const autosave = useAuthorSlideAutosave({
    slide: activeSlide,
    lessonId: lesson?.id ?? "",
    enabled: Boolean(activeSlide && lesson),
    onSaved: (savedSlide, hasUnpublishedChanges) => {
      mergeSavedSlide(savedSlide, hasUnpublishedChanges);
      setMessage(draftSaveMessage("Слайд автосохранён", hasUnpublishedChanges));
    },
    onError: (autosaveError) => setError(autosaveError),
  });

  const handlePublish = useCallback(async () => {
    if (!lesson) {
      return;
    }
    setBusy(true);
    setError(null);
    try {
      if (autosave.dirty) {
        await autosave.flush();
      }
      const updated = await publishAuthorLesson(lesson.id);
      setLesson(updated);
      setMessage("Урок опубликован");
    } catch (err) {
      setError(err instanceof LearnApiError ? err.message : "Не удалось опубликовать урок");
    } finally {
      setBusy(false);
    }
  }, [lesson, autosave]);

  function isEditableTarget(target: EventTarget | null): boolean {
    if (!(target instanceof HTMLElement)) {
      return false;
    }
    const tag = target.tagName;
    if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") {
      return true;
    }
    return Boolean(target.closest(".ProseMirror, [contenteditable='true']"));
  }

  useEffect(() => {
    setPreviewHotspotId(null);
  }, [activeSlideId]);

  useEffect(() => {
    if (selectedVerifyType?.id === "quiz_passed") {
      setQuizExpanded(true);
    }
  }, [selectedVerifyType?.id]);

  function enableQuizLesson() {
    if (!lesson) {
      return;
    }
    const quizVerify = VERIFY_TYPE_ITEMS.find((item) => item.id === "quiz_passed") ?? null;
    setSelectedVerifyType(quizVerify);
    const nextConfig = mergeVerifyConfigOnTypeChange("quiz_passed", lesson.verify.config ?? {});
    setLesson({
      ...lesson,
      verify: { type: "quiz_passed", config: nextConfig },
    });
    setQuizExpanded(true);
    setMessage("Тип проверки переключён на «Квиз». Сохраните урок и настройте вопросы.");
  }

  const saveLessonMeta = useCallback(async () => {
    if (!lesson || !selectedVerifyType) {
      return;
    }
    setBusy(true);
    setError(null);
    try {
      let currentLesson = lesson;
      if (autosave.dirty) {
        const flushed = await autosave.flush();
        if (flushed) {
          currentLesson = {
            ...currentLesson,
            has_unpublished_changes: flushed.has_unpublished_changes,
            slides: currentLesson.slides.map((item) =>
              item.id === flushed.slide.id ? flushed.slide : item,
            ),
          };
        }
      }
      const updated = await updateAuthorLesson(currentLesson.id, {
        title: currentLesson.title,
        summary: currentLesson.summary ?? undefined,
        tags: currentLesson.tags,
        instruction_html: currentLesson.instruction_html,
        deep_link_template: currentLesson.deep_link_template ?? undefined,
        verify_type: selectedVerifyType.id,
        verify_config: currentLesson.verify.config ?? {},
      });
      setLesson(updated);
      setMessage(draftSaveMessage("Урок сохранён", updated.has_unpublished_changes));
    } catch (err) {
      setError(err instanceof LearnApiError ? err.message : "Не удалось сохранить урок");
    } finally {
      setBusy(false);
    }
  }, [lesson, selectedVerifyType, autosave]);

  const saveActiveSlide = useCallback(async () => {
    if (!activeSlide) {
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const updated = await updateAuthorSlide(activeSlide.id, {
        title: activeSlide.title,
        caption_html: activeSlide.caption_html,
        expected_result_html: activeSlide.expected_result_html,
        image_path: activeSlide.image_path,
        hotspots: activeSlide.hotspots,
      });
      mergeSavedSlide(updated.slide, updated.has_unpublished_changes);
      autosave.markClean(updated.slide);
      setMessage(draftSaveMessage("Слайд сохранён", updated.has_unpublished_changes));
    } catch (err) {
      setError(err instanceof LearnApiError ? err.message : "Не удалось сохранить слайд");
    } finally {
      setBusy(false);
    }
  }, [activeSlide, autosave, mergeSavedSlide]);

  async function handleAddSlide() {
    if (!lesson) {
      return;
    }
    setBusy(true);
    try {
      const updated = await createAuthorSlide(lesson.id, {
        title: `Слайд ${lesson.slides.length + 1}`,
      });
      setLesson(updated);
      setActiveSlideId(updated.slides[updated.slides.length - 1]?.id ?? null);
    } catch (err) {
      setError(err instanceof LearnApiError ? err.message : "Не удалось добавить слайд");
    } finally {
      setBusy(false);
    }
  }

  async function confirmDeleteSlide() {
    if (!activeSlide) {
      return;
    }
    setBusy(true);
    try {
      const updated = await deleteAuthorSlide(activeSlide.id);
      setLesson(updated);
      setActiveSlideId(updated.slides[0]?.id ?? null);
    } catch (err) {
      setError(err instanceof LearnApiError ? err.message : "Не удалось удалить слайд");
    } finally {
      setBusy(false);
      setPendingConfirm(null);
    }
  }

  async function confirmDeleteLesson() {
    if (!lesson) {
      return;
    }
    setBusy(true);
    try {
      await deleteAuthorLesson(lesson.id);
      navigate("/author");
    } catch (err) {
      setError(err instanceof LearnApiError ? err.message : "Не удалось удалить урок");
    } finally {
      setBusy(false);
      setPendingConfirm(null);
    }
  }

  async function handleDuplicateSlide() {
    if (!lesson || !activeSlide) {
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const stamp = Date.now();
      const updated = await createAuthorSlide(lesson.id, {
        title: `${activeSlide.title} (копия)`,
        caption_html: activeSlide.caption_html,
        expected_result_html: activeSlide.expected_result_html,
        image_path: activeSlide.image_path,
        hotspots: activeSlide.hotspots.map((hotspot, index) => ({
          ...hotspot,
          id: `hotspot-${stamp}-${index}`,
        })),
      });
      setLesson(updated);
      const newSlide = updated.slides[updated.slides.length - 1];
      setActiveSlideId(newSlide?.id ?? null);
      setMessage("Слайд скопирован");
    } catch (err) {
      setError(err instanceof LearnApiError ? err.message : "Не удалось скопировать слайд");
    } finally {
      setBusy(false);
    }
  }

  async function handleReorderSlides(slideIds: string[]) {
    if (!lesson) {
      return;
    }
    setBusy(true);
    try {
      const updated = await reorderAuthorSlides(lesson.id, slideIds);
      setLesson(updated);
    } catch (err) {
      setError(err instanceof LearnApiError ? err.message : "Не удалось изменить порядок");
    } finally {
      setBusy(false);
    }
  }

  async function handleUploadImage(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file || !activeSlide || !lesson) {
      return;
    }
    setBusy(true);
    try {
      const result = await uploadSlideImage(activeSlide.id, file);
      const updated = await updateAuthorSlide(activeSlide.id, {
        title: activeSlide.title,
        caption_html: activeSlide.caption_html,
        expected_result_html: activeSlide.expected_result_html,
        image_path: result.image_path,
        hotspots: activeSlide.hotspots,
      });
      mergeSavedSlide(updated.slide, updated.has_unpublished_changes);
      autosave.markClean(updated.slide);
      setMessage(draftSaveMessage("Изображение загружено", updated.has_unpublished_changes));
    } catch (err) {
      setError(err instanceof LearnApiError ? err.message : "Не удалось загрузить файл");
    } finally {
      setBusy(false);
      event.target.value = "";
    }
  }

  async function handleExport() {
    if (!lesson) {
      return;
    }
    const payload = await exportAuthorLesson(lesson.id);
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `${lesson.id}.json`;
    anchor.click();
    URL.revokeObjectURL(url);
  }

  async function handleImport(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file || !lesson) {
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const text = await file.text();
      const payload = JSON.parse(text) as Record<string, unknown>;
      const updated = await importAuthorLesson(lesson.module_id, payload);
      setLesson(updated);
      setSelectedVerifyType(
        VERIFY_TYPE_ITEMS.find((item) => item.id === updated.verify.type) ?? VERIFY_TYPE_ITEMS[0],
      );
      setActiveSlideId(updated.slides[0]?.id ?? null);
      if (updated.id !== lessonId) {
        navigate(`/author/lessons/${updated.id}`, { replace: true });
      }
      setMessage("Урок импортирован из JSON");
    } catch (err) {
      setError(err instanceof LearnApiError ? err.message : "Не удалось импортировать JSON");
    } finally {
      setBusy(false);
      event.target.value = "";
    }
  }

  const handleSlideIndexChange = useCallback(
    (index: number) => {
      if (!lesson?.slides.length) {
        return;
      }
      const clamped = clampSlideIndex(index, lesson.slides.length);
      setActiveSlideId(lesson.slides[clamped]?.id ?? null);
    },
    [lesson?.slides],
  );

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (isEditableTarget(event.target)) {
        return;
      }
      if (event.ctrlKey && event.shiftKey && event.key.toLowerCase() === "s") {
        event.preventDefault();
        void saveLessonMeta();
        return;
      }
      if (event.ctrlKey && event.key.toLowerCase() === "s") {
        event.preventDefault();
        if (activeSlide) {
          void saveActiveSlide();
        } else {
          void saveLessonMeta();
        }
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [activeSlide, saveActiveSlide, saveLessonMeta]);

  function patchActiveSlide(patch: Partial<LessonSlide>) {
    if (!lesson || !activeSlide) {
      return;
    }
    setLesson({
      ...lesson,
      slides: lesson.slides.map((slide) => (slide.id === activeSlide.id ? { ...slide, ...patch } : slide)),
    });
  }

  function patchHotspots(hotspots: HotspotItem[]) {
    patchActiveSlide({ hotspots });
  }

  if (loading || !lesson) {
    return (
      <AuthorConstructorLayout>
        {loading ? <PageLoading /> : <Typography color="text.secondary">Урок не найден</Typography>}
      </AuthorConstructorLayout>
    );
  }

  return (
    <AuthorConstructorLayout>
        <AuthorLessonToolbar
          lesson={lesson}
          busy={busy}
          autosaveDirty={autosave.dirty}
          autosaveSaving={autosave.saving}
          validationHint={validationHint}
          activeSlide={Boolean(activeSlide)}
          importInputRef={importInputRef}
          moreMenuAnchor={moreMenuAnchor}
          onMoreMenuOpen={setMoreMenuAnchor}
          onMoreMenuClose={() => setMoreMenuAnchor(null)}
          onSaveLesson={() => void saveLessonMeta()}
          onSaveSlide={() => void saveActiveSlide()}
          onPublish={() => void handlePublish()}
          onToggleStoryboard={() => setStoryboardMode((value) => !value)}
          onExport={() => void handleExport()}
          onDeleteLesson={() => setPendingConfirm("lesson")}
          onImport={handleImport}
          storyboardMode={storyboardMode}
        />

        {message && (
          <Typography color="success.main" className="step-status step-status-passed author-flash-message">
            {message}
          </Typography>
        )}
        {error && <PageError message={error} />}

        <div className="author-constructor-body">
          <div className="author-constructor-meta">
            <AuthorLessonMetaPanel
              lesson={lesson}
              selectedVerifyType={selectedVerifyType}
              onLessonChange={setLesson}
              onVerifyTypeChange={setSelectedVerifyType}
              activeSlideId={activeSlideId}
              onSelectSlide={setActiveSlideId}
              onReorderSlides={handleReorderSlides}
              onAddSlide={handleAddSlide}
              onEnableQuiz={enableQuizLesson}
              busy={busy}
              metaExpanded={metaExpanded}
              quizExpanded={quizExpanded}
              onMetaExpandedChange={setMetaExpanded}
              onQuizExpandedChange={setQuizExpanded}
              onQuizMessage={setMessage}
              onQuizError={setError}
            />
            <AuthorRevisionHistoryPanel
              lesson={lesson}
              onLessonUpdated={setLesson}
              onError={setError}
              onMessage={setMessage}
            />
          </div>

          <div className="author-constructor-workspace">
            <ToggleButtonGroup
              exclusive
              size="small"
              value={constructorViewMode}
              onChange={(_, value: ConstructorViewMode | null) => {
                if (value) {
                  setConstructorViewMode(value);
                }
              }}
              aria-label="Режим редактора конструктора"
              className="author-constructor-view-toggle"
            >
              <ToggleButton value="slide" aria-label="Слайд">
                Слайд
              </ToggleButton>
              <ToggleButton value="hotspots" aria-label="Метки">
                Метки
              </ToggleButton>
            </ToggleButtonGroup>

            <div className="author-constructor-workspace-content">
              {constructorViewMode === "slide" ? (
                <div className="author-constructor-main">
                  {storyboardMode ? (
                    <AuthorStoryboardView
                      lesson={lesson}
                      activeSlideId={activeSlideId}
                      onSelectSlide={(slideId) => {
                        setActiveSlideId(slideId);
                        setStoryboardMode(false);
                      }}
                    />
                  ) : (
                    <>
                      <LessonSlideView
                        mode="author"
                        lesson={lesson}
                        slideIndex={slideIndex}
                        onSlideIndexChange={handleSlideIndexChange}
                        activeHotspotId={previewHotspotId}
                        onHotspotSelect={setPreviewHotspotId}
                        hasUnpublishedChanges={lesson.has_unpublished_changes}
                      />

                      {activeSlide && (
                        <div className="author-slide-editors">
                          <div className="step-actions author-slide-toolbar">
                            <Tooltip title="Загрузить PNG, WebP или SVG">
                              <span>
                                <Button
                                  variant="outlined"
                                  size="small"
                                  disabled={busy}
                                  onClick={() => uploadInputRef.current?.click()}
                                >
                                  Загрузить изображение
                                </Button>
                              </span>
                            </Tooltip>
                            <input
                              ref={uploadInputRef}
                              type="file"
                              accept="image/png,image/webp,image/svg+xml"
                              onChange={handleUploadImage}
                              hidden
                            />
                            <Button variant="outlined" size="small" disabled={busy} onClick={handleDuplicateSlide}>
                              Дублировать
                            </Button>
                            <Button
                              variant="outlined"
                              size="small"
                              color="error"
                              disabled={busy}
                              onClick={() => setPendingConfirm("slide")}
                            >
                              Удалить слайд
                            </Button>
                          </div>
                          <RichTextEditor
                            label="Подпись"
                            value={activeSlide.caption_html}
                            onChange={(caption_html) => patchActiveSlide({ caption_html })}
                            rows={2}
                            editorMode="lesson"
                            showPreview
                            compact
                          />
                          <RichTextEditor
                            label="Ожидаемый результат"
                            value={activeSlide.expected_result_html}
                            onChange={(expected_result_html) => patchActiveSlide({ expected_result_html })}
                            rows={2}
                            editorMode="lesson"
                            showPreview
                            compact
                          />
                        </div>
                      )}
                    </>
                  )}
                </div>
              ) : (
                <aside className="author-constructor-hotspots">
                  {activeSlide ? (
                    <>
                      <Typography variant="subtitle1" fontWeight={700} component="h2">
                        Метки
                      </Typography>
                      <HotspotEditor
                        imagePath={activeSlide.image_path}
                        hotspots={activeSlide.hotspots}
                        onChange={patchHotspots}
                        selectedId={previewHotspotId}
                        onSelectedIdChange={setPreviewHotspotId}
                        viewportResetKey={activeSlide.id}
                        showNumericFields
                      />
                      <Accordion
                        className="hotspot-student-preview-accordion"
                        disableGutters
                        elevation={0}
                        defaultExpanded={false}
                      >
                        <AccordionSummary expandIcon={<ExpandMoreIcon fontSize="small" />}>
                          <Typography variant="caption" fontWeight={600} color="text.secondary">
                            Превью для ученика
                            {activeSlide.hotspots.length > 0
                              ? ` · ${activeSlide.hotspots.length} меток`
                              : ""}
                          </Typography>
                        </AccordionSummary>
                        <AccordionDetails>
                          <LessonScreenshotHintsPanel
                            slide={activeSlide}
                            activeHotspotId={previewHotspotId}
                            onHotspotSelect={setPreviewHotspotId}
                            scrollActiveItem={false}
                          />
                        </AccordionDetails>
                      </Accordion>
                    </>
                  ) : (
                    <Typography variant="body2" color="text.secondary">
                      Добавьте слайд, чтобы редактировать метки.
                    </Typography>
                  )}
                </aside>
              )}
            </div>
          </div>
        </div>

      <ConfirmModal
        isOpen={pendingConfirm === "slide"}
        title="Удалить слайд?"
        message="Слайд и его hotspots будут удалены без возможности восстановления."
        confirmLabel="Удалить"
        danger
        loading={busy}
        onConfirm={confirmDeleteSlide}
        onCancel={() => setPendingConfirm(null)}
      />
      <ConfirmModal
        isOpen={pendingConfirm === "lesson"}
        title="Удалить урок целиком?"
        message="Урок, все слайды и прогресс учеников по этому уроку будут удалены."
        confirmLabel="Удалить урок"
        danger
        loading={busy}
        onConfirm={confirmDeleteLesson}
        onCancel={() => setPendingConfirm(null)}
      />
    </AuthorConstructorLayout>
  );
}
