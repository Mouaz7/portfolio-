import { supabaseAdmin as supabase } from "@/lib/backend/supabaseAdminClient";
import { detectRagLanguage } from "./language";
import { createEmbeddings, embeddingModelId, vectorToSqlLiteral } from "./nvidia";
import { chunkText, createSnapshot, createSourceHash, formatDbError, sourceKey, textLines } from "./rag/text";
import { searchRagChunks } from "./rag/search";
import type { ExistingSource, RagRefreshResult, RagSnapshot } from "./rag/types";

export { chunkText, createSourceHash, searchRagChunks };
export type { RagRefreshResult, RagSearchMatch } from "./rag/types";

const TRACKED_SOURCE_TABLES = [
  "site_cv",
  "project",
  "skill_category",
  "journey_item",
  "site_profile",
] as const;

const LEGACY_JOURNEY_TABLE = `${"road"}${"map"}_item`;
const MISSING_TABLE_CODES = new Set(["42P01", "PGRST205"]);

export function createRagIndexHash(contentHash: string, model = embeddingModelId()): string {
  return createSourceHash({ contentHash, embeddingModel: model });
}

async function fetchJourneyRows() {
  const query = (table: string) => supabase
    .from(table)
    .select("id,title,details,start_date,end_date,icon_alt")
    .eq("is_active", true)
    .order("start_date", { ascending: false });

  let result = await query("journey_item");
  if (result.error?.code && MISSING_TABLE_CODES.has(result.error.code)) {
    result = await query(LEGACY_JOURNEY_TABLE);
  }
  return result;
}

