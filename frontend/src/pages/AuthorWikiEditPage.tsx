import Button from "@mui/material/Button";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { FormEvent, useEffect, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";

import "../styles/author.css";
import "../styles/quiz-editor.css";

import { LearnApiError } from "../api/learnApi";
import {
  createAuthorWikiArticle,
  getAuthorWikiArticle,
  updateAuthorWikiArticle,
  type WikiArticleDetail,
} from "../api/wikiApi";
import { PageError, PageLoading } from "../components/mui/PageStatus";
import PortalTopbar from "../components/PortalTopbar";
import RichTextEditor from "../features/author/components/RichTextEditor";
import { formatTagsInput, parseTagsInput, slugFromTitle } from "../utils/wikiSlug";

const EMPTY_ARTICLE: WikiArticleDetail = {
  id: "",
  order: 0,
  title: "",
  summary: "",
  tags: [],
  body_html: "<p></p>",
};

export default function AuthorWikiEditPage() {
  const { slug } = useParams<{ slug: string }>();
  const location = useLocation();
  const isNew = location.pathname.endsWith("/new");
  const navigate = useNavigate();
  const [article, setArticle] = useState<WikiArticleDetail>(EMPTY_ARTICLE);
  const [slugValue, setSlugValue] = useState("");
  const [slugTouched, setSlugTouched] = useState(false);
  const [tagsInput, setTagsInput] = useState("");
  const [loading, setLoading] = useState(!isNew);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (isNew) {
      return;
    }
    if (!slug) {
      navigate("/author/wiki", { replace: true });
      return;
    }
    getAuthorWikiArticle(slug)
      .then((data) => {
        setArticle(data);
        setSlugValue(data.id);
        setTagsInput(formatTagsInput(data.tags));
      })
      .catch((err: unknown) => {
        setError(err instanceof LearnApiError ? err.message : "Не удалось загрузить статью");
      })
      .finally(() => setLoading(false));
  }, [isNew, slug, navigate]);

  useEffect(() => {
    if (!isNew || slugTouched || !article.title.trim()) {
      return;
    }
    setSlugValue(slugFromTitle(article.title));
  }, [article.title, isNew, slugTouched]);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!article.title.trim()) {
      setError("Укажите заголовок статьи");
      return;
    }

    setBusy(true);
    setError(null);
    const tags = parseTagsInput(tagsInput);

    try {
      if (isNew) {
        const created = await createAuthorWikiArticle({
          id: slugValue.trim() || undefined,
          title: article.title.trim(),
          summary: article.summary.trim(),
          body_html: article.body_html,
          tags,
        });
        navigate(`/author/wiki/${created.id}/edit`, { replace: true });
        return;
      }

      const updated = await updateAuthorWikiArticle(article.id, {
        title: article.title.trim(),
        summary: article.summary.trim(),
        body_html: article.body_html,
        tags,
      });
      setArticle(updated);
      setTagsInput(formatTagsInput(updated.tags));
    } catch (err) {
      setError(err instanceof LearnApiError ? err.message : "Не удалось сохранить статью");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="catalog-layout">
      <PortalTopbar active="author" />

      <main className="lesson-shell author-layout">
        <Button
          size="small"
          variant="text"
          className="author-back-link"
          onClick={() => navigate("/author/wiki")}
          sx={{ alignSelf: "flex-start", px: 0, mb: 0.5 }}
        >
          ← К списку статей
        </Button>
        <Typography variant="h4" fontWeight="bold" component="h1" className="catalog-main-title">
          {isNew ? "Новая статья Wiki" : "Редактирование статьи"}
        </Typography>

        {loading && <PageLoading />}
        {error && <PageError message={error} />}

        {!loading && (
          <form className="author-wiki-form" onSubmit={handleSubmit}>
            <TextField
              label="Заголовок"
              value={article.title}
              onChange={(event) => setArticle({ ...article, title: event.target.value })}
              required
              fullWidth
              margin="normal"
            />
            <TextField
              label="Краткое описание"
              value={article.summary}
              onChange={(event) => setArticle({ ...article, summary: event.target.value })}
              fullWidth
              margin="normal"
              multiline
              minRows={2}
            />
            <TextField
              label="Идентификатор (slug)"
              value={slugValue}
              onChange={(event) => {
                setSlugTouched(true);
                setSlugValue(event.target.value);
              }}
              disabled={!isNew}
              helperText={isNew ? "Используется в URL: /wiki/…" : "Идентификатор нельзя изменить после создания"}
              fullWidth
              margin="normal"
            />
            <TextField
              label="Теги"
              value={tagsInput}
              onChange={(event) => setTagsInput(event.target.value)}
              helperText="Через запятую, например: Демо, Старт"
              fullWidth
              margin="normal"
            />
            <RichTextEditor
              label="Текст статьи"
              value={article.body_html}
              onChange={(body_html) => setArticle({ ...article, body_html })}
              rows={8}
              editorMode="wiki"
              showPreview
            />

            <div className="author-wiki-form-actions">
              <Button type="submit" variant="contained" disabled={busy}>
                {busy ? "Сохранение…" : "Сохранить"}
              </Button>
              {!isNew && (
                <Button type="button" variant="outlined" onClick={() => navigate(`/wiki/${article.id}`)}>
                  Просмотр
                </Button>
              )}
              <Button type="button" variant="text" onClick={() => navigate("/author/wiki")}>
                Отмена
              </Button>
            </div>
          </form>
        )}
      </main>
    </div>
  );
}
