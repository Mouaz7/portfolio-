"use client";

import { useEffect, useState } from "react";

export function computeViewportFitScale(
  availableWidth: number,
  availableHeight: number,
  baseWidth: number,
  baseHeight: number,
  minScale = 0,
  maxScale = 1
) {
  if (
    availableWidth <= 0 ||
    availableHeight <= 0 ||
    baseWidth <= 0 ||
    baseHeight <= 0
  ) {
    return 1;
  }

  const fitScale = Math.min(maxScale, availableWidth / baseWidth, availableHeight / baseHeight);
  return Math.max(minScale, fitScale);
}

export function computeFluidStageWidth(
  availableWidth: number,
  scale: number,
  fallbackWidth: number
) {
  if (availableWidth <= 0 || scale <= 0 || !Number.isFinite(scale)) {
    return fallbackWidth;
  }
  return availableWidth / scale;
}

type Options = {
  baseWidth: number;
  baseHeight: number;
  enabled?: boolean;
  headerSelector?: string;
  minScale?: number;
  maxScale?: number;
  padX?: number;
  padY?: number;
  transformOrigin?: string;
};

export function useViewportFitStage({
  baseWidth,
  baseHeight,
  enabled = true,
  headerSelector = "header",
  minScale = 0,
  maxScale = 1,
  padX = 16,
  padY = 16,
  transformOrigin = "50% 50%",
}: Options) {
  const [scale, setScale] = useState(1);
  const [availableWidth, setAvailableWidth] = useState(0);
  const [availableHeight, setAvailableHeight] = useState(0);

  useEffect(() => {
    if (!enabled) {
      setScale(1);
      setAvailableWidth(0);
      setAvailableHeight(0);
      return;
    }

    let frameId: number | null = null;
    const update = () => {
      frameId = null;
      const header = typeof document !== "undefined" ? document.querySelector(headerSelector) : null;
      const headerHeight = header ? (header as HTMLElement).offsetHeight : 0;
      const nextAvailableWidth = Math.max(0, window.innerWidth - padX * 2);
      const nextAvailableHeight = Math.max(0, window.innerHeight - headerHeight - padY * 2);

      setAvailableWidth(nextAvailableWidth);
      setAvailableHeight(nextAvailableHeight);
      setScale(
        computeViewportFitScale(
          nextAvailableWidth,
          nextAvailableHeight,
          baseWidth,
          baseHeight,
          minScale,
          maxScale
        )
      );
    };

    const scheduleUpdate = () => {
      if (frameId !== null) return;
      frameId = window.requestAnimationFrame(update);
    };

    scheduleUpdate();
    window.addEventListener("resize", scheduleUpdate);
    window.addEventListener("orientationchange", scheduleUpdate);
    window.visualViewport?.addEventListener("resize", scheduleUpdate);

    return () => {
      window.removeEventListener("resize", scheduleUpdate);
      window.removeEventListener("orientationchange", scheduleUpdate);
      window.visualViewport?.removeEventListener("resize", scheduleUpdate);
      if (frameId !== null) window.cancelAnimationFrame(frameId);
    };
  }, [baseWidth, baseHeight, enabled, headerSelector, minScale, maxScale, padX, padY]);

  return {
    scale,
    availableWidth,
    availableHeight,
    stageStyle: {
      width: baseWidth,
      height: baseHeight,
      transform: `scale(${scale})`,
      transformOrigin,
    } as React.CSSProperties,
    wrapperStyle: (overridePadY = padY, overridePadX = padX) =>
      ({
        height: `${availableHeight + overridePadY * 2}px`,
        padding: `${overridePadY}px ${overridePadX}px`,
      }) as React.CSSProperties,
  };
}
