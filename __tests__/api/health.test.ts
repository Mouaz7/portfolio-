/**
 * @jest-environment node
 */

import { GET as getHealth } from "@/app/api/health/route";
import { GET as getInternalHealth } from "@/app/api/internal/health/route";
import { supabase } from "@/lib/backend/supabaseClient";

jest.mock("@/lib/backend/supabaseClient", () => ({
  supabase: {
    from: jest.fn(),
  },
}));

describe("health routes", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.CRON_SECRET = "cron-secret";
  });

  it("returns a short-cached shallow public health response without database work", async () => {
    const response = await getHealth();

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ ok: true });
    expect(response.headers.get("Cache-Control")).toBe(
      "public, max-age=15, s-maxage=60, stale-while-revalidate=300",
    );
    expect(supabase.from).not.toHaveBeenCalled();
  });

  it("requires a strict Bearer token for the uncached deep health check", async () => {
    const missing = await getInternalHealth(
      new Request("https://portfolio.test/api/internal/health"),
    );
    const malformed = await getInternalHealth(
      new Request("https://portfolio.test/api/internal/health", {
        headers: { Authorization: "Token cron-secret" },
      }),
    );

    expect(missing.status).toBe(401);
    expect(malformed.status).toBe(401);
    expect(supabase.from).not.toHaveBeenCalled();
  });

  it("checks Supabase only after internal authorization", async () => {
    const limit = jest.fn().mockResolvedValue({ error: null });
    const select = jest.fn().mockReturnValue({ limit });
    (supabase.from as jest.Mock).mockReturnValue({ select });

    const response = await getInternalHealth(
      new Request("https://portfolio.test/api/internal/health", {
        headers: { Authorization: "Bearer cron-secret" },
      }),
    );

    expect(response.status).toBe(200);
    expect(response.headers.get("Cache-Control")).toBe("no-store");
    expect(supabase.from).toHaveBeenCalledWith("site_profile");
    expect(select).toHaveBeenCalledWith("id");
    expect(limit).toHaveBeenCalledWith(1);
  });

  it("fails the deep check closed when Supabase is unavailable", async () => {
    const limit = jest.fn().mockResolvedValue({
      error: { message: "database unavailable" },
    });
    const select = jest.fn().mockReturnValue({ limit });
    (supabase.from as jest.Mock).mockReturnValue({ select });
    const consoleError = jest.spyOn(console, "error").mockImplementation(() => undefined);

    const response = await getInternalHealth(
      new Request("https://portfolio.test/api/internal/health", {
        headers: { Authorization: "Bearer cron-secret" },
      }),
    );

    expect(response.status).toBe(503);
    await expect(response.json()).resolves.toEqual({ ok: false });
    consoleError.mockRestore();
  });
});
