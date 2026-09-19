import ProjectsPage from "@/app/projects-page/projects-page";
import { localizedPageMetadata } from "@/lib/page-metadata";
import { getRequestLocale } from "@/lib/i18n/request-locale";
import { getProjects } from "@/lib/projects/data.server";
import { logServerError } from "@/lib/security/safe-logger.server";

export const generateMetadata = () => localizedPageMetadata("projects", "/projects");

export default async function Page() {
  const locale = await getRequestLocale();
  try {
    return <ProjectsPage initialProjects={await getProjects(null, locale)} />;
  } catch (error) {
    logServerError("page.projects.initial_data_failed", error, {
      route: "/projects",
    });
    return <ProjectsPage initialLoadFailed />;
  }
}
