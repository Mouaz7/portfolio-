import { canonicalProjectIconHref } from "./icon-assets.ts";
import {
  AEGISDB_PROJECT_DESCRIPTION,
  AEGISDB_PROJECT_LANGUAGES,
} from "./aegisdb-preview.ts";

export const GITHUB_OWNER = "Mouaz7";
export const MANUAL_PORTFOLIO_URL = `https://github.com/${GITHUB_OWNER}/portfolio-`;
const EXCLUDED_REPO_NAMES = new Set(["portfolio-test", GITHUB_OWNER.toLowerCase()]);

export type ProjectCategory = "Full-Stack" | "Build" | "Systems" | "Mobile";

export const PROJECT_CATEGORY_ORDER = [
  "Full-Stack",
  "Build",
  "Mobile",
  "Systems",
] as const satisfies readonly ProjectCategory[];

export interface GitHubRepo {
  id: number;
  name: string;
  full_name: string;
  private: boolean;
  description: string | null;
  html_url: string;
  language: string | null;
  topics?: string[];
  homepage?: string | null;
  fork?: boolean;
  archived?: boolean;
  default_branch: string;
}

export interface RepoTechnologyEvidence {
  paths?: readonly string[];
  manifestText?: string;
}

export interface ProjectUpsertRecord {
  title: string;
  description: string;
  category: ProjectCategory;
  github_url: string;
  languages: string[];
  cover_image_href: string;
  is_active: boolean;
  sort_order: number;
}

interface ProjectOverride {
  title?: string;
  description?: string;
  category?: ProjectCategory;
  languages?: string[];
  iconKey?: string;
}

// Verified against public repository trees, manifests, and READMEs on
// 2026-09-24. The two Softhouse showcase repos contain documentation rather
// than source, so their technologies come from their own architecture tables.
const AUDITED_REPO_TECHNOLOGIES: Record<string, readonly string[]> = {
  "Mouaz7/AegisDB": [
    "Java", "Raft", "MVCC", "Maven", "gRPC", "Protocol Buffers",
    "OpenTelemetry", "Prometheus", "Grafana", "TLA+", "JUnit",
    "Python", "Bash", "Docker", "GitHub Actions", "CI/CD",
  ],
  "Mouaz7/auto-healing-devops-platform": [
    "Python", "Docker", "Jenkins", "MCP", "OpenAI", "Anthropic",
    "Prometheus", "Pytest", "Bandit", "Pylint", "Slack", "Jira", "CI/CD", "AI",
  ],
  "Mouaz7/team-temp-app": [
    "React", "React Native", "TypeScript", "Vite", "Tailwind CSS",
    "React Query", "Expo", "Express", "Bun", "MongoDB", "Prisma",
    "Better Auth", "Google OAuth", "Gemini AI", "Cloudinary", "Qlik",
    "Zod", "Cypress", "Google Cloud", "CI/CD", "AI",
  ],
  "Mouaz7/Move-Out": [
    "JavaScript", "EJS", "HTML5", "CSS3", "SQLite", "Jest",
    "Passport.js", "Google OAuth", "Docker", "GitHub Actions", "CI/CD",
  ],
  "Mouaz7/Campus360": [
    "Kotlin", "Java", "Android", "Jetpack Compose", "Firebase",
    "Firebase Auth", "Firestore", "Google Maps", "Gradle", "JUnit",
    "GitHub Actions", "CI/CD",
  ],
  "Mouaz7/Asm-Buffered-IO": ["Assembly", "C", "x86", "Linux"],
  "Mouaz7/Concurrency-Systems": ["C", "Linux"],
  "Mouaz7/Os_filesystem": ["C++", "Linux"],
  "Mouaz7/chess-game": [
    "C++", "SFML", "OOP", "MSBuild", "vcpkg", "PowerShell",
    "GitHub Actions", "CI/CD",
  ],
  "Mouaz7/PongPal-Showcase": [
    "React", "TypeScript", "Slack API", "Firebase Functions", "Firestore",
    "Firebase Realtime", "Python", "Google OAuth", "Raspberry Pi",
  ],
  "Mouaz7/Eshop-management-system": [
    "Node.js", "Express", "MariaDB", "MySQL", "SQL", "EJS",
    "JavaScript", "HTML5", "CSS3",
  ],
  "Mouaz7/Python-Linked-List": ["Python"],
  "Mouaz7/Python-Table-Implementations": ["Python"],
  "Mouaz7/ARM-Interrupt-UART-Display": ["Assembly", "ARM", "UART"],
  "Mouaz7/ARM-UART-Factorial": ["Assembly", "ARM", "UART"],
  "Mouaz7/Practical-Communication": ["Python", "TCP", "UDP", "HTTP"],
  "Mouaz7/network-udp-tcp-analysis": ["Python", "TCP", "UDP"],
  "Mouaz7/Python-directed-graph-bfs": ["Python", "BFS", "Graphs", "Pytest"],
  "Mouaz7/BurgerProject": [
    "Node.js", "Express", "MySQL", "SQL", "EJS", "JavaScript",
    "HTML5", "CSS3", "Security",
  ],
  "Mouaz7/typing-speed-tracker": ["Python"],
  "Mouaz7/Cpp-TransportSystem": ["C++", "OOP"],
  "Mouaz7/bsv-duplicate": ["Python", "Pytest", "GitHub Actions", "CI/CD"],
  "Mouaz7/bsv-edutask": [
    "Python", "JavaScript", "Flask", "React", "Cypress", "Pytest",
    "HTML5", "CSS3", "Docker", "MongoDB",
  ],
  "Mouaz7/quiz-game": ["C++", "OOP", "Algorithms"],
};
const AUDITED_REPO_TECHNOLOGIES_BY_NAME = new Map(
  Object.entries(AUDITED_REPO_TECHNOLOGIES).map(([fullName, technologies]) => [
    fullName.toLocaleLowerCase("en"),
    technologies,
  ]),
);

