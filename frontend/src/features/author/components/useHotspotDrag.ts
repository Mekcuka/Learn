import {
  useCallback,
  useEffect,
  useRef,
  type Dispatch,
  type MouseEvent as ReactMouseEvent,
  type RefObject,
  type SetStateAction,
} from "react";

import type { HotspotItem, HotspotKind } from "../../../types/lesson";
import { defaultHotspotLabel, pinRectAtPoint } from "../../../utils/hotspots";
import {
  clientDeltaToImagePercent,
  clientPointToImagePercent,
  getObjectFitContainRect,
} from "../../../utils/imageContentRect";
import type { HotspotToolMode } from "./HotspotToolToolbar";
import {
  clamp,
  type DraftRect,
  type DragState,
  type LiveRect,
} from "./hotspotEditorUtils";

type UseHotspotDragOptions = {
  containerRef: RefObject<HTMLDivElement | null>;
  viewportPan: { x: number; y: number };
  viewportZoom: number;
  hotspotsRef: RefObject<HotspotItem[]>;
  onChangeRef: RefObject<(hotspots: HotspotItem[]) => void>;
  toolMode: HotspotToolMode;
  toolModeRef: RefObject<HotspotToolMode>;
  spacePressed: boolean;
  selectedId: string | null;
  setSelectedId: (id: string | null) => void;
  startPanDrag: (event: ReactMouseEvent) => void;
  setDraft: Dispatch<SetStateAction<DraftRect | null>>;
  setLiveRect: Dispatch<SetStateAction<LiveRect | null>>;
};

