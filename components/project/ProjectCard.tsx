"use client";
import React from "react";
import Image from "next/image";
import { useAccentRgb, rgbToHex } from "@/lib/useAccentRgb";
import { type Project } from "@/components/project/types";
import { iconPathToKey } from "@/lib/projects/githubSync";
import { useI18n } from "@/components/i18n/I18nProvider";
import type { RepositoryStats } from "@/lib/projects/repository-stats.server";

interface ProjectCardProps {
  project: Project;
  index?: number;
  branchName?: string;
  categoryColor?: { accent: string };
  repositoryStats?: RepositoryStats;
}

const ProjectCard: React.FC<ProjectCardProps> = ({
  project,
  index = 0,
  branchName = index === 0 ? "main" : "develop",
  categoryColor,
  repositoryStats,
}) => {
  const { dictionary, format } = useI18n();
  const copy = dictionary.projects;
  const displayLanguages = project.languages.slice(0, 3);
  const iconKey = project.cover_image_url ? iconPathToKey(project.cover_image_url) : "";
  const randomDelay = index * 0.08;
  const accentRgb = useAccentRgb();
  const accentColor = categoryColor?.accent || rgbToHex(accentRgb);
  const commitHash = `${project.id.replace(/[^a-z0-9]/gi, "").slice(-6) || "a1b2c3"}`.toLowerCase();
  const stars = repositoryStats?.stars ?? 0;
  const watchers = repositoryStats?.watchers ?? 0;
  const forks = repositoryStats?.forks ?? 0;
  const repositoryUrl = project.github_url.replace(/\/$/, "");

  return (
    <div
      className="project-card-enter w-full"
      style={{ animationDelay: `${randomDelay}s` }}
    >
      <article
        className="projects-mobile-card-row block w-full overflow-hidden rounded-[22px] p-[1px]"
        style={{
          border: "1px solid var(--projects-row-border)",
          background: "var(--projects-row-bg)",
          boxShadow: "var(--projects-row-shadow)",
        }}
      >
        <div className="projects-mobile-card-inner relative overflow-hidden rounded-[21px]">

          <div className="projects-mobile-card-topline flex items-center justify-between gap-2">
            <div
              className="projects-mobile-category"
              style={{ color: accentColor }}
            >
              {copy.categories[project.category as keyof typeof copy.categories] ?? project.category}
            </div>
            <div className="projects-mobile-card-index">
              {index === 0 && <span className="projects-mobile-head">HEAD</span>}
              <span>{String(index + 1).padStart(2, "0")}</span>
            </div>
          </div>

          <div className="projects-mobile-card-body">
            <div
              className="projects-mobile-card-media flex items-center justify-center overflow-hidden p-1"
              data-icon-key={iconKey}
            >
              {project.cover_image_url ? (
                <Image
                  src={project.cover_image_url}
                  alt={project.title}
                  width={96}
                  height={96}
                  fetchPriority={index === 0 ? "high" : "auto"}
                  loading={index === 0 ? "eager" : "lazy"}
                  priority={index === 0}
                  className="projects-mobile-card-media-image max-h-full max-w-full object-contain"
                  unoptimized
                />
              ) : (
                <div className="text-[10px] text-white/35">{copy.noIcon}</div>
              )}
            </div>

            <div className="projects-mobile-card-copy min-w-0">
              <h3 className="projects-mobile-card-title truncate text-[color:var(--projects-title-text)]">
                <a
                  href={repositoryUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={format(dictionary.common.open, { name: project.title })}
                >
                  {project.title}
                </a>
              </h3>
              <p className="projects-mobile-card-description line-clamp-2 text-[color:var(--projects-description-text)]">
                {project.description}
              </p>

              {displayLanguages.length > 0 && (
                <div className="projects-mobile-tech-list flex flex-wrap">
                  {displayLanguages.map((lang) => (
                    <span
                      key={lang}
                      className="projects-mobile-tech-chip rounded border font-medium uppercase text-[color:var(--projects-tag-text)]"
                      style={{
                        backgroundColor: "var(--projects-tag-bg)",
                        borderColor: "transparent",
                      }}
                    >
                      {lang}
                    </span>
                  ))}
                </div>
              )}
            </div>

            <div
              className="projects-mobile-repo-stats"
              aria-label={format(copy.repositoryStats, { stars, watchers, forks })}
            >
              <a href={`${repositoryUrl}/stargazers`} target="_blank" rel="noopener noreferrer" className="projects-mobile-repo-stat">
                <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.35" strokeLinejoin="round" aria-hidden="true">
                  <path d="m8 1.5 1.9 3.84 4.24.62-3.07 2.99.72 4.22L8 11.18l-3.79 1.99.72-4.22-3.07-2.99 4.24-.62L8 1.5Z" />
                </svg>
                <span>{copy.stars}</span><strong>{stars}</strong>
              </a>
              <a href={`${repositoryUrl}/watchers`} target="_blank" rel="noopener noreferrer" className="projects-mobile-repo-stat">
                <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.35" aria-hidden="true">
                  <path d="M1.4 8s2.4-3.6 6.6-3.6S14.6 8 14.6 8 12.2 11.6 8 11.6 1.4 8 1.4 8Z" />
                  <circle cx="8" cy="8" r="1.65" />
                </svg>
                <span>{copy.watching}</span><strong>{watchers}</strong>
              </a>
              <a href={`${repositoryUrl}/forks`} target="_blank" rel="noopener noreferrer" className="projects-mobile-repo-stat">
                <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.35" strokeLinecap="round" aria-hidden="true">
                  <circle cx="4" cy="3" r="1.5" />
                  <circle cx="12" cy="3" r="1.5" />
                  <circle cx="8" cy="13" r="1.5" />
                  <path d="M4 4.5v1.2c0 1.3.9 2.3 2.2 2.3H8m4-3.5v1.2C12 7 11.1 8 9.8 8H8v3.5" />
                </svg>
                <span>{copy.forks}</span><strong>{forks}</strong>
              </a>
            </div>
          </div>

          <div className="projects-mobile-git-meta flex items-center justify-between gap-2">
            <span className="projects-mobile-branch">
              <svg viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
                <path d="M5 3.25a2.25 2.25 0 1 1-3 2.122v5.256a2.251 2.251 0 1 1 1.5 0V7.372A5.5 5.5 0 0 0 8.25 10.1v.528a2.251 2.251 0 1 1 1.5 0V10.1a5.5 5.5 0 0 0 4.75-2.728V5.372a2.25 2.25 0 1 1 1.5 0v2.172a7 7 0 0 1-6.25 4.045v-.961a2.251 2.251 0 0 1-1.5 0v.961A7 7 0 0 1 2 7.544V5.372A2.25 2.25 0 0 1 5 3.25Z" />
              </svg>
              {branchName}
            </span>
            <span className="projects-mobile-repo-links">
              <a href={`${repositoryUrl}#readme`} target="_blank" rel="noopener noreferrer">README</a>
              <a href={`${repositoryUrl}/activity`} target="_blank" rel="noopener noreferrer">{copy.activity}</a>
            </span>
            <span className="projects-mobile-commit">{commitHash}</span>
          </div>
        </div>
      </article>
    </div>
  );
};

export default ProjectCard;
