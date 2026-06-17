import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";

import {
  createAuthorSlide,
  deleteAuthorLesson,
  deleteAuthorSlide,
  exportAuthorLesson,
  getAuthorLesson,
  reorderAuthorSlides,
  updateAuthorLesson,
  updateAuthorSlide,
  uploadSlideImage,
  type AuthorLessonDetail,
} from "../api/authorApi";
import type { HotspotItem, LessonSlide } from "../api/learnApi";
import { LearnApiError } from "../api/learnApi";
import { useAuth } from "../auth/AuthContext";
import HotspotEditor from "../components/author/HotspotEditor";
import RichTextEditor from "../components/author/RichTextEditor";
import ExpectedResult from "../components/ExpectedResult";
import SafeHtml from "../components/SafeHtml";
import ScreenshotGuide from "../components/ScreenshotGuide";
import { formatTagsInput, parseTagsInput } from "../utils/hashtags";
import { VERIFY_TYPE_VALUES, verifyTypeLabel } from "../utils/verifyTypes";

const VERIFY_TYPES = VERIFY_TYPE_VALUES;

export default function AuthorLessonPage() {
  const { lessonId } = useParams<{ lessonId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [lesson, setLesson] = useState<AuthorLessonDetail | null>(null);
  const [activeSlideId, setActiveSlideId] = useState<string | null>(null);
  const [previewHotspotId, setPreviewHotspotId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [verifyConfigJson, setVerifyConfigJson] = useState("{}");

  const loadLesson = useCallback(async () => {
    if (!lessonId) {
      return;
    }
    const data = await getAuthorLesson(lessonId);
    setLesson(data);
    setVerifyConfigJson(JSON.stringify(data.verify.config ?? {}, null, 2));
    setActiveSlideId((current) => current ?? data.slides[0]?.id ?? null);
  }, [lessonId]);

  useEffect(() => {
    if (!lessonId) {
      navigate("/author", { replace: true });
      return;
    }
    setLoading(true);
    loadLesson()
      .catch((err: unknown) => {
        setError(err instanceof LearnApiError ? err.message : "Не удалось загрузить урок");
      })
      .finally(() => setLoading(false));
  }, [lessonId, loadLesson, navigate]);

  const activeSlide = useMemo(
    () => lesson?.slides.find((slide) => slide.id === activeSlideId) ?? null,
    [lesson, activeSlideId],
  );

  useEffect(() => {
    setPreviewHotspotId(null);
  }, [activeSlideId]);

  async function saveLessonMeta() {
    if (!lesson) {
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const verify_config = JSON.parse(verifyConfigJson) as Record<string, unknown>;
      const updated = await updateAuthorLesson(lesson.id, {
        title: lesson.title,
        summary: lesson.summary ?? undefined,
        tags: lesson.tags,
        instruction_html: lesson.instruction_html,
        deep_link_template: lesson.deep_link_template ?? undefined,
        verify_type: lesson.verify.type,
        verify_config,
      });
      setLesson(updated);
      setMessage("Урок сохранён");
    } catch (err) {
      setError(err instanceof LearnApiError ? err.message : "Не удалось сохранить урок");
    } finally {
      setBusy(false);
    }
  }

  async function saveActiveSlide() {
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
      setLesson(updated);
      setMessage("Слайд сохранён");
    } catch (err) {
      setError(err instanceof LearnApiError ? err.message : "Не удалось сохранить слайд");
    } finally {
      setBusy(false);
    }
  }

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

  async function handleDeleteSlide() {
    if (!activeSlide || !lesson) {
      return;
    }
    if (!window.confirm("Удалить слайд?")) {
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
    }
  }

  async function handleMoveSlide(direction: -1 | 1) {
    if (!lesson || !activeSlideId) {
      return;
    }
    const index = lesson.slides.findIndex((slide) => slide.id === activeSlideId);
    const target = index + direction;
    if (target < 0 || target >= lesson.slides.length) {
      return;
    }
    const ids = lesson.slides.map((slide) => slide.id);
    [ids[index], ids[target]] = [ids[target], ids[index]];
    setBusy(true);
    try {
      const updated = await reorderAuthorSlides(lesson.id, ids);
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
      const updatedSlides = lesson.slides.map((slide) =>
        slide.id === activeSlide.id ? { ...slide, image_path: result.image_path } : slide,
      );
      setLesson({ ...lesson, slides: updatedSlides });
      setMessage("Изображение загружено");
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

  async function handleDeleteLesson() {
    if (!lesson) {
      return;
    }
    if (!window.confirm("Удалить урок целиком?")) {
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
    }
  }

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
      <main className="lesson-shell">
        <p className="catalog-message">{loading ? "Загрузка…" : "Урок не найден"}</p>
      </main>
    );
  }

  return (
    <div className="catalog-layout">
      <header className="catalog-topbar">
        <div className="catalog-brand">
          <Link to="/author" className="catalog-logo" style={{ textDecoration: "none", color: "inherit" }}>
            Learn · Редактор
          </Link>
          <span className="catalog-greeting">{user?.display_name ?? "Методист"}</span>
          <Link to="/author" className="back-link" style={{ marginLeft: "auto" }}>
            ← К списку уроков
          </Link>
        </div>
      </header>

      <main className="lesson-shell author-layout">
        <header className="author-lesson-header">
          <div className="author-lesson-heading">
            <h1>{lesson.title}</h1>
            <p className="meta">{lesson.module_title}</p>
          </div>
          <div className="author-toolbar">
            <div className="author-toolbar-group">
              <button type="button" onClick={saveLessonMeta} disabled={busy}>
                Сохранить урок
              </button>
              <button type="button" className="secondary" onClick={handleExport} disabled={busy}>
                Экспорт JSON
              </button>
            </div>
            <Link
              to={`/lessons/${lesson.id}?preview=1`}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-preview"
              aria-label="Открыть урок как видит ученик в новой вкладке"
            >
              <svg className="btn-preview-icon" width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
                <path
                  fill="currentColor"
                  d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"
                />
              </svg>
              Превью для ученика
              <svg className="btn-preview-external" width="14" height="14" viewBox="0 0 24 24" aria-hidden="true">
                <path
                  fill="currentColor"
                  d="M19 19H5V5h7V3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7h-2v7zM14 3v2h3.59l-9.83 9.83 1.41 1.41L19 6.41V10h2V3h-7z"
                />
              </svg>
            </Link>
            <button type="button" className="secondary btn-danger" onClick={handleDeleteLesson} disabled={busy}>
              Удалить урок
            </button>
          </div>
        </header>

        {message && <p className="step-status step-status-passed">{message}</p>}
        {error && <p className="catalog-message catalog-error">{error}</p>}

        <section className="author-section">
          <h2>Основное</h2>
          <label className="field">
            <span>Название</span>
            <input
              className="author-input"
              value={lesson.title}
              onChange={(e) => setLesson({ ...lesson, title: e.target.value })}
            />
          </label>
          <label className="field">
            <span>Краткое описание</span>
            <input
              className="author-input"
              value={lesson.summary ?? ""}
              onChange={(e) => setLesson({ ...lesson, summary: e.target.value })}
            />
          </label>
          <label className="field">
            <span>Хештеги</span>
            <input
              className="author-input"
              value={formatTagsInput(lesson.tags ?? [])}
              placeholder="Старт, Демо, Карта"
              onChange={(e) => setLesson({ ...lesson, tags: parseTagsInput(e.target.value) })}
            />
          </label>
          <RichTextEditor
            label="Инструкция"
            value={lesson.instruction_html}
            onChange={(instruction_html) => setLesson({ ...lesson, instruction_html })}
            rows={3}
          />
          <label className="field">
            <span>Deep link</span>
            <input
              className="author-input"
              value={lesson.deep_link_template ?? ""}
              onChange={(e) => setLesson({ ...lesson, deep_link_template: e.target.value })}
            />
          </label>
          <label className="field">
            <span>Тип проверки</span>
            <select
              className="author-select"
              value={lesson.verify.type}
              onChange={(e) =>
                setLesson({ ...lesson, verify: { ...lesson.verify, type: e.target.value } })
              }
            >
              {VERIFY_TYPES.map((type) => (
                <option key={type} value={type}>
                  {verifyTypeLabel(type)}
                </option>
              ))}
            </select>
          </label>
          <label className="field">
            <span>verify_config (JSON)</span>
            <textarea
              className="author-textarea"
              rows={4}
              value={verifyConfigJson}
              onChange={(e) => setVerifyConfigJson(e.target.value)}
            />
          </label>
        </section>

        <section className="author-section">
          <div className="author-section-header">
            <h2>Слайды</h2>
            <div className="step-actions">
              <button type="button" className="secondary" onClick={handleAddSlide} disabled={busy}>
                + Слайд
              </button>
            </div>
          </div>

          <div className="author-slide-tabs">
            {lesson.slides.map((slide) => (
              <button
                key={slide.id}
                type="button"
                className={`catalog-pill ${activeSlideId === slide.id ? "catalog-pill-active" : ""}`}
                onClick={() => setActiveSlideId(slide.id)}
              >
                {slide.order}. {slide.title}
              </button>
            ))}
          </div>

          {activeSlide && (
            <>
              <div className="step-actions">
                <button type="button" className="secondary" onClick={() => handleMoveSlide(-1)} disabled={busy}>
                  ↑
                </button>
                <button type="button" className="secondary" onClick={() => handleMoveSlide(1)} disabled={busy}>
                  ↓
                </button>
                <button type="button" onClick={saveActiveSlide} disabled={busy}>
                  Сохранить слайд
                </button>
                <label className="button secondary author-file-label">
                  Загрузить изображение
                  <input type="file" accept="image/png,image/webp,image/svg+xml" onChange={handleUploadImage} hidden />
                </label>
                <button type="button" className="secondary" onClick={handleDeleteSlide} disabled={busy}>
                  Удалить слайд
                </button>
              </div>

              <label className="field">
                <span>Заголовок слайда</span>
                <input
                  className="author-input"
                  value={activeSlide.title}
                  onChange={(e) => patchActiveSlide({ title: e.target.value })}
                />
              </label>
              <RichTextEditor
                label="Подпись"
                value={activeSlide.caption_html}
                onChange={(caption_html) => patchActiveSlide({ caption_html })}
                rows={2}
              />
              <RichTextEditor
                label="Ожидаемый результат"
                value={activeSlide.expected_result_html}
                onChange={(expected_result_html) => patchActiveSlide({ expected_result_html })}
                rows={2}
              />

              <div className="author-split">
                <div>
                  <h3>Редактор hotspots</h3>
                  <HotspotEditor
                    imagePath={activeSlide.image_path}
                    hotspots={activeSlide.hotspots}
                    onChange={patchHotspots}
                  />
                </div>
                <div>
                  <h3>Превью ученика</h3>
                  <ScreenshotGuide
                    imagePath={activeSlide.image_path}
                    alt={activeSlide.title}
                    hotspots={activeSlide.hotspots}
                    viewportResetKey={activeSlide.id}
                    activeHotspotId={previewHotspotId}
                    onHotspotSelect={setPreviewHotspotId}
                  />
                  {activeSlide.caption_html && (
                    <SafeHtml html={activeSlide.caption_html} className="slide-caption" />
                  )}
                  {activeSlide.expected_result_html && (
                    <ExpectedResult html={activeSlide.expected_result_html} />
                  )}
                </div>
              </div>
            </>
          )}
        </section>
      </main>
    </div>
  );
}
