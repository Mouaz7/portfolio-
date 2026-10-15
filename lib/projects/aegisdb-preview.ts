import type { Project } from "@/components/project/types";
import type { Locale } from "@/lib/i18n/config";

export const AEGISDB_REPOSITORY_URL = "https://github.com/Mouaz7/AegisDB";
export const AEGISDB_PROJECT_DESCRIPTION =
  "An early-alpha distributed transactional key-value database in Java 21, exploring Raft consensus, MVCC, write-ahead logging, sharding, and two-phase commit.";
export const AEGISDB_PROJECT_LANGUAGES = [
  "Java",
  "Raft",
  "MVCC",
  "Docker",
  "Prometheus",
  "Maven",
  "gRPC",
  "Protocol Buffers",
  "OpenTelemetry",
  "Grafana",
  "TLA+",
  "JUnit",
  "Python",
  "Bash",
  "GitHub Actions",
  "CI/CD",
  "Git",
  "GitHub",
];

const descriptions: Record<Locale, string> = {
  en: AEGISDB_PROJECT_DESCRIPTION,
  sv: "En distribuerad transaktionell nyckel-värde-databas i Java 21 (tidig alfaversion) som utforskar Raft, MVCC, skrivloggning, sharding och tvåfas-commit.",
  ar: "قاعدة بيانات موزعة للمعاملات من نوع مفتاح-قيمة بلغة Java 21، في مرحلة ألفا مبكرة، تستكشف Raft وMVCC وسجل الكتابة والتقسيم والالتزام على مرحلتين.",
};

export function aegisDbPreview(locale: Locale): Project {
  return {
    id: "aegisdb-preview",
    title: "AegisDB",
    description: descriptions[locale],
    category: "Systems",
    github_url: AEGISDB_REPOSITORY_URL,
    languages: AEGISDB_PROJECT_LANGUAGES,
    cover_image_url: "/project-icons/java.svg",
    visibility: "public",
  };
}

export function withAegisDbPreview(
  projects: Project[],
  locale: Locale,
  category: string | null,
): Project[] {
  const categoryMatches = !category
    || category.toLowerCase() === "all"
    || category.toLowerCase() === "systems";
  const alreadyListed = projects.some((project) =>
    project.github_url.toLowerCase().replace(/\/$/, "") === AEGISDB_REPOSITORY_URL.toLowerCase(),
  );
  return categoryMatches && !alreadyListed
    ? [...projects, aegisDbPreview(locale)]
    : projects;
}
