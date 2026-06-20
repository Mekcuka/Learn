import { useImageNaturalAspectRatio } from "../hooks/useImageNaturalAspectRatio";
import type { HotspotItem } from "../../../types/lesson";
import { getHotspotCropBackgroundStyle, getHotspotPopupStyle } from "../../../utils/hotspotZoomCrop";

type ZoomHotspotPopupProps = {
  open: boolean;
  hotspot: HotspotItem | null;
  imagePath: string;
  imageAlt: string;
  onClose: () => void;
  /** Captures backdrop clicks and shows close button (student view). Default true. */
  interactive?: boolean;
  /** Entrance animation. Default true. */
  animate?: boolean;
};

export default function ZoomHotspotPopup({
  open,
  hotspot,
  imagePath,
  imageAlt,
  onClose,
  interactive = true,
  animate = true,
}: ZoomHotspotPopupProps) {
  const imageAspectRatio = useImageNaturalAspectRatio(imagePath);

  if (!open || !hotspot) {
    return null;
  }

  const cropStyle = getHotspotCropBackgroundStyle(hotspot, {
    imageAspectRatio: imageAspectRatio ?? 1,
  });
  const popupStyle = getHotspotPopupStyle(hotspot);
  const overlayClass = [
    "zoom-hotspot-overlay",
    interactive ? "zoom-hotspot-overlay--interactive" : "zoom-hotspot-overlay--preview",
  ].join(" ");
  const popupClass = [
    "zoom-hotspot-popup",
    animate ? "zoom-hotspot-popup--animate" : "zoom-hotspot-popup--static",
  ].join(" ");

  return (
    <div
      className={overlayClass}
      role="dialog"
      aria-modal={interactive ? "true" : undefined}
      aria-label={`Увеличенный фрагмент: ${hotspot.label}`}
    >
      {interactive ? (
        <button type="button" className="zoom-hotspot-backdrop" aria-label="Закрыть" onClick={onClose} />
      ) : null}
      <div className={popupClass} style={popupStyle}>
        {interactive ? (
          <button type="button" className="zoom-hotspot-close" aria-label="Закрыть" onClick={onClose}>
            <span aria-hidden="true">×</span>
          </button>
        ) : null}
        <div
          className="zoom-hotspot-crop"
          style={{
            ...cropStyle,
            backgroundImage: `url(${imagePath})`,
          }}
          role="img"
          aria-label={`Увеличенный фрагмент: ${hotspot.label} — ${imageAlt}`}
        />
      </div>
    </div>
  );
}
