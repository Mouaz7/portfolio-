/**
 * @jest-environment node
 */

import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/backend/supabaseAdminClient";
import {
  acquireConcurrency,
  identifyApiRequest,
  PROTECTION_POLICIES,
  protectApiRequest,
  readLimitedJson,
  releaseProtection,
  RequestBodyError,
  secureResponse,
} from "@/lib/security/request-protection";

jest.mock("@/lib/backend/supabaseAdminClient", () => ({
  supabaseAdmin: { rpc: jest.fn() },
}));

const rpcMock = supabaseAdmin.rpc as jest.Mock;
const policy = PROTECTION_POLICIES.cv_chat;

describe("API request protection", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.ENABLE_SECURITY_TESTS = "1";
    process.env.RATE_LIMIT_PEPPER = "test-pepper";
    process.env.SESSION_COOKIE_SECRET = "test-cookie-secret";
    delete process.env.VERCEL;
    delete process.env.NETLIFY;
    delete process.env.TRUSTED_PROXY_IP_HEADER;
    delete process.env.TURNSTILE_SECRET_KEY;
    delete process.env.TURNSTILE_EXPECTED_HOSTNAME;
  });

  afterAll(() => {
    delete process.env.ENABLE_SECURITY_TESTS;
  });

  it("uses the exact configured quotas", () => {
    expect(PROTECTION_POLICIES.cv_chat).toMatchObject({ sessionLimit: 10, sessionWindowSeconds: 600, ipLimit: 20, globalLimit: 500, concurrencyLimit: 4 });
    expect(PROTECTION_POLICIES.code_review).toMatchObject({ sessionLimit: 5, ipLimit: 10, globalLimit: 100, concurrencyLimit: 2 });
    expect(PROTECTION_POLICIES.code_review_chat).toMatchObject({ sessionLimit: 12, ipLimit: 24, globalLimit: 300, concurrencyLimit: 2 });
    expect(PROTECTION_POLICIES.contact).toMatchObject({ sessionLimit: 3, ipLimit: 5, globalLimit: 50, concurrencyLimit: 2 });
  });

  it("hashes identities and reuses a valid signed HttpOnly session", () => {
    const request = new Request("https://example.test", { headers: { "x-real-ip": "203.0.113.8" } });
    const first = identifyApiRequest(request);
    expect(first.ipHash).not.toContain("203.0.113.8");
    expect(first.sessionCookie).toMatch(/^[a-f0-9-]{36}\./i);

    const response = secureResponse(NextResponse.json({ ok: true }), first);
    const setCookie = response.headers.get("set-cookie")!;
    expect(setCookie).toContain("portfolio_session=");
    expect(setCookie).toContain("HttpOnly");
    const cookie = setCookie.split(";", 1)[0];
    const second = identifyApiRequest(new Request("https://example.test", { headers: { cookie } }));
    expect(second.sessionHash).toBe(first.sessionHash);
    expect(second.sessionCookie).toBeNull();
  });

  it("ignores forged session cookies and trusts Vercel's canonical forwarded address", () => {
    process.env.VERCEL = "1";
    const forged = identifyApiRequest(new Request("https://example.test", {
      headers: { cookie: "portfolio_session=00000000-0000-0000-0000-000000000000.fake", "x-vercel-forwarded-for": "198.51.100.2, 10.0.0.1" },
    }));
    expect(forged.sessionCookie).not.toBeNull();
    expect(forged.ipHash).toHaveLength(43);
    expect(forged.remoteIp).toBe("198.51.100.2");
  });

  it("trusts Netlify's canonical client address only in Netlify", () => {
    process.env.NETLIFY = "true";
    const identity = identifyApiRequest(new Request("https://example.test", {
      headers: {
        "x-nf-client-connection-ip": "203.0.113.12",
        "x-forwarded-for": "198.51.100.99",
      },
    }));

    expect(identity.remoteIp).toBe("203.0.113.12");
  });

  it("ignores public proxy headers unless a self-hosted proxy header is explicitly trusted", () => {
    const untrusted = identifyApiRequest(new Request("https://example.test", {
      headers: { "x-forwarded-for": "198.51.100.99" },
    }));
    expect(untrusted.remoteIp).toBe("127.0.0.1");

    process.env.TRUSTED_PROXY_IP_HEADER = "x-client-ip";
    const trusted = identifyApiRequest(new Request("https://example.test", {
      headers: { "x-client-ip": "192.0.2.44" },
    }));
    expect(trusted.remoteIp).toBe("192.0.2.44");
  });

  it.each([
    [{ allowed: false, reason: "captcha_required" }, 428, "captcha_required"],
    [{ allowed: false, reason: "busy" }, 503, "busy"],
    [{ allowed: false, reason: "rate_limited" }, 429, "rate_limited"],
  ])("maps limiter result %j to a stable response", async (data, status, code) => {
    if (data.reason === "captcha_required") {
      process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY = "test-site-key";
      process.env.TURNSTILE_SECRET_KEY = "test-secret";
      process.env.TURNSTILE_EXPECTED_HOSTNAME = "example.test";
    }
    rpcMock.mockResolvedValue({ data, error: null });
    const result = await protectApiRequest(new Request("https://example.test"), policy);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.response.status).toBe(status);
      await expect(result.response.json()).resolves.toMatchObject({ code });
    }
  });

  it("fails closed with a rate limit when Turnstile is not fully configured", async () => {
    rpcMock.mockResolvedValue({ data: { allowed: false, reason: "captcha_required" }, error: null });
    const result = await protectApiRequest(new Request("https://example.test"), policy);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.response.status).toBe(429);
      await expect(result.response.json()).resolves.toMatchObject({ code: "rate_limited" });
    }
  });

  it("returns a lease for an allowed request and releases it", async () => {
    rpcMock.mockResolvedValueOnce({ data: { allowed: true, lease_id: "11111111-1111-1111-1111-111111111111" }, error: null });
    const result = await protectApiRequest(new Request("https://example.test"), policy);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.context.leaseId).toBe("11111111-1111-1111-1111-111111111111");
    rpcMock.mockResolvedValueOnce({ error: null });
    await releaseProtection(result.context);
    expect(rpcMock).toHaveBeenLastCalledWith("release_request_lease", { p_lease_id: result.context.leaseId });
  });

  it("fails closed when the limiter database is unavailable", async () => {
    const consoleError = jest.spyOn(console, "error").mockImplementation(() => undefined);
    rpcMock.mockResolvedValue({ data: null, error: { message: "offline" } });
    const result = await protectApiRequest(new Request("https://example.test"), policy);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.response.status).toBe(503);
    consoleError.mockRestore();
  });

  it("checks development Turnstile tokens and never accepts a bad token", async () => {
    const bad = await protectApiRequest(new Request("https://example.test", { headers: { "x-turnstile-token": "wrong" } }), policy);
    expect(bad.ok).toBe(false);
    if (!bad.ok) expect(bad.response.status).toBe(400);
    rpcMock.mockResolvedValue({ data: { allowed: true }, error: null });
    const good = await protectApiRequest(new Request("https://example.test", { headers: { "x-turnstile-token": "development-pass" } }), policy);
    expect(good.ok).toBe(true);
  });

  it("acquires a dedicated concurrency lease and handles exhaustion", async () => {
    const context = identifyApiRequest(new Request("https://example.test"));
    rpcMock.mockResolvedValueOnce({ data: "22222222-2222-2222-2222-222222222222", error: null });
    await expect(acquireConcurrency(context, "contact_send", 2)).resolves.toBe(true);
    expect(context.leaseId).toBe("22222222-2222-2222-2222-222222222222");
    rpcMock.mockResolvedValueOnce({ data: null, error: null });
    await expect(acquireConcurrency(context, "contact_send", 2)).resolves.toBe(false);
    rpcMock.mockResolvedValueOnce({ data: null, error: new Error("db") });
    await expect(acquireConcurrency(context, "contact_send", 2)).rejects.toThrow("db");
  });

  it("rejects media type, announced length, streamed overflow and malformed JSON before parsing", async () => {
    await expect(readLimitedJson(new Request("https://example.test", { method: "POST", body: "{}", headers: { "content-type": "text/html" } }), 10)).rejects.toMatchObject({ status: 415 });
    await expect(readLimitedJson(new Request("https://example.test", { method: "POST", body: "{}", headers: { "content-type": "application/json", "content-length": "99" } }), 10)).rejects.toMatchObject({ status: 413 });
    await expect(readLimitedJson(new Request("https://example.test", { method: "POST", body: JSON.stringify({ value: "long" }), headers: { "content-type": "application/json" } }), 4)).rejects.toMatchObject({ status: 413 });
    await expect(readLimitedJson(new Request("https://example.test", { method: "POST", body: "[1]", headers: { "content-type": "application/json" } }), 10)).rejects.toMatchObject({ status: 400 });
    await expect(readLimitedJson(new Request("https://example.test", { method: "POST", body: "{", headers: { "content-type": "application/json" } }), 10)).rejects.toBeInstanceOf(RequestBodyError);
  });

  it("reads a bounded JSON object and accepts an empty body", async () => {
    await expect(readLimitedJson(new Request("https://example.test", { method: "POST", body: "{\"ok\":true}", headers: { "content-type": "application/json; charset=utf-8" } }), 100)).resolves.toEqual({ ok: true });
    await expect(readLimitedJson(new Request("https://example.test", { headers: { "content-type": "application/json" } }), 100)).resolves.toEqual({});
    await expect(releaseProtection(null)).resolves.toBeUndefined();
  });
});
