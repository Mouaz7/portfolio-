/**
 * @jest-environment node
 */

import { GET as cleanupGet } from "@/app/api/internal/contact-cleanup/route";
import { supabaseAdmin } from "@/lib/backend/supabaseAdminClient";

jest.mock("@/lib/backend/supabaseAdminClient", () => ({
  supabaseAdmin: { from: jest.fn(), storage: { from: jest.fn() } },
}));

const fromMock = supabaseAdmin.from as jest.Mock;
const storageFromMock = supabaseAdmin.storage.from as jest.Mock;

describe("protected internal jobs", () => {
  const originalCronSecret = process.env.CRON_SECRET;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env.CRON_SECRET = "cron-secret";
  });

  afterAll(() => {
    if (originalCronSecret === undefined) delete process.env.CRON_SECRET;
    else process.env.CRON_SECRET = originalCronSecret;
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
