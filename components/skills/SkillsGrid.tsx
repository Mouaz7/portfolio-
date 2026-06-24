"use client";

import { useEffect, useMemo, useState } from "react";
import { SkillCategoryCard } from "./SkillCategoryCard";
import LoadingAnimation from "@/components/ui/LoadingAnimation";

export type UISkill = {
  id: string;
  name: string;
  category?: string | null;
  src: string;
  xOffset?: number;
  yOffset?: number;
  weight?: number;
};

type Category = { key: string; title: string; blurb: string; accentRgb?: string | null };

export default function SkillsGrid({ fill = false }: { fill?: boolean }) {
  const [allSkills, setAllSkills] = useState<UISkill[]>([]);
  const [cats, setCats] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let off = false;
    (async () => {
      try {
        const [catRes, skillRes] = await Promise.all([
          fetch("/api/skill-categories", { cache: "no-store" }),
          fetch("/api/skills", { cache: "no-store" }),
        ]);
        if (!catRes.ok || !skillRes.ok) throw new Error("api error");
        const [catData, skillData] = await Promise.all([catRes.json(), skillRes.json()]);
        if (!off) {
          setCats(Array.isArray(catData) ? catData : []);
          setAllSkills(Array.isArray(skillData) ? skillData : []);
        }
      } catch {
        if (!off) setError(true);
      } finally {
        if (!off) setLoading(false);
      }
    })();
    return () => { off = true; };
  }, []);

  const byCat = useMemo(() => {
    const map: Record<string, UISkill[]> = {};
    for (const c of cats) map[c.key] = [];
    for (const s of allSkills) {
      if (s.category && map[s.category]) map[s.category].push(s);
    }
    Object.keys(map).forEach((k) => map[k].sort((a, b) => (a.weight ?? 0) - (b.weight ?? 0)));
    return map;
  }, [cats, allSkills]);

  if (loading) {
    return (
      <main className="flex min-h-[70vh] items-center justify-center">
        <LoadingAnimation text="Loading skills..." />
      </main>
    );
  }

  if (error || cats.length === 0) {
    return (
      <main className="flex min-h-[70vh] flex-col items-center justify-center gap-4 text-center px-6">
        <p className="text-sm" style={{ color: "var(--fg-50)" }}>
          {error ? "Kunde inte hämta skills från databasen." : "Inga skills hittades i databasen."}
        </p>
        <p className="text-xs" style={{ color: "var(--fg-50)" }}>
          Konfigurera SUPABASE_ANON_KEY i .env.local och kör setup.sql i Supabase SQL Editor.
        </p>
      </main>
    );
  }

  const rows = cats.filter((c) => (byCat[c.key]?.length ?? 0) > 0);

  return (
    <main className={`mx-auto flex w-full max-w-[1180px] flex-col px-[clamp(1rem,4vw,2.5rem)] py-[clamp(0.5rem,2vh,1.25rem)]${fill ? " h-full" : ""}`}>
      {/* Editorial header — compact so all rows fit on one screen */}
      <header className="animate-row shrink-0 pb-[clamp(0.5rem,1.6vh,1rem)]" style={{ animationFillMode: "both" }}>
        <p
          className="text-[clamp(0.6rem,1.4vh,0.72rem)] font-medium uppercase tracking-[0.32em]"
          style={{ color: "rgba(var(--accent-rgb),0.95)" }}
        >
          Toolbox
        </p>
        <h1 className="mt-1 text-[clamp(1.5rem,4.5vh,2.75rem)] font-bold leading-[1.05] tracking-tight">
          Skills &amp; Technologies
        </h1>
      </header>

      {/* Category cards in a responsive grid — 2-up on phones, 3-up on larger
          screens — so every icon keeps its full label and it all still fits one
          screen (scaled by FitToScreen), no scrolling. */}
      <div className={`grid grid-cols-2 gap-[clamp(0.5rem,1.5vh,1rem)] sm:grid-cols-3${fill ? " min-h-0 flex-1 auto-rows-fr" : ""}`}>
        {rows.map((c, i) => (
          <SkillCategoryCard
            key={c.key}
            title={c.title}
            blurb={c.blurb}
            accentRgb={c.accentRgb}
            items={byCat[c.key] ?? []}
            index={i + 1}
            fill={fill}
          />
        ))}
      </div>

      <style>{`
        @keyframes rowFadeUp {
          0%   { opacity: 0; transform: translateY(18px); filter: blur(2px); }
          100% { opacity: 1; transform: translateY(0);    filter: none; }
        }
        .animate-row { animation: rowFadeUp 700ms cubic-bezier(.2,.7,.2,1) both; will-change: transform, opacity, filter; }
        .skill-card { transition: transform .3s cubic-bezier(.2,.7,.2,1), border-color .3s; }
        .skill-card:hover { transform: translateY(-3px); border-color: rgba(var(--cat-rgb),0.5) !important; }
        @media (prefers-reduced-motion: reduce) {
          .animate-row { animation: none !important; opacity: 1 !important; transform: none !important; filter: none !important; }
          .skill-card:hover { transform: none; }
        }
      `}</style>
    </main>
  );
}
