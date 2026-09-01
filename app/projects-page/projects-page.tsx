"use client";
import React, { useEffect, useState, type CSSProperties } from "react";
import Header from "@/components/navigation/Header";
import { type Project } from "@/components/project/types";
import {
  githubUrlToFullName,
  PROJECT_CATEGORY_ORDER,
  type ProjectCategory,
} from "@/lib/projects/githubSync";
import ProjectCard from "@/components/project/ProjectCard";
import MobileGitGraph from "@/components/project/MobileGitGraph";
import PageLoadingStage from "@/components/ui/PageLoadingStage";
import { useMediaQuery, usePrefersReducedMotion } from "@/hooks/useMediaQuery";
import { useMinimumLoading } from "@/hooks/useMinimumLoading";
import { useI18n } from "@/components/i18n/I18nProvider";
import { localeTag } from "@/lib/i18n/config";
import type { RepositoryStats } from "@/lib/projects/repository-stats.server";

const PROJECT_CATEGORY_TONES: Record<
  ProjectCategory,
  { accent: string; accentRgb: string; branchRgb: string }
> = {
  "Full-Stack": {
    accent: "rgb(8, 185, 190)",
    accentRgb: "8, 185, 190",
    branchRgb: "238, 112, 82",
  },
  Build: {
    accent: "rgb(218, 130, 37)",
    accentRgb: "218, 130, 37",
    branchRgb: "8, 185, 190",
  },
  Mobile: {
    accent: "rgb(38, 139, 253)",
    accentRgb: "38, 139, 253",
    branchRgb: "168, 85, 247",
  },
  Systems: {
    accent: "rgb(57, 191, 137)",
    accentRgb: "57, 191, 137",
    branchRgb: "218, 130, 37",
  },
};

const MOBILE_PROJECTS_BREAKPOINT = "(max-width: 540px)";

type RepositoryTypeFilter = "all" | "public" | "source" | "fork" | "archived";
type RepositorySort = "default" | "name" | "stars" | "forks" | "updated";

const LANGUAGE_COLORS: Record<string, string> = {
  c: "#555555",
  "c++": "#f34b7d",
  ejs: "#a91e50",
  java: "#b07219",
  javascript: "#f1e05a",
  kotlin: "#a97bff",
  python: "#3572a5",
  react: "#61dafb",
  "react native": "#61dafb",
  typescript: "#3178c6",
};

function getLanguageColor(language: string | null | undefined) {
  if (!language) return "#8b949e";
  return LANGUAGE_COLORS[language.toLowerCase()] ?? "#39b98a";
}

function isSecondaryProject(index: number, total: number) {
  return total >= 3 && index % 3 === 1 && index < total - 1;
}

type ProjectsPageProps = {
  initialLoadFailed?: boolean;
  initialProjects?: Project[];
  initialRepositoryStats?: Record<string, RepositoryStats>;
};