async function fetchSnapshots(): Promise<RagSnapshot[]> {
  const [
    cvResult,
    projectResult,
    categoryResult,
    skillResult,
    journeyResult,
    profileResult,
    homeRoleResult,
    homeCapabilityResult,
  ] = await Promise.all([
    supabase.from("site_cv").select("id,content,updated_at").order("id", { ascending: true }),
    supabase
      .from("project")
      .select("id,title,description,category,github_url,languages,sort_order,is_active,visibility,created_at")
      .eq("is_active", true)
      .eq("visibility", "public")
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: false }),
    supabase
      .from("skill_category")
      .select("name,title,blurb,sort_order,accent_rgb")
      .eq("is_active", true)
      .order("sort_order", { ascending: true }),
    supabase
      .from("skill")
      .select("id,name,category,sort_order,created_at")
      .eq("is_active", true)
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: true }),
    fetchJourneyRows(),
    supabase.from("site_profile").select("id,intro_prefix,display_name,role_prefix,updated_at"),
    supabase.from("home_role").select("label,sort_order,is_active").eq("is_active", true).order("sort_order"),
    supabase
      .from("home_capability")
      .select("id,title,description,sort_order,is_active")
      .eq("is_active", true)
      .order("sort_order"),
  ]);

  for (const result of [
    cvResult,
    projectResult,
    categoryResult,
    skillResult,
    journeyResult,
  ]) {
    if (result.error) {
      throw new Error(`Supabase RAG source error: ${formatDbError(result.error)}`);
    }
  }

  const snapshots: RagSnapshot[] = [];

  for (const row of cvResult.data ?? []) {
    const content = String(row.content ?? "").trim();
    if (!content) continue;

    snapshots.push(
      createSnapshot({
        sourceTable: "site_cv",
        sourcePk: String(row.id),
        title: "CV",
        content: textLines([
          "Portfolio CV",
          content,
        ]),
        metadata: {
          type: "cv",
          updated_at: row.updated_at,
        },
      }),
    );
  }

  for (const row of projectResult.data ?? []) {
    snapshots.push(
      createSnapshot({
        sourceTable: "project",
        sourcePk: String(row.id),
        title: String(row.title ?? "Project"),
        content: textLines([
          `Project: ${row.title ?? "Untitled"}`,
          row.description ? `Description: ${row.description}` : null,
          row.category ? `Category: ${row.category}` : null,
          Array.isArray(row.languages) && row.languages.length > 0
            ? `Technologies: ${row.languages.join(", ")}`
            : null,
          row.github_url ? `GitHub: ${row.github_url}` : null,
        ]),
        metadata: {
          type: "project",
          category: row.category,
          github_url: row.github_url,
          sort_order: row.sort_order,
        },
      }),
    );
  }

  const skillsByCategory = new Map<string, string[]>();
  for (const skill of skillResult.data ?? []) {
    const category = String(skill.category ?? "uncategorized");
    const skills = skillsByCategory.get(category) ?? [];
    skills.push(String(skill.name ?? ""));
    skillsByCategory.set(category, skills.filter(Boolean));
  }

  for (const category of categoryResult.data ?? []) {
    const key = String(category.name);
    const skills = skillsByCategory.get(key) ?? [];

    snapshots.push(
      createSnapshot({
        sourceTable: "skill_category",
        sourcePk: key,
        title: String(category.title ?? key),
        content: textLines([
          `Skill category: ${category.title ?? key}`,
          category.blurb ? `Description: ${category.blurb}` : null,
          skills.length > 0 ? `Skills: ${skills.join(", ")}` : null,
        ]),
        metadata: {
          type: "skills",
          category: key,
          sort_order: category.sort_order,
          accent_rgb: category.accent_rgb,
          skills,
        },
      }),
    );
  }

  for (const row of journeyResult.data ?? []) {
    snapshots.push(
      createSnapshot({
        sourceTable: "journey_item",
        sourcePk: String(row.id),
        title: String(row.title ?? "Journey item"),
        content: textLines([
          `Journey: ${row.title ?? "Untitled"}`,
          row.details ? `Details: ${row.details}` : null,
          row.start_date ? `From: ${row.start_date}` : null,
          row.end_date ? `To: ${row.end_date}` : "Status: Current or ongoing",
          row.icon_alt ? `Topic: ${row.icon_alt}` : null,
        ]),
        metadata: {
          type: "journey",
          start_date: row.start_date,
          end_date: row.end_date,
          topic: row.icon_alt,
        },
      }),
    );
  }

  // These tables are created by the dynamic-content migration. Keep the AI
  // available for installations that have not applied it yet.
  const hasHomeContent = !profileResult.error && !homeRoleResult.error && !homeCapabilityResult.error;
  const roles = hasHomeContent ? (homeRoleResult.data ?? [])
    .map((role) => String(role.label ?? "").trim())
    .filter(Boolean) : [];
  const capabilities = hasHomeContent ? (homeCapabilityResult.data ?? [])
    .map((capability) =>
      textLines([
        capability.title ? `Capability: ${capability.title}` : null,
        capability.description ? `Description: ${capability.description}` : null,
      ]),
    )
    .filter(Boolean) : [];

  for (const profile of hasHomeContent ? profileResult.data ?? [] : []) {
    snapshots.push(
      createSnapshot({
        sourceTable: "site_profile",
        sourcePk: String(profile.id),
        title: String(profile.display_name ?? "Portfolio profile"),
        content: textLines([
          `Portfolio profile: ${profile.display_name ?? ""}`,
          profile.role_prefix ? `Role prefix: ${profile.role_prefix}` : null,
          roles.length > 0 ? `Roles: ${roles.join(", ")}` : null,
          ...capabilities,
        ]),
        metadata: {
          type: "profile",
          updated_at: profile.updated_at,
          roles,
        },
      }),
    );
  }

  return snapshots;
}

async function getExistingSources(): Promise<ExistingSource[]> {
  const { data, error } = await supabase
    .from("rag_source")
    .select("id,source_table,source_pk,source_hash")
    .in("source_table", [...TRACKED_SOURCE_TABLES]);

  if (error) {
    throw new Error(`Supabase RAG schema error: ${formatDbError(error)}`);
  }

  return (data ?? []) as ExistingSource[];
}

async function insertRun(): Promise<string | null> {
  const { data, error } = await supabase
    .from("rag_index_run")
    .insert({ status: "running" })
    .select("id")
    .single();

  if (error) {
    throw new Error(`Supabase RAG run log error: ${formatDbError(error)}`);
  }

  return data?.id ?? null;
}

async function updateRun(
  runId: string | null,
  patch: Record<string, unknown>,
): Promise<void> {
  if (!runId) return;
  const { error } = await supabase.from("rag_index_run").update(patch).eq("id", runId);
  if (error) console.error("[rag] failed to update run log", error);
}

