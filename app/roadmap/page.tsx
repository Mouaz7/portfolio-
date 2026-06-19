"use client";
import { useEffect, useState } from "react";
import Header from "@/components/layout/Header";
import StreetTimeline, { type RoadmapItem } from "@/components/roadmap/StreetTimeline";
import LoadingAnimation from "@/components/ui/LoadingAnimation";
import { useAccentHex } from "@/lib/hooks/useAccentRgb";

type ApiItem = { id: string; title: string; description: string; icon?: string; from: string; to?: string | null };

export default function RoadmapPage() {
  const [items, setItems] = useState<RoadmapItem[]>([]);
  const [loading, setLoading] = useState(true);

  // DB-driven accent, live with the theme toggle.
  const BRAND = useAccentHex();

  useEffect(() => {
    let off = false;
    (async () => {
      try {
        const r = await fetch("/api/roadmap", { cache: "no-store" });
        if (!r.ok) throw new Error(String(r.status));
        const all: ApiItem[] = await r.json();
        if (!off) {
          setItems(all as any);
          setLoading(false);
        }
      } catch (e) {
        console.error("[RoadmapPage] fetch failed:", e);
        if (!off) {
          setLoading(false);
        }
      }
    })();
    return () => { off = true; };
  }, []);

  return (
    <div className="relative flex flex-col overflow-hidden" style={{ minHeight: "100dvh" }}>
      <Header />

      {/* Slide area (constellation backdrop is global in app/layout.tsx) */}
      <main className="relative flex-1 min-h-0 overflow-hidden px-[120px] pb-8 max-[675px]:px-5 max-[675px]:pb-6 grid place-items-center">
        {/* Loading state */}
        {loading && (
          <div className="absolute inset-0 z-20 bg-black/50 backdrop-blur-sm">
            <LoadingAnimation text="Loading roadmap..." />
          </div>
        )}

        {/* Content above the global backdrop */}
        <div className="relative z-10 w-full max-w-[1600px] max-h-full place-self-center">
          <StreetTimeline
            items={items}
            accentColor={BRAND}
            laneHeight={460}
            iconSize={96}
            autoScale
            // @ts-expect-error - style prop is not in type definition but works fine
            style={{ width: "100%", height: "auto", maxHeight: "100%", overflow: "visible" }}
          />
        </div>
      </main>
    </div>
  );
}
