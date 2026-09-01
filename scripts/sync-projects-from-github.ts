import { createClient } from "@supabase/supabase-js";
import {
  buildSyncPayload,
  GITHUB_OWNER,
  githubUrlToFullName,
  type GitHubRepo,
} from "../lib/projects/githubSync.ts";

const githubToken = process.env.GITHUB_TOKEN;
const supabaseUrl = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SECRET_KEY;
const canonicalSiteUrl = process.env.CANONICAL_SITE_URL ?? process.env.NEXT_PUBLIC_SITE_URL;

if (!supabaseUrl || !supabaseKey) {
  throw new Error("Missing Supabase credentials. Set SUPABASE_URL and SUPABASE_SECRET_KEY.");
}
if (!canonicalSiteUrl || !/^https:\/\//i.test(canonicalSiteUrl)) {
  throw new Error("Set CANONICAL_SITE_URL to the production portfolio HTTPS origin.");
}
const canonicalSiteOrigin = new URL(canonicalSiteUrl).origin;

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

function githubHeaders() {
  return {
    Accept: "application/vnd.github+json",
    ...(githubToken ? { Authorization: `Bearer ${githubToken}` } : {}),
    "User-Agent": "portfolio-project-sync",
  };
}

async function fetchJson<T>(url: string): Promise<T> {
  let lastStatus = 0;
  for (let attempt = 0; attempt < 3; attempt += 1) {
    const response = await fetch(url, { headers: githubHeaders() });
    if (response.ok) return (await response.json()) as T;
    lastStatus = response.status;
    if (response.status !== 429 && response.status < 500) break;
    await new Promise((resolve) => setTimeout(resolve, 500 * (attempt + 1)));
  }
  throw new Error(`GitHub request failed (${lastStatus}) for ${url}`);
}

async function fetchAllRepos(owner: string) {
  const repos: GitHubRepo[] = [];
  for (let page = 1; page < 10; page += 1) {
    const batch = await fetchJson<GitHubRepo[]>(
      `https://api.github.com/users/${owner}/repos?per_page=100&page=${page}&sort=updated`,
    );
    repos.push(...batch);
    if (batch.length < 100) break;
  }
  return repos;
}

async function mapWithConcurrency<T, R>(
  values: T[],
  limit: number,
  mapper: (value: T) => Promise<R>,
): Promise<R[]> {
  const results = new Array<R>(values.length);
  let nextIndex = 0;
  await Promise.all(Array.from({ length: Math.min(limit, values.length) }, async () => {
    while (nextIndex < values.length) {
      const index = nextIndex;
      nextIndex += 1;
      results[index] = await mapper(values[index]);
    }
  }));
  return results;
}

async function syncProjects() {
  const repos = await fetchAllRepos(GITHUB_OWNER);
  const languageEntries = await mapWithConcurrency(repos, 5, async (repo) => {
    try {
      const languages = await fetchJson<Record<string, number>>(
        `https://api.github.com/repos/${repo.full_name}/languages`,
      );
      return [repo.full_name, languages] as const;
    } catch (error) {
      console.warn(`Skipping languages for ${repo.full_name}:`, error);
      return [repo.full_name, {}] as const;
    }
  });

  const payload = buildSyncPayload(repos, Object.fromEntries(languageEntries));
  const rows = [
    ...payload.projectRows.map((row) => ({
      ...row,
      github_full_name: githubUrlToFullName(row.github_url).toLowerCase(),
      source_kind: "github",
    })),
    {
      ...payload.manualPortfolioRow,
      github_full_name: null,
      github_url: canonicalSiteOrigin,
      source_kind: "manual",
    },
  ];
  const seen = rows
    .filter((row) => row.source_kind === "github" && row.github_full_name)
    .map((row) => row.github_full_name!);

  const { data, error } = await supabase.rpc("sync_github_projects", {
    p_rows: rows,
    p_seen_full_names: seen,
  });
  if (error) throw error;
  console.log(`Synchronised ${data ?? 0} project records atomically.`);
}

syncProjects().catch((error) => {
  console.error("Project sync failed:", error);
  process.exitCode = 1;
});