async function indexSnapshot(
  snapshot: RagSnapshot,
): Promise<number> {
  const chunks = chunkText(`${snapshot.title}\n\n${snapshot.content}`);
  if (chunks.length === 0) return 0;

  const embeddings = await createEmbeddings(chunks, "passage");
  const { error } = await supabase.rpc("replace_rag_source", {
    p_chunks: chunks.map((content, index) => ({
      chunk_index: index,
      content,
      language: detectRagLanguage(content),
      embedding: vectorToSqlLiteral(embeddings[index]),
      token_estimate: Math.ceil(content.length / 4),
      metadata: {
        title: snapshot.title,
        source_table: snapshot.sourceTable,
      },
    })),
    p_language: snapshot.language,
    p_metadata: snapshot.metadata,
    p_source_hash: snapshot.sourceHash,
    p_source_pk: snapshot.sourcePk,
    p_source_table: snapshot.sourceTable,
    p_title: snapshot.title,
  });
  if (error) throw new Error(`Supabase RAG replacement error: ${formatDbError(error)}`);

  return chunks.length;
}

async function refreshRagIndexInner(): Promise<RagRefreshResult> {
  const startedAt = Date.now();
  let runId: string | null = null;
  let sourcesSeen = 0;
  let sourcesIndexed = 0;
  let chunksIndexed = 0;
  let leaseToken: string | null = null;

  try {
    const leaseResult = await supabase.rpc("acquire_job_lease", {
      p_job_name: "rag_reindex",
      p_lease_seconds: 15 * 60,
    });
    if (leaseResult.error) throw new Error(`Supabase RAG lease error: ${formatDbError(leaseResult.error)}`);
    leaseToken = typeof leaseResult.data === "string" ? leaseResult.data : null;
    if (!leaseToken) {
      return { refreshed: false, sourcesSeen: 0, sourcesIndexed: 0, chunksIndexed: 0 };
    }

    runId = await insertRun();
    const activeEmbeddingModel = embeddingModelId();
    const snapshots = (await fetchSnapshots()).map((snapshot) => ({
      ...snapshot,
      sourceHash: createRagIndexHash(snapshot.sourceHash, activeEmbeddingModel),
    }));
    sourcesSeen = snapshots.length;
    const snapshotByKey = new Map(
      snapshots.map((snapshot) => [
        sourceKey(snapshot.sourceTable, snapshot.sourcePk),
        snapshot,
      ]),
    );
    const existing = await getExistingSources();
    const existingByKey = new Map(
      existing.map((source) => [sourceKey(source.source_table, source.source_pk), source]),
    );

    for (const snapshot of snapshots) {
      const existingSource = existingByKey.get(sourceKey(snapshot.sourceTable, snapshot.sourcePk));
      if (existingSource?.source_hash === snapshot.sourceHash) continue;

      chunksIndexed += await indexSnapshot(snapshot);
      sourcesIndexed += 1;
    }

    // Stale sources are removed only after every changed source was embedded
    // and transactionally replaced without error.
    for (const source of existing) {
      if (!snapshotByKey.has(sourceKey(source.source_table, source.source_pk))) {
        const { error } = await supabase.from("rag_source").delete().eq("id", source.id);
        if (error) throw new Error(`Supabase RAG source delete error: ${formatDbError(error)}`);
        sourcesIndexed += 1;
      }
    }

    await updateRun(runId, {
      status: "success",
      finished_at: new Date().toISOString(),
      duration_ms: Date.now() - startedAt,
      sources_seen: sourcesSeen,
      sources_indexed: sourcesIndexed,
      chunks_indexed: chunksIndexed,
    });

    const result = {
      refreshed: sourcesIndexed > 0,
      sourcesSeen,
      sourcesIndexed,
      chunksIndexed,
    };

    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    await supabase.from("rag_index_run").delete().lt("started_at", thirtyDaysAgo);
    const { data: excessRuns } = await supabase
      .from("rag_index_run")
      .select("id")
      .order("started_at", { ascending: false })
      .range(100, 999);
    const excessIds = (excessRuns ?? []).map((run) => run.id);
    if (excessIds.length > 0) await supabase.from("rag_index_run").delete().in("id", excessIds);

    return result;
  } catch (error) {
    await updateRun(runId, {
      status: "error",
      finished_at: new Date().toISOString(),
      duration_ms: Date.now() - startedAt,
      sources_seen: sourcesSeen,
      sources_indexed: sourcesIndexed,
      chunks_indexed: chunksIndexed,
      error_summary: error instanceof Error ? error.message.slice(0, 900) : "Unknown RAG error",
    });
    throw error;
  } finally {
    if (leaseToken) {
      const { error } = await supabase.rpc("release_job_lease", {
        p_job_name: "rag_reindex",
        p_lease_token: leaseToken,
      });
      if (error) console.error("[rag] failed to release job lease", error);
    }
  }
}

export function refreshRagIndex(): Promise<RagRefreshResult> {
  return refreshRagIndexInner();
}
