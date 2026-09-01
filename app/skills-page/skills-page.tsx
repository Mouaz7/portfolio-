"use client";
import Header from "@/components/navigation/Header";
import SkillsGrid from "@/components/skills/SkillsGrid";
import { useI18n } from "@/components/i18n/I18nProvider";
import type { SkillCategoryData, SkillData } from "@/lib/skills/data.server";

type SkillsPageProps = {
  initialCategories?: SkillCategoryData[];
  initialSkills?: SkillData[];
  performanceAudit?: boolean;
};

export default function Page({
  initialCategories,
  initialSkills,
  performanceAudit = false,
}: SkillsPageProps) {
  const { dictionary } = useI18n();
  return (
    <div className="flex min-h-[100dvh] w-full flex-col overflow-hidden text-white relative">
      {performanceAudit ? (
        <style>{`.animate-card,.animate-icon{animation:none!important;opacity:1!important;transform:none!important;filter:none!important}`}</style>
      ) : null}
      <Header />

      {/* Background is the shared global WebGL nebula (see app/layout.tsx) */}
      <div className="relative z-10 flex-1 min-h-0">
        <h1 className="sr-only">{dictionary.skills.title}</h1>
        <SkillsGrid
          initialCategories={initialCategories}
          initialSkills={initialSkills}
        />
      </div>
    </div>
  );
}
