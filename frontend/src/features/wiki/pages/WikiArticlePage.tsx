import Button from "@mui/material/Button";

import Typography from "@mui/material/Typography";

import { useEffect, useMemo, useState } from "react";

import { Link, Navigate, useNavigate, useParams } from "react-router-dom";

import "../../../styles/portal-wiki.css";

import { getWikiArticle, listWikiArticles, type WikiArticleDetail, type WikiArticleListItem } from "../api/wikiApi";

import { LearnApiError } from "../../../api/learnApi";

import { useIsAuthor } from "../../auth/AuthContext";

import PortalTopbar from "../../../components/PortalTopbar";

import HashtagList from "../../../shared/content/HashtagList";

import ContentHtml from "../components/ContentHtml";

import WikiTableOfContents from "../components/WikiTableOfContents";

import { PageError, PageLoading } from "../../../components/mui/PageStatus";

import { addHeadingIds } from "../utils/contentHtml";

export default function WikiArticlePage() {
  const { articleId } = useParams<{ articleId: string }>();
  const navigate = useNavigate();
  const isAuthor = useIsAuthor();
  const [article, setArticle] = useState<WikiArticleDetail | null>(null);
  const [allArticles, setAllArticles] = useState<WikiArticleListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!articleId) {
      setNotFound(true);
      setLoading(false);
      return;
    }

    Promise.all([getWikiArticle(articleId), listWikiArticles()])
      .then(([detail, list]) => {
        setArticle(detail);
        setAllArticles(list);
      })
      .catch((err: unknown) => {
        if (err instanceof LearnApiError && err.status === 404) {
          setNotFound(true);
          return;
        }
        setError(err instanceof LearnApiError ? err.message : "Не удалось загрузить статью");
      })
      .finally(() => setLoading(false));
  }, [articleId]);

  const bodyWithIds = useMemo(
    () => (article ? addHeadingIds(article.body_html) : ""),
    [article],
  );

  if (notFound) {
    return <Navigate to="/wiki" replace />;
  }

  const currentIndex = article ? allArticles.findIndex((item) => item.id === article.id) : -1;
  const prevArticle = currentIndex > 0 ? allArticles[currentIndex - 1] : null;
  const nextArticle =
    currentIndex >= 0 && currentIndex < allArticles.length - 1 ? allArticles[currentIndex + 1] : null;

  return (
    <div className="catalog-layout">
      <PortalTopbar active="wiki" />

      <main className="wiki-shell wiki-article-shell">
        <nav className="wiki-article-nav">
          <Button size="small" variant="text" onClick={() => navigate("/wiki")}>
            ← Все статьи
          </Button>
          {isAuthor && article && (
            <Button size="small" variant="outlined" onClick={() => navigate(`/author/wiki/${article.id}/edit`)}>
              Редактировать
            </Button>
          )}
        </nav>

        {loading && <PageLoading />}
        {error && <PageError message={error} />}

        {!loading && !error && article && (
          <article className="wiki-article">
            <header className="wiki-article-header">
              <HashtagList tags={article.tags} linkBase="/wiki" />
              <Typography variant="h4" fontWeight="bold" component="h1">
                {article.title}
              </Typography>
              <Typography variant="h6" color="text.secondary" className="wiki-article-summary">
                {article.summary}
              </Typography>
            </header>

            <WikiTableOfContents html={bodyWithIds} className="wiki-article-toc" />

            <ContentHtml html={bodyWithIds} className="wiki-article-body" />

            <footer className="wiki-article-footer">
              {prevArticle ? (
                <Link to={`/wiki/${prevArticle.id}`} className="wiki-article-adjacent">
                  ← {prevArticle.title}
                </Link>
              ) : (
                <span />
              )}
              {nextArticle ? (
                <Link to={`/wiki/${nextArticle.id}`} className="wiki-article-adjacent wiki-article-adjacent-next">
                  {nextArticle.title} →
                </Link>
              ) : (
                <span />
              )}
            </footer>
          </article>
        )}
      </main>
    </div>
  );
}
