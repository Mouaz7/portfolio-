import ProjectsPage from "./projects-page";
import { localizedPageMetadata } from "@/lib/page-metadata";
import { getRequestLocale } from "@/lib/i18n/request-locale";
import { getProjects } from "@/lib/projects/data.server";
import { logServerError } from "@/lib/security/safe-logger.server";
import { requestedProjectTechnology } from "@/lib/projects/technology-filter";

export const generateMetadata = () => localizedPageMetadata("projects", "/projects-page");

type PageProps = {
  searchParams: Promise<{ technology?: string | string[] }>;
};

export default async function Page({ searchParams }: PageProps) {
  const initialTechnology = requestedProjectTechnology((await searchParams).technology);
  const locale = await getRequestLocale();
  try {
    const initialProjects = await getProjects(null, locale);

    // Repository counters are secondary information. The client loads them
    // after the project cards are visible, so a slow GitHub response can never
    // hold the route transition for up to the API timeout.
    return <ProjectsPage initialProjects={initialProjects} initialTechnology={initialTechnology} />;
  } catch (error) {
    logServerError("page.projects_legacy.initial_data_failed", error, {
      route: "/projects-page",
    });
    return <ProjectsPage initialLoadFailed initialTechnology={initialTechnology} />;
  }
}
