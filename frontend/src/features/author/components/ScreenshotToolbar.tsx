import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";

export type ScreenshotToolbarProps = {
  zoom: number;
  canZoomIn: boolean;
  canZoomOut: boolean;
  showHotspots: boolean;
  isFullscreen: boolean;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onReset: () => void;
  onToggleHotspots: () => void;
  onToggleFullscreen: () => void;
  /** When false, hides − / % / + / Сброс (student lesson view). Default: true. */
  showZoomControls?: boolean;
  /** When false, hides «На весь экран» (student lesson view). Default: true. */
  showFullscreen?: boolean;
};

export default function ScreenshotToolbar({
  zoom,
  canZoomIn,
  canZoomOut,
  showHotspots,
  isFullscreen,
  onZoomIn,
  onZoomOut,
  onReset,
  onToggleHotspots,
  onToggleFullscreen,
  showZoomControls = true,
  showFullscreen = true,
}: ScreenshotToolbarProps) {
  const zoomPercent = Math.round(zoom * 100);

  return (
    <div className="screenshot-toolbar" role="toolbar" aria-label="Инструменты просмотра скрина">
      {showZoomControls ? (
        <div className="screenshot-toolbar-group">
          <Button
            size="small"
            variant="text"
            color="primary"
            disableElevation
            disabled={!canZoomOut}
            aria-label="Уменьшить"
            title="Уменьшить"
            onClick={onZoomOut}
          >
            −
          </Button>
          <Typography
            variant="caption"
            color="text.secondary"
            fontWeight={600}
            className="screenshot-zoom-label"
            aria-live="polite"
          >
            {zoomPercent}%
          </Typography>
          <Button
            size="small"
            variant="text"
            color="primary"
            disableElevation
            disabled={!canZoomIn}
            aria-label="Увеличить"
            title="Увеличить"
            onClick={onZoomIn}
          >
            +
          </Button>
          <Button
            size="small"
            variant="outlined"
            color="primary"
            disableElevation
            disabled={zoomPercent === 100}
            aria-label="Сбросить масштаб"
            onClick={onReset}
          >
            Сброс
          </Button>
        </div>
      ) : null}
      <div className="screenshot-toolbar-group">
        <Button
          size="small"
          variant={showHotspots ? "contained" : "outlined"}
          color="primary"
          disableElevation
          aria-pressed={showHotspots}
          aria-label={showHotspots ? "Скрыть метки" : "Показать метки"}
          onClick={onToggleHotspots}
        >
          Метки
        </Button>
        {showFullscreen ? (
          <Button
            size="small"
            variant="outlined"
            color="primary"
            disableElevation
            aria-label={isFullscreen ? "Выйти из полного экрана" : "На весь экран"}
            onClick={onToggleFullscreen}
          >
            {isFullscreen ? "Свернуть" : "На весь экран"}
          </Button>
        ) : null}
      </div>
    </div>
  );
}
