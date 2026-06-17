import { Link, Navigate, useParams } from "react-router-dom";

import PortalTopbar from "../components/PortalTopbar";
import HashtagList from "../components/HashtagList";
import SafeHtml from "../components/SafeHtml";
import { getWikiArticle, listWikiArticles } from "../content/wikiArticles";

export default function WikiArticlePage() {
  const { articleId } = useParams<{ articleId: string }>();
  const article = articleId ? getWikiArticle(articleId) : undefined;
  const allArticles = listWikiArticles();

  if (!article) {
    return <Navigate to="/wiki" replace />;
  }

  const currentIndex = allArticles.findIndex((item) => item.id === article.id);
  const prevArticle = currentIndex > 0 ? allArticles[currentIndex - 1] : null;
  const nextArticle =
    currentIndex >= 0 && currentIndex < allArticles.length - 1
      ? allArticles[currentIndex + 1]
      : null;

  return (
    <div className="catalog-layout">
      <PortalTopbar active="wiki" />

      <main className="wiki-shell wiki-article-shell">
        <nav className="wiki-article-nav">
          <Link to="/wiki" className="back-link">
            ← Все статьи
          </Link>
        </nav>

        <article className="wiki-article">
          <header className="wiki-article-header">
            <HashtagList tags={article.tags} linkBase="/wiki" />
            <h1>{article.title}</h1>
            <p className="wiki-article-summary">{article.summary}</p>
          </header>

          <SafeHtml html={article.body_html} className="wiki-article-body" tag="div" />

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
      </main>
    </div>
  );
}
