import Badge from "@mui/material/Badge";

import Button from "@mui/material/Button";

import Chip from "@mui/material/Chip";

import Divider from "@mui/material/Divider";

import LinearProgress from "@mui/material/LinearProgress";

import Stack from "@mui/material/Stack";

import TextField from "@mui/material/TextField";

import ToggleButton from "@mui/material/ToggleButton";

import ToggleButtonGroup from "@mui/material/ToggleButtonGroup";

import Typography from "@mui/material/Typography";

import { FormEvent, useEffect, useMemo, useState } from "react";



import type { ModuleDashboardItem } from "../../../types/lesson";

import type { StatusFilter } from "../utils/catalogGrouping";

import { formatHashtag, normalizeTag, type TagCount } from "../../../utils/hashtags";



export type { StatusFilter };



type StatusChoice = {

  value: StatusFilter;

  label: string;

};



const STATUS_ITEMS: StatusChoice[] = [

  { value: "all", label: "Все" },

  { value: "available", label: "Доступные" },

  { value: "completed", label: "Пройденные" },

];



const TAG_ROWS_COLLAPSED = 2;

const TAGS_PER_ROW_ESTIMATE = 2;

const TAG_COLLAPSED_LIMIT = TAG_ROWS_COLLAPSED * TAGS_PER_ROW_ESTIMATE;



type CatalogSidebarProps = {

  modules: ModuleDashboardItem[];

  selectedModuleId: string;

  statusFilter: StatusFilter;

  onModuleChange: (moduleId: string) => void;

  onStatusFilterChange: (filter: StatusFilter) => void;

  popularTags?: TagCount[];

  activeTag?: string | null;

  onTagClick?: (tag: string) => void;

};



function lessonCountLabel(completed: number, total: number): string {

  const lessonWord = total === 1 ? "урок" : total >= 2 && total <= 4 ? "урока" : "уроков";

  return `${completed} из ${total} ${lessonWord}`;

}



type ModuleNavItemProps = {

  title: string;

  selected: boolean;

  completedLessons: number;

  totalLessons: number;

  progressPercent: number;

  onSelect: () => void;

};



function ModuleNavItem({

  title,

  selected,

  completedLessons,

  totalLessons,

  progressPercent,

  onSelect,

}: ModuleNavItemProps) {

  return (

    <Stack

      spacing={0.5}

      className={`catalog-module-item-wrap${selected ? " catalog-module-item-wrap-active" : ""}`}

    >

      <Button

        size="small"

        variant={selected ? "contained" : "outlined"}

        fullWidth

        className="catalog-module-item"

        aria-current={selected ? "true" : undefined}

        onClick={onSelect}

        sx={{ justifyContent: "flex-start", textAlign: "left" }}

      >

        {title}

      </Button>

      <Typography variant="caption" color={selected ? "primary" : "text.secondary"}>

        {lessonCountLabel(completedLessons, totalLessons)}

      </Typography>

      <LinearProgress

        variant="determinate"

        value={progressPercent}

        color={selected ? "primary" : "inherit"}

        aria-hidden="true"

      />

    </Stack>

  );

}



