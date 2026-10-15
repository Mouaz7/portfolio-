import type { Project } from "@/components/project/types";

const TECHNOLOGY_ALIASES: Record<string, readonly string[]> = {
  "bash": ["bash", "shell"],
  "ci/cd": ["ci/cd", "jenkins", "github actions"],
  "css3": ["css", "css3"],
  "function calling": ["function calling", "ai"],
  "html5": ["html", "html5", "ejs"],
  "llm integration": ["llm integration", "llm", "ai"],
  "prompt design": ["prompt design", "ai"],
  "tailwind css": ["tailwind", "tailwind css"],
  "vue 3": ["vue", "vue 3"],
  "x86 asm": ["assembly", "x86", "x86 asm"],
  "react": ["react", "react native"],
  "sql": ["sql", "postgresql", "mysql", "mariadb", "sqlite"],
};

export function linkedSkillNames(
  skills: readonly { name: string }[],
  projects: readonly Pick<Project, "languages">[],
): string[] {
  return skills
    .filter((skill) => projects.some((project) =>
      matchesProjectTechnology(project, skill.name),
    ))
    .map((skill) => skill.name);
}

export function matchesProjectTechnology(
  project: Pick<Project, "languages">,
  technology: string,
): boolean {
  if (!technology || technology === "all") return true;
  const normalized = technology.trim().toLocaleLowerCase("en");
  const accepted = TECHNOLOGY_ALIASES[normalized] ?? [normalized];
  return project.languages.some((language) =>
    accepted.includes(language.trim().toLocaleLowerCase("en")),
  );
}

export function requestedProjectTechnology(value: string | string[] | undefined): string | null {
  const technology = (Array.isArray(value) ? value[0] : value)?.trim();
  return technology && technology.length <= 80 ? technology : null;
}
