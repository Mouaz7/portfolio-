const PROJECT_ICON_ALIASES: Readonly<Record<string, string>> = {
  "/project-icons/android.svg": "/skill-icons/mobile-android.svg",
  "/project-icons/category-systems.svg": "/skill-icons/devops-linux.svg",
  "/project-icons/cplusplus.svg": "/skill-icons/backend-c-plus-plus.svg",
  "/project-icons/githubactions.svg": "/skill-icons/devops-ci-cd.svg",
  "/project-icons/java.svg": "/skill-icons/backend-java.svg",
  "/project-icons/javascript.svg": "/skill-icons/frontend-javascript.svg",
  "/project-icons/python.svg": "/skill-icons/backend-python.svg",
  "/project-icons/react.svg": "/project-icons/category-full-stack.svg",
  "/project-icons/typescript.svg": "/skill-icons/frontend-typescript.svg",
};

/** Preserve approved pixels while serving one copy of byte-identical artwork. */
export function canonicalProjectIconHref(href: string): string {
  return PROJECT_ICON_ALIASES[href] ?? href;
}
