// components/skills/SkillsGrid.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { useViewportStage } from "./useViewportStage";
import { SkillCard } from "./SkillCard";
import PageLoadingStage from "@/components/ui/PageLoadingStage";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { useMinimumLoading } from "@/hooks/useMinimumLoading";
import { useI18n } from "@/components/i18n/I18nProvider";
import type {
  SkillCategoryData,
  SkillData,
} from "@/lib/skills/data.server";

const BASE = { cardW: 360, gap: 24, cardRatio: 9 / 7, padY: 40 };
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
const DESKTOP_SPEC: Spec = { cols: 3, rows: 3 };
const WIDE_DESKTOP_SPEC: Spec = {
  cols: 3,
  rows: 3,
  cardW: 570,
  gap: 14,
  cardRatio: 2,
  maxScale: 1,
  padY: 28,
};
const MOBILE_SPEC: Spec = {
  cols: 2,
  rows: 5,
  gap: 10,
  cardRatio: 5 / 4,
  minScale: 0.3,
  padX: 4,
  padY: 6,
};

// Minimal skill shape used by our UI
type UISkill = SkillData;

type SkillsGridProps = {
  initialCategories?: CategoryMeta[];
  initialSkills?: UISkill[];
};

export default function SkillsGrid({
  initialCategories,
  initialSkills,
}: SkillsGridProps) {
  const { locale, dictionary } = useI18n();
  const [allSkills, setAllSkills] = useState<UISkill[]>(initialSkills ?? []);
  const [cats, setCats] = useState<CategoryMeta[]>(initialCategories ?? []);
  const { loading, finishLoading } = useMinimumLoading(400);

  // Fetch categories (DB: skill_category with title/blurb)
  useEffect(() => {
    if (initialCategories) {
      setCats(initialCategories);
      return;
    }
    let off = false;
    (async () => {
      try {
        const r = await fetch(`/api/skill-categories?locale=${locale}`);
        if (!r.ok) throw new Error(String(r.status));
        const items = await r.json();
        if (!off) setCats(items);
      } catch (e) {
        console.error("[SkillsGrid] fetch /api/skill-categories failed:", e);
        if (!off) setCats([]);
      }
    })();
    return () => { off = true; };
  }, [initialCategories, locale]);

  // ✅ Fetch skills (Supabase-backed)
  useEffect(() => {
    if (initialSkills) {
      setAllSkills(initialSkills);
      finishLoading();
      return;
    }
    let off = false;
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
        if (!off) finishLoading();
      }
    })();
    return () => { off = true; };
  }, [finishLoading, initialSkills]);

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

  // Phones retain the two-column composition. Tablets, iPads, and larger
  // platforms share the same three-column composition as desktop.
  const desktopComposition = useMediaQuery("(min-width: 640px)");
  const wideDesktopComposition = useMediaQuery(
    "(min-width: 1000px) and (min-aspect-ratio: 8/5)",
  );
  const spec = wideDesktopComposition
    ? WIDE_DESKTOP_SPEC
    : desktopComposition
      ? DESKTOP_SPEC
      : MOBILE_SPEC;

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
  const { stageStyle, wrapperStyle } = useViewportStage(STAGE);

  return (
    <>
      {loading ? (
        <main className="min-h-[calc(100dvh-54px)]">
          <PageLoadingStage
            text={dictionary.skills.loading}
            noun={dictionary.skills.title}
          />
        </main>
      ) : (
        <main
          className="skills-stage page-fade-in flex items-center justify-center"
          data-skills-layout={desktopComposition ? "desktop" : "phone"}
          data-skills-size={wideDesktopComposition ? "wide" : "default"}
          style={wrapperStyle(STAGE.padY, STAGE.padX)}
        >
          <div style={stageStyle}>
            <ul
              className="skills-bento-grid grid"
              style={{
                gridTemplateColumns: `repeat(${STAGE.cols}, ${STAGE.cardW}px)`,
                gridAutoRows: `${STAGE.cardW / STAGE.cardRatio}px`,
                gap: STAGE.gap,
              }}
            >
              {cats.map((c, i) => {
                const centeredFinalTwoColumnCard =
                  spec.cols === 2 && cats.length % 2 === 1 && i === cats.length - 1;

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
                      largeContent={wideDesktopComposition}
                    />
                  </li>
                );
              })}
            </ul>
          </div>
        </main>
      )}
    </>
  );
}
