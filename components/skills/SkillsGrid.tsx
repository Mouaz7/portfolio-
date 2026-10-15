// components/skills/SkillsGrid.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { useViewportStage } from "./useViewportStage";
import { SkillCard } from "./SkillCard";
import PageLoadingStage from "@/components/ui/PageLoadingStage";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { useI18n } from "@/components/i18n/I18nProvider";
import type {
  SkillCategoryData,
  SkillData,
} from "@/lib/skills/data.server";

const BASE = { cardW: 360, gap: 24, cardRatio: 6 / 5, padY: 40 };
type Spec = {
  cols: number;
  rows: number;
  cardW?: number;
  gap?: number;
  cardRatio?: number;
  minScale?: number;
  maxScale?: number;
  padX?: number;
  padY?: number;
};
type CategoryMeta = SkillCategoryData;
// The media-query hooks intentionally start from their SSR-safe `false` value.
// Clamp this intermediate desktop composition so an ultrawide client never
// paints an enlarged grid before the wide profile is selected after hydration.
const DESKTOP_SPEC: Spec = { cols: 3, rows: 3, minScale: 0, maxScale: 1 };
const TALL_DESKTOP_SPEC: Spec = {
  cols: 3,
  rows: 3,
  cardRatio: 4 / 3,
  minScale: 0,
  maxScale: 1.5,
};
const WIDE_DESKTOP_SPEC: Spec = {
  cols: 3,
  rows: 3,
  cardW: 620,
  gap: 16,
  cardRatio: 19 / 10,
  minScale: 0,
  padX: 32,
  padY: 28,
};
const EXTRA_WIDE_DESKTOP_SPEC: Spec = {
  cols: 3,
  rows: 3,
  cardW: 760,
  gap: 18,
  cardRatio: 2,
  minScale: 0,
  padX: 32,
  padY: 32,
};
const ULTRA_WIDE_DESKTOP_SPEC: Spec = {
  cols: 3,
  rows: 3,
  cardW: 900,
  gap: 22,
  cardRatio: 2,
  minScale: 0,
  maxScale: 1,
  padX: 40,
  padY: 36,
};
const MOBILE_SPEC: Spec = {
  cols: 2,
  rows: 5,
  gap: 10,
  cardRatio: 5 / 4,
  minScale: 0.5,
  padX: 4,
  padY: 6,
};

const CATEGORY_DISPLAY_ORDER = [
  "frontend",
  "mobile",
  "backend",
  "storage",
  "devops",
  "webdata",
  "ides",
  "workflow",
  "ai",
] as const;

const CATEGORY_DISPLAY_POSITION = new Map<string, number>(
  CATEGORY_DISPLAY_ORDER.map((key, index) => [key, index]),
);

// Minimal skill shape used by our UI
type UISkill = SkillData;

type SkillsGridProps = {
  initialCategories?: CategoryMeta[];
  initialSkills?: UISkill[];
  initialProjectSkillNames?: string[];
};

