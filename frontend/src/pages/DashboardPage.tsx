import { useEffect, useMemo, useState } from "react";

import { useNavigate, useSearchParams } from "react-router-dom";



import { getDashboard, LearnApiError, type LessonListItem, type ModuleDashboardItem } from "../api/learnApi";

import CatalogSidebar, { type StatusFilter } from "../components/catalog/CatalogSidebar";

import LessonCatalogCard from "../components/catalog/LessonCatalogCard";

import { Button } from "@consta/uikit/Button";
import { Text } from "@consta/uikit/Text";

import { PageError, PageLoading } from "../components/consta/PageStatus";
import PortalTopbar from "../components/PortalTopbar";

import { aggregateTagCounts, formatHashtag, lessonHasTag, normalizeTag } from "../utils/hashtags";



type LessonWithModule = LessonListItem & { moduleId: string; moduleTitle: string };



function filterLessons(

  modules: ModuleDashboardItem[],

  moduleId: string,

  statusFilter: StatusFilter,

  activeTag: string | null,

): LessonWithModule[] {

  const source =

    moduleId === "all"

      ? modules.flatMap((module) =>

          module.lessons.map((lesson) => ({

            ...lesson,

            moduleId: module.id,

            moduleTitle: module.title,

          })),

        )

      : modules

          .filter((m) => m.id === moduleId)

          .flatMap((module) =>

            module.lessons.map((lesson) => ({

              ...lesson,

              moduleId: module.id,

              moduleTitle: module.title,

            })),

          );



  return source.filter((lesson) => {

    if (activeTag && !lessonHasTag(lesson.tags, activeTag)) {

      return false;

    }

    if (statusFilter === "completed") {

      return lesson.status === "completed";

    }

    if (statusFilter === "available") {

      return lesson.status !== "locked";

    }

    return true;

  });

}



export default function DashboardPage() {

  const [searchParams, setSearchParams] = useSearchParams();

  const navigate = useNavigate();

  const activeTag = normalizeTag(searchParams.get("tag") ?? "") || null;



  const [modules, setModules] = useState<ModuleDashboardItem[]>([]);

  const [selectedModuleId, setSelectedModuleId] = useState("all");

  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState<string | null>(null);



  useEffect(() => {

    getDashboard()

      .then((data) => setModules(data.modules))

      .catch((err: unknown) => {

        if (err instanceof LearnApiError) {

          setError(err.message);

        } else {

          setError("Не удалось загрузить каталог");

        }

      })

      .finally(() => setLoading(false));

  }, []);



  const allLessons = useMemo(

    () =>

      modules.flatMap((module) =>

        module.lessons.map((lesson) => ({

          ...lesson,

          moduleId: module.id,

          moduleTitle: module.title,

        })),

      ),

    [modules],

  );



  const popularTags = useMemo(() => aggregateTagCounts(allLessons), [allLessons]);



  const lessons = useMemo(

    () => filterLessons(modules, selectedModuleId, statusFilter, activeTag),

    [modules, selectedModuleId, statusFilter, activeTag],

  );



  const totalCount = useMemo(() => {

    if (selectedModuleId === "all") {

      return modules.reduce((sum, m) => sum + m.lessons.length, 0);

    }

    return modules.find((m) => m.id === selectedModuleId)?.lessons.length ?? 0;

  }, [modules, selectedModuleId]);



  const pageTitle =

    selectedModuleId === "all"

      ? "Уроки"

      : (modules.find((m) => m.id === selectedModuleId)?.title ?? "Уроки");



  function setActiveTag(tag: string | null) {

    const next = new URLSearchParams(searchParams);

    if (tag) {

      next.set("tag", normalizeTag(tag));

    } else {

      next.delete("tag");

    }

    setSearchParams(next, { replace: true });

  }



  function handleTagClick(tag: string) {

    setActiveTag(activeTag && normalizeTag(activeTag) === normalizeTag(tag) ? null : tag);

  }



  return (

    <div className="catalog-layout">

      <PortalTopbar active="lessons" />



      <div className="catalog-body">

        <CatalogSidebar

          modules={modules}

          selectedModuleId={selectedModuleId}

          statusFilter={statusFilter}

          onModuleChange={setSelectedModuleId}

          onStatusFilterChange={setStatusFilter}

          popularTags={popularTags}

          activeTag={activeTag}

          onTagClick={handleTagClick}

        />



        <main className="catalog-main">

          <header className="catalog-main-header">

            <h1 className="catalog-main-title">

              {pageTitle}

              <span className="catalog-info" title="Каталог учебных уроков">

                i

              </span>

            </h1>

            {!loading && !error && (

              <span className="catalog-count">

                {lessons.length} {lessons.length === 1 ? "урок" : "уроков"}

                {(statusFilter !== "all" || activeTag) && ` · из ${totalCount}`}

              </span>

            )}

          </header>



          {activeTag && (
            <div className="hashtag-filter-banner">
              <Text size="s">
                Активный фильтр: <Text as="span" weight="semibold">{formatHashtag(activeTag)}</Text>
              </Text>
              <Button size="xs" view="clear" label="Сбросить ✕" onClick={() => setActiveTag(null)} />
            </div>
          )}

          {loading && <PageLoading />}
          {error && <PageError message={error} />}

          {!loading && !error && lessons.length === 0 && (
            <Text size="m" view="secondary" className="catalog-message">
              Нет уроков по выбранным фильтрам.
            </Text>
          )}



          {!loading && !error && lessons.length > 0 && (

            <div className="catalog-grid">

              {lessons.map((lesson) => (

                <LessonCatalogCard

                  key={lesson.id}

                  lesson={lesson}

                  moduleTitle={lesson.moduleTitle}

                  activeTag={activeTag}

                  onTagClick={(tag, event) => {

                    event.preventDefault();

                    event.stopPropagation();

                    navigate(`/dashboard?tag=${encodeURIComponent(normalizeTag(tag))}`);

                  }}

                />

              ))}

            </div>

          )}

        </main>

      </div>

    </div>

  );

}