function auditedRepoTechnologies(fullName: string) {
  return AUDITED_REPO_TECHNOLOGIES_BY_NAME.get(
    fullName.trim().toLocaleLowerCase("en"),
  ) ?? [];
}

export const MANUAL_PORTFOLIO_TECHNOLOGIES = [
  "Next.js",
  "TypeScript",
  "React",
  "Node.js",
  "Tailwind CSS",
  "HTML5",
  "CSS3",
  "Supabase",
  "Vercel",
  "GitHub Actions",
  "CI/CD",
  "Bash",
  "Git",
  "GitHub",
] as const;

const PROJECT_ICON_DIR = "/project-icons";

const REPO_OVERRIDES: Record<string, ProjectOverride> = {
  "Mouaz7/AegisDB": {
    title: "AegisDB",
    description: AEGISDB_PROJECT_DESCRIPTION,
    category: "Systems",
    languages: AEGISDB_PROJECT_LANGUAGES,
    iconKey: "java",
  },
  "Mouaz7/auto-healing-devops-platform": {
    title: "Auto-Healing DevOps Platform",
    description:
      "An AI-powered, self-healing CI/CD pipeline with six specialized agents, MCP microservices, a traffic-light safety system, and Prometheus metrics. Developed as a bachelor’s thesis at BTH.",
    category: "Build",
    languages: ["Python", "Jenkins", "Docker", "JSON", "AI"],
    iconKey: "python",
  },
  "Mouaz7/team-temp-app": {
    title: "Team Temp App Showcase",
    description:
      "Visual and video documentation for Team Temp App, an AI-driven employee survey platform developed for Softhouse.",
    category: "Full-Stack",
    languages: ["React", "React Native", "TypeScript", "AI", "Express", "Bun"],
    iconKey: "react",
  },
  "Mouaz7/Move-Out": {
    title: "Move-Out: Moving Box System",
    description:
      "A professional moving box management system built with Node.js, Express, and EJS, using SQLite for development and PostgreSQL/Supabase in production with robust security controls.",
    category: "Full-Stack",
    languages: ["Node.js", "Express", "PostgreSQL", "Supabase", "Security"],
    iconKey: "nodejs-badge",
  },
  "Mouaz7/Campus360": {
    description:
      "An Android campus navigation app with indoor and outdoor maps, pathfinding, and Firebase authentication, built with Kotlin, Clean Architecture, and MVVM.",
    category: "Mobile",
    languages: ["Kotlin", "Java", "Firebase", "Android"],
    iconKey: "android",
  },
  "Mouaz7/Asm-Buffered-IO": {
    title: "Buffered I/O in Assembly",
    description:
      "An Assembly and C I/O library with x86-64 routines for text and integer input/output, plus test applications in both languages.",
    category: "Systems",
    languages: ["Assembly", "C", "x86"],
    iconKey: "c",
  },
  "Mouaz7/Concurrency-Systems": {
    description:
      "Low-level systems programming in C covering multithreading, process synchronization, IPC mechanisms, and memory-management algorithms.",
    category: "Systems",
    languages: ["C", "Linux", "POSIX Threads"],
    iconKey: "c",
  },
  "Mouaz7/Os_filesystem": {
    title: "OS Filesystem",
    description:
      "A C++ implementation of a FAT-based file system with a command-line shell.",
    category: "Systems",
    languages: ["C++", "Linux"],
    iconKey: "cplusplus",
  },
  "Mouaz7/chess-game": {
    title: "Chess Game",
    description:
      "A lightweight chess game built with C++ and SFML 3.0, featuring move hints, material scores, player names, 10-minute timers, and automatically saved results.",
    category: "Systems",
    languages: ["C++", "SFML", "OOP", "MSBuild", "vcpkg"],
    iconKey: "cplusplus",
  },
  "Mouaz7/PongPal-Showcase": {
    title: "PongPal Showcase",
    description:
      "A visual showcase of the PongPal project developed at Softhouse, featuring booking, statistics, and user profile flows. The repository contains images and videos, not source code.",
    category: "Full-Stack",
    languages: ["React", "TypeScript", "Firebase", "Slack API"],
    iconKey: "typescript",
  },
  "Mouaz7/Eshop-management-system": {
    title: "E-Shop Management System",
    description:
      "A full-stack e-commerce management system built with Node.js, Express, EJS, and MariaDB, including product, category, order, and inventory management, stored procedures, triggers, and an admin interface.",
    category: "Full-Stack",
    languages: ["Node.js", "Express", "MariaDB", "MySQL", "EJS"],
    iconKey: "nodejs-badge",
  },
  "Mouaz7/Python-Linked-List": {
    title: "Linked List in Python",
    description:
      "A Python implementation of the TwoCell class for doubly linked lists.",
    category: "Systems",
    languages: ["Python", "Data Structures"],
    iconKey: "python",
  },
  "Mouaz7/Python-Table-Implementations": {
    description:
      "Implementations and performance tests for a table ADT in Python, including TableAsArray, TableAsList, and TableAsMTF.",
    category: "Systems",
    languages: ["Python", "Algorithms"],
    iconKey: "python",
  },
  "Mouaz7/ARM-Interrupt-UART-Display": {
    title: "ARM Interrupt and UART Display",
    description:
      "An ARM Cortex-A9 Assembly project that handles button interrupts, reads UART commands, and updates a seven-segment display.",
    category: "Systems",
    languages: ["Assembly", "ARM", "UART"],
    iconKey: "c",
  },
  "Mouaz7/ARM-UART-Factorial": {
    title: "ARM UART Factorial",
    description:
      "A compact ARM Assembly project that computes factorials recursively and prints the results over UART.",
    category: "Systems",
    languages: ["Assembly", "ARM", "UART"],
    iconKey: "c",
  },
  "Mouaz7/Practical-Communication": {
    title: "Practical Network Communication",
    description:
      "A practical network communication project using TCP, UDP, and a simple web browser.",
    category: "Systems",
    languages: ["Python", "TCP", "UDP"],
    iconKey: "python",
  },
  "Mouaz7/network-udp-tcp-analysis": {
    title: "UDP and TCP Analysis",
    description:
      "Analysis and implementation of UDP and TCP send-and-receive tests, including performance observations and improvements.",
    category: "Systems",
    languages: ["Python", "TCP", "UDP"],
    iconKey: "python",
  },
  "Mouaz7/Python-directed-graph-bfs": {
    title: "Directed Graph and BFS in Python",
    description:
      "A Python program that checks connectivity in directed graphs using breadth-first search (BFS).",
    category: "Systems",
    languages: ["Python", "BFS", "Graphs"],
    iconKey: "python",
  },
  "Mouaz7/BurgerProject": {
    title: "Burger Project",
    description:
      "A full-stack burger ordering app built with Node.js, MySQL, and EJS, including order customization, a kitchen view, and database integration.",
    category: "Full-Stack",
    languages: ["Node.js", "Express", "MySQL", "EJS"],
    iconKey: "nodejs-badge",
  },
  "Mouaz7/typing-speed-tracker": {
    description:
      "A Python program that measures and tracks typing speed with word lists at different difficulty levels.",
    category: "Systems",
    languages: ["Python"],
    iconKey: "python",
  },
  "Mouaz7/Cpp-TransportSystem": {
    title: "C++ Transport System",
    description:
      "A C++ project for managing transport schedules, shuttle services, and passenger bookings.",
    category: "Systems",
    languages: ["C++", "OOP"],
    iconKey: "cplusplus",
  },
  "Mouaz7/bsv-duplicate": {
    title: "BSV Duplicate",
    description:
      "A course project that detects duplicate entries in BibTeX files.",
    category: "Systems",
    languages: ["Python", "Pytest"],
    iconKey: "python",
  },
  "Mouaz7/bsv-edutask": {
    title: "BSV Edutask",
    description:
      "An educational project for the PA1417 course that applies software-testing techniques.",
    category: "Systems",
    languages: ["Python", "Flask", "React", "Cypress", "Pytest", "Testing"],
    iconKey: "python",
  },
  "Mouaz7/quiz-game": {
    title: "Quiz Game",
    description:
      "An object-oriented C++ quiz system for creating, managing, and playing quizzes, with multiple question types, players, leaderboards, file handling, and UML documentation.",
    category: "Systems",
    languages: ["C++", "OOP", "Algorithms"],
    iconKey: "cplusplus",
  },
};