export function useHotspotDrag({
  containerRef,
  viewportPan,
  viewportZoom,
  hotspotsRef,
  onChangeRef,
  toolMode,
  toolModeRef,
  spacePressed,
  selectedId,
  setSelectedId,
  startPanDrag,
  setDraft,
  setLiveRect,
}: UseHotspotDragOptions) {
  const draftRef = useRef<DraftRect | null>(null);
  const liveRectRef = useRef<LiveRect | null>(null);
  const dragRef = useRef<DragState | null>(null);
  const dragListenersRef = useRef<{ move: (event: MouseEvent) => void; up: (event: MouseEvent) => void } | null>(null);
  const dragRafRef = useRef<number | null>(null);
  const pendingPointerRef = useRef<{ clientX: number; clientY: number } | null>(null);

  const setDraftTracked = useCallback(
    (next: DraftRect | null) => {
      draftRef.current = next;
      setDraft(next);
    },
    [setDraft],
  );

  const setLiveRectTracked = useCallback(
    (next: LiveRect | null) => {
      liveRectRef.current = next;
      setLiveRect(next);
    },
    [setLiveRect],
  );

  const updateHotspot = useCallback((id: string, patch: Partial<HotspotItem>) => {
    onChangeRef.current(
      hotspotsRef.current.map((item) => (item.id === id ? { ...item, ...patch } : item)),
    );
  }, [hotspotsRef, onChangeRef]);

  const removeHotspot = useCallback(
    (id: string) => {
      onChangeRef.current(hotspotsRef.current.filter((item) => item.id !== id));
      if (selectedId === id) {
        setSelectedId(null);
      }
    },
    [hotspotsRef, onChangeRef, selectedId, setSelectedId],
  );

  const addHotspotFromDraft = useCallback(
    (rect: DraftRect, kind: HotspotKind) => {
      if (rect.width_pct < 1 || rect.height_pct < 1) {
        return;
      }
      const id = `hotspot-${Date.now()}`;
      const next: HotspotItem = {
        id,
        label: defaultHotspotLabel(kind),
        x_pct: rect.x_pct,
        y_pct: rect.y_pct,
        width_pct: rect.width_pct,
        height_pct: rect.height_pct,
        pulse: kind === "region",
        ...(kind !== "region" ? { kind } : {}),
      };
      onChangeRef.current([...hotspotsRef.current, next]);
      setSelectedId(id);
    },
    [hotspotsRef, onChangeRef, setSelectedId],
  );

  const addPinHotspot = useCallback(
    (x_pct: number, y_pct: number) => {
      const rect = pinRectAtPoint(x_pct, y_pct);
      const id = `hotspot-${Date.now()}`;
      const next: HotspotItem = {
        id,
        label: defaultHotspotLabel("pin"),
        ...rect,
        kind: "pin",
        pulse: false,
      };
      onChangeRef.current([...hotspotsRef.current, next]);
      setSelectedId(id);
    },
    [hotspotsRef, onChangeRef, setSelectedId],
  );

  const pointerToPercent = useCallback(
    (clientX: number, clientY: number) => {
      const container = containerRef.current;
      const img = container?.querySelector(".screenshot-image") as HTMLImageElement | null;
      if (!container || !img || img.naturalWidth <= 0 || img.naturalHeight <= 0) {
        return { x_pct: 0, y_pct: 0 };
      }
      const rect = container.getBoundingClientRect();
      const { x_pct, y_pct } = clientPointToImagePercent(
        clientX,
        clientY,
        rect,
        container.clientWidth,
        container.clientHeight,
        img.naturalWidth,
        img.naturalHeight,
        { panX: viewportPan.x, panY: viewportPan.y, zoom: viewportZoom },
      );
      return {
        x_pct: clamp(x_pct, 0, 100),
        y_pct: clamp(y_pct, 0, 100),
      };
    },
    [containerRef, viewportPan.x, viewportPan.y, viewportZoom],
  );

  const pointerDeltaToPercent = useCallback(
    (clientX: number, clientY: number, startClientX: number, startClientY: number) => {
      const container = containerRef.current;
      const img = container?.querySelector(".screenshot-image") as HTMLImageElement | null;
      if (!container || !img || img.naturalWidth <= 0 || img.naturalHeight <= 0) {
        return { dx: 0, dy: 0 };
      }
      const contentRect = getObjectFitContainRect(
        container.clientWidth,
        container.clientHeight,
        img.naturalWidth,
        img.naturalHeight,
      );
      return clientDeltaToImagePercent(
        clientX - startClientX,
        clientY - startClientY,
        contentRect,
        viewportZoom,
      );
    },
    [containerRef, viewportZoom],
  );

  const applyPointerMove = useCallback(
    (clientX: number, clientY: number) => {
      const drag = dragRef.current;
      const container = containerRef.current;
      if (!drag || !container) {
        return;
      }

      if (drag.mode === "draw") {
        const { x_pct, y_pct } = pointerToPercent(clientX, clientY);
        const left = Math.min(drag.startX, x_pct);
        const top = Math.min(drag.startY, y_pct);
        setDraftTracked({
          x_pct: left,
          y_pct: top,
          width_pct: Math.abs(x_pct - drag.startX),
          height_pct: Math.abs(y_pct - drag.startY),
        });
        return;
      }

      const { dx, dy } = pointerDeltaToPercent(clientX, clientY, drag.startX, drag.startY);
      const origin = drag.origin as HotspotItem;

      if (drag.mode === "move" && drag.hotspotId) {
        setLiveRectTracked({
          id: drag.hotspotId,
          x_pct: clamp(origin.x_pct + dx, 0, 100 - origin.width_pct),
          y_pct: clamp(origin.y_pct + dy, 0, 100 - origin.height_pct),
          width_pct: origin.width_pct,
          height_pct: origin.height_pct,
        });
        return;
      }

      if (drag.mode === "resize" && drag.hotspotId) {
        setLiveRectTracked({
          id: drag.hotspotId,
          x_pct: origin.x_pct,
          y_pct: origin.y_pct,
          width_pct: clamp(origin.width_pct + dx, 1, 100 - origin.x_pct),
          height_pct: clamp(origin.height_pct + dy, 1, 100 - origin.y_pct),
        });
      }
    },
    [containerRef, pointerDeltaToPercent, pointerToPercent, setDraftTracked, setLiveRectTracked],
  );

  const endDrag = useCallback(() => {
    if (dragRafRef.current !== null) {
      cancelAnimationFrame(dragRafRef.current);
      dragRafRef.current = null;
    }
    pendingPointerRef.current = null;

    const drag = dragRef.current;
    if (drag?.mode === "draw" && draftRef.current) {
      addHotspotFromDraft(draftRef.current, toolModeRef.current === "zoom" ? "zoom" : "region");
    } else if ((drag?.mode === "move" || drag?.mode === "resize") && drag.hotspotId && liveRectRef.current) {
      const { id, x_pct, y_pct, width_pct, height_pct } = liveRectRef.current;
      updateHotspot(id, { x_pct, y_pct, width_pct, height_pct });
    }

    dragRef.current = null;
    setDraftTracked(null);
    setLiveRectTracked(null);

    if (dragListenersRef.current) {
      document.removeEventListener("mousemove", dragListenersRef.current.move);
      document.removeEventListener("mouseup", dragListenersRef.current.up);
      dragListenersRef.current = null;
    }
  }, [addHotspotFromDraft, setDraftTracked, setLiveRectTracked, toolModeRef, updateHotspot]);

  const startDrag = useCallback(
    (drag: DragState) => {
      endDrag();
      dragRef.current = drag;

      const onMove = (event: MouseEvent) => {
        pendingPointerRef.current = { clientX: event.clientX, clientY: event.clientY };
        if (dragRafRef.current !== null) {
          return;
        }
        dragRafRef.current = requestAnimationFrame(() => {
          dragRafRef.current = null;
          const pointer = pendingPointerRef.current;
          if (pointer) {
            applyPointerMove(pointer.clientX, pointer.clientY);
          }
        });
      };

      const onUp = () => {
        endDrag();
      };

      dragListenersRef.current = { move: onMove, up: onUp };
      document.addEventListener("mousemove", onMove);
      document.addEventListener("mouseup", onUp);
    },
    [applyPointerMove, endDrag],
  );

  useEffect(() => {
    return () => {
      if (dragRafRef.current !== null) {
        cancelAnimationFrame(dragRafRef.current);
      }
      if (dragListenersRef.current) {
        document.removeEventListener("mousemove", dragListenersRef.current.move);
        document.removeEventListener("mouseup", dragListenersRef.current.up);
      }
    };
  }, []);

  const handleFrameMouseDown = useCallback(
    (event: ReactMouseEvent) => {
      if (spacePressed) {
        event.preventDefault();
        startPanDrag(event);
        return;
      }
      if ((event.target as HTMLElement).closest(".hotspot-editor-handle, .hotspot-editor-zone, .hotspot-editor-pin")) {
        return;
      }
      const { x_pct, y_pct } = pointerToPercent(event.clientX, event.clientY);
      if (toolMode === "pin") {
        addPinHotspot(x_pct, y_pct);
        return;
      }
      setSelectedId(null);
      setLiveRectTracked(null);
      setDraftTracked({ x_pct, y_pct, width_pct: 0, height_pct: 0 });
      startDrag({
        mode: "draw",
        startX: x_pct,
        startY: y_pct,
        origin: { x_pct, y_pct, width_pct: 0, height_pct: 0 },
      });
    },
    [
      addPinHotspot,
      pointerToPercent,
      setDraftTracked,
      setLiveRectTracked,
      setSelectedId,
      spacePressed,
      startDrag,
      startPanDrag,
      toolMode,
    ],
  );

  const handleHotspotMouseDown = useCallback(
    (event: ReactMouseEvent, hotspot: HotspotItem) => {
      event.preventDefault();
      event.stopPropagation();
      setSelectedId(hotspot.id);
      setDraftTracked(null);
      setLiveRectTracked({
        id: hotspot.id,
        x_pct: hotspot.x_pct,
        y_pct: hotspot.y_pct,
        width_pct: hotspot.width_pct,
        height_pct: hotspot.height_pct,
      });
      startDrag({
        mode: "move",
        startX: event.clientX,
        startY: event.clientY,
        origin: hotspot,
        hotspotId: hotspot.id,
      });
    },
    [setDraftTracked, setLiveRectTracked, setSelectedId, startDrag],
  );

  const handleResizeMouseDown = useCallback(
    (event: ReactMouseEvent, hotspot: HotspotItem) => {
      event.preventDefault();
      event.stopPropagation();
      setSelectedId(hotspot.id);
      setDraftTracked(null);
      setLiveRectTracked({
        id: hotspot.id,
        x_pct: hotspot.x_pct,
        y_pct: hotspot.y_pct,
        width_pct: hotspot.width_pct,
        height_pct: hotspot.height_pct,
      });
      startDrag({
        mode: "resize",
        startX: event.clientX,
        startY: event.clientY,
        origin: hotspot,
        hotspotId: hotspot.id,
      });
    },
    [setDraftTracked, setLiveRectTracked, setSelectedId, startDrag],
  );

  const nudgeSelectedHotspot = useCallback(
    (patch: Partial<Pick<HotspotItem, "x_pct" | "y_pct" | "width_pct" | "height_pct">>) => {
      if (!selectedId) {
        return;
      }
      const current = hotspotsRef.current.find((item) => item.id === selectedId);
      if (!current) {
        return;
      }
      updateHotspot(selectedId, {
        x_pct: patch.x_pct ?? current.x_pct,
        y_pct: patch.y_pct ?? current.y_pct,
        width_pct: patch.width_pct ?? current.width_pct,
        height_pct: patch.height_pct ?? current.height_pct,
      });
    },
    [hotspotsRef, selectedId, updateHotspot],
  );

  return {
    updateHotspot,
    removeHotspot,
    handleFrameMouseDown,
    handleHotspotMouseDown,
    handleResizeMouseDown,
    nudgeSelectedHotspot,
  };
}
