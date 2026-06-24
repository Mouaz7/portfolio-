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
          FitToScreen scales the whole natural-size card board uniformly to fit
          the screen. The board is taller than a phone screen, so it scales down
          to fill the height proportionally — no tiny/overlapping icons, no empty
          space, no scroll. On desktop it scales up a touch to fill. */}
      <div className="relative z-10 min-h-0 flex-1">
        <FitToScreen desktopMaxScale={mobile ? 1 : 1.32}>
          <SkillsGrid />
        </FitToScreen>
      </div>
    </div>
  );
}
