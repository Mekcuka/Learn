import { Button } from "@consta/uikit/Button";
import { ProgressLine } from "@consta/uikit/ProgressLine";
import { Tag } from "@consta/uikit/Tag";
import { Text } from "@consta/uikit/Text";
import { TextField } from "@consta/uikit/TextField";
import { FormEvent, useEffect, useMemo, useState } from "react";

import type { ModuleDashboardItem } from "../../api/learnApi";
import { formatHashtag, normalizeTag, type TagCount } from "../../utils/hashtags";

export type StatusFilter = "all" | "available" | "completed";

type StatusChoice = {
  value: StatusFilter;
  label: string;
};

const STATUS_ITEMS: StatusChoice[] = [
  { value: "all", label: "Любой" },
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
    <button
      type="button"
      className={`catalog-module-item${selected ? " catalog-module-item-active" : ""}`}
      aria-current={selected ? "true" : undefined}
      onClick={onSelect}
    >
      <span className="catalog-module-item-head">
        <Text
          size="s"
          view="primary"
          weight={selected ? "semibold" : "medium"}
          className="catalog-module-item-title"
        >
          {title}
        </Text>
        <Text size="2xs" view="secondary" className="catalog-module-item-meta">
          {lessonCountLabel(completedLessons, totalLessons)}
        </Text>
      </span>
      <ProgressLine value={progressPercent} size="s" aria-hidden="true" />
    </button>
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
        <Text size="2xs" view="secondary" weight="semibold" transform="uppercase" className="catalog-sidebar-label">
          Модули
        </Text>
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

      <Button
        className="catalog-sidebar-filters-toggle"
        size="s"
        view="secondary"
        width="full"
        label={filtersOpen ? "Скрыть фильтры" : "Фильтры и прогресс"}
        aria-expanded={filtersOpen}
        onClick={() => setFiltersOpen((open) => !open)}
      />

      <div className="catalog-filters">
        {popularTags.length > 0 && onTagClick && (
          <section className="catalog-filter-group">
            <Text size="2xs" view="secondary" weight="semibold" transform="uppercase" className="catalog-sidebar-label">
              Хештеги
            </Text>
            <form className="catalog-tag-search" onSubmit={applyTagSearch}>
              <TextField
                size="s"
                placeholder="#Демо"
                value={tagQuery}
                onChange={(value) => setTagQuery(value ?? "")}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    applyTagSearch();
                  }
                }}
              />
              <Button type="submit" size="xs" view="secondary" label="Найти" />
            </form>
            {filteredTags.length > 0 ? (
              <div
                className={`catalog-filter-tags${tagsExpanded ? "" : " catalog-filter-tags-limited"}`}
              >
                {filteredTags.map(({ tag, count }) => {
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
                      title={`${count} ${count === 1 ? "урок" : "уроков"}`}
                      onChange={() => onTagClick(tag)}
                    />
                  );
                })}
              </div>
            ) : (
              <Text size="xs" view="secondary">
                Нет тегов по запросу
              </Text>
            )}
            {!tagsExpanded && hasMoreTags && (
              <Button
                size="xs"
                view="clear"
                label={`Ещё ${hiddenTagCount}`}
                onClick={() => setTagsExpanded(true)}
              />
            )}
            {tagsExpanded && hasMoreTags && (
              <Button size="xs" view="clear" label="Свернуть" onClick={() => setTagsExpanded(false)} />
            )}
          </section>
        )}

        <section className="catalog-filter-group">
          <Text size="2xs" view="secondary" weight="semibold" transform="uppercase" className="catalog-sidebar-label">
            Статус
          </Text>
          <div className="catalog-status-list">
            {STATUS_ITEMS.map((item) => (
              <Button
                key={item.value}
                size="xs"
                width="full"
                view={statusFilter === item.value ? "primary" : "ghost"}
                label={item.label}
                onClick={() => onStatusFilterChange(item.value)}
              />
            ))}
          </div>
        </section>

        <section className="catalog-filter-group catalog-filter-group-progress">
          <Text size="2xs" view="secondary" weight="semibold" transform="uppercase" className="catalog-sidebar-label">
            Прогресс
          </Text>
          {modules
            .filter((m) => selectedModuleId === "all" || m.id === selectedModuleId)
            .map((module) => (
              <div key={module.id} className="catalog-progress-block">
                {selectedModuleId === "all" && (
                  <Text size="xs" weight="medium" className="catalog-progress-module">
                    {module.title}
                  </Text>
                )}
                <ProgressLine value={module.progress_percent} size="s" />
                <Text size="2xs" view="secondary" className="catalog-progress-text">
                  {lessonCountLabel(module.completed_lessons, module.total_lessons)} · {module.progress_percent}%
                </Text>
              </div>
            ))}
        </section>
      </div>
    </aside>
  );
}