export default function SkillsGrid({
  initialCategories,
  initialSkills,
  initialProjectSkillNames = [],
}: SkillsGridProps) {
  const { locale, dictionary } = useI18n();
  const [allSkills, setAllSkills] = useState<UISkill[]>(initialSkills ?? []);
  const [cats, setCats] = useState<CategoryMeta[]>(initialCategories ?? []);
  const [categoriesLoading, setCategoriesLoading] = useState(initialCategories === undefined);
  const [skillsLoading, setSkillsLoading] = useState(initialSkills === undefined);
  const loading = categoriesLoading || skillsLoading;

  // Fetch categories (DB: skill_category with title/blurb)
  useEffect(() => {
    if (initialCategories) {
      setCats(initialCategories);
      setCategoriesLoading(false);
      return;
    }
    let off = false;
    setCategoriesLoading(true);
    (async () => {
      try {
        const r = await fetch(`/api/skill-categories?locale=${locale}`);
        if (!r.ok) throw new Error(String(r.status));
        const items = await r.json();
        if (!off) setCats(items);
      } catch (e) {
        console.error("[SkillsGrid] fetch /api/skill-categories failed:", e);
        if (!off) setCats([]);
      } finally {
        if (!off) setCategoriesLoading(false);
      }
    })();
    return () => { off = true; };
  }, [initialCategories, locale]);

  // ✅ Fetch skills (Supabase-backed)
  useEffect(() => {
    if (initialSkills) {
      setAllSkills(initialSkills);
      setSkillsLoading(false);
      return;
    }
    let off = false;
    setSkillsLoading(true);
    (async () => {
      try {
        const r = await fetch("/api/skills");
        if (!r.ok) throw new Error(String(r.status));
        const items: UISkill[] = await r.json();
        if (!off) setAllSkills(items);
      } catch (e) {
        console.error("[SkillsGrid] fetch /api/skills failed:", e);
        if (!off) setAllSkills([]);
      } finally {
        if (!off) setSkillsLoading(false);
      }
    })();
    return () => { off = true; };
  }, [initialSkills]);

  // Bucket skills by fetched categories
  const byCat = useMemo(() => {
    const map: Record<string, UISkill[]> = {};
    for (const c of cats) map[c.key] = [];
    for (const s of allSkills) {
      if (s.category && map[s.category]) map[s.category].push(s);
    }
    Object.keys(map).forEach(k => map[k].sort((a, b) => (a.weight ?? 0) - (b.weight ?? 0)));
    return map;
  }, [cats, allSkills]);
  const projectSkillNames = useMemo(
    () => new Set(initialProjectSkillNames),
    [initialProjectSkillNames],
  );
  const orderedCategories = useMemo(
    () => [...cats].sort((a, b) => {
      const fallbackPosition = CATEGORY_DISPLAY_ORDER.length;
      return (CATEGORY_DISPLAY_POSITION.get(a.key) ?? fallbackPosition)
        - (CATEGORY_DISPLAY_POSITION.get(b.key) ?? fallbackPosition);
    }),
    [cats],
  );

  // Phones retain the two-column composition. Tablets, iPads, and larger
  // platforms share the same three-column composition as desktop.
  const desktopComposition = useMediaQuery("(min-width: 640px)");
  const wideDesktopComposition = useMediaQuery(
    "(min-width: 1000px) and (min-aspect-ratio: 8/5)",
  );
  const tallDesktopComposition = useMediaQuery(
    "(min-width: 1200px) and (min-height: 1000px) and (max-aspect-ratio: 8/5)",
  );
  const extraWideDesktopComposition = useMediaQuery(
    "(min-width: 2200px) and (min-height: 1100px)",
  );
  const ultraWideDesktopComposition = useMediaQuery(
    "(min-width: 3200px) and (min-height: 1500px)",
  );
  const spec = ultraWideDesktopComposition
    ? ULTRA_WIDE_DESKTOP_SPEC
    : extraWideDesktopComposition
      ? EXTRA_WIDE_DESKTOP_SPEC
      : wideDesktopComposition
        ? WIDE_DESKTOP_SPEC
        : tallDesktopComposition
          ? TALL_DESKTOP_SPEC
          : desktopComposition
            ? DESKTOP_SPEC
            : MOBILE_SPEC;
  const largeContent = wideDesktopComposition
    || extraWideDesktopComposition
    || ultraWideDesktopComposition;

  const STAGE = {
    ...BASE,
    cols: spec.cols,
    rows: spec.rows,
    cardW: spec.cardW ?? BASE.cardW,
    gap: spec.gap ?? BASE.gap,
    cardRatio: spec.cardRatio ?? BASE.cardRatio,
    minScale: spec.minScale,
    maxScale: spec.maxScale,
    padX: spec.padX,
    padY: spec.padY ?? BASE.padY,
  };
  const {
    isMeasured,
    profile,
    scale,
    baseW,
    baseH,
    needsVerticalScroll,
    stageStyle,
    wrapperStyle,
  } = useViewportStage(STAGE);

  if (loading) {
    return (
      <main className="min-h-[calc(100dvh-54px)]">
        <PageLoadingStage
          text={dictionary.skills.loading}
          noun={dictionary.skills.title}
        />
      </main>
    );
  }

  return (
    <main
      className={`skills-stage page-fade-in flex flex-col items-center ${
        needsVerticalScroll ? "justify-start overflow-x-hidden overflow-y-auto" : "justify-center overflow-hidden"
      }`}
      data-viewport-content
      data-viewport-profile={profile}
      data-viewport-scale={scale.toFixed(3)}
      data-skills-overflow={needsVerticalScroll ? "scroll" : "fit"}
      tabIndex={needsVerticalScroll ? 0 : undefined}
      aria-label={needsVerticalScroll ? dictionary.skills.title : undefined}
      data-skills-layout={desktopComposition ? "desktop" : "phone"}
      data-skills-size={
        ultraWideDesktopComposition
          ? "ultra-wide"
          : extraWideDesktopComposition
            ? "extra-wide"
            : wideDesktopComposition
              ? "wide"
              : "default"
      }
      style={wrapperStyle(STAGE.padY, STAGE.padX)}
    >
      <div
        className="relative shrink-0"
        // The server cannot measure the viewport. Reveal the fitted grid in
        // the first layout effect, before an unscaled fallback can be painted.
        style={{
          width: baseW * scale,
          height: baseH * scale,
          visibility: isMeasured ? "visible" : "hidden",
        }}
      >
        <div className="absolute left-0 top-0" style={stageStyle}>
          <ul
            className="skills-bento-grid grid"
            style={{
              gridTemplateColumns: `repeat(${STAGE.cols}, ${STAGE.cardW}px)`,
              gridAutoRows: `${STAGE.cardW / STAGE.cardRatio}px`,
              gap: STAGE.gap,
            }}
          >
            {orderedCategories.map((c, i) => {
              const centeredFinalTwoColumnCard =
                spec.cols === 2
                && orderedCategories.length % 2 === 1
                && i === orderedCategories.length - 1;

              return (
                <li
                  key={c.key}
                  data-skills-centered={centeredFinalTwoColumnCard ? "true" : undefined}
                  style={
                    centeredFinalTwoColumnCard
                      ? { gridColumn: "1 / -1", justifySelf: "center" }
                      : undefined
                  }
                >
                  <SkillCard
                    categoryKey={c.key}
                    title={c.title}
                    blurb={c.blurb}
                    items={byCat[c.key] ?? []}
                    cardW={STAGE.cardW}
                    cardRatio={STAGE.cardRatio}
                    cardIndex={i}
                    projectSkillNames={projectSkillNames}
                    largeContent={largeContent}
                  />
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </main>
  );
}
