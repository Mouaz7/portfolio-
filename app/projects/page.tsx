"use client";
import React, { useEffect, useMemo, useState } from "react";
import Header from "@/components/layout/Header";
import GithubRepoRow, { type Project, type RepoMeta, CATEGORY_META, catColor } from "@/components/projects/GithubRepoRow";
import LoadingAnimation from "@/components/ui/LoadingAnimation";
import { useLanguage } from "@/components/i18n/LanguageProvider";
import { translateOr } from "@/lib/i18n";

type GhRepo = {
  id: number;
  name: string;
  description: string | null;
  html_url: string;
  language: string | null;
  topics?: string[];
  stargazers_count: number;
  forks_count: number;
  pushed_at: string;
  fork: boolean;
  archived: boolean;
};

const GH_USER = "Mouaz7";

// The repo name shown in each row (e.g. "auto-healing-devops-platform") — used for A→Z sorting.
const repoName = (p: Project) => (p.github_url || "").split("/").pop() || p.title;

// Map a repo to one of the portfolio categories when it isn't curated in the DB.
function deriveCategory(language: string | null): string {
  const l = (language || "").toLowerCase();
  if (["kotlin", "swift", "java"].includes(l)) return "Mobile";
  if (["c", "c++", "assembly", "python", "shell", "makefile"].includes(l)) return "Systems";
  if (["typescript", "javascript", "html", "css", "vue", "ejs", "php"].includes(l)) return "Full-Stack";
  return "Build";
}

