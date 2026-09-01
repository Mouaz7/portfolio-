import {
  buildSyncPayload,
  collectProjectIconPaths,
  getProjectCategoryRank,
  githubUrlToFullName,
  inferProjectIconKey,
  MANUAL_PORTFOLIO_URL,
  mapRepoToProjectRecord,
  prettifyRepoTitle,
  type GitHubRepo,
} from "@/lib/projects/githubSync";

const makeRepo = (overrides: Partial<GitHubRepo>): GitHubRepo => ({
  id: overrides.id ?? 1,
  name: overrides.name ?? "Move-Out",
  full_name: overrides.full_name ?? "Mouaz7/Move-Out",
  private: overrides.private ?? false,
  description: overrides.description ?? "Repository description",
  html_url: overrides.html_url ?? "https://github.com/Mouaz7/Move-Out",
  language: overrides.language ?? "TypeScript",
  topics: overrides.topics ?? [],
  homepage: overrides.homepage ?? null,
  fork: overrides.fork ?? false,
  archived: overrides.archived ?? false,
});

describe("github project sync mapping", () => {
  it("prettifies repo names into portfolio-friendly titles", () => {
    expect(prettifyRepoTitle("Cpp-TransportSystem")).toBe("C++ Transport System");
    expect(prettifyRepoTitle("Os_filesystem")).toBe("OS Filesystem");
  });

  it("ignores private repos and portfolio-test while keeping a manual portfolio row", () => {
    const publicRepo = makeRepo({
      id: 10,
      name: "Asm-Buffered-IO",
      full_name: "Mouaz7/Asm-Buffered-IO",
      html_url: "https://github.com/Mouaz7/Asm-Buffered-IO",
      language: "C++",
    });
    const privateRepo = makeRepo({
      id: 11,
      name: "portfolio",
      full_name: "Mouaz7/portfolio-",
      private: true,
      html_url: MANUAL_PORTFOLIO_URL,
    });
    const excludedRepo = makeRepo({
      id: 12,
      name: "portfolio-test",
      full_name: "Mouaz7/portfolio-test",
      html_url: "https://github.com/Mouaz7/portfolio-test",
    });
    const profileRepo = makeRepo({
      id: 13,
      name: "Mouaz7",
      full_name: "Mouaz7/Mouaz7",
      html_url: "https://github.com/Mouaz7/Mouaz7",
      description: "Config files for my GitHub profile.",
    });

    const { projectRows, manualPortfolioRow } = buildSyncPayload(
      [publicRepo, privateRepo, excludedRepo, profileRepo],
      {
        [publicRepo.full_name]: { "C++": 1234, Assembly: 512 },
      },
    );

    expect(projectRows).toHaveLength(1);
    expect(projectRows[0].github_url).toBe(publicRepo.html_url);
    expect(projectRows[0].title).toBe("Buffered I/O in Assembly");
    expect(projectRows[0].description).toContain("x86-64 routines");
    expect(projectRows[0].languages).toEqual(["Assembly", "C", "x86"]);
    expect(manualPortfolioRow.github_url).toBe(MANUAL_PORTFOLIO_URL);
    expect(manualPortfolioRow.description).toBe(
      "A multilingual developer portfolio built with Next.js, TypeScript, Tailwind CSS, and Supabase.",
    );
    expect(projectRows.find((row) => row.github_url === MANUAL_PORTFOLIO_URL)).toBeUndefined();
    expect(projectRows.find((row) => row.github_url === profileRepo.html_url)).toBeUndefined();
  });

  it("uses audited override data for build repos", () => {
    const row = mapRepoToProjectRecord(
      makeRepo({
        name: "auto-healing-devops-platform",
        full_name: "Mouaz7/auto-healing-devops-platform",
        html_url: "https://github.com/Mouaz7/auto-healing-devops-platform",
        description: "Self-healing CI/CD pipeline with Docker automation.",
        language: "Python",
        topics: ["devops", "automation"],
      }),
      { Python: 2000, Dockerfile: 800 },
      7,
    );

    expect(row.category).toBe("Build");
    expect(row.title).toBe("Auto-Healing DevOps Platform");
    expect(row.description).toContain("six specialized agents");
    expect(row.is_active).toBe(true);
    expect(row.sort_order).toBe(7);
    expect(row.languages).toEqual(["Python", "Jenkins", "Docker", "JSON", "AI"]);
    expect(row.cover_image_href).toBe("/project-icons/python.svg");
  });

  it("falls back to category icon when no exact repo icon match exists", () => {
    const repo = makeRepo({
      name: "mystery-platform",
      description: "Internal distributed service mesh.",
      language: "",
      topics: [],
    });

    const iconKey = inferProjectIconKey(repo, "Build", []);
    expect(iconKey).toBe("githubactions");
  });

  it("uses systems fallback instead of a dedicated linux icon for linux-flavored repos", () => {
    const iconKey = inferProjectIconKey(
      makeRepo({
        name: "kernel-lab",
        description: "Linux filesystem syscall pthread experiments.",
        language: "",
      }),
      "Systems",
      [],
    );

    expect(iconKey).toBe("category-systems");
  });

  it("prefers nodejs icon over javascript when final stack contains Node.js", () => {
    const iconKey = inferProjectIconKey(
      makeRepo({
        name: "server-platform",
        description: "Node.js backend with some JavaScript client helpers.",
        language: "JavaScript",
      }),
      "Full-Stack",
      ["Node.js", "JavaScript", "Express"],
    );

    expect(iconKey).toBe("nodejs-badge");
  });

  it("uses repo overrides for mobile, showcase, and systems repos", () => {
    const campusRow = mapRepoToProjectRecord(
      makeRepo({
        name: "Campus360",
        full_name: "Mouaz7/Campus360",
        html_url: "https://github.com/Mouaz7/Campus360",
        description:
          "Android campus navigation app with hybrid indoor/outdoor maps, pathfinding & Firebase auth built with Kotlin, Clean Architecture & MVVM",
        language: "Kotlin",
        topics: ["android", "mobile"],
      }),
      { Kotlin: 1000, Java: 600, HTML: 20 },
      1,
    );
    const pongPalRow = mapRepoToProjectRecord(
      makeRepo({
        name: "PongPal-Showcase",
        full_name: "Mouaz7/PongPal-Showcase",
        html_url: "https://github.com/Mouaz7/PongPal-Showcase",
        description:
          "Visual presentation of the PongPal project developed at Softhouse.",
        language: "",
      }),
      {},
      2,
    );
    const quizRow = mapRepoToProjectRecord(
      makeRepo({
        name: "quiz-game",
        full_name: "Mouaz7/quiz-game",
        html_url: "https://github.com/Mouaz7/quiz-game",
        description: "C++ quiz system with UML and OOP structure.",
        language: "C++",
      }),
      { "C++": 1000, C: 200 },
      3,
    );

    expect(campusRow.languages).toEqual(["Kotlin", "Java", "Firebase", "Android"]);
    expect(campusRow.cover_image_href).toBe("/project-icons/android.svg");
    expect(campusRow.category).toBe("Mobile");

    expect(pongPalRow.languages).toEqual(["TypeScript", "JavaScript"]);
    expect(pongPalRow.description).toContain("not source code");
    expect(pongPalRow.cover_image_href).toBe("/project-icons/typescript.svg");
    expect(pongPalRow.category).toBe("Full-Stack");

    expect(quizRow.languages).toEqual(["C++", "OOP", "Algorithms"]);
    expect(quizRow.cover_image_href).toBe("/project-icons/cplusplus.svg");
    expect(quizRow.category).toBe("Systems");
  });

  it("collects local icon paths for sync download cache", () => {
    const paths = collectProjectIconPaths([
      { cover_image_href: "/project-icons/react.svg" },
      { cover_image_href: "/project-icons/react.svg" },
      { cover_image_href: "/project-icons/category-systems.svg" },
    ]);

    expect(paths).toEqual([
      "/project-icons/react.svg",
      "/project-icons/category-systems.svg",
    ]);
  });

  it("extracts full repo name from github url for DB fallback sync", () => {
    expect(githubUrlToFullName("https://github.com/Mouaz7/PongPal-Showcase")).toBe(
      "Mouaz7/PongPal-Showcase",
    );
  });

  it("uses audited overrides for Move-Out and Team Temp stacks", () => {
    const moveOutRow = mapRepoToProjectRecord(
      makeRepo({
        name: "Move-Out",
        full_name: "Mouaz7/Move-Out",
        html_url: "https://github.com/Mouaz7/Move-Out",
        description: "Moving box app with React and Firebase.",
        language: "JavaScript",
      }),
      { JavaScript: 900, TypeScript: 400 },
      1,
    );
    const teamTempRow = mapRepoToProjectRecord(
      makeRepo({
        name: "team-temp-app",
        full_name: "Mouaz7/team-temp-app",
        html_url: "https://github.com/Mouaz7/team-temp-app",
        description: "AI-driven employee survey showcase.",
        language: "TypeScript",
      }),
      { TypeScript: 700, JavaScript: 500 },
      2,
    );

    expect(moveOutRow.languages).toEqual(["Node.js", "Express", "PostgreSQL", "Supabase", "Security"]);
    expect(moveOutRow.languages).not.toContain("React");
    expect(moveOutRow.languages).not.toContain("Firebase");
    expect(moveOutRow.cover_image_href).toBe("/project-icons/nodejs-badge.svg");
    expect(moveOutRow.category).toBe("Full-Stack");

    expect(teamTempRow.languages).toEqual(["React", "React Native", "TypeScript", "AI", "Express"]);
    expect(teamTempRow.cover_image_href).toBe("/project-icons/react.svg");
    expect(teamTempRow.category).toBe("Full-Stack");
  });

  it("assigns stable sort order by category rank before writing to DB", () => {
    const { projectRows } = buildSyncPayload(
      [
        makeRepo({
          id: 1,
          name: "Concurrency-Systems",
          full_name: "Mouaz7/Concurrency-Systems",
          html_url: "https://github.com/Mouaz7/Concurrency-Systems",
          language: "C",
        }),
        makeRepo({
          id: 2,
          name: "Campus360",
          full_name: "Mouaz7/Campus360",
          html_url: "https://github.com/Mouaz7/Campus360",
          language: "Kotlin",
        }),
        makeRepo({
          id: 3,
          name: "Move-Out",
          full_name: "Mouaz7/Move-Out",
          html_url: "https://github.com/Mouaz7/Move-Out",
          language: "JavaScript",
        }),
        makeRepo({
          id: 4,
          name: "auto-healing-devops-platform",
          full_name: "Mouaz7/auto-healing-devops-platform",
          html_url: "https://github.com/Mouaz7/auto-healing-devops-platform",
          language: "Python",
        }),
      ],
      {},
    );

    expect(projectRows.map((row) => row.category)).toEqual([
      "Full-Stack",
      "Build",
      "Mobile",
      "Systems",
    ]);
    expect(projectRows.map((row) => row.sort_order)).toEqual([
      getProjectCategoryRank("Full-Stack") * 100 + 1,
      getProjectCategoryRank("Build") * 100 + 1,
      getProjectCategoryRank("Mobile") * 100 + 1,
      getProjectCategoryRank("Systems") * 100 + 1,
    ]);
  });
});
