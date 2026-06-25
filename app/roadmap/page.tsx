"use client";
import { useEffect, useState } from "react";
import Header from "@/components/layout/Header";
import FitToScreen from "@/components/layout/FitToScreen";
import GitGraphTimeline, { type RoadmapItem } from "@/components/roadmap/GitGraphTimeline";
import LoadingAnimation from "@/components/ui/LoadingAnimation";
import { useAccentHex } from "@/lib/hooks/useAccentRgb";
import { useLanguage } from "@/components/i18n/LanguageProvider";

type ApiItem = { id: string; title: string; description: string; icon?: string; from: string; to?: string | null };

export default function RoadmapPage() {
  const [items, setItems] = useState<RoadmapItem[]>([]);
  const [loading, setLoading] = useState(true);

  // DB-driven accent, live with the theme toggle.
  const BRAND = useAccentHex();
  const { t } = useLanguage();

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
    <div className="relative flex h-dvh w-full flex-col overflow-hidden">
      <Header />

      {/* One screen, no scroll: FitToScreen scales the timeline to fit on every
          device (constellation backdrop is global in app/layout.tsx). */}
      <main className="relative z-10 min-h-0 flex-1">
        {loading ? (
          <div className="absolute inset-0 z-20 grid place-items-center bg-black/50 backdrop-blur-sm">
            <LoadingAnimation text={t("roadmap.loading")} />
          </div>
        ) : (
          <FitToScreen>
            <div className="mx-auto w-full max-w-[820px] px-6 py-4 max-[675px]:px-4">
              <GitGraphTimeline items={items} accentColor={BRAND} />
            </div>
          </FitToScreen>
        )}
      </main>
    </div>
  );
}