const ProjectsPageClient: React.FC = () => {
  const [dbProjects, setDbProjects] = useState<Project[]>([]);
  const [ghRepos, setGhRepos] = useState<GhRepo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [openCategory, setOpenCategory] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [sortBy, setSortBy] = useState<"pushed" | "name">("pushed");
  const [isMobile, setIsMobile] = useState(false);
  const { language, t } = useLanguage();

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 680px)");
    const apply = () => setIsMobile(mq.matches);
    apply();
    mq.addEventListener?.("change", apply);
    return () => mq.removeEventListener?.("change", apply);
  }, []);

  // Curated metadata from our DB (nicer titles / descriptions / categories for the highlights)
  useEffect(() => {
    (async () => {
      try {
        const r = await fetch("/api/project");
        if (r.ok) setDbProjects(await r.json());
      } catch (e) {
        console.error("[projects] db fetch failed:", e);
      }
    })();
  }, []);

  // Every public repo, live from GitHub — the source of truth (sorted by recently pushed)
  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        setError(null);
        const r = await fetch(`https://api.github.com/users/${GH_USER}/repos?per_page=100&sort=pushed`);
        if (r.ok) {
          const data = await r.json();
          if (Array.isArray(data)) {
            setGhRepos((data as GhRepo[]).filter((x) => !x.fork && x.name !== GH_USER));
          }
        }
      } catch (e) {
        console.error("[projects] github fetch failed:", e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const dbBySlug = useMemo(() => {
    const m: Record<string, Project> = {};
    for (const p of dbProjects) {
      const n = (p.github_url || "").split("/").pop() || "";
      if (n) m[n.toLowerCase()] = p;
    }
    return m;
  }, [dbProjects]);

  // Merge: every GitHub repo, overridden with curated DB data when we have it.
  const merged = useMemo(() => {
    const built = ghRepos.map((r) => {
      const db = dbBySlug[r.name.toLowerCase()];
      const project: Project = db ?? {
        id: String(r.id),
        title: r.name,
        description: r.description || t("projects.noDescription"),
        category: deriveCategory(r.language),
        github_url: r.html_url,
        languages: ((r.topics && r.topics.length ? r.topics : r.language ? [r.language] : []) as string[]).slice(0, 6),
      };
      const meta: RepoMeta = { stars: r.stargazers_count, forks: r.forks_count, pushedAt: r.pushed_at, language: r.language };
      return { project, meta, pushed: new Date(r.pushed_at).getTime() };
    });
    // Fallback to DB-only if the GitHub API is unavailable (rate-limited)
    if (built.length === 0 && dbProjects.length) {
      return dbProjects.map((p) => ({ project: p, meta: undefined as RepoMeta | undefined, pushed: 0 }));
    }
    return built;
  }, [ghRepos, dbBySlug, dbProjects, t]);

  const q = query.trim().toLowerCase();
  const searching = q.length > 0;

  // Last 6 months — the scope for the default "Recently pushed" view.
  const recent = useMemo(() => {
    const cutoff = Date.now() - 1000 * 60 * 60 * 24 * 183;
    return merged.filter((it) => it.pushed >= cutoff);
  }, [merged]);

  // Default view = the last 6 months. Selecting a category, searching, or
  // sorting by name widens the scope to every repository.
  const base = useMemo(() => {
    if (sortBy === "name" || searching || openCategory) return merged;
    return recent.length ? recent : merged; // fallback if GitHub API is unavailable
  }, [sortBy, searching, openCategory, merged, recent]);

  // Category pills always reflect every repo, so all four (incl. Build) always show.
  const categoryCounts = useMemo(() => {
    const acc: Record<string, number> = {};
    for (const it of merged) acc[it.project.category] = (acc[it.project.category] || 0) + 1;
    return acc;
  }, [merged]);

  const categories = useMemo(
    () => Object.keys(CATEGORY_META).filter((c) => categoryCounts[c]),
    [categoryCounts]
  );

  const filtered = useMemo(() => {
    let list = base;
    if (openCategory && !searching) list = list.filter((it) => it.project.category === openCategory);
    if (searching)
      list = list.filter((it) => {
        const p = it.project;
        return (
          p.title.toLowerCase().includes(q) ||
          p.description.toLowerCase().includes(q) ||
          p.category.toLowerCase().includes(q) ||
          p.languages.some((l) => l.toLowerCase().includes(q))
        );
      });
    const sorted = [...list];
    if (sortBy === "name") {
      sorted.sort((a, b) => repoName(a.project).localeCompare(repoName(b.project), undefined, { sensitivity: "base" }));
    } else {
      sorted.sort((a, b) => b.pushed - a.pushed);
    }
    return sorted;
  }, [base, openCategory, searching, q, sortBy]);

  const metaFor = (it: { meta?: RepoMeta }) => it.meta;
  const showEmpty = !loading && merged.length === 0;
  const categoryLabel = (category: string) => translateOr(language, `projects.categories.${category}`, category);

  return (
    <div className="relative flex flex-col overflow-hidden h-screen">
      <Header />

      {/* Page itself never scrolls (no page-swipe either). The repo list is the
          only scroll region, contained inside the fixed panel below. */}
      <main className="relative z-10 flex min-h-0 flex-1 px-4 sm:px-6 md:px-8 py-4 md:py-6">
        <div className="relative mx-auto flex h-full w-full max-w-[940px] flex-col">
          {loading && merged.length === 0 && (
            <div className="grid place-items-center" style={{ minHeight: "60vh" }}>
              <LoadingAnimation text={t("projects.loading")} />
            </div>
          )}

          {error && !loading && (
            <div className="flex items-center justify-center" style={{ minHeight: "60vh" }}>
              <div className="text-center">
                <p className="mb-4 text-lg text-red-400">{error}</p>
                <button onClick={() => window.location.reload()} className="rounded-full bg-accent px-6 py-3 font-medium text-white transition-colors hover:bg-accent-strong">
                  {t("projects.retry")}
                </button>
              </div>
            </div>
          )}

          {showEmpty && (
            <div className="flex items-center justify-center" style={{ minHeight: "60vh" }}>
              <p style={{ color: "var(--fg-70)" }}>{t("projects.noRepos")}</p>
            </div>
          )}

          {merged.length > 0 && (
            <div
              className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl"
              style={{
                background: "color-mix(in srgb, var(--surface) 72%, transparent)",
                backdropFilter: "blur(14px)",
                WebkitBackdropFilter: "blur(14px)",
                border: "1px solid var(--surface-border)",
                boxShadow: "none",
              }}
            >
              {/* panel header */}
              <div className="flex shrink-0 items-center justify-between gap-3 px-4 py-3 sm:px-5" style={{ borderBottom: "1px solid var(--surface-border)" }}>
                <div className="flex min-w-0 items-center gap-2 font-mono" style={{ fontSize: isMobile ? 13 : 15 }}>
                  <svg width={isMobile ? 17 : 19} height={isMobile ? 17 : 19} viewBox="0 0 16 16" fill="var(--fg)" aria-hidden>
                    <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0 0 16 8c0-4.42-3.58-8-8-8Z" />
                  </svg>
                  <span className="truncate font-semibold" style={{ color: "var(--fg-70)" }}>{GH_USER}</span>
                  <span style={{ color: "var(--fg-50)" }}>/</span>
                  <span className="truncate font-bold" style={{ color: "var(--gh-link)" }}>{t("projects.repositories")}</span>
                </div>
                <span className="shrink-0 font-mono" style={{ fontSize: isMobile ? 11 : 12.5, color: "var(--fg-70)" }}>
                  <span style={{ color: "var(--fg)", fontWeight: 700 }}>{merged.length}</span> {t("projects.repos")}
                </span>
              </div>

              {/* toolbar: search + sort */}
              <div className="flex shrink-0 flex-col gap-2.5 px-4 py-3 sm:flex-row sm:items-center sm:px-5" style={{ borderBottom: "1px solid var(--surface-border)" }}>
                <div className="relative flex-1">
                  <svg className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2" width="15" height="15" viewBox="0 0 16 16" fill="var(--fg-50)" aria-hidden>
                    <path d="M10.68 11.74a6 6 0 0 1-7.922-8.982 6 6 0 0 1 8.982 7.922l3.04 3.04a.749.749 0 0 1-.326 1.275.749.749 0 0 1-.734-.215ZM11.5 7a4.499 4.499 0 1 0-8.997 0A4.499 4.499 0 0 0 11.5 7Z" />
                  </svg>
                  <input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder={t("projects.searchPlaceholder")}
                    className="w-full rounded-md py-1.5 pl-9 pr-3 outline-none transition-colors focus:border-[var(--gh-link)]"
                    style={{ fontSize: 13, color: "var(--fg)", background: "color-mix(in srgb, var(--surface) 50%, transparent)", border: "1px solid var(--surface-border)" }}
                  />
                </div>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as "pushed" | "name")}
                  className="shrink-0 cursor-pointer rounded-md py-1.5 pl-3 pr-7 font-medium outline-none transition-colors focus:border-[var(--gh-link)]"
                  style={{ fontSize: 12.5, color: "var(--fg-70)", background: "color-mix(in srgb, var(--surface) 50%, transparent)", border: "1px solid var(--surface-border)", appearance: "none", backgroundImage: "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 16 16' fill='%238b949e'><path d='M4.427 7.427 7.25 10.25a1.06 1.06 0 0 0 1.5 0l2.823-2.823A.25.25 0 0 0 11.396 7H4.604a.25.25 0 0 0-.177.427Z'/></svg>\")", backgroundRepeat: "no-repeat", backgroundPosition: "right 8px center" }}
                >
                  <option value="pushed">{t("projects.sortRecent")}</option>
                  <option value="name">{t("projects.sortName")}</option>
                </select>
              </div>

              {/* category filter pills + result count */}
              <div className="flex shrink-0 flex-wrap items-center justify-between gap-2 px-4 py-3 sm:px-5" style={{ borderBottom: "1px solid var(--surface-border)" }}>
                <div className="flex flex-wrap gap-2">
                  {categories.map((category) => {
                    const isActive = !searching && openCategory === category;
                    const color = catColor(category);
                    const count = categoryCounts[category] || 0;
                    const tint = color === "var(--accent)" ? "rgba(var(--accent-rgb),0.16)" : `${color}22`;
                    const glow = color === "var(--accent)" ? "rgba(var(--accent-rgb),0.3)" : `${color}50`;
                    return (
                      <button
                        key={category}
                        onClick={() => { setQuery(""); setOpenCategory(openCategory === category ? null : category); }}
                        className="flex items-center gap-2 rounded-full px-3 py-1 font-mono font-semibold transition-all duration-200"
                        style={{
                          fontSize: isMobile ? 11.5 : 12.5,
                          color: isActive ? "var(--fg)" : "var(--fg-70)",
                          background: isActive ? tint : "color-mix(in srgb, var(--surface) 50%, transparent)",
                          border: `1px solid ${isActive ? color : "var(--surface-border)"}`,
                          boxShadow: isActive ? `0 0 14px ${glow}` : "none",
                        }}
                      >
                        <span className="inline-block rounded-full" style={{ width: 9, height: 9, background: color }} />
                        {categoryLabel(category)}
                        <span className="rounded-full px-1.5 font-bold" style={{ fontSize: 10, color: "var(--fg-50)", background: "var(--fg-10)" }}>{count}</span>
                      </button>
                    );
                  })}
                </div>
                <span className="shrink-0 font-mono" style={{ fontSize: isMobile ? 10.5 : 12, color: "var(--fg-50)" }}>
                  {searching
                    ? `${filtered.length} ${filtered.length === 1 ? t("projects.resultOne") : t("projects.resultMany")}`
                    : !openCategory && sortBy === "pushed"
                    ? `${filtered.length} · ${t("projects.lastSixMonths")}`
                    : `${filtered.length} ${filtered.length === 1 ? t("projects.repositoryOne") : t("projects.repositoryMany")}`}
                </span>
              </div>

              {/* repo list — the only scroll area; the page/shell stays fixed */}
              <div className="min-h-0 flex-1 overflow-y-auto">
                {filtered.length === 0 ? (
                  <div className="px-5 py-14 text-center" style={{ color: "var(--fg-50)", fontSize: 14 }}>
                    <div style={{ fontSize: 30, marginBottom: 6 }}>🔍</div>
                    {t("projects.noMatchStart")} <span style={{ color: "var(--fg-70)", fontWeight: 600 }}>“{query}”</span>.
                  </div>
                ) : (
                  filtered.map((it, i) => (
                    <GithubRepoRow key={it.project.id} project={it.project} meta={metaFor(it)} isMobile={isMobile} index={i} last={i === filtered.length - 1} />
                  ))
                )}
              </div>

              {/* footer — open the full list on GitHub */}
              <a
                href={`https://github.com/${GH_USER}?tab=repositories`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex shrink-0 items-center justify-center gap-2 px-4 py-3 font-mono font-semibold transition-colors hover:underline"
                style={{ fontSize: isMobile ? 12 : 13, color: "var(--gh-link)", borderTop: "1px solid var(--surface-border)" }}
              >
                {t("projects.viewAllGithub")}
                <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor" aria-hidden><path d="M3.75 2h3.5a.75.75 0 0 1 0 1.5h-3.5a.25.25 0 0 0-.25.25v8.5c0 .138.112.25.25.25h8.5a.25.25 0 0 0 .25-.25v-3.5a.75.75 0 0 1 1.5 0v3.5A1.75 1.75 0 0 1 12.25 14h-8.5A1.75 1.75 0 0 1 2 12.25v-8.5C2 2.784 2.784 2 3.75 2Zm6.854-1h4.146a.25.25 0 0 1 .25.25v4.146a.25.25 0 0 1-.427.177L13.03 4.03 9.28 7.78a.751.751 0 0 1-1.06-1.06l3.75-3.75-1.543-1.543A.25.25 0 0 1 10.604 1Z" /></svg>
              </a>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default ProjectsPageClient;
