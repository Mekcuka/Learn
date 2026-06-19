import Typography from "@mui/material/Typography";

import {

  useCallback,

  useEffect,

  useRef,

  useState,

  type MouseEvent as ReactMouseEvent,

} from "react";



import type { HotspotItem } from "../../../types/lesson";

import { useScreenshotViewport } from "../../lesson/hooks/useScreenshotViewport";

import ScreenshotToolbar from "./ScreenshotToolbar";

import HotspotEditorFrame from "./HotspotEditorFrame";

import HotspotEditorList from "./HotspotEditorList";

import HotspotEditorProperties from "./HotspotEditorProperties";

import HotspotToolToolbar, { type HotspotToolMode } from "./HotspotToolToolbar";

import { clamp, isEditableTarget, type DraftRect, type LiveRect } from "./hotspotEditorUtils";

import { useHotspotDrag } from "./useHotspotDrag";



type HotspotEditorProps = {

  imagePath: string;

  hotspots: HotspotItem[];

  onChange: (hotspots: HotspotItem[]) => void;

  selectedId?: string | null;

  onSelectedIdChange?: (id: string | null) => void;

  showNumericFields?: boolean;

  viewportResetKey?: string;

};



export default function HotspotEditor({

  imagePath,

  hotspots,

  onChange,

  selectedId: controlledSelectedId,

  onSelectedIdChange,

  showNumericFields = true,

  viewportResetKey,

}: HotspotEditorProps) {

  const viewport = useScreenshotViewport({ resetKey: viewportResetKey ?? imagePath });

  const frameRef = viewport.frameRef;

  const hotspotsRef = useRef(hotspots);

  const onChangeRef = useRef(onChange);

  hotspotsRef.current = hotspots;

  onChangeRef.current = onChange;



  const [spacePressed, setSpacePressed] = useState(false);

  const [toolMode, setToolMode] = useState<HotspotToolMode>("region");

  const toolModeRef = useRef(toolMode);

  toolModeRef.current = toolMode;



  const [internalSelectedId, setInternalSelectedId] = useState<string | null>(null);

  const selectedId = controlledSelectedId !== undefined ? controlledSelectedId : internalSelectedId;



  const setSelectedId = useCallback(

    (id: string | null) => {

      if (onSelectedIdChange) {

        onSelectedIdChange(id);

      } else {

        setInternalSelectedId(id);

      }

    },

    [onSelectedIdChange],

  );



  const [draft, setDraft] = useState<DraftRect | null>(null);

  const [liveRect, setLiveRect] = useState<LiveRect | null>(null);



  const startPanDrag = useCallback(

    (event: ReactMouseEvent) => {

      let lastX = event.clientX;

      let lastY = event.clientY;



      const onMove = (moveEvent: MouseEvent) => {

        const dx = moveEvent.clientX - lastX;

        const dy = moveEvent.clientY - lastY;

        lastX = moveEvent.clientX;

        lastY = moveEvent.clientY;

        viewport.panBy(dx, dy);

      };



      const onUp = () => {

        document.removeEventListener("mousemove", onMove);

        document.removeEventListener("mouseup", onUp);

      };



      document.addEventListener("mousemove", onMove);

      document.addEventListener("mouseup", onUp);

    },

    [viewport],

  );



  const {

    updateHotspot,

    removeHotspot,

    handleFrameMouseDown,

    handleHotspotMouseDown,

    handleResizeMouseDown,

    nudgeSelectedHotspot,

  } = useHotspotDrag({

    containerRef: viewport.containerRef,

    viewportPan: viewport.pan,

    viewportZoom: viewport.zoom,

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

  });



  const handleSelectHotspot = useCallback(

    (id: string) => {

      setSelectedId(id === selectedId ? null : id);

    },

    [selectedId, setSelectedId],

  );



  const selectedHotspot = hotspots.find((item) => item.id === selectedId) ?? null;



  const toolHint =

    toolMode === "pin"

      ? "Кликните на скрин, чтобы поставить метку. Пробел + перетаскивание — панорама."

      : toolMode === "zoom"

        ? "Нарисуйте область увеличения. Пробел + перетаскивание — панорама; стрелки — сдвиг ±0,5% (Shift ±2%)."

        : "Нарисуйте зону на скрине. Пробел + перетаскивание — панорама; стрелки — сдвиг ±0,5% (Shift ±2%).";



  useEffect(() => {

    function onKeyDown(event: KeyboardEvent) {

      if (event.code === "Space" && !isEditableTarget(event.target)) {

        event.preventDefault();

        setSpacePressed(true);

      }

      if (event.key === "Escape" && !isEditableTarget(event.target)) {

        setSelectedId(null);

        return;

      }

      if (!selectedId || isEditableTarget(event.target)) {

        return;

      }

      const step = event.shiftKey ? 2 : 0.5;

      if (event.key === "ArrowLeft") {

        event.preventDefault();

        const h = hotspotsRef.current.find((item) => item.id === selectedId);

        if (h) {

          nudgeSelectedHotspot({ x_pct: clamp(h.x_pct - step, 0, 100 - h.width_pct) });

        }

      }

      if (event.key === "ArrowRight") {

        event.preventDefault();

        const h = hotspotsRef.current.find((item) => item.id === selectedId);

        if (h) {

          nudgeSelectedHotspot({ x_pct: clamp(h.x_pct + step, 0, 100 - h.width_pct) });

        }

      }

      if (event.key === "ArrowUp") {

        event.preventDefault();

        const h = hotspotsRef.current.find((item) => item.id === selectedId);

        if (h) {

          nudgeSelectedHotspot({ y_pct: clamp(h.y_pct - step, 0, 100 - h.height_pct) });

        }

      }

      if (event.key === "ArrowDown") {

        event.preventDefault();

        const h = hotspotsRef.current.find((item) => item.id === selectedId);

        if (h) {

          nudgeSelectedHotspot({ y_pct: clamp(h.y_pct + step, 0, 100 - h.height_pct) });

        }

      }

      if (event.key === "Delete" || event.key === "Backspace") {

        event.preventDefault();

        removeHotspot(selectedId);

      }

    }

    function onKeyUp(event: KeyboardEvent) {

      if (event.code === "Space") {

        setSpacePressed(false);

      }

    }

    window.addEventListener("keydown", onKeyDown);

    window.addEventListener("keyup", onKeyUp);

    return () => {

      window.removeEventListener("keydown", onKeyDown);

      window.removeEventListener("keyup", onKeyUp);

    };

  }, [nudgeSelectedHotspot, removeHotspot, selectedId, setSelectedId]);



  const viewportTransform = `translate(${viewport.pan.x}px, ${viewport.pan.y}px) scale(${viewport.zoom})`;



  return (

    <div className="hotspot-editor">

      <div className="hotspot-editor-toolbar-row">

        <HotspotToolToolbar value={toolMode} onChange={setToolMode} />

        <Typography variant="body2" color="text.secondary" className="hotspot-editor-toolbar-hint">

          {toolHint}

        </Typography>

        <ScreenshotToolbar

          zoom={viewport.zoom}

          canZoomIn={viewport.canZoomIn}

          canZoomOut={viewport.canZoomOut}

          showHotspots

          isFullscreen={false}

          onZoomIn={viewport.zoomIn}

          onZoomOut={viewport.zoomOut}

          onReset={viewport.reset}

          onToggleHotspots={() => undefined}

          onToggleFullscreen={() => undefined}

        />

      </div>



      <div className="hotspot-editor-workspace">
        <div className="hotspot-editor-canvas">
          <HotspotEditorFrame
            imagePath={imagePath}
            hotspots={hotspots}
            selectedId={selectedId}
            liveRect={liveRect}
            draft={draft}
            frameRef={frameRef}
            containerRef={viewport.containerRef}
            viewportTransform={viewportTransform}
            spacePanActive={spacePressed}
            onFrameMouseDown={handleFrameMouseDown}
            onHotspotMouseDown={handleHotspotMouseDown}
            onResizeMouseDown={handleResizeMouseDown}
            onWheel={viewport.handleWheel}
          />
        </div>

        <div className="hotspot-editor-panel" aria-label="Панель меток">
          <HotspotEditorList hotspots={hotspots} selectedId={selectedId} onSelect={handleSelectHotspot} />
          <HotspotEditorProperties
            hotspot={selectedHotspot}
            showNumericFields={showNumericFields}
            onUpdate={updateHotspot}
            onRemove={removeHotspot}
            onCoordChange={nudgeSelectedHotspot}
          />
        </div>
      </div>

    </div>

  );

}


