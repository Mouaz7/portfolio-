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
  const { availableHeight, stageStyle } = useViewportFitStage({
    baseWidth: baseW,
    baseHeight: baseH,
    minScale,
    maxScale,
    padX,
    padY,
    transformOrigin: "50% 50%",
  });

  return {
    stageStyle,
    wrapperStyle: (headerAwarePadY?: number, headerAwarePadX?: number) =>
      ({
        height: `${availableHeight + (headerAwarePadY ?? padY) * 2}px`,
        padding: `${headerAwarePadY ?? padY}px ${headerAwarePadX ?? padX}px`,
      }) as React.CSSProperties,
  };
}
