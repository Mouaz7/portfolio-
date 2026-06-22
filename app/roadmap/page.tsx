"use client";
import { useEffect, useState } from "react";
import Header from "@/components/layout/Header";
import GitGraphTimeline, { type RoadmapItem } from "@/components/roadmap/GitGraphTimeline";
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
      <main className="relative flex-1 min-h-0 overflow-y-auto px-6 py-10 max-[675px]:px-4 max-[675px]:py-6">
        {/* Loading state */}
        {loading && (
          <div className="absolute inset-0 z-20 bg-black/50 backdrop-blur-sm">
            <LoadingAnimation text="Loading roadmap..." />
          </div>
        )}

        {/* Content above the global backdrop */}
        <div className="relative z-10 mx-auto w-full max-w-[820px]">
          <GitGraphTimeline items={items} accentColor={BRAND} />
        </div>
      </main>
    </div>
  );
}
