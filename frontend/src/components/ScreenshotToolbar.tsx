type ScreenshotToolbarProps = {
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
}: ScreenshotToolbarProps) {
  const zoomPercent = Math.round(zoom * 100);

  return (
    <div className="screenshot-toolbar" role="toolbar" aria-label="Инструменты просмотра скрина">
      <div className="screenshot-toolbar-group">
        <button
          type="button"
          className="screenshot-tool-btn secondary"
          onClick={onZoomOut}
          disabled={!canZoomOut}
          aria-label="Уменьшить"
          title="Уменьшить"
        >
          −
        </button>
        <span className="screenshot-zoom-label" aria-live="polite">
          {zoomPercent}%
        </span>
        <button
          type="button"
          className="screenshot-tool-btn secondary"
          onClick={onZoomIn}
          disabled={!canZoomIn}
          aria-label="Увеличить"
          title="Увеличить"
        >
          +
        </button>
        <button
          type="button"
          className="screenshot-tool-btn secondary"
          onClick={onReset}
          disabled={zoomPercent === 100}
          aria-label="Сбросить масштаб"
        >
          Сброс
        </button>
      </div>
      <div className="screenshot-toolbar-group">
        <button
          type="button"
          className={`screenshot-tool-btn secondary ${showHotspots ? "active" : ""}`}
          onClick={onToggleHotspots}
          aria-pressed={showHotspots}
          aria-label={showHotspots ? "Скрыть метки" : "Показать метки"}
        >
          Метки
        </button>
        <button
          type="button"
          className="screenshot-tool-btn secondary"
          onClick={onToggleFullscreen}
          aria-label={isFullscreen ? "Выйти из полного экрана" : "На весь экран"}
        >
          {isFullscreen ? "Свернуть" : "На весь экран"}
        </button>
      </div>
    </div>
  );
}
