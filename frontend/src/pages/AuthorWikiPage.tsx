import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import "../styles/author.css";

import {
  deleteAuthorWikiArticle,
  listAuthorWikiArticles,
  type WikiArticleListItem,
} from "../api/wikiApi";
import { LearnApiError } from "../api/learnApi";
import { PageError, PageLoading } from "../components/mui/PageStatus";
import PortalTopbar from "../components/PortalTopbar";
import { ConfirmModal } from "../components/mui/ConfirmModal";

export default function AuthorWikiPage() {
  const navigate = useNavigate();
  const [articles, setArticles] = useState<WikiArticleListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<WikiArticleListItem | null>(null);

  useEffect(() => {
    listAuthorWikiArticles()
      .then(setArticles)
      .catch((err: unknown) => {
        setError(err instanceof LearnApiError ? err.message : "Не удалось загрузить статьи");
      })
      .finally(() => setLoading(false));
  }, []);

  async function handleDelete() {
    if (!deleteTarget) {
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await deleteAuthorWikiArticle(deleteTarget.id);
      setArticles((prev) => prev.filter((item) => item.id !== deleteTarget.id));
      setDeleteTarget(null);
    } catch (err) {
      setError(err instanceof LearnApiError ? err.message : "Не удалось удалить статью");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="catalog-layout">
      <PortalTopbar active="author" />

      <main className="lesson-shell author-layout">
        <div className="author-wiki-header">
          <div>
            <Button
              size="small"
              variant="text"
              className="author-back-link"
              onClick={() => navigate("/author")}
              sx={{ px: 0, mb: 0.5 }}
            >
              ← К урокам
            </Button>
            <Typography variant="h4" fontWeight="bold" component="h1" className="catalog-main-title">
              Редактор Wiki
            </Typography>
          </div>
          <Button variant="contained" onClick={() => navigate("/author/wiki/new")}>
            Создать статью
          </Button>
        </div>

        {loading && <PageLoading />}
        {error && <PageError message={error} />}

        {!loading && articles.length === 0 && (
          <Typography color="text.secondary" className="catalog-message">
            Статей пока нет. Создайте первую.
          </Typography>
        )}

        {!loading && articles.length > 0 && (
          <ul className="author-wiki-list">
            {articles.map((article) => (
              <li key={article.id} className="author-wiki-list-item">
                <div>
                  <Typography variant="h6" component="h2">
                    {article.title}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {article.summary || "Без описания"}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    slug: {article.id}
                  </Typography>
                </div>
                <div className="author-wiki-list-actions">
                  <Button size="small" variant="outlined" onClick={() => navigate(`/author/wiki/${article.id}/edit`)}>
                    Редактировать
                  </Button>
                  <Button size="small" variant="text" onClick={() => navigate(`/wiki/${article.id}`)}>
                    Открыть
                  </Button>
                  <Button size="small" color="error" variant="text" onClick={() => setDeleteTarget(article)}>
                    Удалить
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </main>

      <ConfirmModal
        isOpen={deleteTarget != null}
        title="Удалить статью?"
        message={deleteTarget ? `Статья «${deleteTarget.title}» будет удалена без возможности восстановления.` : ""}
        confirmLabel="Удалить"
        cancelLabel="Отмена"
        danger
        loading={busy}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
