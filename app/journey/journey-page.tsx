"use client";
import { useEffect, useState } from "react";
import Header from "@/components/navigation/Header";
import GitGraph from "@/components/journey/GitGraph";
import {
  JOURNEY_MOBILE_MAX_ROWS,
  JOURNEY_MOBILE_STAGE,
  journeyMobileStageHeight,
} from "@/components/journey/constants";
import { useJourneyMobile } from "@/components/journey/useJourneyMobile";
import { type JourneyItem } from "@/lib/journey/deriveGitGraph";
import PageLoadingStage from "@/components/ui/PageLoadingStage";
import {
  computeFluidStageWidth,
  useViewportFitStage,
} from "@/hooks/useViewportFitStage";
import { useMinimumLoading } from "@/hooks/useMinimumLoading";
import { useI18n } from "@/components/i18n/I18nProvider";

type ApiItem = {
  id: string;
  title: string;
  description: string;
  icon?: string;
  from: string;
  to?: string | null;
  topic?: string | null;
  brand?: string | null;
  mono?: boolean;
};

type JourneyPageProps = {
  initialItems?: JourneyItem[];
  initialMobile?: boolean;
};

export default function JourneyPage({ initialItems, initialMobile = false }: JourneyPageProps) {
  const { locale, dictionary } = useI18n();
  const [items, setItems] = useState<JourneyItem[]>(initialItems ?? []);
  const { loading, finishLoading } = useMinimumLoading(400);
  const mobile = useJourneyMobile(initialMobile);
  const mobileStageRows = Math.max(
    1,
    Math.min(JOURNEY_MOBILE_MAX_ROWS, items.length || JOURNEY_MOBILE_MAX_ROWS)
  );
  const mobileStageHeight = journeyMobileStageHeight(mobileStageRows);
  const {
    scale: fitScale,
    availableWidth,
    availableHeight,
    stageStyle,
    wrapperStyle,
  } = useViewportFitStage({
    baseWidth: JOURNEY_MOBILE_STAGE.width,
    baseHeight: mobileStageHeight,
    enabled: mobile,
    minScale: JOURNEY_MOBILE_STAGE.minScale,
    padX: JOURNEY_MOBILE_STAGE.padX,
    padY: JOURNEY_MOBILE_STAGE.padY,
    transformOrigin: "50% 0%",
  });
  const mobileStageWidth = computeFluidStageWidth(
    availableWidth,
    fitScale,
    JOURNEY_MOBILE_STAGE.width
  );
  const renderedMobileStageWidth: React.CSSProperties["width"] = availableWidth > 0
    ? mobileStageWidth
    : `calc(100dvw - ${JOURNEY_MOBILE_STAGE.padX * 2}px)`;

  useEffect(() => {
    if (initialItems) {
      setItems(initialItems);
      finishLoading();
      return;
    }
    let off = false;
    (async () => {
      try {
        const r = await fetch(`/api/journey?locale=${locale}`);
        if (!r.ok) throw new Error(String(r.status));
        const all: ApiItem[] = await r.json();
        if (!off) setItems(all as JourneyItem[]);
      } catch (e) {
        console.error("[JourneyPage] fetch failed:", e);
      } finally {
        if (!off) finishLoading();
      }
    })();
    return () => {
      off = true;
    };
  }, [finishLoading, initialItems, locale]);

  return (
    <div className="flex min-h-dvh flex-col overflow-hidden">
      <Header disableRouteTouch={mobile} />

      {/* Background is the shared global WebGL nebula (see app/layout.tsx) */}
      <main
        aria-label={dictionary.journey.contentLabel}
        className={[
          "journey-main relative flex flex-1 min-h-0 px-[120px] pt-8 max-[1024px]:px-12",
          mobile
            ? "overflow-hidden max-[675px]:px-0 max-[675px]:pt-0"
            : "overflow-x-hidden overflow-y-auto max-[675px]:px-4 max-[675px]:pt-6",
        ].join(" ")}
        style={
          mobile
            ? availableHeight > 0
              ? wrapperStyle(JOURNEY_MOBILE_STAGE.padY, JOURNEY_MOBILE_STAGE.padX)
              : {
                padding: `${JOURNEY_MOBILE_STAGE.padY}px ${JOURNEY_MOBILE_STAGE.padX}px`,
              }
            : { paddingBottom: "max(2.5rem, calc(env(safe-area-inset-bottom) + 1.25rem))" }
        }
      >
        <h1 className="sr-only">{dictionary.journey.title}</h1>
        {/* Loading state */}
        {loading && (
          <PageLoadingStage
            text={dictionary.journey.loading}
            noun={dictionary.journey.title}
          />
        )}

        {/* Content: the git-graph Journey log */}
        {!loading && (
          <div
            className={[
              "relative z-10 mx-auto flex items-start justify-center",
              mobile ? "h-full w-full" : "w-full max-w-[1600px]",
            ].join(" ")}
            data-journey-fit={mobile ? "mobile-stage" : "desktop"}
            data-journey-scale={fitScale.toFixed(3)}
            data-journey-fluid-width={mobile ? mobileStageWidth.toFixed(1) : undefined}
          >
            <div
              className={mobile ? "shrink-0" : undefined}
              style={
                mobile
                  ? { ...stageStyle, width: renderedMobileStageWidth }
                  : { width: "100%" }
              }
            >
              <GitGraph items={items} mobileStage={mobile} />
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
