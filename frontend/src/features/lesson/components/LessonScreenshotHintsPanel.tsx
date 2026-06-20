import Badge from "@mui/material/Badge";
import Button from "@mui/material/Button";
import Collapse from "@mui/material/Collapse";
import Typography from "@mui/material/Typography";
import { useEffect, useRef, type KeyboardEvent } from "react";

import type { HotspotItem, LessonSlide } from "../../../types/lesson";
import { scrollIntoOverflowParent } from "../../../utils/scrollContainer";
import { toggleHotspotSelection } from "../../../utils/screenshotViewport";
import SafeHtml from "../../wiki/components/SafeHtml";

export function slideHotspotHints(slide: LessonSlide | null): HotspotItem[] {
  return slide?.hotspots ?? [];
}

type LessonScreenshotHintsPanelProps = {
  slide: LessonSlide | null;
  activeHotspotId?: string | null;
  onHotspotSelect?: (hotspotId: string | null) => void;
  /** When false, active hotspot never triggers scroll (author constructor). */
  scrollActiveItem?: boolean;
};

export default function LessonScreenshotHintsPanel({
  slide,
  activeHotspotId,
  onHotspotSelect,
  scrollActiveItem = true,
}: LessonScreenshotHintsPanelProps) {
  const listRef = useRef<HTMLUListElement>(null);
  const hotspots = slideHotspotHints(slide);

  useEffect(() => {
    if (!scrollActiveItem || !activeHotspotId || !listRef.current) {
      return;
    }
    const item = listRef.current.querySelector<HTMLElement>(`[data-hotspot-id="${activeHotspotId}"]`);
    if (item) {
      scrollIntoOverflowParent(item);
    }
  }, [activeHotspotId, scrollActiveItem]);

  const handleHotspotActivate = (hotspotId: string) => {
    onHotspotSelect?.(toggleHotspotSelection(activeHotspotId ?? null, hotspotId));
  };

  const handleHotspotKeyDown = (event: KeyboardEvent<HTMLButtonElement>, hotspotId: string) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      handleHotspotActivate(hotspotId);
    }
  };

  return (
    <aside className="lesson-screenshot-hints-panel" aria-label="Подсказки по экрану">
      <div className="lesson-panel-header lesson-hints-header">
        <div className="lesson-hints-header-main">
          <Typography
            variant="overline"
            color="primary"
            fontWeight="bold"
            className="lesson-panel-header-title"
          >
            Экран
          </Typography>
          {hotspots.length > 0 && (
            <Badge badgeContent={hotspots.length} color="default" className="lesson-hints-count">
              <span />
            </Badge>
          )}
        </div>
        {slide?.title && (
          <Typography variant="caption" color="text.secondary" className="lesson-hints-slide-name">
            {slide.title}
          </Typography>
        )}
      </div>

      <div className="lesson-hints-body">
        {hotspots.length === 0 ? (
          <div className="lesson-hints-empty">
            <Typography variant="body2" fontWeight={600} className="lesson-hints-empty-title">
              Меток нет
            </Typography>
            <Typography variant="caption" color="text.secondary">
              На этом слайде нет интерактивных подсказок — изучите скриншот и задание слева.
            </Typography>
          </div>
        ) : (
          <>
            <Typography variant="overline" color="text.secondary" className="lesson-hints-hint">
              Нажмите метку — область подсветится на скриншоте
            </Typography>
            <ul ref={listRef} className="lesson-hints-list" role="listbox" aria-label="Метки на скриншоте">
              {hotspots.map((hotspot, index) => {
                const isActive = activeHotspotId === hotspot.id;
                const hasDescription = Boolean(hotspot.description_html?.trim());
                const descriptionId = `lesson-hint-desc-${hotspot.id}`;

                return (
                  <li
                    key={hotspot.id}
                    data-hotspot-id={hotspot.id}
                    className={`lesson-hints-item${isActive ? " lesson-hints-item--active" : ""}`}
                    role="option"
                    aria-selected={isActive}
                  >
                    <Button
                      size="small"
                      variant={isActive ? "contained" : "outlined"}
                      fullWidth
                      className={`lesson-hints-btn${hotspot.pulse !== false ? " lesson-hints-btn--pulse" : ""}`}
                      aria-label={`Метка ${index + 1}: ${hotspot.label}`}
                      aria-expanded={isActive}
                      aria-controls={descriptionId}
                      onClick={() => handleHotspotActivate(hotspot.id)}
                      onKeyDown={(event) => handleHotspotKeyDown(event, hotspot.id)}
                    >
                      <span className="lesson-hints-btn-label">
                        {index + 1}. {hotspot.label}
                      </span>
                    </Button>
                    {!isActive && hasDescription ? (
                      <div aria-hidden="true">
                        <SafeHtml
                          html={hotspot.description_html ?? ""}
                          className="lesson-hints-description lesson-hints-description--collapsed"
                          tag="div"
                        />
                      </div>
                    ) : null}
                    <Collapse
                      in={isActive}
                      timeout="auto"
                      unmountOnExit
                      className="lesson-hints-item-collapse"
                    >
                      <div id={descriptionId} role="region" aria-label={`Описание метки ${index + 1}`}>
                        {hasDescription ? (
                          <SafeHtml
                            html={hotspot.description_html ?? ""}
                            className="lesson-hints-description"
                            tag="div"
                          />
                        ) : (
                          <Typography
                            variant="overline"
                            color="text.disabled"
                            className="lesson-hints-description-placeholder"
                          >
                            Область выделена на скриншоте
                          </Typography>
                        )}
                      </div>
                    </Collapse>
                  </li>
                );
              })}
            </ul>
          </>
        )}
      </div>
    </aside>
  );
}