const CATEGORY_ICON_KEYS: Record<ProjectCategory, string> = {
  Build: "githubactions",
  "Full-Stack": "category-full-stack",
  Mobile: "android",
  Systems: "category-systems",
};

const ICON_KEYWORDS: Array<{ key: string; terms: string[] }> = [
  { key: "android", terms: ["android"] },
  { key: "kotlin", terms: ["kotlin"] },
  { key: "java", terms: ["java"] },
  { key: "flutter", terms: ["flutter"] },
  { key: "nextjs", terms: ["next.js", "nextjs"] },
  { key: "react", terms: ["react"] },
  { key: "typescript", terms: ["typescript"] },
  { key: "javascript", terms: ["javascript"] },
  { key: "nodejs-badge", terms: ["node.js", "nodejs"] },
  { key: "express", terms: ["express"] },
  { key: "firebase", terms: ["firebase"] },
  { key: "gcp", terms: ["gcp", "google cloud", "googlecloud"] },
  { key: "githubactions", terms: ["github actions", "ci/cd", "pipeline"] },
  { key: "supabase", terms: ["supabase"] },
  { key: "tailwindcss", terms: ["tailwind"] },
  { key: "mysql", terms: ["mysql"] },
  { key: "postgresql", terms: ["postgres", "postgresql"] },
  { key: "docker", terms: ["docker"] },
  { key: "python", terms: ["python"] },
  { key: "cplusplus", terms: ["c++", "cpp"] },
  { key: "c", terms: [" c ", " c,", " c.", "language c", "written in c"] },
  { key: "vite", terms: ["vite"] },
  { key: "html5", terms: ["html"] },
  { key: "css3", terms: ["css"] },
];

