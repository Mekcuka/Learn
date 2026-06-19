import { useEffect, useState } from "react";

/** naturalWidth / naturalHeight for a loaded image src, or null while unknown. */
export function useImageNaturalAspectRatio(src: string): number | null {
  const [aspectRatio, setAspectRatio] = useState<number | null>(null);

  useEffect(() => {
    setAspectRatio(null);

    const image = new Image();
    const apply = () => {
      if (image.naturalWidth > 0 && image.naturalHeight > 0) {
        setAspectRatio(image.naturalWidth / image.naturalHeight);
      }
    };

    image.addEventListener("load", apply);
    image.addEventListener("error", () => setAspectRatio(null));
    image.src = src;

    if (image.complete) {
      apply();
    }

    return () => {
      image.removeEventListener("load", apply);
      image.removeEventListener("error", () => setAspectRatio(null));
    };
  }, [src]);

  return aspectRatio;
}