const ProjectsPageClient: React.FC<ProjectsPageProps> = ({
  initialLoadFailed = false,
  initialProjects,
  initialRepositoryStats,
}) => {
  const { locale, dictionary, format } = useI18n();
  const copy = dictionary.projects;
  const prefersReducedMotion = usePrefersReducedMotion();
  const hasInitialProjects = initialProjects !== undefined;
  const [projects, setProjects] = useState<Project[]>(initialProjects ?? []);
  const { loading, finishLoading } = useMinimumLoading(400);
  const [error, setError] = useState<string | null>(
    initialLoadFailed ? copy.loadError : null,
  );
  const [openCategory, setOpenCategory] = useState<string | null>(
    initialProjects?.[0]?.category ?? null,
  );
  const [nextCategory, setNextCategory] = useState<string | null>(null);
  const [isCategoryExiting, setIsCategoryExiting] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [repositoryType, setRepositoryType] =
    useState<RepositoryTypeFilter>("all");
  const [languageFilter, setLanguageFilter] = useState("all");
  const [repositorySort, setRepositorySort] =
    useState<RepositorySort>("default");
  const [repositoryStats, setRepositoryStats] = useState<
    Record<string, RepositoryStats>
  >(initialRepositoryStats ?? {});
  const isMobileLayout = useMediaQuery(MOBILE_PROJECTS_BREAKPOINT);

  // Fetch projects from API
  useEffect(() => {
    if (hasInitialProjects) {
      finishLoading();
      return;
    }
    const fetchProjects = async () => {
      try {
        setError(null);
        const res = await fetch(`/api/project?locale=${locale}`);
        if (!res.ok) {
          throw new Error("Failed to fetch projects");
        }
        const data = await res.json();
        setProjects(data);
        
        // Set first category as open by default
        if (data.length > 0) {
          const firstCategory = data[0].category;
          setOpenCategory(firstCategory);
        }
      } catch (err) {
        console.error("Error fetching projects:", err);
        setError(copy.loadError);
      } finally {
        finishLoading();
      }
    };

    fetchProjects();
  }, [copy.loadError, finishLoading, hasInitialProjects, locale]);

  useEffect(() => {
    if (initialRepositoryStats) {
      setRepositoryStats(initialRepositoryStats);
      return;
    }
    const repositories = Array.from(
      new Set(
        projects
          .map((project) => githubUrlToFullName(project.github_url))
          .filter(Boolean),
      ),
    );

    if (repositories.length === 0) {
      setRepositoryStats({});
      return;
    }

    const controller = new AbortController();

    fetch("/api/github/repo-stats", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ repositories }),
      signal: controller.signal,
    })
      .then((response) => (response.ok ? response.json() : null))
      .then((data: unknown) => {
        if (
          typeof data === "object" &&
          data !== null &&
          "stats" in data &&
          typeof (data as { stats?: unknown }).stats === "object" &&
          (data as { stats?: unknown }).stats !== null
        ) {
          setRepositoryStats(
            (data as { stats: Record<string, RepositoryStats> }).stats,
          );
        }
      })
      .catch((error: unknown) => {
        if (!(error instanceof DOMException && error.name === "AbortError")) {
          setRepositoryStats({});
        }
      });

    return () => controller.abort();
  }, [initialRepositoryStats, projects]);

  // Group projects by category
  const projectsByCategory = projects.reduce((acc, project) => {
    if (!acc[project.category]) {
      acc[project.category] = [];
    }
    acc[project.category].push(project);
    return acc;
  }, {} as Record<string, Project[]>);

  const visibleCategories = PROJECT_CATEGORY_ORDER.filter((category) => projectsByCategory[category]?.length > 0);
  const categoryProjects = openCategory
    ? projectsByCategory[openCategory] ?? []
    : [];
  const availableLanguages = Array.from(
    new Set(categoryProjects.flatMap((project) => project.languages)),
  ).sort((left, right) => left.localeCompare(right, localeTag(locale)));
  const normalizedSearch = searchQuery.trim().toLowerCase();
  const displayedProjects = categoryProjects
    .filter((project) => {
      const repository = githubUrlToFullName(project.github_url);
      const stats = repositoryStats[repository];
      const matchesSearch =
        normalizedSearch.length === 0 ||
        [project.title, project.description, ...project.languages]
          .join(" ")
          .toLowerCase()
          .includes(normalizedSearch);
      const matchesLanguage =
        languageFilter === "all" ||
        project.languages.some(
          (language) =>
            language.toLowerCase() === languageFilter.toLowerCase(),
        );
      const matchesType =
        repositoryType === "all" ||
        (repositoryType === "public" && project.visibility === "public") ||
        (repositoryType === "source" &&
          Boolean(stats && !stats.isFork && !stats.isArchived)) ||
        (repositoryType === "fork" && Boolean(stats?.isFork)) ||
        (repositoryType === "archived" && Boolean(stats?.isArchived));

      return matchesSearch && matchesLanguage && matchesType;
    })
    .sort((left, right) => {
      const leftStats = repositoryStats[githubUrlToFullName(left.github_url)];
      const rightStats = repositoryStats[githubUrlToFullName(right.github_url)];

      if (repositorySort === "name") {
        return left.title.localeCompare(right.title, localeTag(locale));
      }
      if (repositorySort === "stars") {
        return (rightStats?.stars ?? -1) - (leftStats?.stars ?? -1);
      }
      if (repositorySort === "forks") {
        return (rightStats?.forks ?? -1) - (leftStats?.forks ?? -1);
      }
      if (repositorySort === "updated") {
        return (
          Date.parse(rightStats?.updatedAt ?? "1970-01-01") -
          Date.parse(leftStats?.updatedAt ?? "1970-01-01")
        );
      }

      return 0;
    });
  const lastSecondaryProjectIndex = displayedProjects.reduce(
    (lastIndex, _project, index) =>
      isSecondaryProject(index, displayedProjects.length) ? index : lastIndex,
    -1,
  );

  const getCategoryTone = (category: ProjectCategory) => {
    const tone = PROJECT_CATEGORY_TONES[category];

    return {
      "--shell-accent-rgb": tone.accentRgb,
      "--rail-primary-rgb": tone.accentRgb,
      "--rail-secondary-rgb": tone.branchRgb,
    } as CSSProperties;
  };

  const selectCategory = (category: string) => {
    if (category === openCategory || isCategoryExiting) return;
    setLanguageFilter("all");
    if (prefersReducedMotion) {
      setOpenCategory(category);
      return;
    }
    setNextCategory(category);
    setIsCategoryExiting(true);
  };

  const finishCategoryExit = (event: React.AnimationEvent<HTMLDivElement>) => {
    if (
      event.target !== event.currentTarget ||
      !isCategoryExiting ||
      !nextCategory
    ) {
      return;
    }

    setOpenCategory(nextCategory);
    setNextCategory(null);
    setIsCategoryExiting(false);
  };

  return (
    <div className="flex flex-col overflow-hidden h-screen">
      <Header />

      {/* Background is the shared global WebGL nebula (see app/layout.tsx) */}
      <main className="projects-main relative flex-1 min-h-0 overflow-hidden px-4 sm:px-6 md:px-8 lg:px-12 py-6 md:py-8 flex flex-col">
        <h1 className="sr-only">{copy.title}</h1>
        {/* Content - NO SCROLLING */}
        <div className="relative z-10 flex flex-col h-full max-w-[1800px] mx-auto w-full overflow-hidden">
        {/* Loading State */}
        {loading && (
          <PageLoadingStage text={copy.loading} noun={copy.title} />
        )}

        {/* Error State */}
        {error && !loading && (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <p className="text-red-400 text-lg mb-4">{error}</p>
              <button
                onClick={() => window.location.reload()}
                className="px-6 py-3 bg-cornflowerblue-100 hover:bg-cornflowerblue-200 text-white font-medium rounded-full transition-colors"
              >
                {dictionary.common.retry}
              </button>
            </div>
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && projects.length === 0 && (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-cornflowerblue-100 mb-2">
                {copy.emptyTitle}
              </h2>
              <p className="text-white/70">
                {copy.emptyBody}
              </p>
            </div>
          </div>
        )}

        {/* Projects List */}
        {!loading && !error && projects.length > 0 && (
          <div
            className="projects-shell h-full flex flex-col px-3 sm:px-4 md:px-6 lg:px-8 xl:px-12 py-3 sm:py-4 md:py-6 gap-3 sm:gap-4 md:gap-5 rounded-[28px]"
          >
            {!isMobileLayout && (
              <div className="projects-repository-toolbar">
                <h2 className="projects-repository-title">{copy.repositories}</h2>

                <label className="projects-repository-search">
                  <span className="sr-only">{copy.search}</span>
                  <svg viewBox="0 0 16 16" fill="none" aria-hidden="true">
                    <circle cx="7" cy="7" r="4.75" stroke="currentColor" strokeWidth="1.5" />
                    <path d="m10.5 10.5 3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                  </svg>
                  <input
                    type="search"
                    value={searchQuery}
                    onChange={(event) => setSearchQuery(event.target.value)}
                    placeholder={copy.search}
                  />
                </label>

                <div className="projects-repository-controls">
                  <label className="projects-repository-select-wrap">
                    <span className="sr-only">{copy.repositoryType}</span>
                    <select
                      aria-label={copy.repositoryType}
                      value={repositoryType}
                      onChange={(event) =>
                        setRepositoryType(
                          event.target.value as RepositoryTypeFilter,
                        )
                      }
                    >
                      <option value="all">{copy.type}</option>
                      <option value="public">{copy.public}</option>
                      <option value="source">{copy.sources}</option>
                      <option value="fork">{copy.forks}</option>
                      <option value="archived">{copy.archived}</option>
                    </select>
                    <svg viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
                      <path d="m4.4 6 3.6 4 3.6-4Z" />
                    </svg>
                  </label>

                  <label className="projects-repository-select-wrap">
                    <span className="sr-only">{copy.repositoryLanguage}</span>
                    <select
                      aria-label={copy.repositoryLanguage}
                      value={languageFilter}
                      onChange={(event) => setLanguageFilter(event.target.value)}
                    >
                      <option value="all">{dictionary.common.language}</option>
                      {availableLanguages.map((language) => (
                        <option key={language} value={language}>
                          {language}
                        </option>
                      ))}
                    </select>
                    <svg viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
                      <path d="m4.4 6 3.6 4 3.6-4Z" />
                    </svg>
                  </label>

                  <label className="projects-repository-select-wrap">
                    <span className="sr-only">{copy.sortRepositories}</span>
                    <select
                      aria-label={copy.sortRepositories}
                      value={repositorySort}
                      onChange={(event) =>
                        setRepositorySort(event.target.value as RepositorySort)
                      }
                    >
                      <option value="default">{copy.sort}</option>
                      <option value="name">{copy.name}</option>
                      <option value="stars">{copy.stars}</option>
                      <option value="forks">{copy.forks}</option>
                      <option value="updated">{copy.recentlyUpdated}</option>
                    </select>
                    <svg viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
                      <path d="m4.4 6 3.6 4 3.6-4Z" />
                    </svg>
                  </label>
                </div>
              </div>
            )}

            {/* Category Selector */}
            <div className="flex-shrink-0">
              <div className="projects-filter-bank mx-auto flex w-full max-w-5xl flex-wrap justify-center gap-2 sm:gap-2.5 md:gap-3">
                {visibleCategories.map((category) => {
                  const isActive = openCategory === category;
                  const projectCount = projectsByCategory[category].length;
                  const filterTone = getCategoryTone(category);
                  
                  return (
                    <button
                      key={category}
                      onClick={() => selectCategory(category)}
                      data-active={isActive}
                      className="projects-filter-chip relative px-3 sm:px-4 md:px-5 lg:px-6 py-1.5 sm:py-2 md:py-2.5 rounded-lg sm:rounded-xl font-semibold text-xs sm:text-sm md:text-base transition-all duration-300 border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/60"
                      style={filterTone}
                    >
                      <span className="projects-filter-chip-label relative z-[1] flex items-center gap-1.5 sm:gap-2">
                        {copy.categories[category as keyof typeof copy.categories] ?? category}
                        <span 
                          className="projects-filter-count text-[10px] sm:text-xs px-1 sm:px-1.5 py-0.5 rounded-full font-bold"
                        >
                          {projectCount}
                        </span>
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {isMobileLayout && (
              <div className="projects-mobile-git-head" aria-hidden="true">
                <span className="projects-mobile-terminal-prompt">
                  $ git log --graph {openCategory ?? "portfolio"}
                </span>
                <span className="projects-mobile-contributions">
                  {Array.from({ length: 14 }, (_, index) => (
                    <i key={index} data-level={(index * 7 + 3) % 5} />
                  ))}
                </span>
                <span className="projects-mobile-build-status">{copy.actionsPassed}</span>
              </div>
            )}

            {/* Horizontal List Layout */}
            <div className="projects-shell-scroller flex-1 min-h-0 overflow-auto scrollbar-thin scrollbar-thumb-cornflowerblue-100/30 scrollbar-track-transparent">
              {openCategory && projectsByCategory[openCategory] && (
                  <div
                    key={openCategory}
                    data-active-category={openCategory}
                    style={getCategoryTone(openCategory as ProjectCategory)}
                    onAnimationEnd={finishCategoryExit}
                    className={`projects-project-grid projects-category-content w-full max-w-[1500px] mx-auto px-4 sm:px-6 md:px-8 py-4 ${
                      !prefersReducedMotion ? (isCategoryExiting ? "projects-category-exit" : "projects-category-enter") : ""
                    }`}
                  >
                    {isMobileLayout && (
                      <MobileGitGraph nodeCount={displayedProjects.length} />
                    )}
                    {displayedProjects.map((project, idx) => {
                      const category = project.category as ProjectCategory;
                      const tone = PROJECT_CATEGORY_TONES[category];
                      const repository = githubUrlToFullName(project.github_url);
                      const stats = repositoryStats[repository];
                      const primaryLanguage =
                        stats?.language ?? project.languages[0] ?? null;
                      const projectTone = {
                        "--card-accent-rgb": tone.accentRgb,
                        "--projects-language-color":
                          getLanguageColor(primaryLanguage),
                      } as CSSProperties;

                      if (isMobileLayout) {
                        const isSecondaryRail = isSecondaryProject(
                          idx,
                          displayedProjects.length,
                        );
                        const branchName =
                          idx === 0
                            ? "main"
                            : isSecondaryRail
                              ? "feature/ui"
                              : "develop";

                        return (
                          <div
                            key={project.id}
                            className="projects-mobile-card-wrap"
                            style={projectTone}
                            data-rail={isSecondaryRail ? "secondary" : "primary"}
                            data-last={
                              idx === displayedProjects.length - 1
                                ? "true"
                                : undefined
                            }
                            data-git-event={
                              idx === 0 && lastSecondaryProjectIndex >= 0
                                ? "branch created · feature/ui"
                                : idx === lastSecondaryProjectIndex
                                  ? "pull request merged · main"
                                  : isSecondaryRail
                                    ? "commit pushed · feature/ui"
                                    : idx < lastSecondaryProjectIndex
                                      ? "commit pushed · main"
                                      : "release tagged · v1.0"
                            }
                          >
                            <ProjectCard
                              project={project}
                              index={idx}
                              branchName={branchName}
                              categoryColor={{ accent: tone.accent }}
                              repositoryStats={stats}
                            />
                          </div>
                        );
                      }

                      return (
                        <div
                          key={project.id}
                          className="projects-project-row rounded-[22px] p-3 sm:p-4 transition-all duration-300"
                          style={projectTone}
                        >
                          <div className="projects-project-stack">
                            <div className="projects-project-topline">
                              <div className="projects-repo-heading min-w-0">
                                <svg
                                  className="projects-repo-icon"
                                  viewBox="0 0 16 16"
                                  fill="currentColor"
                                  aria-hidden="true"
                                >
                                  <path d="M2 2.75A1.75 1.75 0 0 1 3.75 1h8.5A1.75 1.75 0 0 1 14 2.75v10.5a.75.75 0 0 1-1.5 0v-.5H4a1 1 0 0 0 0 2h2.25a.75.75 0 0 1 0 1.5H4a2.5 2.5 0 0 1-2.5-2.5v-11Zm10.5 8.5v-8.5a.25.25 0 0 0-.25-.25h-8.5a.25.25 0 0 0-.25.25v8.693c.16-.034.327-.052.5-.052h8.5Z" />
                                </svg>
                                <a
                                  href={project.github_url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  aria-label={format(dictionary.common.open, { name: project.title })}
                                  className="projects-project-title-link min-w-0"
                                >
                                  <h3 className="projects-project-title line-clamp-1">
                                    {project.title}
                                  </h3>
                                </a>
                                <span className="projects-visibility-badge">{copy.public}</span>
                              </div>
                              <span className="projects-visibility-badge projects-visibility-badge-end">
                                {copy.public}
                              </span>
                            </div>

                            <div className="projects-project-body">
                              <div className="projects-project-copy min-w-0">
                                <p className="projects-project-description line-clamp-2">
                                  {project.description}
                                </p>

                                <div className="projects-tech-list">
                                  {project.languages.slice(0, 5).map((lang) => (
                                    <span
                                      key={lang}
                                      className="projects-tech-chip text-[10px] sm:text-xs px-2 py-0.5 border rounded-full"
                                    >
                                      {lang}
                                    </span>
                                  ))}
                                </div>

                                <div className="projects-repo-metadata">
                                  {primaryLanguage && (
                                    <span className="projects-primary-language">
                                      <span
                                        aria-hidden="true"
                                        className="projects-language-dot"
                                      />
                                      {primaryLanguage}
                                    </span>
                                  )}
                                  {stats && (
                                    <>
                                      <span
                                        className="projects-repository-stat"
                                        aria-label={format(copy.statCount, {
                                          label: copy.stars,
                                          count: stats.stars,
                                        })}
                                      >
                                        <svg viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
                                          <path d="M8 .25a.75.75 0 0 1 .673.418l1.882 3.815 4.21.612a.75.75 0 0 1 .416 1.279l-3.046 2.97.719 4.193a.75.75 0 0 1-1.088.79L8 12.347l-3.766 1.98a.75.75 0 0 1-1.088-.79l.719-4.193-3.046-2.97a.75.75 0 0 1 .416-1.28l4.21-.611L7.327.668A.75.75 0 0 1 8 .25Zm0 2.445L6.615 5.502a.75.75 0 0 1-.565.41l-3.098.45 2.242 2.186a.75.75 0 0 1 .216.664l-.529 3.085 2.77-1.456a.75.75 0 0 1 .698 0l2.77 1.456-.529-3.085a.75.75 0 0 1 .216-.664l2.242-2.186-3.098-.45a.75.75 0 0 1-.565-.41L8 2.695Z" />
                                        </svg>
                                        {stats.stars}
                                      </span>
                                      <span
                                        className="projects-repository-stat"
                                        aria-label={format(copy.statCount, {
                                          label: copy.forks,
                                          count: stats.forks,
                                        })}
                                      >
                                        <svg viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
                                          <path d="M5 3.25a2.25 2.25 0 1 1-3 2.122v5.256a2.251 2.251 0 1 1 1.5 0V7.372A5.5 5.5 0 0 0 8.25 10.1v.528a2.251 2.251 0 1 1 1.5 0V10.1a5.5 5.5 0 0 0 4.75-2.728V5.372a2.25 2.25 0 1 1 1.5 0v2.172a7 7 0 0 1-6.25 4.045v-.961a2.251 2.251 0 0 1-1.5 0v.961A7 7 0 0 1 2 7.544V5.372A2.25 2.25 0 0 1 5 3.25Z" />
                                        </svg>
                                        {stats.forks}
                                      </span>
                                    </>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                    {isMobileLayout && displayedProjects.length === 1 && (
                      <div className="projects-mobile-end-state" role="status">
                        <span className="projects-mobile-end-dot" aria-hidden="true" />
                        <strong>{copy.endOfHistory}</strong>
                        <span aria-hidden="true">·</span>
                        <code>main</code>
                        <span aria-hidden="true">·</span>
                        <span>{format(copy.repositoryCount, { count: 1 })}</span>
                      </div>
                    )}
                    {displayedProjects.length === 0 && (
                      <div className="projects-repository-empty">
                        {copy.noMatches}
                      </div>
                    )}
                  </div>
                )}
            </div>
          </div>
        )}
        </div>
      </main>
    </div>
  );
};

export default ProjectsPageClient;
