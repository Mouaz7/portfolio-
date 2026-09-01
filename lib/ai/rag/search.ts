import { supabaseAdmin as supabase } from "@/lib/backend/supabaseAdminClient";
import type { RagLanguage } from "../language";
import { createEmbeddings, vectorToSqlLiteral } from "../nvidia";
import { formatDbError } from "./text";
import type { RagSearchMatch } from "./types";

const DEFAULT_MATCH_THRESHOLD = 0.28;
const DEFAULT_RELATIVE_SCORE_MARGIN = 0.14;
const MAX_CHUNKS_PER_SOURCE = 2;

type RagSearchRow = {
  chunk_id: string;
  source_id: string;
  source_table: string;
  source_pk: string;
  title: string;
  content: string;
  language: RagLanguage;
  similarity: number;
  metadata: unknown;
};

type RagSearchLimits = {
  resultCount: number;
  candidateCount: number;
  matchThreshold: number;
  relativeScoreMargin: number;
};

function numericEnvironmentSetting(
  name: string,
  fallback: number,
  minimum: number,
  maximum: number,
): number {
  const configuredValue = Number(process.env[name]);
  return Number.isFinite(configuredValue)
    ? Math.min(maximum, Math.max(minimum, configuredValue))
    : fallback;
}

function getRagSearchLimits(requestedCount: number): RagSearchLimits {
  const resultCount = Math.min(20, Math.max(1, Math.trunc(requestedCount)));
  return {
    resultCount,
    candidateCount: Math.min(20, resultCount * 2),
    matchThreshold: numericEnvironmentSetting("RAG_MATCH_THRESHOLD", DEFAULT_MATCH_THRESHOLD, 0, 1),
    relativeScoreMargin: numericEnvironmentSetting(
      "RAG_RELATIVE_SCORE_MARGIN",
      DEFAULT_RELATIVE_SCORE_MARGIN,
      0,
      1,
    ),
  };
}

function contentTerms(content: string): Set<string> {
  return new Set(
    content
      .toLocaleLowerCase()
      .split(/[^\p{L}\p{N}+#.]+/u)
      .filter((term) => term.length > 2),
  );
}

function isNearDuplicate(content: string, accepted: RagSearchMatch[]): boolean {
  const terms = contentTerms(content);
  if (terms.size === 0) return false;

  return accepted.some((match) => {
    const previousTerms = contentTerms(match.content);
    const smallerSize = Math.min(terms.size, previousTerms.size);
    if (smallerSize === 0) return false;

    let shared = 0;
    for (const term of terms) {
      if (previousTerms.has(term)) shared += 1;
    }
    return shared / smallerSize >= 0.82;
  });
}

function toRagSearchMatch(row: RagSearchRow): RagSearchMatch {
  return {
    chunkId: row.chunk_id,
    sourceId: row.source_id,
    sourceTable: row.source_table,
    sourcePk: row.source_pk,
    title: row.title,
    content: row.content,
    language: row.language,
    similarity: row.similarity,
    metadata: row.metadata,
  };
}

function relevantMatches(
  matches: RagSearchMatch[],
  limits: RagSearchLimits,
): RagSearchMatch[] {
  if (matches.length === 0) return [];

  const relevanceFloor = Math.max(
    limits.matchThreshold,
    matches[0].similarity - limits.relativeScoreMargin,
  );
  const accepted: RagSearchMatch[] = [];
  const sourceCounts = new Map<string, number>();

  for (const match of matches) {
    if (match.similarity < relevanceFloor) continue;
    if ((sourceCounts.get(match.sourceId) ?? 0) >= MAX_CHUNKS_PER_SOURCE) continue;
    if (isNearDuplicate(match.content, accepted)) continue;

    accepted.push(match);
    sourceCounts.set(match.sourceId, (sourceCounts.get(match.sourceId) ?? 0) + 1);
    if (accepted.length >= limits.resultCount) break;
  }

  return accepted;
}

export async function searchRagChunks(
  query: string,
  matchCount = 8,
  deadlineMs?: number,
): Promise<RagSearchMatch[]> {
  const limits = getRagSearchLimits(matchCount);
  const [embedding] = await createEmbeddings([query], "query", deadlineMs);
  const { data: searchRows, error } = await supabase.rpc("match_rag_chunks", {
    query_embedding: vectorToSqlLiteral(embedding),
    match_count: limits.candidateCount,
    match_threshold: limits.matchThreshold,
    filter_language: null,
  });
  if (error) throw new Error(`Supabase RAG match error: ${formatDbError(error)}`);

  const matches = ((searchRows ?? []) as RagSearchRow[]).map(toRagSearchMatch);
  return relevantMatches(matches, limits);
}
