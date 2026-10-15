"use client";

import { useViewportFitStage } from "@/hooks/useViewportFitStage";

type StageSpec = {
  cols: number;
  rows: number;
  cardW: number;      // base design width of a card (px)
  cardRatio: number;  // width / height (e.g., 4/3)
  gap: number;        // gap between cards (px)
  padY: number;       // desired top/bottom padding (px) at 1× scale
  padX?: number;      // desired left/right padding (px)
  minScale?: number;  // optional lower clamp for very short viewports
  maxScale?: number;  // optional upper clamp to preserve intentional whitespace
};

export function useViewportStage(spec: StageSpec) {
  const {
    cols,
    rows,
    cardW,
    cardRatio,
    gap,
    padY,
    padX = 16,
    minScale = 0.5,
    maxScale = Number.POSITIVE_INFINITY,
  } = spec;
  const baseW = cols * cardW + (cols - 1) * gap;
  const baseH = rows * (cardW / cardRatio) + (rows - 1) * gap;
  const { availableHeight, availableWidth, fitScale, profile } = useViewportFitStage({
    baseWidth: baseW,
    baseHeight: baseH,
    minScale: 0,
    maxScale,
    padX,
    padY,
  });

  // Follow the reference's 0.5× readability floor, but never force the
  // stage wider than a narrow phone. Height overflow is handled by the grid's
  // own scroll region instead of shrinking nine categories to illegibility.
  const widthSafeMinimum = availableWidth > 0
    ? Math.min(minScale, availableWidth / baseW)
    : minScale;
  const scale = Math.max(fitScale, widthSafeMinimum);
  const needsVerticalScroll = availableHeight > 0 && baseH * scale > availableHeight + 1;

  return {
    isMeasured: availableWidth > 0 && availableHeight > 0,
    profile,
    scale,
    baseW,
    baseH,
    needsVerticalScroll,
    stageStyle: {
      width: baseW,
      height: baseH,
      transform: `scale(${scale})`,
      transformOrigin: "top left",
    } as React.CSSProperties,
    wrapperStyle: (headerAwarePadY?: number, headerAwarePadX?: number) =>
      ({
        height: availableHeight > 0
          ? `${availableHeight + (headerAwarePadY ?? padY) * 2}px`
          : "100%",
        padding: `${headerAwarePadY ?? padY}px ${headerAwarePadX ?? padX}px`,
      }) as React.CSSProperties,
  };
}
