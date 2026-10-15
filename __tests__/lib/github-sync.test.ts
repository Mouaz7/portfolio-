import {
  buildSyncPayload,
  collectProjectIconPaths,
  getProjectCategoryRank,
  githubUrlToFullName,
  inferProjectIconKey,
  MANUAL_PORTFOLIO_URL,
  mapRepoToProjectRecord,
  prettifyRepoTitle,
  projectTechnologiesForDisplay,
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
  default_branch: overrides.default_branch ?? "main",
});

describe("github project sync mapping", () => {
  it("fills old project tag lists with reviewed technologies without guessing for unknown repos", () => {
    expect(projectTechnologiesForDisplay(
      "https://github.com/Mouaz7/Move-Out",
      ["Node.js", "Express", "PostgreSQL", "Supabase", "Security"],
    )).toEqual(expect.arrayContaining(["EJS", "CSS3", "HTML5", "JavaScript"]));
    expect(projectTechnologiesForDisplay(
      "https://github.com/Mouaz7/Eshop-management-system",
      ["Node.js", "Express", "MySQL", "EJS"],
    )).toEqual(expect.arrayContaining(["MariaDB", "CSS3", "HTML5"]));
    expect(projectTechnologiesForDisplay(
      "https://github.com/Mouaz7/BurgerProject",
      ["Node.js", "MySQL", "EJS"],
    )).toEqual(expect.arrayContaining(["Express", "CSS3", "HTML5"]));
    expect(projectTechnologiesForDisplay(
      MANUAL_PORTFOLIO_URL,
      ["Next.js", "TypeScript", "Tailwind", "Supabase"],
    )).toEqual(expect.arrayContaining(["Tailwind CSS", "HTML5", "CSS3"]));
    expect(projectTechnologiesForDisplay(
      "https://github.com/Mouaz7/Asm-Buffered-IO",
      ["Assembly", "C", "x86"],
    )).not.toContain("CSS3");
    expect(projectTechnologiesForDisplay(
      "https://github.com/other/unknown",
      ["Python"],
    )).toEqual(["Python"]);
  });

  it("uses the reviewed stack instead of stale or vendored-language tags", () => {
    expect(projectTechnologiesForDisplay(
      "https://github.com/Mouaz7/Os_filesystem",
      ["C++", "C", "HTML5", "Linux"],
    )).toEqual(["C++", "Linux", "Git", "GitHub"]);

    const chess = projectTechnologiesForDisplay(
      "https://github.com/Mouaz7/chess-game",
      ["C++", "SFML", "CMake", "C", "Python"],
    );
    expect(chess).toEqual(expect.arrayContaining(["MSBuild", "vcpkg", "PowerShell"]));
    for (const unverified of ["CMake", "C", "Python"]) {
      expect(chess).not.toContain(unverified);
    }

    expect(projectTechnologiesForDisplay(
      "https://github.com/Mouaz7/bsv-edutask",
      ["Python", "Flask", "React"],
    )).toEqual(expect.arrayContaining(["MongoDB", "Cypress", "Docker"]));
    const pongPal = projectTechnologiesForDisplay(
      "https://github.com/Mouaz7/PongPal-Showcase",
      ["TypeScript", "JavaScript"],
    );
    expect(pongPal).toEqual(expect.arrayContaining(["React", "Firebase", "Slack API", "Python"]));
    expect(pongPal).not.toContain("JavaScript");
  });
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
    expect(projectRows[0].languages).toEqual(expect.arrayContaining([
      "Assembly", "C", "x86", "Linux", "Git", "GitHub",
    ]));
    expect(projectRows[0].languages).not.toContain("C++");
    expect(manualPortfolioRow.github_url).toBe(MANUAL_PORTFOLIO_URL);
    expect(manualPortfolioRow.description).toBe(
      "A multilingual developer portfolio built with Next.js, TypeScript, Tailwind CSS, and Supabase.",
    );
    expect(manualPortfolioRow.languages).toEqual(expect.arrayContaining([
      "HTML5", "CSS3", "Vercel", "GitHub Actions", "CI/CD", "Bash",
    ]));
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
    expect(row.languages).toEqual(expect.arrayContaining([
      "Python", "Jenkins", "Docker", "JSON", "AI", "Git", "GitHub",
    ]));
    expect(row.cover_image_href).toBe("/skill-icons/backend-python.svg");
  });

  it("syncs public AegisDB as a Java systems project", () => {
    const row = mapRepoToProjectRecord(
      makeRepo({
        name: "AegisDB",
        full_name: "Mouaz7/AegisDB",
        html_url: "https://github.com/Mouaz7/AegisDB",
        description: "A fault tolerant distributed transactional database engine built in Java",
        language: "Java",
      }),
      { Java: 150000, Dockerfile: 4000 },
    );

    expect(row).toMatchObject({
      title: "AegisDB",
      category: "Systems",
      github_url: "https://github.com/Mouaz7/AegisDB",
      is_active: true,
      cover_image_href: "/skill-icons/backend-java.svg",
    });
    expect(row.languages).toEqual(expect.arrayContaining([
      "Java", "Raft", "MVCC", "Docker", "Prometheus", "Bash",
      "GitHub Actions", "CI/CD", "Git", "GitHub",
    ]));
    expect(row.description).toContain("early-alpha");
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

    expect(campusRow.languages).toEqual(expect.arrayContaining([
      "Kotlin", "Java", "Firebase", "Android", "Jetpack Compose",
      "Firestore", "Google Maps", "Gradle", "Git", "GitHub",
    ]));
    expect(campusRow.languages).not.toContain("HTML5");
    expect(campusRow.cover_image_href).toBe("/skill-icons/mobile-android.svg");
    expect(campusRow.category).toBe("Mobile");

    expect(pongPalRow.languages).toEqual(expect.arrayContaining([
      "React", "TypeScript", "Firebase", "Slack API", "Firestore",
      "Python", "Git", "GitHub",
    ]));
    expect(pongPalRow.languages).not.toContain("JavaScript");
    expect(pongPalRow.description).toContain("not source code");
    expect(pongPalRow.cover_image_href).toBe("/skill-icons/frontend-typescript.svg");
    expect(pongPalRow.category).toBe("Full-Stack");

    expect(quizRow.languages).toEqual(expect.arrayContaining([
      "C++", "OOP", "Algorithms", "Git", "GitHub",
    ]));
    expect(quizRow.languages).not.toContain("C");
    expect(quizRow.cover_image_href).toBe("/skill-icons/backend-c-plus-plus.svg");
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

    expect(moveOutRow.languages).toEqual(expect.arrayContaining([
      "Node.js", "Express", "PostgreSQL", "Supabase", "Security",
      "JavaScript", "EJS", "CSS3", "HTML5", "SQLite", "Jest", "Docker",
      "GitHub Actions", "CI/CD", "Git", "GitHub",
    ]));
    expect(moveOutRow.languages).not.toContain("TypeScript");
    expect(moveOutRow.languages).not.toContain("React");
    expect(moveOutRow.languages).not.toContain("Firebase");
    expect(moveOutRow.cover_image_href).toBe("/project-icons/nodejs-badge.svg");
    expect(moveOutRow.category).toBe("Full-Stack");

    expect(teamTempRow.languages).toEqual(expect.arrayContaining([
      "React", "React Native", "TypeScript", "AI", "Express", "Bun",
      "MongoDB", "Prisma", "Vite", "Tailwind CSS", "Cypress", "Git", "GitHub",
    ]));
    expect(teamTempRow.languages).not.toContain("JavaScript");
    expect(teamTempRow.cover_image_href).toBe("/project-icons/category-full-stack.svg");
    expect(teamTempRow.category).toBe("Full-Stack");
  });

  it("discovers web, deployment, test, and CI technologies from repository evidence", () => {
    const row = mapRepoToProjectRecord(
      makeRepo({
        name: "web-tooling-lab",
        full_name: "Mouaz7/web-tooling-lab",
        html_url: "https://github.com/Mouaz7/web-tooling-lab",
        language: "JavaScript",
      }),
      { JavaScript: 900, CSS: 300, HTML: 200, Shell: 50 },
      1,
      {
        paths: [
          ".github/workflows/ci.yml",
          "Dockerfile",
          "vercel.json",
          "src/styles.css",
          "public/index.html",
        ],
        manifestText: JSON.stringify({
          dependencies: { react: "latest", tailwindcss: "latest", cypress: "latest" },
        }),
      },
    );

    expect(row.languages).toEqual(expect.arrayContaining([
      "JavaScript", "CSS3", "HTML5", "Bash", "GitHub Actions", "CI/CD",
      "Docker", "Vercel", "React", "Tailwind CSS", "Cypress", "Git", "GitHub",
    ]));
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
