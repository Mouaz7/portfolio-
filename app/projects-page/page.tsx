import ProjectsPage from "./projects-page";
import { localizedPageMetadata } from "@/lib/page-metadata";
import { getRequestLocale } from "@/lib/i18n/request-locale";
import { getProjects } from "@/lib/projects/data.server";

export const generateMetadata = () => localizedPageMetadata("projects", "/projects-page");

export default async function Page() {
  const locale = await getRequestLocale();
  try {
    const initialProjects = await getProjects(null, locale);

    // Repository counters are secondary information. The client loads them
    // after the project cards are visible, so a slow GitHub response can never
    // hold the route transition for up to the API timeout.
    return <ProjectsPage initialProjects={initialProjects} />;
  } catch (error) {
    console.error("[projects-page] initial data failed:", error);
    return <ProjectsPage initialLoadFailed />;
  }
}
