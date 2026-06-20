import Chip from "@mui/material/Chip";
import Collapse from "@mui/material/Collapse";
import Typography from "@mui/material/Typography";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import PlaceOutlinedIcon from "@mui/icons-material/PlaceOutlined";
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
  slideIndex?: number;
  slideTotal?: number;
  activeHotspotId?: string | null;
  onHotspotSelect?: (hotspotId: string | null) => void;
  /** When false, active hotspot never triggers scroll (author constructor). */
  scrollActiveItem?: boolean;
};

function formatSlideLabel(slideIndex: number | undefined, slideTotal: number | undefined, slide: LessonSlide | null): string | null {
  if (slide?.title?.trim()) {
    return slide.title.trim();
  }
  if (slideIndex !== undefined) {
    const n = slideIndex + 1;
    if (slideTotal !== undefined && slideTotal > 0) {
      return `Слайд ${n} из ${slideTotal}`;
    }
    return `Слайд ${n}`;
  }
  return null;
}

export default function LessonScreenshotHintsPanel({
  slide,
  slideIndex,
  slideTotal,
  activeHotspotId,
  onHotspotSelect,
  scrollActiveItem = true,
}: LessonScreenshotHintsPanelProps) {
  const listRef = useRef<HTMLUListElement>(null);
  const hotspots = slideHotspotHints(slide);
  const slideLabel = formatSlideLabel(slideIndex, slideTotal, slide);
  const screenNumber =
    slideIndex !== undefined ? slideIndex + 1 : slide?.order !== undefined ? slide.order : null;

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
            {screenNumber !== null ? `Экран ${screenNumber}` : "Экран"}
          </Typography>
          {hotspots.length > 0 && (
            <Chip
              size="small"
              label={hotspots.length === 1 ? "1 метка" : `${hotspots.length} меток`}
              className="lesson-hints-count-chip"
              aria-label={`${hotspots.length} меток на слайде`}
            />
          )}
        </div>
        {slideLabel && (
          <Typography variant="caption" color="text.secondary" className="lesson-hints-slide-name">
            {slideLabel}
          </Typography>
        )}
      </div>

      <div className="lesson-hints-body">
        {hotspots.length === 0 ? (
          <div className="lesson-hints-empty">
            <PlaceOutlinedIcon className="lesson-hints-empty-icon" aria-hidden="true" />
            <Typography variant="body2" fontWeight={600} className="lesson-hints-empty-title">
              Меток нет
            </Typography>
            <Typography variant="caption" color="text.secondary" className="lesson-hints-empty-text">
              На этом слайде нет интерактивных подсказок — изучите скриншот и задание слева.
            </Typography>
          </div>
        ) : (
          <>
            <p className="lesson-hints-helper" role="note">
              <InfoOutlinedIcon className="lesson-hints-helper-icon" aria-hidden="true" />
              <span>Нажмите метку — область подсветится на скриншоте</span>
            </p>
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
                    <button
                      type="button"
                      className={`lesson-hints-card${hotspot.pulse !== false ? " lesson-hints-card--pulse" : ""}`}
                      aria-label={`Метка ${index + 1}: ${hotspot.label}`}
                      aria-expanded={isActive}
                      aria-controls={descriptionId}
                      onClick={() => handleHotspotActivate(hotspot.id)}
                      onKeyDown={(event) => handleHotspotKeyDown(event, hotspot.id)}
                    >
                      <span className="lesson-hints-index" aria-hidden="true">
                        {index + 1}
                      </span>
                      <span className="lesson-hints-card-content">
                        <span className="lesson-hints-title">{hotspot.label}</span>
                        {!isActive && hasDescription ? (
                          <SafeHtml
                            html={hotspot.description_html ?? ""}
                            className="lesson-hints-description lesson-hints-description--collapsed"
                            tag="div"
                          />
                        ) : null}
                      </span>
                      {hasDescription ? (
                        <ExpandMoreIcon
                          className={`lesson-hints-chevron${isActive ? " lesson-hints-chevron--open" : ""}`}
                          aria-hidden="true"
                        />
                      ) : null}
                    </button>
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
                            variant="caption"
                            color="text.secondary"
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