const LANGUAGE_LABELS: Record<string, string> = {
  c: "C",
  "c++": "C++",
  cpp: "C++",
  css: "CSS3",
  dockerfile: "Docker",
  ejs: "EJS",
  firebase: "Firebase",
  gcp: "GCP",
  html: "HTML5",
  javascript: "JavaScript",
  java: "Java",
  jenkins: "Jenkins",
  json: "JSON",
  kotlin: "Kotlin",
  "github actions": "GitHub Actions",
  linux: "Linux",
  mysql: "MySQL",
  "next.js": "Next.js",
  nextjs: "Next.js",
  "node.js": "Node.js",
  nodejs: "Node.js",
  postgres: "PostgreSQL",
  postgresql: "PostgreSQL",
  powershell: "PowerShell",
  python: "Python",
  react: "React",
  "react native": "React Native",
  security: "Security",
  shell: "Bash",
  supabase: "Supabase",
  swift: "Swift",
  tailwind: "Tailwind",
  typescript: "TypeScript",
  x86: "x86",
};

const TITLE_REPLACEMENTS: Array<[RegExp, string]> = [
  [/\bCpp\b/gi, "C++"],
  [/\bOs\b/g, "OS"],
  [/\bAi\b/g, "AI"],
  [/\bCi\/Cd\b/gi, "CI/CD"],
  [/\bDevops\b/gi, "DevOps"],
  [/\bIo\b/g, "IO"],
  [/\bUdp\b/gi, "UDP"],
  [/\bTcp\b/gi, "TCP"],
  [/\bApi\b/gi, "API"],
  [/\bUi\b/gi, "UI"],
  [/\bUx\b/gi, "UX"],
];

