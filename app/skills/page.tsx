"use client";
import { useEffect, useState } from "react";
import Header from "@/components/layout/Header";
import FitToScreen from "@/components/layout/FitToScreen";
import SkillsGrid from "@/components/skills/SkillsGrid";

export default function Page() {
  // Desktop/tablet (≥640px): UNCHANGED — FitToScreen scales the natural-size
  // card board to fit one screen. Phones (<640px): the board stretches to fill
  // the whole screen height (no empty space) instead of being scaled small.
  const [mobile, setMobile] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 639px)");
    const apply = () => setMobile(mq.matches);
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, []);

  return (
    <div className="relative flex h-dvh w-full flex-col overflow-hidden text-white">
      <Header />

      {/* Constellation backdrop is rendered globally in app/layout.tsx.
          Desktop (UNCHANGED): FitToScreen scales the natural-size board to fit.
          Mobile: the board STRETCHES to fill the whole screen height (cards and
          icon rows grow) — no empty space, no scroll. */}
      <div className="relative z-10 min-h-0 flex-1">
        {mobile ? (
          <SkillsGrid fill />
        ) : (
          <FitToScreen desktopMaxScale={1.32}>
            <SkillsGrid />
          </FitToScreen>
        )}
      </div>
    </div>
  );
}
