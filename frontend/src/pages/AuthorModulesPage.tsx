import { FormEvent, useEffect, useState } from "react";
import { Link } from "react-router-dom";

import {
  createAuthorLesson,
  getAuthorModuleLessons,
  getAuthorModules,
  importAuthorLesson,
  type AuthorLessonListItem,
  type AuthorModule,
} from "../api/authorApi";
import { LearnApiError } from "../api/learnApi";
import { useAuth } from "../auth/AuthContext";
import { verifyTypeLabel } from "../utils/verifyTypes";

export default function AuthorModulesPage() {
  const { user } = useAuth();
  const [modules, setModules] = useState<AuthorModule[]>([]);
  const [selectedModuleId, setSelectedModuleId] = useState<string | null>(null);
  const [lessons, setLessons] = useState<AuthorLessonListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newTitle, setNewTitle] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    getAuthorModules()
      .then((data) => {
        setModules(data);
        if (data.length > 0) {
          setSelectedModuleId(data[0].id);
        }
      })
      .catch((err: unknown) => {
        setError(err instanceof LearnApiError ? err.message : "Не удалось загрузить модули");
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!selectedModuleId) {
      return;
    }
    getAuthorModuleLessons(selectedModuleId)
      .then(setLessons)
      .catch((err: unknown) => {
        setError(err instanceof LearnApiError ? err.message : "Не удалось загрузить уроки");
      });
  }, [selectedModuleId]);

  async function handleCreateLesson(event: FormEvent) {
    event.preventDefault();
    if (!selectedModuleId || !newTitle.trim()) {
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const lesson = await createAuthorLesson(selectedModuleId, { title: newTitle.trim() });
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
    if (!file || !selectedModuleId) {
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const text = await file.text();
      const payload = JSON.parse(text) as Record<string, unknown>;
      const lesson = await importAuthorLesson(selectedModuleId, payload);
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

  return (
    <div className="catalog-layout">
      <header className="catalog-topbar">
        <div className="catalog-brand">
          <Link to="/author" className="catalog-logo" style={{ textDecoration: "none", color: "inherit" }}>
            Learn · Редактор
          </Link>
          <span className="catalog-greeting">{user?.display_name ?? "Методист"}</span>
          <Link to="/" className="back-link" style={{ marginLeft: "auto" }}>
            На главную
          </Link>
        </div>
      </header>

      <main className="lesson-shell author-layout">
        <h1 className="catalog-main-title">Редактор уроков</h1>
        {loading && <p className="catalog-message">Загрузка…</p>}
        {error && <p className="catalog-message catalog-error">{error}</p>}

        {!loading && (
          <>
            <label className="field">
              <span>Модуль</span>
              <select
                value={selectedModuleId ?? ""}
                onChange={(e) => setSelectedModuleId(e.target.value)}
                className="author-select"
              >
                {modules.map((module) => (
                  <option key={module.id} value={module.id}>
                    {module.title} ({module.lesson_count})
                  </option>
                ))}
              </select>
            </label>

            <form className="author-inline-form" onSubmit={handleCreateLesson}>
              <input
                type="text"
                placeholder="Название нового урока"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                className="author-input"
              />
              <button type="submit" disabled={busy || !newTitle.trim()}>
                Создать урок
              </button>
              <label className="button secondary author-file-label">
                Импорт JSON
                <input type="file" accept="application/json" onChange={handleImport} hidden />
              </label>
            </form>

            <ul className="author-lesson-list">
              {lessons.map((lesson) => (
                <li key={lesson.id} className="author-lesson-item">
                  <div>
                    <strong>{lesson.order}. {lesson.title}</strong>
                    <p className="meta">
                      {lesson.slide_count} слайдов · {verifyTypeLabel(lesson.verify_type)}
                    </p>
                  </div>
                  <Link to={`/author/lessons/${lesson.id}`} className="back-link">
                    Редактировать
                  </Link>
                </li>
              ))}
            </ul>
          </>
        )}
      </main>
    </div>
  );
}
