import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";

import Box from "@mui/material/Box";

import Button from "@mui/material/Button";

import Chip from "@mui/material/Chip";

import IconButton from "@mui/material/IconButton";

import LinearProgress from "@mui/material/LinearProgress";

import Paper from "@mui/material/Paper";

import Stack from "@mui/material/Stack";

import Tooltip from "@mui/material/Tooltip";

import Typography from "@mui/material/Typography";

import { useEffect, useMemo, useState } from "react";

import { useNavigate, useSearchParams } from "react-router-dom";



import { getDashboard, LearnApiError, type ModuleDashboardItem } from "../../../api/learnApi";

import CatalogSidebar, { type StatusFilter } from "../components/CatalogSidebar";

import ModuleCatalogGroup from "../components/ModuleCatalogGroup";

import { PageError, PageLoading } from "../../../components/mui/PageStatus";

import PortalTopbar from "../../../components/PortalTopbar";

import {

  countVisibleLessons,

  getFilteredModuleGroups,

} from "../utils/catalogGrouping";

import { aggregateTagCounts, formatHashtag, normalizeTag } from "../../../utils/hashtags";

import { moduleProgressLabel } from "../../../utils/lessonUi";



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

    () => modules.flatMap((module) => module.lessons),

    [modules],

  );



  const popularTags = useMemo(() => aggregateTagCounts(allLessons), [allLessons]);



  const moduleGroups = useMemo(

    () => getFilteredModuleGroups(modules, selectedModuleId, statusFilter, activeTag),

    [modules, selectedModuleId, statusFilter, activeTag],

  );



  const visibleLessonCount = useMemo(() => countVisibleLessons(moduleGroups), [moduleGroups]);



  const totals = useMemo(

    () =>

      modules.reduce(

        (acc, module) => ({

          completed: acc.completed + module.completed_lessons,

          total: acc.total + module.total_lessons,

        }),

        { completed: 0, total: 0 },

      ),

    [modules],

  );



  const overallProgress = totals.total ? Math.round((totals.completed / totals.total) * 100) : 0;



  const selectedModule =

    selectedModuleId === "all"

      ? null

      : (modules.find((module) => module.id === selectedModuleId) ?? null);



  const headerProgress = selectedModule

    ? {

        percent: selectedModule.progress_percent,

        label: moduleProgressLabel(selectedModule.completed_lessons, selectedModule.total_lessons),

      }

    : {

        percent: overallProgress,

        label: moduleProgressLabel(totals.completed, totals.total),

      };



  const hasActiveFilters = statusFilter !== "all" || Boolean(activeTag);

  const showModuleAccordions = selectedModuleId === "all" && moduleGroups.length > 1;



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



  function resetFilters() {

    setStatusFilter("all");

    setActiveTag(null);

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

          <Box className="catalog-main-inner">

            <Stack component="header" spacing={1.5} className="catalog-page-header">

              <Stack

                direction={{ xs: "column", sm: "row" }}

                justifyContent="space-between"

                alignItems={{ xs: "flex-start", sm: "center" }}

                spacing={1}

              >

                <Box>

                  <Typography variant="h4" component="h1" fontWeight={800}>

                    Обучение

                  </Typography>

                  <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>

                    {selectedModule

                      ? selectedModule.title

                      : "Каталог модулей и уроков платформы"}

                  </Typography>

                </Box>

                <Tooltip title="Выберите модуль слева, отфильтруйте уроки по статусу или хештегу">

                  <IconButton size="small" aria-label="Подсказка по каталогу">

                    <InfoOutlinedIcon fontSize="small" />

                  </IconButton>

                </Tooltip>

              </Stack>



              {!loading && !error && totals.total > 0 && (

                <Box>

                  <Stack

                    direction="row"

                    justifyContent="space-between"

                    alignItems="center"

                    spacing={1}

                    sx={{ mb: 0.75 }}

                  >

                    <Typography variant="body2" color="text.secondary">

                      {headerProgress.label}

                    </Typography>

                    <Typography variant="body2" fontWeight={600} color="primary.main">

                      {headerProgress.percent}%

                    </Typography>

                  </Stack>

                  <LinearProgress

                    variant="determinate"

                    value={headerProgress.percent}

                    aria-label="Общий прогресс обучения"

                  />

                </Box>

              )}



              {!loading && !error && (

                <Stack direction="row" flexWrap="wrap" gap={0.75} useFlexGap>

                  <Chip

                    size="small"

                    variant="outlined"

                    label={`${visibleLessonCount} ${

                      visibleLessonCount === 1

                        ? "урок"

                        : visibleLessonCount >= 2 && visibleLessonCount <= 4

                          ? "урока"

                          : "уроков"

                    }`}

                  />

                  {selectedModuleId === "all" && moduleGroups.length > 0 && (

                    <Chip

                      size="small"

                      variant="outlined"

                      label={`${moduleGroups.length} ${

                        moduleGroups.length === 1 ? "модуль" : "модулей"

                      }`}

                    />

                  )}

                  {hasActiveFilters && (

                    <Chip size="small" color="primary" label="Фильтры активны" />

                  )}

                </Stack>

              )}

            </Stack>



            {activeTag && (

              <Paper variant="outlined" className="hashtag-filter-banner">

                <Typography variant="body2">

                  Активный фильтр:{" "}

                  <Typography component="span" fontWeight={600}>

                    {formatHashtag(activeTag)}

                  </Typography>

                </Typography>

                <Button size="small" variant="text" onClick={() => setActiveTag(null)}>

                  Сбросить

                </Button>

              </Paper>

            )}



            {loading && <PageLoading label="Загружаем каталог…" />}

            {error && <PageError message={error} />}



            {!loading && !error && moduleGroups.length === 0 && (

              <Paper variant="outlined" className="catalog-empty-state">

                <Typography variant="h6" component="h2" gutterBottom>

                  {hasActiveFilters ? "Ничего не найдено" : "Уроки пока недоступны"}

                </Typography>

                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>

                  {hasActiveFilters

                    ? "По выбранным фильтрам уроков нет. Попробуйте сбросить фильтры или выбрать другой модуль."

                    : "Когда появятся учебные модули, они отобразятся здесь."}

                </Typography>

                {hasActiveFilters && (

                  <Button variant="outlined" size="small" onClick={resetFilters}>

                    Сбросить фильтры

                  </Button>

                )}

              </Paper>

            )}



            {!loading && !error && moduleGroups.length > 0 && (

              <Stack spacing={3} useFlexGap className="catalog-module-groups">

                {moduleGroups.map((group, index) => (

                  <ModuleCatalogGroup

                    key={group.module.id}

                    module={group.module}

                    lessons={group.lessons}

                    collapsible={showModuleAccordions}

                    defaultExpanded={index === 0 || !showModuleAccordions}

                    activeTag={activeTag}

                    onTagClick={(tag, event) => {

                      event.preventDefault();

                      event.stopPropagation();

                      navigate(`/dashboard?tag=${encodeURIComponent(normalizeTag(tag))}`);

                    }}

                  />

                ))}

              </Stack>

            )}

          </Box>

        </main>

      </div>

    </div>

  );

}


