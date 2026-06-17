import { Button } from "@consta/uikit/Button";
import { Tag } from "@consta/uikit/Tag";
import { Text } from "@consta/uikit/Text";
import { TextField } from "@consta/uikit/TextField";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";

import HashtagList from "../components/HashtagList";
import PortalTopbar from "../components/PortalTopbar";
import { listWikiArticles } from "../content/wikiArticles";
import { aggregateTagCounts, formatHashtag, lessonHasTag, normalizeTag } from "../utils/hashtags";

export default function WikiPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const activeTag = normalizeTag(searchParams.get("tag") ?? "") || null;
  const [tagQuery, setTagQuery] = useState(activeTag ?? "");

  const allArticles = listWikiArticles();

  const articles = useMemo(
    () => allArticles.filter((article) => lessonHasTag(article.tags, activeTag)),
    [allArticles, activeTag],
  );

  const popularTags = useMemo(() => aggregateTagCounts(allArticles), [allArticles]);

  useEffect(() => {
    setTagQuery(activeTag ?? "");
  }, [activeTag]);

  function clearTagFilter() {
    const next = new URLSearchParams(searchParams);
    next.delete("tag");
    setSearchParams(next, { replace: true });
  }

  function applyTagSearch(event?: FormEvent) {
    event?.preventDefault();
    const normalized = normalizeTag(tagQuery);
    if (!normalized) {
      navigate("/wiki");
      return;
    }
    navigate(`/wiki?tag=${encodeURIComponent(normalized)}`);
  }

  return (
    <div className="catalog-layout">
      <PortalTopbar active="wiki" />

      <main className="wiki-shell">
        <header className="wiki-header">
          <Link to="/" className="back-link">
            ← На главную
          </Link>
          <h1>Wiki приложения</h1>
          <p className="wiki-lead">
            Справочные материалы по демо-приложению и Learn Portal. Для практики используйте{" "}
            <Link to="/dashboard">каталог уроков</Link>.
          </p>

          {popularTags.length > 0 && (
            <div className="wiki-tag-cloud">
              <Text size="s" view="secondary" className="wiki-tag-cloud-label">
                Темы:
              </Text>
              <div className="catalog-filter-tags">
                {popularTags.map(({ tag }) => {
                  const isActive =
                    activeTag != null &&
                    activeTag.toLocaleLowerCase("ru") === tag.toLocaleLowerCase("ru");
                  return (
                    <Tag
                      key={tag}
                      size="s"
                      mode="check"
                      label={formatHashtag(tag)}
                      checked={isActive}
                      onChange={() =>
                        navigate(isActive ? "/wiki" : `/wiki?tag=${encodeURIComponent(tag)}`)
                      }
                    />
                  );
                })}
              </div>
            </div>
          )}

          <form className="wiki-tag-search" onSubmit={applyTagSearch}>
            <TextField
              label="Поиск по хештегу"
              placeholder="Например, #Демо или Демо"
              value={tagQuery}
              onChange={(value) => setTagQuery(value ?? "")}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  applyTagSearch();
                }
              }}
            />
            <Button type="submit" size="s" label="Найти" />
            {tagQuery && (
              <Button
                type="button"
                size="s"
                view="clear"
                label="Сбросить"
                onClick={() => {
                  setTagQuery("");
                  navigate("/wiki");
                }}
              />
            )}
          </form>
        </header>

        {activeTag && (
          <div className="hashtag-filter-banner">
            <Text size="s">
              Активный фильтр: <Text as="span" weight="semibold">{formatHashtag(activeTag)}</Text>
            </Text>
            <Button size="xs" view="clear" label="Сбросить ✕" onClick={clearTagFilter} />
          </div>
        )}

        {articles.length === 0 ? (
          <Text size="m" view="secondary" className="catalog-message">
            Нет статей по выбранному тегу.
          </Text>
        ) : (
          <ul className="wiki-article-list">
            {articles.map((article) => (
              <li key={article.id}>
                <Link to={`/wiki/${article.id}`} className="wiki-article-card">
                  <div className="wiki-article-card-head">
                    <h2>{article.title}</h2>
                    <HashtagList tags={article.tags} activeTag={activeTag} linkBase="/wiki" />
                  </div>
                  <p>{article.summary}</p>
                  <span className="wiki-article-read">Читать →</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </main>
    </div>
  );
}
