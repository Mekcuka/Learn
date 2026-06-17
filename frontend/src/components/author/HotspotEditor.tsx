import { useCallback, useRef, useState, type MouseEvent as ReactMouseEvent } from "react";

import type { HotspotItem } from "../../api/learnApi";

type HotspotEditorProps = {
  imagePath: string;
  hotspots: HotspotItem[];
  onChange: (hotspots: HotspotItem[]) => void;
};

type DragMode = "draw" | "move" | "resize" | null;

type DraftRect = {
  x_pct: number;
  y_pct: number;
  width_pct: number;
  height_pct: number;
};

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function toPercent(value: number, total: number) {
  if (total <= 0) {
    return 0;
  }
  return (value / total) * 100;
}

export default function HotspotEditor({ imagePath, hotspots, onChange }: HotspotEditorProps) {
  const frameRef = useRef<HTMLDivElement>(null);
  const [selectedId, setSelectedId] = useState<string | null>(hotspots[0]?.id ?? null);
  const [draft, setDraft] = useState<DraftRect | null>(null);
  const dragRef = useRef<{
    mode: DragMode;
    startX: number;
    startY: number;
    origin: HotspotItem | DraftRect;
    hotspotId?: string;
  } | null>(null);

  const updateHotspot = useCallback(
    (id: string, patch: Partial<HotspotItem>) => {
      onChange(hotspots.map((item) => (item.id === id ? { ...item, ...patch } : item)));
    },
    [hotspots, onChange],
  );

  const removeHotspot = useCallback(
    (id: string) => {
      onChange(hotspots.filter((item) => item.id !== id));
      if (selectedId === id) {
        setSelectedId(null);
      }
    },
    [hotspots, onChange, selectedId],
  );

  const addHotspotFromDraft = useCallback(
    (rect: DraftRect) => {
      if (rect.width_pct < 1 || rect.height_pct < 1) {
        return;
      }
      const id = `hotspot-${Date.now()}`;
      const next: HotspotItem = {
        id,
        label: "Новая зона",
        x_pct: rect.x_pct,
        y_pct: rect.y_pct,
        width_pct: rect.width_pct,
        height_pct: rect.height_pct,
        pulse: true,
      };
      onChange([...hotspots, next]);
      setSelectedId(id);
    },
    [hotspots, onChange],
  );

  const pointerToPercent = useCallback((clientX: number, clientY: number) => {
    const frame = frameRef.current;
    if (!frame) {
      return { x_pct: 0, y_pct: 0 };
    }
    const rect = frame.getBoundingClientRect();
    return {
      x_pct: clamp(toPercent(clientX - rect.left, rect.width), 0, 100),
      y_pct: clamp(toPercent(clientY - rect.top, rect.height), 0, 100),
    };
  }, []);

  function handleFrameMouseDown(event: ReactMouseEvent) {
    if ((event.target as HTMLElement).closest(".hotspot-editor-handle")) {
      return;
    }
    const { x_pct, y_pct } = pointerToPercent(event.clientX, event.clientY);
    dragRef.current = { mode: "draw", startX: x_pct, startY: y_pct, origin: { x_pct, y_pct, width_pct: 0, height_pct: 0 } };
    setDraft({ x_pct, y_pct, width_pct: 0, height_pct: 0 });
    setSelectedId(null);
  }

  function handleHotspotMouseDown(event: ReactMouseEvent, hotspot: HotspotItem) {
    event.stopPropagation();
    setSelectedId(hotspot.id);
    dragRef.current = {
      mode: "move",
      startX: event.clientX,
      startY: event.clientY,
      origin: hotspot,
      hotspotId: hotspot.id,
    };
  }

  function handleResizeMouseDown(event: ReactMouseEvent, hotspot: HotspotItem) {
    event.stopPropagation();
    setSelectedId(hotspot.id);
    dragRef.current = {
      mode: "resize",
      startX: event.clientX,
      startY: event.clientY,
      origin: hotspot,
      hotspotId: hotspot.id,
    };
  }

  function handleMouseMove(event: ReactMouseEvent) {
    const drag = dragRef.current;
    const frame = frameRef.current;
    if (!drag || !frame) {
      return;
    }

    if (drag.mode === "draw") {
      const { x_pct, y_pct } = pointerToPercent(event.clientX, event.clientY);
      const left = Math.min(drag.startX, x_pct);
      const top = Math.min(drag.startY, y_pct);
      setDraft({
        x_pct: left,
        y_pct: top,
        width_pct: Math.abs(x_pct - drag.startX),
        height_pct: Math.abs(y_pct - drag.startY),
      });
      return;
    }

    const rect = frame.getBoundingClientRect();
    const dx = toPercent(event.clientX - drag.startX, rect.width);
    const dy = toPercent(event.clientY - drag.startY, rect.height);
    const origin = drag.origin as HotspotItem;

    if (drag.mode === "move" && drag.hotspotId) {
      updateHotspot(drag.hotspotId, {
        x_pct: clamp(origin.x_pct + dx, 0, 100 - origin.width_pct),
        y_pct: clamp(origin.y_pct + dy, 0, 100 - origin.height_pct),
      });
      return;
    }

    if (drag.mode === "resize" && drag.hotspotId) {
      updateHotspot(drag.hotspotId, {
        width_pct: clamp(origin.width_pct + dx, 1, 100 - origin.x_pct),
        height_pct: clamp(origin.height_pct + dy, 1, 100 - origin.y_pct),
      });
    }
  }

  function handleMouseUp() {
    if (dragRef.current?.mode === "draw" && draft) {
      addHotspotFromDraft(draft);
    }
    dragRef.current = null;
    setDraft(null);
  }

  return (
    <div className="hotspot-editor">
      <p className="meta">Нарисуйте зону на скрине или перетащите существующую.</p>
      <div
        ref={frameRef}
        className="hotspot-editor-frame screenshot-frame"
        onMouseDown={handleFrameMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        <img src={imagePath} alt="" className="screenshot-image" draggable={false} />
        <div className="screenshot-overlay">
          {hotspots.map((hotspot) => (
            <div
              key={hotspot.id}
              className={`hotspot-editor-zone ${selectedId === hotspot.id ? "hotspot-editor-zone-active" : ""}`}
              style={{
                left: `${hotspot.x_pct}%`,
                top: `${hotspot.y_pct}%`,
                width: `${hotspot.width_pct}%`,
                height: `${hotspot.height_pct}%`,
              }}
              onMouseDown={(event) => handleHotspotMouseDown(event, hotspot)}
            >
              <span className="hotspot-label">{hotspot.label}</span>
              <button
                type="button"
                className="hotspot-editor-handle"
                aria-label="Изменить размер"
                onMouseDown={(event) => handleResizeMouseDown(event, hotspot)}
              />
            </div>
          ))}
          {draft && (
            <div
              className="hotspot-editor-zone hotspot-editor-draft"
              style={{
                left: `${draft.x_pct}%`,
                top: `${draft.y_pct}%`,
                width: `${draft.width_pct}%`,
                height: `${draft.height_pct}%`,
              }}
            />
          )}
        </div>
      </div>

      <ul className="hotspot-editor-list">
        {hotspots.map((hotspot) => (
          <li key={hotspot.id} className="hotspot-editor-list-item">
            <input
              type="text"
              value={hotspot.label}
              onChange={(e) => updateHotspot(hotspot.id, { label: e.target.value })}
              className="author-input"
              placeholder="Подпись зоны"
            />
            <textarea
              className="author-textarea hotspot-editor-description"
              rows={2}
              value={hotspot.description_html ?? ""}
              placeholder="Описание для ученика (HTML или текст)"
              onChange={(e) => updateHotspot(hotspot.id, { description_html: e.target.value })}
            />
            <div className="hotspot-editor-list-actions">
              <label className="catalog-radio">
                <input
                  type="checkbox"
                  checked={hotspot.pulse !== false}
                  onChange={(e) => updateHotspot(hotspot.id, { pulse: e.target.checked })}
                />
                <span>Пульс</span>
              </label>
              <button type="button" className="secondary" onClick={() => removeHotspot(hotspot.id)}>
                Удалить
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