function titleCaseWord(word: string) {
  if (!word) {
    return word;
  }

  return word[0].toUpperCase() + word.slice(1).toLowerCase();
}

export function prettifyRepoTitle(repoName: string) {
  const base = repoName
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .split(" ")
    .map(titleCaseWord)
    .join(" ");

  return TITLE_REPLACEMENTS.reduce(
    (title, [pattern, replacement]) => title.replace(pattern, replacement),
    base,
  );
}

function normalizeLanguageLabel(language: string) {
  const normalized = language.trim();
  const mapped = LANGUAGE_LABELS[normalized.toLowerCase()];
  return mapped ?? normalized;
}

function uniqueTechnologies(...groups: readonly (readonly string[])[]) {
  const seen = new Set<string>();
  return groups.flatMap((group) => group.filter((technology) => {
    const key = technology.trim().toLocaleLowerCase("en");
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  }));
}

function verifiedRepoTechnologies(fullName: string): string[] | null {
  const audited = auditedRepoTechnologies(fullName);
  if (audited.length === 0) return null;

  const override = Object.entries(REPO_OVERRIDES).find(
    ([name]) => name.toLowerCase() === fullName.toLowerCase(),
  )?.[1];

  return uniqueTechnologies(override?.languages ?? [], audited, ["Git", "GitHub"]);
}

export function mergeAuditedProjectTechnologies(
  fullName: string,
  current: readonly string[] = [],
) {
  return verifiedRepoTechnologies(fullName) ?? uniqueTechnologies(current, ["Git", "GitHub"]);
}

