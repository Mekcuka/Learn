import Button from "@mui/material/Button";

import Chip from "@mui/material/Chip";

import TextField from "@mui/material/TextField";

import Typography from "@mui/material/Typography";

import { FormEvent, useEffect, useMemo, useState } from "react";

import { Link, useNavigate, useSearchParams } from "react-router-dom";

import "../../../styles/portal-wiki.css";

import { listWikiArticles, type WikiArticleListItem } from "../api/wikiApi";

import { LearnApiError } from "../../../api/learnApi";

import { useIsAuthor } from "../../auth/AuthContext";

import HashtagList from "../../../shared/content/HashtagList";

import PortalTopbar from "../../../components/PortalTopbar";

import { PageError, PageLoading } from "../../../components/mui/PageStatus";

import { aggregateTagCounts, formatHashtag, lessonHasTag, normalizeTag } from "../../../utils/hashtags";



export default function WikiPage() {

  const [searchParams, setSearchParams] = useSearchParams();

  const navigate = useNavigate();

  const isAuthor = useIsAuthor();

  const activeTag = normalizeTag(searchParams.get("tag") ?? "") || null;

  const [tagQuery, setTagQuery] = useState(activeTag ?? "");

  const [allArticles, setAllArticles] = useState<WikiArticleListItem[]>([]);

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState<string | null>(null);



  useEffect(() => {

    listWikiArticles()

      .then(setAllArticles)

      .catch((err: unknown) => {

        setError(err instanceof LearnApiError ? err.message : "Не удалось загрузить статьи Wiki");

      })

      .finally(() => setLoading(false));

  }, []);



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

          <div className="wiki-header-row">

            <h1>Wiki приложения</h1>

            {isAuthor && (

              <Button size="small" variant="outlined" onClick={() => navigate("/author/wiki")}>

                Создать статью

              </Button>

            )}

          </div>

          <p className="wiki-lead">

            Справочные материалы по демо-приложению и Learn Portal. Для практики используйте{" "}

            <Link to="/dashboard">каталог уроков</Link>.

          </p>



          {popularTags.length > 0 && (

            <div className="wiki-tag-cloud">

              <Typography variant="body2" color="text.secondary" className="wiki-tag-cloud-label">

                Темы:

              </Typography>

              <div className="catalog-filter-tags">

                {popularTags.map(({ tag }) => {

                  const isActive =

                    activeTag != null &&

                    activeTag.toLocaleLowerCase("ru") === tag.toLocaleLowerCase("ru");

                  return (

                    <Chip

                      key={tag}

                      size="small"

                      label={formatHashtag(tag)}

                      color={isActive ? "primary" : "default"}

                      variant={isActive ? "filled" : "outlined"}

                      onClick={() =>

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

              onChange={(event) => setTagQuery(event.target.value)}

              onKeyDown={(event) => {

                if (event.key === "Enter") {

                  applyTagSearch();

                }

              }}

              fullWidth

            />

            <Button type="submit" size="small" variant="contained">

              Найти

            </Button>

            {tagQuery && (

              <Button

                type="button"

                size="small"

                variant="text"

                onClick={() => {

                  setTagQuery("");

                  navigate("/wiki");

                }}

              >

                Сбросить

              </Button>

            )}

          </form>

        </header>



        {activeTag && (

          <div className="hashtag-filter-banner">

            <Typography variant="body2">

              Активный фильтр: <Typography component="span" fontWeight={600}>{formatHashtag(activeTag)}</Typography>

            </Typography>

            <Button size="small" variant="text" onClick={clearTagFilter}>

              Сбросить ✕

            </Button>

          </div>

        )}



        {loading && <PageLoading />}

        {error && <PageError message={error} />}



        {!loading && !error && articles.length === 0 && (

          <Typography color="text.secondary" className="catalog-message">

            Нет статей по выбранному тегу.

          </Typography>

        )}



        {!loading && !error && articles.length > 0 && (

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


