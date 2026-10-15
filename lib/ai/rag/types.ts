import type { RagLanguage } from "../language";

export type DbError = {
  message?: string;
  code?: string;
  details?: string;
  hint?: string;
};

export type ExistingSource = {
  id: string;
  source_table: string;
  source_pk: string;
  source_hash: string;
};

export type RagSnapshot = {
  sourceTable: string;
  sourcePk: string;
  title: string;
  content: string;
  language: RagLanguage;
  sourceHash: string;
  metadata: Record<string, unknown>;
};

export type RagRefreshResult = {
  refreshed: boolean;
  sourcesSeen: number;
  sourcesIndexed: number;
  chunksIndexed: number;
};

export type RagSearchMatch = {
  chunkId: string;
  sourceId: string;
  sourceTable: string;
  sourcePk: string;
  title: string;
  content: string;
  language: RagLanguage;
  similarity: number;
  metadata: unknown;
};
