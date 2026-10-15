import "server-only";

import { GITHUB_OWNER } from "./githubSync";

export const REPOSITORY_STATS_REVALIDATE_SECONDS = 1800;
const MAX_REPOSITORIES = 24;

const GITHUB_TIMEOUT_MS = 5_000;
const REPOSITORY_PATTERN = /^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/;

export interface GitHubRepositoryResponse {
  full_name: string;
  private: boolean;
  stargazers_count: number;
  subscribers_count?: number;
  forks_count: number;
  language: string | null;
  fork: boolean;
  archived: boolean;
  updated_at: string;
}

export interface RepositoryStats {
  stars: number;
  watchers: number;
  forks: number;
  language: string | null;
  isFork: boolean;
  isArchived: boolean;
  updatedAt: string;
}

export function normalizeRepositories(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  const ownerPrefix = `${GITHUB_OWNER.toLowerCase()}/`;
  const repositories = new Map<string, string>();

  for (const item of value) {
    if (typeof item !== "string") continue;
    const repository = item.trim();
    const key = repository.toLowerCase();
    if (
      REPOSITORY_PATTERN.test(repository)
      && key.startsWith(ownerPrefix)
      && !repositories.has(key)
    ) {
      repositories.set(key, repository);
    }
    if (repositories.size === MAX_REPOSITORIES) break;
  }
  return Array.from(repositories.values());
}

function githubHeaders() {
  const token = process.env.GITHUB_TOKEN;
  return {
    Accept: "application/vnd.github+json",
    "User-Agent": "portfolio-projects-page",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

export async function getPublicRepositories(): Promise<GitHubRepositoryResponse[]> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), GITHUB_TIMEOUT_MS);
  try {
    const query = new URLSearchParams({
      per_page: "100",
      sort: "updated",
      type: "owner",
    });
    const response = await fetch(
      `https://api.github.com/users/${GITHUB_OWNER}/repos?${query}`,
      {
        headers: githubHeaders(),
        next: { revalidate: REPOSITORY_STATS_REVALIDATE_SECONDS },
        signal: controller.signal,
      },
    );
    if (!response.ok) return [];
    const data: unknown = await response.json();
    if (!Array.isArray(data)) return [];
    return (data as GitHubRepositoryResponse[]).filter(
      (repository) => !repository.private
        && repository.full_name.toLowerCase().startsWith(
          `${GITHUB_OWNER.toLowerCase()}/`,
        ),
    );
  } catch {
    return [];
  } finally {
    clearTimeout(timeout);
  }
}

export function repositoryStatsFor(
  repositories: string[],
  publicRepositories: GitHubRepositoryResponse[],
): Record<string, RepositoryStats> {
  const byName = new Map(
    publicRepositories.map((repository) => [
      repository.full_name.toLowerCase(),
      repository,
    ]),
  );
  return Object.fromEntries(repositories.flatMap((repository) => {
    const data = byName.get(repository.toLowerCase());
    if (!data) return [];
    return [[repository, {
      stars: data.stargazers_count,
      watchers: data.subscribers_count ?? 0,
      forks: data.forks_count,
      language: data.language,
      isFork: data.fork,
      isArchived: data.archived,
      updatedAt: data.updated_at,
    } satisfies RepositoryStats] as const];
  }));
}
