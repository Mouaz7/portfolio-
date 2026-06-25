"use client";
import { useEffect, useState } from "react";
import Header from "@/components/layout/Header";
import FitToScreen from "@/components/layout/FitToScreen";
import SkillsGrid from "@/components/skills/SkillsGrid";

export default function Page() {
  // Desktop/tablet (≥640px): UNCHANGED — FitToScreen scales the natural-size
  // card board to fit one screen.
  // Phones (<640px): the board FILLS the whole screen height — cards grow to
  // share the height evenly so there's no empty space, while each card centers
  // its (fixed-size) icon rows in the extra room. No scroll, no swipe, no
  // overlap (the icon rows are centered, never stretched apart).
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

      {/* Constellation backdrop is rendered globally in app/layout.tsx. */}
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
