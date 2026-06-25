"use client";

import { useLanguage } from "@/components/i18n/LanguageProvider";
import { translateOr } from "@/lib/i18n";

export interface Project {
  id: string;
  title: string;
  description: string;
  category: string;
  github_url: string;
  languages: string[];
  cover_image_url?: string;
}

export interface RepoMeta {
  stars?: number;
  forks?: number;
  pushedAt?: string;
  language?: string | null;
}

/* category → accent colour (used by the filter pills) */
export const CATEGORY_META: Record<string, { color: string; label: string }> = {
  "Full-Stack": { color: "var(--accent)", label: "Full-Stack" },
  Mobile: { color: "#a371f7", label: "Mobile" },
  Systems: { color: "#f0883e", label: "Systems" },
  Build: { color: "#3fb950", label: "Build" },
};
export const catColor = (c: string) => CATEGORY_META[c]?.color ?? "var(--accent)";

/* language → dot colour (GitHub linguist palette) */
export const LANG_COLOR: Record<string, string> = {
  TypeScript: "#3178c6", JavaScript: "#f1e05a", "Next.js": "#3178c6", Python: "#3572A5",
  "C++": "#f34b7d", C: "#555555", Kotlin: "#A97BFF", Assembly: "#6E4C13", "x86 Assembly": "#6E4C13",
  Bun: "#f0d264", "React Native": "#61dafb", React: "#61dafb", "Node.js": "#3fb950",
  Tailwind: "#38bdf8", Supabase: "#3ecf8e", Firebase: "#FFCA28", Linux: "#888888",
  Docker: "#2496ed", "POSIX Threads": "#555555", Express: "#aaaaaa", MySQL: "#dad8d8",
  "AI Agents": "#a371f7", AI: "#a371f7", "CI/CD": "#3fb950", "Google Maps": "#34a853",
  "Jetpack Compose": "#A97BFF", MVVM: "#A97BFF", EJS: "#a91e50", GCP: "#4285F4", OOP: "#f34b7d", HTML: "#e34c26",
};

const StarIcon = ({ c = "currentColor" }: { c?: string }) => (
  <svg width="14" height="14" viewBox="0 0 16 16" fill={c} aria-hidden>
    <path d="M8 .25a.75.75 0 0 1 .673.418l1.882 3.815 4.21.612a.75.75 0 0 1 .416 1.279l-3.046 2.97.719 4.192a.751.751 0 0 1-1.088.791L8 12.347l-3.766 1.98a.75.75 0 0 1-1.088-.79l.72-4.194L.818 6.374a.75.75 0 0 1 .416-1.28l4.21-.611L7.327.668A.75.75 0 0 1 8 .25Z" />
  </svg>
);
const ForkIcon = ({ c = "currentColor" }: { c?: string }) => (
  <svg width="14" height="14" viewBox="0 0 16 16" fill={c} aria-hidden>
    <path d="M5 5.372v.878c0 .414.336.75.75.75h4.5a.75.75 0 0 0 .75-.75v-.878a2.25 2.25 0 1 1 1.5 0v.878a2.25 2.25 0 0 1-2.25 2.25h-1.5v2.128a2.251 2.251 0 1 1-1.5 0V8.5h-1.5A2.25 2.25 0 0 1 3.5 6.25v-.878a2.25 2.25 0 1 1 1.5 0ZM5 3.25a.75.75 0 1 0-1.5 0 .75.75 0 0 0 1.5 0Zm6.75.75a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Zm-3 8.75a.75.75 0 1 0-1.5 0 .75.75 0 0 0 1.5 0Z" />
  </svg>
);

function timeAgo(iso: string | undefined, locale: string) {
  if (!iso) return "";
  const t = new Date(iso).getTime();
  if (isNaN(t)) return "";
  const s = Math.max(1, Math.floor((Date.now() - t) / 1000));
  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: "auto" });
  const u: [Intl.RelativeTimeFormatUnit, number][] = [
    ["year", 31536000],
    ["month", 2592000],
    ["week", 604800],
    ["day", 86400],
    ["hour", 3600],
    ["minute", 60],
  ];
  for (const [name, sec] of u) {
    const v = Math.floor(s / sec);
    if (v >= 1) return rtf.format(-v, name);
  }
  return rtf.format(-s, "second");
}