export default function CatalogSidebar({

  modules,

  selectedModuleId,

  statusFilter,

  onModuleChange,

  onStatusFilterChange,

  popularTags = [],

  activeTag,

  onTagClick,

}: CatalogSidebarProps) {

  const [filtersOpen, setFiltersOpen] = useState(false);

  const [tagsExpanded, setTagsExpanded] = useState(false);

  const [tagQuery, setTagQuery] = useState(activeTag ?? "");



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



  const filteredTags = useMemo(() => {

    const query = normalizeTag(tagQuery).toLocaleLowerCase("ru");

    if (!query) {

      return popularTags;

    }

    return popularTags.filter(({ tag }) => tag.toLocaleLowerCase("ru").includes(query));

  }, [popularTags, tagQuery]);



  const hasMoreTags = filteredTags.length > TAG_COLLAPSED_LIMIT;

  const hiddenTagCount = Math.max(0, filteredTags.length - TAG_COLLAPSED_LIMIT);



  const hasActiveFilters = Boolean(activeTag) || statusFilter !== "all";

  const activeFilterCount = (activeTag ? 1 : 0) + (statusFilter !== "all" ? 1 : 0);



  useEffect(() => {

    setTagQuery(activeTag ?? "");

  }, [activeTag]);



  useEffect(() => {

    if (hasActiveFilters) {

      setFiltersOpen(true);

    }

  }, [hasActiveFilters]);



  function applyTagSearch(event?: FormEvent) {

    event?.preventDefault();

    if (!onTagClick) {

      return;

    }

    const normalized = normalizeTag(tagQuery);

    if (!normalized) {

      if (activeTag && onTagClick) {

        onTagClick(activeTag);

      }

      return;

    }

    onTagClick(normalized);

  }



  return (

    <aside className={`catalog-sidebar${filtersOpen ? " catalog-sidebar-filters-open" : ""}`}>

      <section className="catalog-sidebar-section">

        <Typography variant="overline" color="text.secondary" fontWeight={700} className="catalog-sidebar-label">

          Модули

        </Typography>

        <div className="catalog-nav-scroll">

          <nav className="catalog-nav" aria-label="Модули">

            <ModuleNavItem

              title="Все модули"

              selected={selectedModuleId === "all"}

              completedLessons={totals.completed}

              totalLessons={totals.total}

              progressPercent={overallProgress}

              onSelect={() => onModuleChange("all")}

            />

            {modules.map((module) => (

              <ModuleNavItem

                key={module.id}

                title={module.title}

                selected={selectedModuleId === module.id}

                completedLessons={module.completed_lessons}

                totalLessons={module.total_lessons}

                progressPercent={module.progress_percent}

                onSelect={() => onModuleChange(module.id)}

              />

            ))}

          </nav>

        </div>

      </section>



      <Badge

        badgeContent={activeFilterCount}

        color="primary"

        invisible={!hasActiveFilters}

        className="catalog-sidebar-filters-badge"

      >

        <Button

          className="catalog-sidebar-filters-toggle"

          size="small"

          variant="outlined"

          fullWidth

          aria-expanded={filtersOpen}

          onClick={() => setFiltersOpen((open) => !open)}

        >

          {filtersOpen ? "Скрыть фильтры" : "Фильтры и прогресс"}

        </Button>

      </Badge>



      <div className="catalog-filters">

        {popularTags.length > 0 && onTagClick && (

          <section className="catalog-filter-group">

            <Typography variant="overline" color="text.secondary" fontWeight={700} className="catalog-sidebar-label">

              Хештеги

            </Typography>

            <Stack

              component="form"

              direction="row"

              spacing={0.5}

              className="catalog-tag-search"

              onSubmit={applyTagSearch}

            >

              <TextField

                size="small"

                placeholder="#Демо"

                value={tagQuery}

                onChange={(event) => setTagQuery(event.target.value)}

                onKeyDown={(event) => {

                  if (event.key === "Enter") {

                    applyTagSearch();

                  }

                }}

                fullWidth

              />

              <Button type="submit" size="small" variant="outlined">

                Найти

              </Button>

            </Stack>

            {filteredTags.length > 0 ? (

              <div className={`catalog-filter-tags${tagsExpanded ? "" : " catalog-filter-tags-limited"}`}>

                {filteredTags.map(({ tag, count }) => {

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

                      title={`${count} ${count === 1 ? "урок" : "уроков"}`}

                      onClick={() => onTagClick(tag)}

                    />

                  );

                })}

              </div>

            ) : (

              <Typography variant="caption" color="text.secondary">

                Нет тегов по запросу

              </Typography>

            )}

            {!tagsExpanded && hasMoreTags && (

              <Button size="small" variant="text" onClick={() => setTagsExpanded(true)}>

                Ещё {hiddenTagCount}

              </Button>

            )}

            {tagsExpanded && hasMoreTags && (

              <Button size="small" variant="text" onClick={() => setTagsExpanded(false)}>

                Свернуть

              </Button>

            )}

          </section>

        )}



        <Divider flexItem />



        <section className="catalog-filter-group">

          <Typography variant="overline" color="text.secondary" fontWeight={700} className="catalog-sidebar-label">

            Статус урока

          </Typography>

          <ToggleButtonGroup

            exclusive

            fullWidth

            size="small"

            value={statusFilter}

            onChange={(_, value: StatusFilter | null) => {

              if (value) {

                onStatusFilterChange(value);

              }

            }}

            aria-label="Фильтр по статусу урока"

            className="catalog-status-toggle"

          >

            {STATUS_ITEMS.map((item) => (

              <ToggleButton key={item.value} value={item.value} aria-label={item.label}>

                {item.label}

              </ToggleButton>

            ))}

          </ToggleButtonGroup>

        </section>



        <Divider flexItem />



        <section className="catalog-filter-group catalog-filter-group-progress">

          <Typography variant="overline" color="text.secondary" fontWeight={700} className="catalog-sidebar-label">

            Прогресс по модулям

          </Typography>

          {modules

            .filter((m) => selectedModuleId === "all" || m.id === selectedModuleId)

            .map((module) => (

              <Stack key={module.id} spacing={0.5} className="catalog-progress-block">

                {selectedModuleId === "all" && (

                  <Typography variant="caption" fontWeight={600} className="catalog-progress-module">

                    {module.title}

                  </Typography>

                )}

                <LinearProgress variant="determinate" value={module.progress_percent} />

                <Typography variant="caption" color="text.secondary" className="catalog-progress-text">

                  {lessonCountLabel(module.completed_lessons, module.total_lessons)} · {module.progress_percent}%

                </Typography>

              </Stack>

            ))}

        </section>

      </div>

    </aside>

  );

}


