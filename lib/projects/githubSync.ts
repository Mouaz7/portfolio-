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

const PROJECT_ICON_DIR = "/project-icons";

const REPO_OVERRIDES: Record<string, ProjectOverride> = {
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
    languages: ["React", "React Native", "TypeScript", "AI", "Express"],
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
    languages: ["C++", "SFML", "CMake"],
    iconKey: "cplusplus",
  },
  "Mouaz7/PongPal-Showcase": {
    title: "PongPal Showcase",
    description:
      "A visual showcase of the PongPal project developed at Softhouse, featuring booking, statistics, and user profile flows. The repository contains images and videos, not source code.",
    category: "Full-Stack",
    languages: ["TypeScript", "JavaScript"],
    iconKey: "typescript",
  },
  "Mouaz7/Eshop-management-system": {
    title: "E-Shop Management System",
    description:
      "A full-stack e-commerce management system built with Node.js, Express, EJS, and MariaDB, including product, category, order, and inventory management, stored procedures, triggers, and an admin interface.",
    category: "Full-Stack",
    languages: ["Node.js", "Express", "MySQL", "EJS"],
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
    languages: ["Node.js", "MySQL", "EJS"],
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
    languages: ["Python"],
    iconKey: "python",
  },
  "Mouaz7/bsv-edutask": {
    title: "BSV Edutask",
    description:
      "An educational project for the PA1417 course that applies software-testing techniques.",
    category: "Systems",
    languages: ["Python", "Testing"],
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
  css: "CSS",
  dockerfile: "Docker",
  ejs: "EJS",
  firebase: "Firebase",
  gcp: "GCP",
  html: "HTML",
  javascript: "JavaScript",
  java: "Java",
  jenkins: "Jenkins",
  json: "JSON",
  kotlin: "Kotlin",
  "github actions": "GitHub",
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

function deriveLanguages(
  repo: Pick<GitHubRepo, "name" | "description" | "language">,
  languageMap: Record<string, number> = {},
) {
  const picked = Object.keys(languageMap)
    .sort((left, right) => languageMap[right] - languageMap[left])
    .slice(0, 5)
    .map(normalizeLanguageLabel);

  if (picked.length > 0) {
    return picked;
  }

  const mainLanguage = repo.language ? normalizeLanguageLabel(repo.language) : null;
  if (mainLanguage) {
    return [mainLanguage];
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

  return fallbackMatches.slice(0, 5);
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
  return `${PROJECT_ICON_DIR}/${iconKey}.svg`;
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
    languages: override.languages ?? row.languages,
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
): ProjectUpsertRecord {
  const languages = deriveLanguages(repo, languageMap);
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
  const languages = ["Next.js", "TypeScript", "Tailwind", "Supabase"];
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
) {
  const publicRepos = repos.filter(isSyncablePublicRepo);
  const rowsByCategoryPosition = new Map<ProjectCategory, number>();
  const projectRows = publicRepos
    .map((repo, index) => ({
      sourceIndex: index,
      row: mapRepoToProjectRecord(repo, languageMaps[repo.full_name], index + 1),
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
