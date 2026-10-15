"use client";

import { useEffect, useLayoutEffect, useState, type RefObject } from "react";

const useBrowserLayoutEffect = typeof window === "undefined" ? useEffect : useLayoutEffect;

export type ViewportLayoutProfile = "fit" | "compact" | "accessible-overflow";

export function selectViewportLayoutProfile(
  fitScale: number,
  availableWidth: number,
  availableHeight: number,
): ViewportLayoutProfile {
  if (availableWidth <= 540 || availableHeight <= 360 || fitScale < 0.58) {
    return "accessible-overflow";
  }
  if (fitScale < 0.9 || availableWidth < 1200 || availableHeight < 700) {
    return "compact";
  }
  return "fit";
}

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
  containerRef?: RefObject<HTMLElement | null>;
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
  containerRef,
  enabled = true,
  headerSelector = "header",
  minScale = 0,
  maxScale = 1,
  padX = 16,
  padY = 16,
  transformOrigin = "50% 50%",
}: Options) {
  const [scale, setScale] = useState(1);
  const [fitScale, setFitScale] = useState(1);
  const [availableWidth, setAvailableWidth] = useState(0);
  const [availableHeight, setAvailableHeight] = useState(0);
  const [profile, setProfile] = useState<ViewportLayoutProfile>("fit");

  useBrowserLayoutEffect(() => {
    if (!enabled) {
      setScale(1);
      setFitScale(1);
      setAvailableWidth(0);
      setAvailableHeight(0);
      setProfile("fit");
      return;
    }

    let frameId: number | null = null;
    let resizeObserver: ResizeObserver | null = null;
    const update = () => {
      frameId = null;
      const container = containerRef?.current;
      let nextAvailableWidth: number;
      let nextAvailableHeight: number;

      if (container) {
        const styles = window.getComputedStyle(container);
        const horizontalPadding = parseFloat(styles.paddingLeft) + parseFloat(styles.paddingRight);
        const verticalPadding = parseFloat(styles.paddingTop) + parseFloat(styles.paddingBottom);
        nextAvailableWidth = Math.max(0, container.clientWidth - horizontalPadding - padX * 2);
        nextAvailableHeight = Math.max(0, container.clientHeight - verticalPadding - padY * 2);
      } else {
        const header = typeof document !== "undefined" ? document.querySelector(headerSelector) : null;
        // `offsetHeight` excludes the header's top margin. Using its visual
        // bottom edge keeps fitted stages inside the viewport on short browser
        // windows as well as at browser/OS zoom levels.
        const headerHeight = header
          ? Math.max(
            (header as HTMLElement).offsetHeight,
            (header as HTMLElement).getBoundingClientRect().bottom,
          )
          : 0;
        const viewportWidth = window.visualViewport?.width ?? window.innerWidth;
        const viewportHeight = window.visualViewport?.height ?? window.innerHeight;
        nextAvailableWidth = Math.max(0, viewportWidth - padX * 2);
        nextAvailableHeight = Math.max(0, viewportHeight - headerHeight - padY * 2);
      }

      const nextFitScale = computeViewportFitScale(
        nextAvailableWidth,
        nextAvailableHeight,
        baseWidth,
        baseHeight,
        0,
        maxScale,
      );
      const nextScale = Math.max(minScale, nextFitScale);

      setAvailableWidth(nextAvailableWidth);
      setAvailableHeight(nextAvailableHeight);
      setFitScale(nextFitScale);
      setScale(nextScale);
      setProfile(
        selectViewportLayoutProfile(nextFitScale, nextAvailableWidth, nextAvailableHeight),
      );
    };

    const scheduleUpdate = () => {
      if (frameId !== null) return;
      frameId = window.requestAnimationFrame(update);
    };

    // The first measurement is layout-critical. Run it synchronously in the
    // browser layout effect so a slow device never paints the unscaled fallback
    // stage for one frame. Later resize bursts remain animation-frame batched.
    update();
    window.addEventListener("resize", scheduleUpdate);
    window.addEventListener("orientationchange", scheduleUpdate);
    window.visualViewport?.addEventListener("resize", scheduleUpdate);
    if (typeof ResizeObserver !== "undefined") {
      resizeObserver = new ResizeObserver(scheduleUpdate);
      if (containerRef?.current) resizeObserver.observe(containerRef.current);
      const header = document.querySelector(headerSelector);
      if (header) resizeObserver.observe(header);
    }

    return () => {
      window.removeEventListener("resize", scheduleUpdate);
      window.removeEventListener("orientationchange", scheduleUpdate);
      window.visualViewport?.removeEventListener("resize", scheduleUpdate);
      resizeObserver?.disconnect();
      if (frameId !== null) window.cancelAnimationFrame(frameId);
    };
  }, [baseWidth, baseHeight, containerRef, enabled, headerSelector, minScale, maxScale, padX, padY]);

  return {
    scale,
    fitScale,
    profile,
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
