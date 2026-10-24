import ProjectsPage from "@/app/projects/projects-page";
import { localizedPageMetadata } from "@/lib/page-metadata";
import { getRequestLocale } from "@/lib/i18n/request-locale";
import { getProjects } from "@/lib/projects/data.server";
import { logServerError } from "@/lib/security/safe-logger.server";
import { requestedProjectTechnology } from "@/lib/projects/technology-filter";

export const generateMetadata = () => localizedPageMetadata("projects", "/projects");

type PageProps = {
  searchParams: Promise<{ technology?: string | string[] }>;
};

export default async function Page({ searchParams }: PageProps) {
  const initialTechnology = requestedProjectTechnology((await searchParams).technology);
  const locale = await getRequestLocale();
  try {
    return <ProjectsPage initialProjects={await getProjects(null, locale)} initialTechnology={initialTechnology} />;
  } catch (error) {
    logServerError("page.projects.initial_data_failed", error, {
      route: "/projects",
    });
    return <ProjectsPage initialLoadFailed initialTechnology={initialTechnology} />;
  }
}
