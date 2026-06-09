"use client";

import { useEffect, useMemo, useState } from "react";
import { useViewportStage } from "./useViewportStage";
import { SkillCard } from "./SkillCard";
import LoadingAnimation from "@/components/LoadingAnimation";

const BASE = { cardW: 360, gap: 24, cardRatio: 4 / 3, padY: 40 };

export type UISkill = {
  id: string;
  name: string;
  category?: string | null;
  src: string;
  xOffset?: number;
  yOffset?: number;
  weight?: number;
};

export default function SkillsGrid() {
  const [allSkills, setAllSkills] = useState<UISkill[]>([]);
  const [cats, setCats] = useState<{ key: string; title: string; blurb: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  // Fixed 3-col desktop / 2-col mobile layout
  const [cols, setCols] = useState(3);
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 768px)");
    const apply = () => setCols(mq.matches ? 3 : 2);
    apply();
    mq.addEventListener?.("change", apply);
    return () => mq.removeEventListener?.("change", apply);
  }, []);

  // ALL hooks must be called unconditionally before any early return
  const rows = Math.ceil(cats.length / cols) || 2;
  const STAGE = { ...BASE, cols, rows };
  const { stageStyle, wrapperStyle } = useViewportStage(STAGE);

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
    Object.keys(map).forEach(k => map[k].sort((a, b) => (a.weight ?? 0) - (b.weight ?? 0)));
    return map;
  }, [cats, allSkills]);

  // Early returns AFTER all hooks
  if (loading) {
    return (
      <main className="flex items-center justify-center min-h-screen bg-black">
        <LoadingAnimation text="Loading skills..." />
      </main>
    );
  }

  if (error || cats.length === 0) {
    return (
      <main className="flex flex-col items-center justify-center min-h-screen bg-black gap-4 text-center px-6">
        <p className="text-white/40 text-sm">
          {error ? "Kunde inte hämta skills från databasen." : "Inga skills hittades i databasen."}
        </p>
        <p className="text-white/25 text-xs">
          Konfigurera SUPABASE_ANON_KEY i .env.local och kör setup.sql i Supabase SQL Editor.
        </p>
      </main>
    );
  }

  return (
    <main className="flex items-center justify-center" style={wrapperStyle(STAGE.padY)}>
      <div style={stageStyle}>
        <ul
          className="grid"
          style={{
            gridTemplateColumns: `repeat(${cols}, ${BASE.cardW}px)`,
            gridAutoRows: `${BASE.cardW / BASE.cardRatio}px`,
            gap: BASE.gap,
          }}
        >
          {cats.map((c, i) => (
            <li key={c.key}>
              <SkillCard
                categoryKey={c.key}
                title={c.title}
                blurb={c.blurb}
                items={byCat[c.key] ?? []}
                cardW={BASE.cardW}
                cardRatio={BASE.cardRatio}
                cardIndex={i}
              />
            </li>
          ))}
        </ul>
      </div>

      <style>{`
        @keyframes cardBounceFadeIn {
          0%   { opacity: 0; transform: translateY(22px) scale(0.965); filter: blur(2px); }
          55%  { opacity: 1; transform: translateY(-4px) scale(1.02);  filter: blur(0.4px); }
          82%  {            transform: translateY(1px)  scale(0.998);   filter: blur(0); }
          100% {            transform: translateY(0)    scale(1);       filter: none; }
        }
        @keyframes iconBounceFadeIn {
          0%   { opacity: 0; transform: translateY(14px) scale(0.985); filter: blur(1.5px); }
          60%  { opacity: 1; transform: translateY(-2px) scale(1.01);  filter: blur(0.2px); }
          88%  {            transform: translateY(1px)   scale(0.999); filter: blur(0); }
          100% {            transform: translateY(0)     scale(1);     filter: none; }
        }
        .animate-card { animation: cardBounceFadeIn 900ms cubic-bezier(.2,.7,.2,1) both; will-change: transform, opacity, filter; }
        .animate-icon { animation: iconBounceFadeIn 1000ms cubic-bezier(.2,.7,.2,1) both; will-change: transform, opacity, filter; }
        @media (prefers-reduced-motion: reduce) {
          .animate-card, .animate-icon { animation: none !important; opacity: 1 !important; transform: none !important; filter: none !important; }
        }
      `}</style>
    </main>
  );
}
