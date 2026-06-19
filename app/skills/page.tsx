"use client";
import Header from "@/components/layout/Header";
import SkillsGrid from "@/components/skills/SkillsGrid";

export default function Page() {
  return (
    <div className="relative flex h-dvh w-full flex-col overflow-hidden text-white">
      <Header />

      {/* Constellation backdrop is rendered globally in app/layout.tsx */}
      <div className="relative z-10 min-h-0 flex-1">
        <SkillsGrid />
      </div>
    </div>
  );
}
