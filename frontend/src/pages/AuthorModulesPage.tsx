import DragIndicatorIcon from "@mui/icons-material/DragIndicator";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import MenuItem from "@mui/material/MenuItem";
import Select from "@mui/material/Select";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { FormEvent, useEffect, useRef, useState, type DragEvent } from "react";
import { useNavigate } from "react-router-dom";

import "../styles/author.css";

import {
  createAuthorLesson,
  duplicateAuthorLesson,
  getAuthorModuleLessons,
  getAuthorModules,
  importAuthorLesson,
  reorderAuthorLessons,
  type AuthorLessonListItem,
  type AuthorModule,
} from "../api/authorApi";
import { LearnApiError } from "../api/learnApi";
import { PageError, PageLoading } from "../components/mui/PageStatus";
import PortalTopbar from "../components/PortalTopbar";
import { verifyTypeLabel } from "../utils/verifyTypes";

export default function AuthorModulesPage() {
  const navigate = useNavigate();
  const [modules, setModules] = useState<AuthorModule[]>([]);
  const [selectedModule, setSelectedModule] = useState<AuthorModule | null>(null);
  const [lessons, setLessons] = useState<AuthorLessonListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newTitle, setNewTitle] = useState("");
  const [busy, setBusy] = useState(false);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [overIndex, setOverIndex] = useState<number | null>(null);
  const skipInitialLessonsFetchRef = useRef(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    getAuthorModules()
      .then(async (data) => {
        if (cancelled) {
          return;
        }
        setModules(data);
        if (data.length === 0) {
          return;
        }
        const firstModule = data[0];
        setSelectedModule(firstModule);
        const lessonData = await getAuthorModuleLessons(firstModule.id);
        if (!cancelled) {
          setLessons(lessonData);
        }
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setError(err instanceof LearnApiError ? err.message : "Не удалось загрузить модули");
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
  }, []);

  useEffect(() => {
    if (!selectedModule || skipInitialLessonsFetchRef.current) {
      skipInitialLessonsFetchRef.current = false;
      return;
    }
    getAuthorModuleLessons(selectedModule.id)
      .then(setLessons)
      .catch((err: unknown) => {
        setError(err instanceof LearnApiError ? err.message : "Не удалось загрузить уроки");
      });
  }, [selectedModule]);

  async function handleCreateLesson(event: FormEvent) {
    event.preventDefault();
    if (!selectedModule || !newTitle.trim()) {
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const lesson = await createAuthorLesson(selectedModule.id, { title: newTitle.trim() });
      setNewTitle("");
      setLessons((prev) => [
        ...prev,
        {
          id: lesson.id,
          order: lesson.order,
          title: lesson.title,
          summary: lesson.summary,
          slide_count: lesson.slides.length,
          verify_type: lesson.verify.type,
        },
      ]);
    } catch (err) {
      setError(err instanceof LearnApiError ? err.message : "Не удалось создать урок");
    } finally {
      setBusy(false);
    }
  }

  async function handleImport(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file || !selectedModule) {
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const text = await file.text();
      const payload = JSON.parse(text) as Record<string, unknown>;
      const lesson = await importAuthorLesson(selectedModule.id, payload);
      setLessons((prev) => {
        const without = prev.filter((item) => item.id !== lesson.id);
        return [
          ...without,
          {
            id: lesson.id,
            order: lesson.order,
            title: lesson.title,
            summary: lesson.summary,
            slide_count: lesson.slides.length,
            verify_type: lesson.verify.type,
          },
        ].sort((a, b) => a.order - b.order);
      });
    } catch (err) {
      setError(err instanceof LearnApiError ? err.message : "Не удалось импортировать JSON");
    } finally {
      setBusy(false);
      event.target.value = "";
    }
  }

  async function handleDuplicateLesson(lesson: AuthorLessonListItem) {
    if (!selectedModule) {
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const copy = await duplicateAuthorLesson(lesson.id);
      setLessons((prev) =>
        [
          ...prev,
          {
            id: copy.id,
            order: copy.order,
            title: copy.title,
            summary: copy.summary,
            slide_count: copy.slides.length,
            verify_type: copy.verify.type,
          },
        ].sort((a, b) => a.order - b.order),
      );
    } catch (err) {
      setError(err instanceof LearnApiError ? err.message : "Не удалось дублировать урок");
    } finally {
      setBusy(false);
    }
  }

  async function handleReorderLessons(lessonIds: string[]) {
    if (!selectedModule) {
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const reordered = await reorderAuthorLessons(selectedModule.id, lessonIds);
      setLessons(reordered);
    } catch (err) {
      setError(err instanceof LearnApiError ? err.message : "Не удалось изменить порядок уроков");
    } finally {
      setBusy(false);
    }
  }

  function handleLessonDragStart(index: number, event: DragEvent) {
    if (busy || lessons.length < 2) {
      event.preventDefault();
      return;
    }
    setDragIndex(index);
    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData("text/plain", String(index));
  }

  function handleLessonDragOver(index: number, event: DragEvent) {
    event.preventDefault();
    if (dragIndex === null || dragIndex === index) {
      return;
    }
    setOverIndex(index);
  }

  function handleLessonDrop(index: number, event: DragEvent) {
    event.preventDefault();
    if (dragIndex === null || dragIndex === index) {
      setDragIndex(null);
      setOverIndex(null);
      return;
    }
    const ids = lessons.map((lesson) => lesson.id);
    const [moved] = ids.splice(dragIndex, 1);
    ids.splice(index, 0, moved);
    void handleReorderLessons(ids);
    setDragIndex(null);
    setOverIndex(null);
  }

  function handleLessonDragEnd() {
    setDragIndex(null);
    setOverIndex(null);
  }

  return (
    <div className="catalog-layout catalog-layout--author-modules">
      <PortalTopbar active="author" />

      <main className="author-modules-shell">
        <div className="author-modules-inner">
          <header className="author-modules-header">
            <div className="author-modules-header__text">
              <Typography variant="h4" fontWeight="bold" component="h1" className="catalog-main-title">
                Редактор уроков
              </Typography>
              <Typography variant="body2" color="text.secondary" className="author-modules-subtitle">
                {selectedModule
                  ? `${selectedModule.title} · ${lessons.length} ${lessons.length === 1 ? "урок" : lessons.length < 5 ? "урока" : "уроков"}`
                  : "Выберите модуль и управляйте уроками"}
              </Typography>
            </div>
            <Button size="small" variant="outlined" onClick={() => navigate("/author/wiki")}>
              Редактор Wiki
            </Button>
          </header>

          {loading && <PageLoading />}
          {error && <PageError message={error} />}

          {!loading && modules.length === 0 && (
            <Typography color="text.secondary" className="catalog-message">
              Модулей пока нет.
            </Typography>
          )}

          {!loading && modules.length > 0 && (
            <>
              <section className="author-modules-toolbar" aria-label="Модуль и действия">
                <FormControl className="author-modules-module-select" size="small" fullWidth>
                  <InputLabel id="author-module-label">Модуль</InputLabel>
                  <Select
                    labelId="author-module-label"
                    label="Модуль"
                    value={selectedModule?.id ?? ""}
                    onChange={(event) => {
                      const module = modules.find((item) => item.id === event.target.value) ?? null;
                      setSelectedModule(module);
                    }}
                  >
                    {modules.map((module) => (
                      <MenuItem key={module.id} value={module.id}>
                        {module.title} ({module.lesson_count})
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                <form className="author-inline-form author-modules-create-form" onSubmit={handleCreateLesson}>
                  <TextField
                    className="author-inline-form-field"
                    size="small"
                    placeholder="Название нового урока"
                    value={newTitle}
                    onChange={(event) => setNewTitle(event.target.value)}
                  />
                  <Button type="submit" variant="contained" size="small" disabled={busy || !newTitle.trim()}>
                    Создать урок
                  </Button>
                  <Button
                    type="button"
                    variant="outlined"
                    size="small"
                    disabled={busy}
                    onClick={() => document.getElementById("author-import-input")?.click()}
                  >
                    Импорт JSON
                  </Button>
                  <input
                    id="author-import-input"
                    type="file"
                    accept="application/json"
                    onChange={handleImport}
                    hidden
                  />
                </form>
              </section>

              <section className="author-modules-list-section" aria-label="Уроки модуля">
                <div className="author-modules-list-heading">
                  <Typography variant="subtitle1" fontWeight={700} component="h2">
                    Уроки
                  </Typography>
                  {lessons.length >= 2 && (
                    <Typography variant="caption" color="text.secondary">
                      Перетащите для изменения порядка
                    </Typography>
                  )}
                </div>

                {lessons.length === 0 && (
                  <Typography color="text.secondary" className="author-modules-empty">
                    В этом модуле пока нет уроков. Создайте первый или импортируйте JSON.
                  </Typography>
                )}

                {lessons.length > 0 && (
                  <ul className="author-lesson-list author-modules-lesson-list">
                    {lessons.map((lesson, index) => {
                      const isDragging = dragIndex === index;
                      const isOver = overIndex === index && dragIndex !== index;
                      return (
                        <li
                          key={lesson.id}
                          className={`author-lesson-item${isDragging ? " author-lesson-item-dragging" : ""}${isOver ? " author-lesson-item-over" : ""}`}
                          draggable={!busy && lessons.length >= 2}
                          onDragStart={(event) => handleLessonDragStart(index, event)}
                          onDragOver={(event) => handleLessonDragOver(index, event)}
                          onDrop={(event) => handleLessonDrop(index, event)}
                          onDragEnd={handleLessonDragEnd}
                        >
                          {lessons.length >= 2 && (
                            <span className="author-slide-reorder-handle" aria-hidden="true">
                              <DragIndicatorIcon fontSize="small" />
                            </span>
                          )}
                          <div className="author-lesson-item-body">
                            <Typography fontWeight={600} component="strong" className="author-lesson-item-title">
                              <span className="author-lesson-item-order">{lesson.order}.</span> {lesson.title}
                              {lesson.has_unpublished_changes && (
                                <Chip
                                  size="small"
                                  color="warning"
                                  label="Черновик"
                                  sx={{ ml: 1, verticalAlign: "middle" }}
                                />
                              )}
                            </Typography>
                            {lesson.summary && (
                              <Typography variant="body2" color="text.secondary" className="author-lesson-item-summary">
                                {lesson.summary}
                              </Typography>
                            )}
                            <Typography variant="body2" color="text.secondary" className="meta">
                              {lesson.slide_count} слайдов · {verifyTypeLabel(lesson.verify_type)}
                            </Typography>
                          </div>
                          <div className="author-lesson-item-actions">
                            <Button size="small" variant="text" onClick={() => navigate(`/author/lessons/${lesson.id}`)}>
                              Редактировать
                            </Button>
                            <Button
                              size="small"
                              variant="outlined"
                              disabled={busy}
                              onClick={() => void handleDuplicateLesson(lesson)}
                            >
                              Дублировать
                            </Button>
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </section>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
