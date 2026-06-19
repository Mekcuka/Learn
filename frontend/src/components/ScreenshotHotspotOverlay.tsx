import { useRef, type ReactNode, type RefObject } from "react";

import { useImageContentRect } from "../hooks/useImageContentRect";
import { overlayStyleFromContentRect } from "../utils/imageContentRect";

type ScreenshotHotspotOverlayProps = {
  containerRef: RefObject<HTMLElement | null>;
  imagePath: string;
  imageAlt?: string;
  resetKey?: string;
  lazy?: boolean;
  className?: string;
  children: ReactNode;
};

export default function ScreenshotHotspotOverlay({
  containerRef,
  imagePath,
  imageAlt = "",
  resetKey,
  lazy = true,
  className = "screenshot-overlay",
  children,
}: ScreenshotHotspotOverlayProps) {
  const imageRef = useRef<HTMLImageElement>(null);
  const contentRect = useImageContentRect(containerRef, imageRef, {
    resetKey: resetKey ?? imagePath,
    imageSrc: imagePath,
  });

  return (
    <>
      <img
        ref={imageRef}
        src={imagePath}
        alt={imageAlt}
        loading={lazy ? "lazy" : undefined}
        className="screenshot-image"
        draggable={false}
      />
      {contentRect ? (
        <div className={className} style={overlayStyleFromContentRect(contentRect)}>
          {children}
        </div>
      ) : null}
    </>
  );
}
