"use client";
import { useEffect, useRef, useState } from "react";
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
import { useI18n } from "@/components/i18n/I18nProvider";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { useRouteEntrance } from "@/components/navigation/NavigationExperienceProvider";

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

const JOURNEY_DESKTOP_STAGE = {
  minWidth: 720,
  fallbackWidth: 1260,
  maxWidth: 1750,
  height: 730,
  largeHeight: 920,
  ultraHeight: 995,
  maxViewportWidth: 1600,
  largeMaxViewportWidth: 2200,
  ultraMaxViewportWidth: 2800,
} as const;

export default function JourneyPage({ initialItems, initialMobile = false }: JourneyPageProps) {
  const { locale, dictionary } = useI18n();
  const routeEntrance = useRouteEntrance();
  const [items, setItems] = useState<JourneyItem[]>(initialItems ?? []);
  const [loading, setLoading] = useState(initialItems === undefined);
  const mainRef = useRef<HTMLElement>(null);
  const mobile = useJourneyMobile(initialMobile);
  const largeDesktop = useMediaQuery("(min-width: 2200px) and (min-height: 1000px)");
  const ultraDesktop = useMediaQuery("(min-width: 3200px) and (min-height: 1400px)");
  const desktopStageHeight = ultraDesktop
    ? JOURNEY_DESKTOP_STAGE.ultraHeight
    : largeDesktop
      ? JOURNEY_DESKTOP_STAGE.largeHeight
      : JOURNEY_DESKTOP_STAGE.height;
  const desktopViewportWidth = ultraDesktop
    ? JOURNEY_DESKTOP_STAGE.ultraMaxViewportWidth
    : largeDesktop
      ? JOURNEY_DESKTOP_STAGE.largeMaxViewportWidth
      : JOURNEY_DESKTOP_STAGE.maxViewportWidth;
  const mobileStageRows = Math.max(
    1,
    Math.min(JOURNEY_MOBILE_MAX_ROWS, items.length || JOURNEY_MOBILE_MAX_ROWS)
  );
  const mobileStageHeight = journeyMobileStageHeight(mobileStageRows);
  const {
    scale: fitScale,
    profile: mobileProfile,
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
  const desktopFit = useViewportFitStage({
    baseWidth: JOURNEY_DESKTOP_STAGE.minWidth,
    baseHeight: desktopStageHeight,
    containerRef: mainRef,
    enabled: !mobile,
    maxScale: 1.6,
    padX: 0,
    padY: 0,
    transformOrigin: "50% 50%",
  });
  const desktopAvailableWidth = Math.min(
    desktopFit.availableWidth || desktopViewportWidth,
    desktopViewportWidth,
  );
  const desktopStageWidth = Math.min(
    JOURNEY_DESKTOP_STAGE.maxWidth,
    Math.max(
      JOURNEY_DESKTOP_STAGE.minWidth,
      computeFluidStageWidth(
        desktopAvailableWidth,
        desktopFit.scale,
        JOURNEY_DESKTOP_STAGE.fallbackWidth,
      ),
    ),
  );
  const mobileStageWidth = computeFluidStageWidth(
    availableWidth,
    fitScale,
    JOURNEY_MOBILE_STAGE.width
  );
  const renderedMobileStageWidth: React.CSSProperties["width"] = availableWidth > 0
    ? mobileStageWidth
    : `calc(100dvw - ${JOURNEY_MOBILE_STAGE.padX * 2}px)`;
  const mobileNeedsInternalScroll = mobile
    && availableHeight > 0
    && fitScale < JOURNEY_MOBILE_STAGE.minScale;

  useEffect(() => {
    if (initialItems) {
      setItems(initialItems);
      setLoading(false);
      return;
    }
    let off = false;
    setLoading(true);
    (async () => {
      try {
        const r = await fetch(`/api/journey?locale=${locale}`);
        if (!r.ok) throw new Error(String(r.status));
        const all: ApiItem[] = await r.json();
        if (!off) setItems(all as JourneyItem[]);
      } catch (e) {
        console.error("[JourneyPage] fetch failed:", e);
      } finally {
        if (!off) setLoading(false);
      }
    })();
    return () => {
      off = true;
    };
  }, [initialItems, locale]);

  return (
    <div
      className="flex h-dvh min-h-0 flex-col overflow-hidden"
      data-viewport-page="journey"
      data-route-entrance={routeEntrance}
      data-viewport-profile={mobile ? mobileProfile : desktopFit.profile}
    >
      <Header disableRouteTouch={mobile} />

      {/* Background is the shared global WebGL nebula (see app/layout.tsx) */}
      <main
        ref={mainRef}
        aria-label={dictionary.journey.contentLabel}
        data-viewport-content
        className={[
          "journey-main relative flex flex-1 min-h-0 px-[120px] pt-8 max-[1024px]:px-12",
          mobile
            ? `${mobileNeedsInternalScroll ? "overflow-x-hidden overflow-y-auto" : "overflow-hidden"} max-[675px]:px-0 max-[675px]:pt-0`
            : "overflow-hidden max-[675px]:px-4 max-[675px]:pt-6",
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
              "z-10 flex items-start justify-center",
              mobile ? "relative mx-auto h-full w-full" : "journey-stage-viewport",
            ].join(" ")}
            data-journey-fit={mobile ? "mobile-stage" : "desktop"}
            data-journey-scale={(mobile ? fitScale : desktopFit.fitScale).toFixed(3)}
            data-journey-fluid-width={mobile ? mobileStageWidth.toFixed(1) : undefined}
          >
            <div
              className={mobile ? "shrink-0" : "journey-stage-surface"}
              style={
                mobile
                  ? { ...stageStyle, width: renderedMobileStageWidth }
                  : {
                    ...desktopFit.stageStyle,
                    width: desktopStageWidth,
                    transform: `translate(-50%, -50%) scale(${desktopFit.scale})`,
                  }
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
