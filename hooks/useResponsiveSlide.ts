"use client";

import {
  useEffect,
  useLayoutEffect,
  useState,
  type CSSProperties,
} from "react";

const useBrowserLayoutEffect =
  typeof window === "undefined" ? useEffect : useLayoutEffect;

type ResponsiveSlide = {
  scale: number;
  style: CSSProperties & { "--home-slide-layout-height": string };
};

/**
 * Uses the reference portfolio's 560px minimum slide height and CSS zoom when
 * the visible viewport is shorter. Zoom preserves the viewport width and the
 * positioning of fixed navigation descendants.
 */
export function useResponsiveSlide(minHeight: number): ResponsiveSlide {
  const [viewportHeight, setViewportHeight] = useState(0);

  useBrowserLayoutEffect(() => {
    const update = () => {
      setViewportHeight(window.visualViewport?.height ?? window.innerHeight);
    };

    update();
    window.addEventListener("resize", update);
    window.addEventListener("orientationchange", update);
    window.visualViewport?.addEventListener("resize", update);

    return () => {
      window.removeEventListener("resize", update);
      window.removeEventListener("orientationchange", update);
      window.visualViewport?.removeEventListener("resize", update);
    };
  }, []);

  const scale = viewportHeight > 0
    ? Math.min(1, viewportHeight / minHeight)
    : 1;

  return {
    scale,
    style: scale < 1
      ? {
          height: `${minHeight}px`,
          minHeight: `${minHeight}px`,
          zoom: scale,
          "--home-slide-layout-height": `${minHeight}px`,
        }
      : {
          height: "100dvh",
          minHeight: "100dvh",
          zoom: 1,
          "--home-slide-layout-height": "100dvh",
        },
  };
}
