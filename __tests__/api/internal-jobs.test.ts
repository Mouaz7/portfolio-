/**
 * @jest-environment node
 */

import { GET as reindexGet, POST as reindexPost } from "@/app/api/internal/rag/reindex/route";
import { GET as cleanupGet } from "@/app/api/internal/contact-cleanup/route";
import { refreshRagIndex } from "@/lib/ai/rag";
import { supabaseAdmin } from "@/lib/backend/supabaseAdminClient";

jest.mock("@/lib/ai/rag", () => ({ refreshRagIndex: jest.fn() }));
jest.mock("@/lib/backend/supabaseAdminClient", () => ({
  supabaseAdmin: { from: jest.fn(), storage: { from: jest.fn() } },
}));

const refreshMock = refreshRagIndex as jest.Mock;
const fromMock = supabaseAdmin.from as jest.Mock;
const storageFromMock = supabaseAdmin.storage.from as jest.Mock;

describe("protected internal jobs", () => {
  const originalCronSecret = process.env.CRON_SECRET;
  const originalRagJobSecret = process.env.RAG_JOB_SECRET;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env.RAG_JOB_SECRET = "rag-secret";
    process.env.CRON_SECRET = "cron-secret";
    refreshMock.mockResolvedValue({ indexed: 12, skipped: false });
  });

  afterAll(() => {
    if (originalCronSecret === undefined) delete process.env.CRON_SECRET;
    else process.env.CRON_SECRET = originalCronSecret;

    if (originalRagJobSecret === undefined) delete process.env.RAG_JOB_SECRET;
    else process.env.RAG_JOB_SECRET = originalRagJobSecret;
  });

  it("protects and runs RAG reindex for both supported methods", async () => {
    expect((await reindexGet(new Request("http://localhost"))).status).toBe(401);
    const get = await reindexGet(new Request("http://localhost", { headers: { authorization: "Bearer cron-secret" } }));
    expect(get.status).toBe(200);
    await expect(get.json()).resolves.toEqual({ ok: true, indexed: 12, skipped: false });
    expect((await reindexPost(new Request("http://localhost", { headers: { authorization: "Bearer rag-secret" } }))).status).toBe(200);
  });

  it.each([
    "Basic rag-secret",
    "Bearer",
    "Bearer  rag-secret",
    "Bearer rag-secret extra",
    "Bearer rag-secret-with-extra-data",
  ])("rejects malformed or unequal RAG authorization: %s", async (authorization) => {
    const response = await reindexPost(
      new Request("http://localhost", { headers: { authorization } }),
    );

    expect(response.status).toBe(401);
    expect(refreshMock).not.toHaveBeenCalled();
  });

  it("fails closed when no RAG job secret is configured", async () => {
    delete process.env.RAG_JOB_SECRET;
    delete process.env.CRON_SECRET;

    const response = await reindexPost(
      new Request("http://localhost", {
        headers: { authorization: "Bearer rag-secret" },
      }),
    );

    expect(response.status).toBe(401);
    expect(refreshMock).not.toHaveBeenCalled();
  });

  it("does not leak a RAG job failure", async () => {
    const consoleError = jest.spyOn(console, "error").mockImplementation(() => undefined);
    refreshMock.mockRejectedValue(new Error("private detail"));
    const response = await reindexPost(new Request("http://localhost", { headers: { authorization: "Bearer rag-secret" } }));
    expect(response.status).toBe(500);
    await expect(response.json()).resolves.toEqual({ ok: false, error: "Reindex failed" });
    consoleError.mockRestore();
  });

  it("deletes expired contact rows and their private objects", async () => {
    const limit = jest.fn().mockResolvedValue({
      data: [{ id: "one", contact_upload: [{ object_path: "one/a.pdf" }] }, { id: "two", contact_upload: null }],
      error: null,
    });
    const neq = jest.fn(() => ({ limit }));
    const secondLt = jest.fn(() => ({ neq }));
    const firstLt = jest.fn(() => ({ lt: secondLt }));
    const select = jest.fn(() => ({ lt: firstLt }));
    const inIds = jest.fn().mockResolvedValue({ error: null });
    const remove = jest.fn().mockResolvedValue({ error: null });
    fromMock.mockReturnValue({ delete: jest.fn(() => ({ in: inIds })), select });
    storageFromMock.mockReturnValue({ remove });

    expect((await cleanupGet(new Request("http://localhost"))).status).toBe(401);
    const response = await cleanupGet(new Request("http://localhost", { headers: { authorization: "Bearer cron-secret" } }));
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ ok: true, removed: 2 });
    expect(remove).toHaveBeenCalledWith(["one/a.pdf"]);
    expect(inIds).toHaveBeenCalledWith("id", ["one", "two"]);
  });

  it("fails closed when cleanup queries fail", async () => {
    const consoleError = jest.spyOn(console, "error").mockImplementation(() => undefined);
    const limit = jest.fn().mockResolvedValue({ data: null, error: { message: "db unavailable" } });
    const chain = { limit, neq: jest.fn(), lt: jest.fn(), select: jest.fn() };
    chain.select.mockReturnValue(chain);
    chain.lt.mockReturnValue(chain);
    chain.neq.mockReturnValue(chain);
    fromMock.mockReturnValue(chain);
    const response = await cleanupGet(new Request("http://localhost", { headers: { authorization: "Bearer cron-secret" } }));
    expect(response.status).toBe(500);
    consoleError.mockRestore();
  });
});
