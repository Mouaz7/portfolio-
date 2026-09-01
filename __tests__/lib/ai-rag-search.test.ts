import { searchRagChunks } from "@/lib/ai/rag/search";
import { supabaseAdmin } from "@/lib/backend/supabaseAdminClient";
import { createEmbeddings, vectorToSqlLiteral } from "@/lib/ai/nvidia";

jest.mock("@/lib/backend/supabaseAdminClient", () => ({
  supabaseAdmin: { rpc: jest.fn() },
}));

jest.mock("@/lib/ai/nvidia", () => ({
  createEmbeddings: jest.fn(),
  vectorToSqlLiteral: jest.fn(),
}));

const rpcMock = supabaseAdmin.rpc as jest.Mock;
const embeddingMock = createEmbeddings as jest.MockedFunction<typeof createEmbeddings>;
const vectorMock = vectorToSqlLiteral as jest.MockedFunction<typeof vectorToSqlLiteral>;
const originalEnv = process.env;

function row(
  chunkId: string,
  sourceId: string,
  content: string,
  similarity: number,
) {
  return {
    chunk_id: chunkId,
    source_id: sourceId,
    source_table: "project",
    source_pk: sourceId,
    title: sourceId,
    content,
    language: "en",
    similarity,
    metadata: {},
  };
}

describe("RAG search", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env = { ...originalEnv };
    delete process.env.RAG_MATCH_THRESHOLD;
    delete process.env.RAG_RELATIVE_SCORE_MARGIN;
    embeddingMock.mockResolvedValue([[0.1, 0.2]]);
    vectorMock.mockReturnValue("[0.1,0.2]");
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it("filters weak results, overlapping chunks, and excessive chunks from one source", async () => {
    rpcMock.mockResolvedValue({
      data: [
        row("chunk-1", "source-1", "Next.js Supabase TypeScript project architecture deployment API", 0.91),
        row("chunk-2", "source-1", "Next.js Supabase TypeScript project architecture deployment API details", 0.89),
        row("chunk-3", "source-1", "Testing Jest CI pipelines automation and quality", 0.86),
        row("chunk-4", "source-1", "Docker containers cloud infrastructure and observability", 0.84),
        row("chunk-5", "source-2", "React frontend UI accessibility and responsive design", 0.8),
        row("chunk-6", "source-3", "Unrelated low confidence portfolio text", 0.75),
      ],
      error: null,
    });

    const matches = await searchRagChunks("What technologies does Mouaz use?", 8);

    expect(rpcMock).toHaveBeenCalledWith("match_rag_chunks", {
      query_embedding: "[0.1,0.2]",
      match_count: 16,
      match_threshold: 0.28,
      filter_language: null,
    });
    expect(matches.map((match) => match.chunkId)).toEqual(["chunk-1", "chunk-3", "chunk-5"]);
  });

  it("returns no context when the database has no sufficiently relevant result", async () => {
    rpcMock.mockResolvedValue({ data: [], error: null });

    await expect(searchRagChunks("What is the weather?", 8)).resolves.toEqual([]);
  });
});
