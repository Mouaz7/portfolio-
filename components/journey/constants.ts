const JOURNEY_MOBILE_MAX = 675;
export const JOURNEY_MOBILE_MEDIA = `(max-width: ${JOURNEY_MOBILE_MAX}px)`;

export const JOURNEY_MOBILE_MAX_ROWS = 6;

export const JOURNEY_MOBILE_STAGE = {
  width: 332,
  padX: 6,
  padY: 8,
  minScale: 0.52,
  headerHeight: 64,
  headerGap: 6,
  rowHeight: 84,
  rowGap: 5,
} as const;

export function journeyMobileStageHeight(rowCount: number) {
  const rows = Math.max(1, Math.min(JOURNEY_MOBILE_MAX_ROWS, rowCount));
  return (
    JOURNEY_MOBILE_STAGE.headerHeight +
    JOURNEY_MOBILE_STAGE.headerGap +
    rows * JOURNEY_MOBILE_STAGE.rowHeight +
    Math.max(0, rows - 1) * JOURNEY_MOBILE_STAGE.rowGap
  );
}
