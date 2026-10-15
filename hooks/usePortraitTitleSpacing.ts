"use client";

import { useLayoutEffect, useRef, useState, type RefObject } from "react";

// The current cutout has transparent pixels above the first visible hair.
// Keep this in sync if /home/portfolio-cutout-1600.webp is replaced.
const VISIBLE_TOP_FRACTION = 151 / 2405;
const VISIBLE_TITLE_GAP = 18;
// The title box includes its underline, so keep the visible hair below it.
const MOBILE_VISIBLE_TITLE_GAP = 16;

type PortraitTitleSpacing = {
  titleRef: RefObject<HTMLHeadingElement | null>;
  artboxRef: RefObject<HTMLDivElement | null>;
  shiftY: number;
};

export function usePortraitTitleSpacing(slideScale: number): PortraitTitleSpacing {
  const titleRef = useRef<HTMLHeadingElement>(null);
  const artboxRef = useRef<HTMLDivElement>(null);
  const [shiftY, setShiftY] = useState(0);

  useLayoutEffect(() => {
    const title = titleRef.current;
    const artbox = artboxRef.current;
    const image = artbox?.querySelector("img");
    if (!title || !artbox || !image) return;

    let active = true;
    const measure = () => {
      if (!active) return;
      // Desktop uses a side-by-side composition; compact landscape hides the
      // portrait altogether. Neither layout needs title-based positioning.
      if (window.innerWidth >= 1200 || artbox.getClientRects().length === 0) {
        setShiftY(0);
        return;
      }
      if (!image.naturalWidth || !image.naturalHeight) return;

      const titleBottom = title.getBoundingClientRect().bottom;
      const box = artbox.getBoundingClientRect();
      const imageHeight = Math.min(
        box.height,
        box.width * image.naturalHeight / image.naturalWidth,
      );
      const visibleTop = box.bottom - imageHeight + imageHeight * VISIBLE_TOP_FRACTION;
      const currentGap = visibleTop - titleBottom;
      const targetGap = window.innerWidth <= 675
        ? MOBILE_VISIBLE_TITLE_GAP
        : VISIBLE_TITLE_GAP;
      setShiftY((currentShift) => {
        const nextShift = Math.max(
          -48,
          Math.min(
            80,
            Math.round(currentShift + (targetGap - currentGap) / slideScale),
          ),
        );

        return Math.abs(nextShift - currentShift) >= 1 ? nextShift : currentShift;
      });
    };

    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(title);
    observer.observe(artbox);
    window.addEventListener("resize", measure);
    window.visualViewport?.addEventListener("resize", measure);
    image.addEventListener("load", measure);
    document.fonts?.ready.then(measure);

    return () => {
      active = false;
      observer.disconnect();
      window.removeEventListener("resize", measure);
      window.visualViewport?.removeEventListener("resize", measure);
      image.removeEventListener("load", measure);
    };
  }, [slideScale]);

  return { titleRef, artboxRef, shiftY };
}