export default function GithubRepoRow({
  project,
  meta,
  isMobile = false,
  last = false,
  index = 0,
}: {
  project: Project;
  meta?: RepoMeta;
  isMobile?: boolean;
  last?: boolean;
  index?: number;
}) {
  const { language, locale, t } = useLanguage();
  const slug = (project.github_url || "").replace(/^https?:\/\/github\.com\//i, "");
  const name = slug.split("/")[1] || project.title;
  const primary = meta?.language || project.languages[0];
  const dot = (primary && LANG_COLOR[primary]) || catColor(project.category);
  const stars = meta?.stars ?? 0;
  const forks = meta?.forks ?? 0;
  const updated = timeAgo(meta?.pushedAt, locale);
  const categoryLabel = translateOr(language, `projects.categories.${project.category}`, project.category);

  return (
    <div
      className="gh-repo-row gh-row-in group relative px-4 py-3.5 transition-colors sm:px-5 sm:py-4"
      style={{ borderBottom: last ? "none" : "1px solid var(--surface-border)", animationDelay: `${index * 55}ms` }}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          {/* name + visibility */}
          <div className="flex flex-wrap items-center gap-2">
            <a
              href={project.github_url}
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold hover:underline"
              style={{ color: "var(--gh-link)", fontSize: isMobile ? 16 : 18 }}
            >
              {name}
            </a>
            <span
              className="rounded-full px-2 py-[1px] font-medium"
              style={{ fontSize: 11, color: "var(--fg-50)", border: "1px solid var(--surface-border)" }}
            >
              {t("projectRow.public")}
            </span>
            <span
              className="hidden rounded-full px-2 py-[1px] font-mono font-medium sm:inline"
              style={{ fontSize: 10.5, color: catColor(project.category), background: `color-mix(in srgb, ${catColor(project.category)} 14%, transparent)`, border: `1px solid color-mix(in srgb, ${catColor(project.category)} 40%, transparent)` }}
            >
              {categoryLabel}
            </span>
          </div>

          {/* description */}
          <p className={`mt-1.5 leading-relaxed ${isMobile ? "line-clamp-2" : ""}`} style={{ fontSize: isMobile ? 13 : 14, color: "var(--fg-70)", maxWidth: "60ch" }}>
            {project.description}
          </p>

          {/* topics (GitHub blue pills) */}
          <div className="mt-2 flex flex-wrap gap-1.5">
            {project.languages.slice(0, isMobile ? 3 : 6).map((l) => (
              <span
                key={l}
                className="rounded-full px-2.5 py-0.5 font-medium"
                style={{ fontSize: 11.5, color: "var(--gh-topic-fg)", background: "var(--gh-topic-bg)" }}
              >
                {l}
              </span>
            ))}
          </div>

          {/* meta footer */}
          <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1" style={{ fontSize: isMobile ? 11.5 : 12, color: "var(--fg-50)" }}>
            {primary && (
              <span className="flex items-center gap-1.5">
                <span className="inline-block rounded-full" style={{ width: 12, height: 12, background: dot }} />
                {primary}
              </span>
            )}
            {stars > 0 && (
              <span className="flex items-center gap-1"><StarIcon /> {stars}</span>
            )}
            {forks > 0 && (
              <span className="flex items-center gap-1"><ForkIcon /> {forks}</span>
            )}
            {updated && <span>{t("projectRow.updated")} {updated}</span>}
          </div>
        </div>

        {/* Star button */}
        <a
          href={project.github_url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex shrink-0 items-center gap-1.5 rounded-md px-2.5 py-1 font-semibold transition-colors hover:brightness-110"
          style={{
            fontSize: isMobile ? 11.5 : 12.5,
            color: "var(--fg)",
            background: "color-mix(in srgb, var(--surface) 55%, transparent)",
            border: "1px solid var(--surface-border)",
          }}
        >
          <StarIcon c="#e3b341" />
          <span className={isMobile ? "hidden" : ""}>{t("projectRow.star")}</span>
          {stars > 0 && (
            <span className="rounded-full px-1.5" style={{ fontSize: 11, color: "var(--fg-70)", background: "var(--fg-10)" }}>
              {stars}
            </span>
          )}
        </a>
      </div>

      <style>{`
        .gh-repo-row:hover { background: var(--gh-row-hover); }
        .gh-row-in { animation: ghRowIn .42s cubic-bezier(.2,.7,.2,1) both; }
        @keyframes ghRowIn { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: none; } }
      `}</style>
    </div>
  );
}
