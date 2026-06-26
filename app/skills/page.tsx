"use client";
import { useEffect, useState } from "react";
import Header from "@/components/layout/Header";
import FitToScreen from "@/components/layout/FitToScreen";
import SkillsGrid from "@/components/skills/SkillsGrid";

export default function Page() {
  // Desktop/tablet (≥640px): UNCHANGED — FitToScreen scales the natural-size
  // card board to fit one screen.
  // Phones (<640px): the board fills the viewport without scrolling. Skill
  // labels are hidden there so all categories and icons can fit cleanly.
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
          <div className="h-full lg:pt-12 xl:pt-14">
            <FitToScreen desktopMaxScale={1.32}>
              <SkillsGrid />
            </FitToScreen>
          </div>
        )}
      </div>
    </div>
  );
}
