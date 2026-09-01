import SkillsPage from "./skills-page";
import { localizedPageMetadata } from "@/lib/page-metadata";
import { getRequestLocale } from "@/lib/i18n/request-locale";
import { getSkillCategories, getSkills } from "@/lib/skills/data.server";

export const generateMetadata = () => localizedPageMetadata("skills", "/skills-page");

type PageProps = {
  searchParams: Promise<{ audit?: string }>;
};

export default async function Page({ searchParams }: PageProps) {
  const performanceAudit = (await searchParams).audit === "performance";
  const locale = await getRequestLocale();
  const initialData = await Promise.all([
    getSkillCategories(locale),
    getSkills(),
  ]).catch((error) => {
    console.error("[skills-page] initial data failed:", error);
    return undefined;
  });

  return (
    <>
      <link
        rel="preload"
        href="/skill-icons/devops-pytest.svg"
        as="image"
        type="image/svg+xml"
        fetchPriority="high"
      />
      <SkillsPage
        initialCategories={initialData?.[0]}
        initialSkills={initialData?.[1]}
        performanceAudit={performanceAudit}
      />
    </>
  );
}
