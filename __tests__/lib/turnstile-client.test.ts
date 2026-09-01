/**
 * @jest-environment jsdom
 */

import { fetchWithTurnstile } from "@/lib/security/turnstile-client";

class TestHeaders {
  private readonly values = new Map<string, string>();

  constructor(init?: HeadersInit) {
    if (init instanceof TestHeaders) {
      for (const [key, value] of init.values) this.values.set(key, value);
    } else if (Array.isArray(init)) {
      for (const [key, value] of init) this.set(key, value);
    } else if (init) {
      for (const [key, value] of Object.entries(init)) this.set(key, value);
    }
  }

  get(name: string) { return this.values.get(name.toLowerCase()) ?? null; }
  set(name: string, value: string) { this.values.set(name.toLowerCase(), String(value)); }
}

class TestResponse {
  constructor(private readonly body: string, readonly status: number) {}
  clone() { return new TestResponse(this.body, this.status); }
  async json() { return JSON.parse(this.body); }
}

const testResponse = (body: string, status: number) => new TestResponse(body, status) as unknown as Response;

describe("lazy Turnstile client", () => {
  beforeEach(() => {
    jest.restoreAllMocks();
    Object.defineProperty(globalThis, "Headers", { configurable: true, value: TestHeaders, writable: true });
    Object.defineProperty(globalThis, "fetch", { configurable: true, value: jest.fn(), writable: true });
    document.head.innerHTML = "";
    document.body.innerHTML = "";
    delete window.turnstile;
    process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY = "test-site-key";
  });

  it("returns ordinary responses without loading Turnstile", async () => {
    const fetchMock = jest.mocked(global.fetch).mockResolvedValue(testResponse("ok", 200));
    const response = await fetchWithTurnstile("/api/test", { method: "POST" }, "cv_chat");
    expect(response.status).toBe(200);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(document.querySelector("script[data-portfolio-turnstile]")).toBeNull();
  });

  it("does not retry unrelated 428 responses", async () => {
    const fetchMock = jest.mocked(global.fetch).mockResolvedValue(testResponse(JSON.stringify({ code: "other" }), 428));
    await fetchWithTurnstile("/api/test", {}, "contact");
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("executes invisible Turnstile and retries exactly once", async () => {
    let options: { callback: (token: string) => void } | undefined;
    window.turnstile = {
      render: jest.fn((_container, nextOptions) => { options = nextOptions; return "widget-1"; }),
      execute: jest.fn(() => options?.callback("verified-token")),
      remove: jest.fn(),
    };
    const fetchMock = jest.mocked(global.fetch)
      .mockResolvedValueOnce(testResponse(JSON.stringify({ code: "captcha_required" }), 428))
      .mockResolvedValueOnce(testResponse("ok", 200));

    const response = await fetchWithTurnstile("/api/test", { headers: { "Content-Type": "application/json" } }, "code_review");
    expect(response.status).toBe(200);
    expect(fetchMock).toHaveBeenCalledTimes(2);
    const retry = fetchMock.mock.calls[1][1]!;
    expect(new Headers(retry.headers).get("X-Turnstile-Token")).toBe("verified-token");
    expect(window.turnstile.render).toHaveBeenCalledWith(expect.any(HTMLElement), expect.objectContaining({ action: "code_review", execution: "execute", sitekey: "test-site-key", size: "invisible" }));
    expect(document.body.children).toHaveLength(0);
  });

  it("fails safely when Turnstile is not configured", async () => {
    delete process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
    jest.mocked(global.fetch).mockResolvedValue(testResponse(JSON.stringify({ code: "captcha_required" }), 428));
    await expect(fetchWithTurnstile("/api/test", {}, "contact")).rejects.toThrow("not configured");
  });
});
