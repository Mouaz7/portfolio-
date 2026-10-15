import { createClient } from "@supabase/supabase-js";

// The explicit .mts extension lets Node run this standalone ESM sync script cleanly.
import {
  buildSyncPayload,
  GITHUB_OWNER,
  githubUrlToFullName,
  MANUAL_PORTFOLIO_TECHNOLOGIES,
  mergeAuditedProjectTechnologies,
  type GitHubRepo,
  type RepoTechnologyEvidence,
} from "../lib/projects/githubSync.ts";

const githubToken = process.env.GITHUB_TOKEN;
const supabaseUrl = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SECRET_KEY;
const canonicalSiteUrl =
  process.env.CANONICAL_SITE_URL ??
  process.env.NEXT_PUBLIC_SITE_URL ??
  "https://mouazdev.vercel.app";

if (!supabaseUrl || !supabaseKey) {
  throw new Error("Missing Supabase credentials. Set SUPABASE_URL and SUPABASE_SECRET_KEY.");
}
if (!/^https:\/\//i.test(canonicalSiteUrl)) {
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

async function fetchText(url: string): Promise<string> {
  const response = await fetch(url, { headers: githubHeaders() });
  if (!response.ok) throw new Error(`GitHub request failed (${response.status}) for ${url}`);
  return response.text();
}

type GitHubTree = {
  tree?: Array<{ path: string; type: "blob" | "tree" }>;
};

const TECHNOLOGY_MANIFEST = /(^|\/)(package\.json|requirements[^/]*\.txt|pyproject\.toml|pom\.xml|composer\.json|vercel\.json)$/i;

function rawGitHubUrl(repo: GitHubRepo, path: string) {
  const encodedPath = path.split("/").map(encodeURIComponent).join("/");
  return `https://raw.githubusercontent.com/${repo.full_name}/${encodeURIComponent(repo.default_branch)}/${encodedPath}`;
}

async function fetchRepoTechnologyEvidence(repo: GitHubRepo): Promise<RepoTechnologyEvidence> {
  const tree = await fetchJson<GitHubTree>(
    `https://api.github.com/repos/${repo.full_name}/git/trees/${encodeURIComponent(repo.default_branch)}?recursive=1`,
  );
  const paths = (tree.tree ?? [])
    .filter((entry) => entry.type === "blob")
    .map((entry) => entry.path);
  const manifests = paths.filter((path) => TECHNOLOGY_MANIFEST.test(path)).slice(0, 12);
  const manifestParts = await mapWithConcurrency(manifests, 4, async (path) => {
    try {
      return (await fetchText(rawGitHubUrl(repo, path))).slice(0, 250_000);
    } catch {
      return "";
    }
  });

  return {
    paths,
    manifestText: manifestParts.join("\n"),
  };
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

type StoredProjectTechnologyRow = {
  id: string;
  github_full_name: string | null;
  languages: string[] | null;
  source_kind: "github" | "manual" | null;
};

async function refreshAuditedTechnologiesOnly() {
  const { data, error } = await supabase
    .from("project")
    .select("id, github_full_name, languages, source_kind")
    .eq("is_active", true);
  if (error) throw error;

  const rows = (data ?? []) as StoredProjectTechnologyRow[];
  await mapWithConcurrency(rows, 5, async (row) => {
    const languages = row.source_kind === "manual"
      ? [...MANUAL_PORTFOLIO_TECHNOLOGIES]
      : mergeAuditedProjectTechnologies(
        row.github_full_name ?? "",
        row.languages ?? [],
      );
    const { error: updateError } = await supabase
      .from("project")
      .update({ languages })
      .eq("id", row.id);
    if (updateError) throw updateError;
  });

  console.log(JSON.stringify({
    level: "info",
    operation: "refresh_audited_project_technologies",
    provider: "supabase",
    status: "complete",
    count: rows.length,
  }));
}

async function syncProjects() {
  let repos: GitHubRepo[];
  try {
    repos = await fetchAllRepos(GITHUB_OWNER);
  } catch {
    console.warn(JSON.stringify({
      level: "warn",
      operation: "sync_projects",
      provider: "github",
      code: "repositories_unavailable_using_audit",
      status: "fallback",
    }));
    await refreshAuditedTechnologiesOnly();
    return;
  }
  const repoEntries = await mapWithConcurrency(repos, 5, async (repo) => {
    let languages: Record<string, number> = {};
    let evidence: RepoTechnologyEvidence = {};
    try {
      languages = await fetchJson<Record<string, number>>(
        `https://api.github.com/repos/${repo.full_name}/languages`,
      );
    } catch {
      console.warn(JSON.stringify({
        level: "warn",
        operation: "sync_project_languages",
        provider: "github",
        code: "languages_unavailable",
        status: "skipped",
      }));
    }
    try {
      evidence = await fetchRepoTechnologyEvidence(repo);
    } catch {
      console.warn(JSON.stringify({
        level: "warn",
        operation: "sync_project_technologies",
        provider: "github",
        code: "repository_evidence_unavailable",
        status: "skipped",
      }));
    }
    return [repo.full_name, languages, evidence] as const;
  });

  const languageMaps = Object.fromEntries(
    repoEntries.map(([fullName, languages]) => [fullName, languages]),
  );
  const evidenceMaps = Object.fromEntries(
    repoEntries.map(([fullName, , evidence]) => [fullName, evidence]),
  );
  const payload = buildSyncPayload(repos, languageMaps, evidenceMaps);
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
  console.log(JSON.stringify({
    level: "info",
    operation: "sync_projects",
    provider: "github_supabase",
    status: "complete",
    count: data ?? 0,
  }));
}

syncProjects().catch(() => {
  console.error(JSON.stringify({
    level: "error",
    operation: "sync_projects",
    provider: "github_supabase",
    code: "sync_failed",
    status: "failed",
  }));
  process.exitCode = 1;
});