/** Prefer the reviewed stack over stale or vendored-language database tags. */
export function projectTechnologiesForDisplay(
  githubUrl: string,
  current: readonly string[] = [],
) {
  const fullName = githubUrlToFullName(githubUrl);
  const normalizedCurrent = current.map((technology) =>
    technology.trim().toLowerCase() === "tailwind" ? "Tailwind CSS" : technology,
  );

  if (fullName.toLowerCase() === `${GITHUB_OWNER.toLowerCase()}/portfolio-`) {
    return [...MANUAL_PORTFOLIO_TECHNOLOGIES];
  }

  return verifiedRepoTechnologies(fullName) ?? uniqueTechnologies(normalizedCurrent);
}

function technologiesFromEvidence(evidence: RepoTechnologyEvidence = {}) {
  const paths = (evidence.paths ?? []).map((path) => path.toLocaleLowerCase("en"));
  const manifest = evidence.manifestText?.toLocaleLowerCase("en") ?? "";
  const technologies: string[] = [];
  const hasPath = (pattern: RegExp) => paths.some((path) => pattern.test(path));
  const hasManifest = (pattern: RegExp) => pattern.test(manifest);

  if (hasPath(/^\.github\/workflows\/[^/]+\.ya?ml$/)) {
    technologies.push("GitHub Actions", "CI/CD");
  }
  if (hasPath(/(^|\/)(jenkinsfile|\.jenkinsfile)$/)) {
    technologies.push("Jenkins", "CI/CD");
  }
  if (hasPath(/(^|\/)vercel\.json$/) || hasPath(/(^|\/)\.vercel\//)) {
    technologies.push("Vercel");
  }
  if (hasPath(/(^|\/)(dockerfile(?:\.[^/]+)?|compose\.ya?ml|docker-compose\.ya?ml)$/)) {
    technologies.push("Docker");
  }
  if (hasPath(/\.(?:html?|ejs)$/)) technologies.push("HTML5");
  if (hasPath(/\.css$/)) technologies.push("CSS3");
  if (hasPath(/(^|\/)bun\.lockb?$/) || hasPath(/(^|\/)bunfig\.toml$/)) {
    technologies.push("Bun");
  }

  const manifestTechnologies: Array<[RegExp, string]> = [
    [/"next"\s*:|\bnext(?:js)?==/, "Next.js"],
    [/"react"\s*:/, "React"],
    [/"express"\s*:/, "Express"],
    [/"tailwindcss"\s*:/, "Tailwind CSS"],
    [/"cypress"\s*:/, "Cypress"],
    [/(?:^|[\s"'])flask(?:[\s"'=<~>]|$)/m, "Flask"],
    [/(?:^|[\s"'])pytest(?:[\s"'=<~>]|$)/m, "Pytest"],
    [/"(?:mongodb|mongoose)"\s*:|\bmongodb(?:[\s=<>~]|$)/m, "MongoDB"],
    [/"graphql"\s*:|\bgraphql(?:[\s=<>~]|$)/m, "GraphQL"],
    [/"firebase"\s*:/, "Firebase"],
    [/"(?:vue|@vue\/[^"']+)"\s*:/, "Vue 3"],
  ];
  for (const [pattern, technology] of manifestTechnologies) {
    if (hasManifest(pattern)) technologies.push(technology);
  }

  return uniqueTechnologies(technologies);
}

function deriveLanguages(
  repo: Pick<GitHubRepo, "name" | "description" | "language">,
  languageMap: Record<string, number> = {},
  evidence: RepoTechnologyEvidence = {},
) {
  const picked = Object.keys(languageMap)
    .sort((left, right) => languageMap[right] - languageMap[left])
    .slice(0, 5)
    .map(normalizeLanguageLabel);

  const repositoryTools = ["Git", "GitHub"];
  const evidenceTechnologies = technologiesFromEvidence(evidence);

  if (picked.length > 0) {
    return uniqueTechnologies(picked, evidenceTechnologies, repositoryTools);
  }

  const mainLanguage = repo.language ? normalizeLanguageLabel(repo.language) : null;
  if (mainLanguage) {
    return uniqueTechnologies([mainLanguage], evidenceTechnologies, repositoryTools);
  }

  const haystack = `${repo.name} ${repo.description ?? ""}`.toLowerCase();
  const fallbackMatches = [
    "React",
    "Next.js",
    "Node.js",
    "TypeScript",
    "JavaScript",
    "Python",
    "C++",
    "C",
    "MySQL",
    "Docker",
    "Firebase",
    "Supabase",
    "GitHub Actions",
    "Assembly",
  ].filter((candidate) => haystack.includes(candidate.toLowerCase()));

  return uniqueTechnologies(
    fallbackMatches.slice(0, 5),
    evidenceTechnologies,
    repositoryTools,
  );
}

function matchesAny(haystack: string, values: string[]) {
  return values.some((value) => haystack.includes(value));
}

function inferProjectCategory(
  repo: Pick<GitHubRepo, "name" | "description" | "language" | "topics">,
  languages: string[],
): ProjectCategory {
  const haystack = [
    repo.name,
    repo.description ?? "",
    repo.language ?? "",
    ...(repo.topics ?? []),
    ...languages,
  ]
    .join(" ")
    .toLowerCase();

  if (
    matchesAny(haystack, [
      "android",
      "ios",
      "react native",
      "flutter",
      "mobile",
      "swift",
      "kotlin",
      "expo",
      "apk",
    ])
  ) {
    return "Mobile";
  }

  if (
    matchesAny(haystack, [
      "devops",
      "ci/cd",
      "pipeline",
      "docker",
      "automation",
      "github actions",
      "terraform",
      "ansible",
      "infra",
      "infrastructure",
      "build",
    ])
  ) {
    return "Build";
  }

  if (
    matchesAny(haystack, [
      "assembly",
      "buffered io",
      "filesystem",
      "kernel",
      "concurrency",
      "thread",
      "pthread",
      "network",
      "socket",
      "tcp",
      "udp",
      "os ",
      "operating system",
      "linux",
      "syscall",
      "low-level",
      "x86",
      "arm",
      "c++",
      "c ",
    ])
  ) {
    return "Systems";
  }

  return "Full-Stack";
}

function buildIconPath(iconKey: string) {
  return canonicalProjectIconHref(`${PROJECT_ICON_DIR}/${iconKey}.svg`);
}

export function getProjectCategoryRank(category: ProjectCategory) {
  const index = PROJECT_CATEGORY_ORDER.indexOf(category);
  return index === -1 ? PROJECT_CATEGORY_ORDER.length : index;
}

export function inferProjectIconKey(
  repo: Pick<GitHubRepo, "name" | "description" | "language" | "topics">,
  category: ProjectCategory,
  languages: string[],
) {
  if (languages.some((language) => language.toLowerCase() === "node.js")) {
    return "nodejs-badge";
  }

  const haystack = [
    repo.name,
    repo.description ?? "",
    repo.language ?? "",
    ...(repo.topics ?? []),
    ...languages,
  ]
    .join(" ")
    .toLowerCase();

  for (const matcher of ICON_KEYWORDS) {
    if (matchesAny(haystack, matcher.terms)) {
      return matcher.key;
    }
  }

  return CATEGORY_ICON_KEYS[category] ?? "github";
}

function applyRepoOverride(
  fullName: string,
  row: ProjectUpsertRecord,
) {
  const override = REPO_OVERRIDES[fullName];

  if (!override) {
    return row;
  }

  const iconKey = override.iconKey ? buildCoverImageHref(override.iconKey) : row.cover_image_href;

  return {
    ...row,
    title: override.title ?? row.title,
    description: override.description ?? row.description,
    category: override.category ?? row.category,
    languages: override.languages
      ? uniqueTechnologies(override.languages, row.languages)
      : row.languages,
    cover_image_href: iconKey,
  };
}

function buildCoverImageHref(iconKey: string) {
  return buildIconPath(iconKey);
}

export function collectProjectIconPaths(rows: Pick<ProjectUpsertRecord, "cover_image_href">[]) {
  return Array.from(new Set(rows.map((row) => row.cover_image_href)));
}

export function iconPathToKey(iconPath: string) {
  return iconPath.replace(`${PROJECT_ICON_DIR}/`, "").replace(/\.svg$/i, "");
}

export function githubUrlToFullName(githubUrl: string) {
  const match = githubUrl.match(/github\.com\/([^/]+\/[^/]+?)(?:\.git)?\/?$/i);
  return match?.[1] ?? "";
}

function isSyncablePublicRepo(repo: Pick<GitHubRepo, "name" | "private" | "full_name">) {
  if (repo.private) {
    return false;
  }

  if (repo.full_name.toLowerCase() === `${GITHUB_OWNER.toLowerCase()}/portfolio`) {
    return false;
  }

  if (repo.name.toLowerCase() === GITHUB_OWNER.toLowerCase()) {
    return false;
  }

  return !EXCLUDED_REPO_NAMES.has(repo.name.toLowerCase());
}

export function mapRepoToProjectRecord(
  repo: GitHubRepo,
  languageMap: Record<string, number> = {},
  sortOrder = 0,
  evidence: RepoTechnologyEvidence = {},
): ProjectUpsertRecord {
  const languages = verifiedRepoTechnologies(repo.full_name)
    ?? deriveLanguages(repo, languageMap, evidence);
  const category = inferProjectCategory(repo, languages);
  const iconKey = inferProjectIconKey(repo, category, languages);

  const baseRow = {
    title: prettifyRepoTitle(repo.name),
    description: repo.description ?? "",
    category,
    github_url: repo.html_url,
    languages,
    cover_image_href: buildCoverImageHref(iconKey),
    is_active: true,
    sort_order: sortOrder,
  };

  return applyRepoOverride(repo.full_name, baseRow);
}

function buildManualPortfolioRecord(sortOrder = 0): ProjectUpsertRecord {
  const title = "Developer Portfolio";
  const description =
    "A multilingual developer portfolio built with Next.js, TypeScript, Tailwind CSS, and Supabase.";
  const languages = [...MANUAL_PORTFOLIO_TECHNOLOGIES];
  const category: ProjectCategory = "Full-Stack";

  return {
    title,
    description,
    category,
    github_url: MANUAL_PORTFOLIO_URL,
    languages,
    cover_image_href: buildCoverImageHref("nextjs"),
    is_active: true,
    sort_order: sortOrder,
  };
}

export function buildSyncPayload(
  repos: GitHubRepo[],
  languageMaps: Record<string, Record<string, number>> = {},
  evidenceMaps: Record<string, RepoTechnologyEvidence> = {},
) {
  const publicRepos = repos.filter(isSyncablePublicRepo);
  const rowsByCategoryPosition = new Map<ProjectCategory, number>();
  const projectRows = publicRepos
    .map((repo, index) => ({
      sourceIndex: index,
      row: mapRepoToProjectRecord(
        repo,
        languageMaps[repo.full_name],
        index + 1,
        evidenceMaps[repo.full_name],
      ),
    }))
    .sort((left, right) => {
      const categoryDiff =
        getProjectCategoryRank(left.row.category) - getProjectCategoryRank(right.row.category);

      if (categoryDiff !== 0) {
        return categoryDiff;
      }

      return left.sourceIndex - right.sourceIndex;
    })
    .map(({ row }) => {
      const categoryRank = getProjectCategoryRank(row.category);
      const positionInCategory = (rowsByCategoryPosition.get(row.category) ?? 0) + 1;
      rowsByCategoryPosition.set(row.category, positionInCategory);

      return {
        ...row,
        sort_order: categoryRank * 100 + positionInCategory,
      };
    });

  return {
    projectRows,
    manualPortfolioRow: buildManualPortfolioRecord(0),
  };
}
