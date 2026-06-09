"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ImageLightbox } from "./image-lightbox";

type OpenState = { src: string; alt?: string } | null;

/**
 * Wrap a lesson/content area with this component.
 * Any <img> click inside will open the lightbox.
 */
export function ImageLightboxProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState<OpenState>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const close = useCallback(() => setOpen(null), []);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const onClick = (e: MouseEvent) => {
      const target = e.target;
      if (!(target instanceof HTMLImageElement)) return;
      e.preventDefault();
      e.stopPropagation();
      setOpen({ src: target.src, alt: target.alt });
    };

    container.addEventListener("click", onClick, true);
    return () => container.removeEventListener("click", onClick, true);
  }, []);

  return (
    <div ref={containerRef} className="contents">
      {children}
      {open && <ImageLightbox src={open.src} alt={open.alt} onClose={close} />}
    </div>
  );
}
