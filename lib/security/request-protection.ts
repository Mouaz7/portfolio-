import "server-only";
import crypto from "crypto";
import { isIP } from "node:net";
import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/backend/supabaseAdminClient";
import { securitySecret } from "@/lib/security/production-config";

export type ProtectedAction = "cv_chat" | "code_review" | "code_review_chat" | "contact";

type ProtectionPolicy = {
  action: ProtectedAction;
  sessionLimit: number;
  sessionWindowSeconds: number;
  ipLimit: number;
  ipWindowSeconds: number;
  globalLimit: number;
  globalWindowSeconds: number;
  concurrencyLimit: number;
  leaseSeconds?: number;
};

export const PROTECTION_POLICIES: Record<ProtectedAction, ProtectionPolicy> = {
  cv_chat: {
    action: "cv_chat",
    sessionLimit: 10,
    sessionWindowSeconds: 10 * 60,
    ipLimit: 20,
    ipWindowSeconds: 60 * 60,
    globalLimit: 500,
    globalWindowSeconds: 24 * 60 * 60,
    concurrencyLimit: 4,
  },
  code_review: {
    action: "code_review",
    sessionLimit: 5,
    sessionWindowSeconds: 10 * 60,
    ipLimit: 10,
    ipWindowSeconds: 60 * 60,
    globalLimit: 100,
    globalWindowSeconds: 24 * 60 * 60,
    concurrencyLimit: 2,
  },
  code_review_chat: {
    action: "code_review_chat",
    sessionLimit: 12,
    sessionWindowSeconds: 10 * 60,
    ipLimit: 24,
    ipWindowSeconds: 60 * 60,
    globalLimit: 300,
    globalWindowSeconds: 24 * 60 * 60,
    concurrencyLimit: 2,
  },
  contact: {
    action: "contact",
    sessionLimit: 3,
    sessionWindowSeconds: 60 * 60,
    ipLimit: 5,
    ipWindowSeconds: 24 * 60 * 60,
    globalLimit: 50,
    globalWindowSeconds: 24 * 60 * 60,
    concurrencyLimit: 2,
  },
};

export type ProtectionContext = {
  deadline: number;
  ipHash: string;
  leaseId: string | null;
  remoteIp: string | null;
  sessionHash: string;
  sessionCookie: string | null;
};

type ProtectionResult =
  | { ok: true; context: ProtectionContext }
  | { ok: false; response: NextResponse };

type BudgetResult = {
  allowed?: boolean;
  lease_id?: string;
  reason?: "captcha_required" | "rate_limited" | "busy";
};

const SECURITY_STORE_TIMEOUT_MS = 5_000;
const SECURITY_RELEASE_TIMEOUT_MS = 3_000;

async function withSecurityStoreTimeout<T>(
  request: PromiseLike<T>,
  timeoutMs = SECURITY_STORE_TIMEOUT_MS,
): Promise<T> {
  let timeout: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      Promise.resolve(request),
      new Promise<never>((_, reject) => {
        timeout = setTimeout(
          () => reject(new Error("Security store request timed out")),
          timeoutMs,
        );
      }),
    ]);
  } finally {
    if (timeout) clearTimeout(timeout);
  }
}

function turnstileConfigured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY?.trim()
    && process.env.TURNSTILE_SECRET_KEY?.trim()
    && process.env.TURNSTILE_EXPECTED_HOSTNAME?.trim(),
  );
}

const SESSION_COOKIE = "portfolio_session";
const SESSION_MAX_AGE = 60 * 60 * 24;

function hmac(value: string, secret: string): string {
  return crypto.createHmac("sha256", secret).update(value).digest("base64url");
}

function hashIdentity(value: string): string {
  return hmac(value, securitySecret("RATE_LIMIT_PEPPER"));
}

function safeEqual(left: string, right: string): boolean {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);
  return leftBuffer.length === rightBuffer.length && crypto.timingSafeEqual(leftBuffer, rightBuffer);
}

function secretDigest(value: string): Buffer {
  return crypto.createHash("sha256").update(value, "utf8").digest();
}

function safeSecretEqual(left: string, right: string): boolean {
  return crypto.timingSafeEqual(secretDigest(left), secretDigest(right));
}

export function hasValidBearerSecret(
  request: Request,
  configuredSecrets: readonly (string | null | undefined)[],
): boolean {
  const authorization = request.headers.get("authorization") ?? "";
  const match = /^Bearer ([^\s]+)$/i.exec(authorization);
  if (!match) return false;

  const token = match[1];
  return configuredSecrets.some((configuredSecret) => {
    const secret = configuredSecret?.trim();
    return secret ? safeSecretEqual(token, secret) : false;
  });
}

function parseCookies(value: string | null): Map<string, string> {
  const result = new Map<string, string>();
  for (const item of value?.split(";") ?? []) {
    const separator = item.indexOf("=");
    if (separator < 1) continue;
    result.set(item.slice(0, separator).trim(), item.slice(separator + 1).trim());
  }
  return result;
}

function sessionIdentity(req: Request): { id: string; cookie: string | null } {
  const secret = securitySecret("SESSION_COOKIE_SECRET");
  const current = parseCookies(req.headers.get("cookie")).get(SESSION_COOKIE);
  if (current) {
    const separator = current.lastIndexOf(".");
    const id = current.slice(0, separator);
    const signature = current.slice(separator + 1);
    if (/^[a-f0-9-]{36}$/i.test(id) && signature && safeEqual(signature, hmac(id, secret))) {
      return { id, cookie: null };
    }
  }

  const id = crypto.randomUUID();
  return { id, cookie: `${id}.${hmac(id, secret)}` };
}

function firstValidAddress(value: string | null): string | null {
  const address = value?.split(",", 1)[0]?.trim() ?? "";
  return isIP(address) ? address : null;
}

function clientAddress(req: Request): string | null {
  const isVercel = process.env.VERCEL === "1" || Boolean(req.headers.get("x-vercel-id"));
  if (isVercel) {
    return firstValidAddress(req.headers.get("x-vercel-forwarded-for"));
  }

  if (process.env.NETLIFY === "true") {
    return firstValidAddress(req.headers.get("x-nf-client-connection-ip"));
  }

  const configuredHeader = process.env.TRUSTED_PROXY_IP_HEADER?.trim().toLowerCase();
  if (configuredHeader && /^[a-z0-9-]{1,64}$/.test(configuredHeader)) {
    return firstValidAddress(req.headers.get(configuredHeader));
  }

  return process.env.NODE_ENV === "production"
    ? null
    : firstValidAddress(req.headers.get("x-real-ip")) ?? "127.0.0.1";
}

function applySessionCookie(response: NextResponse, cookie: string | null): NextResponse {
  if (cookie) {
    response.cookies.set(SESSION_COOKIE, cookie, {
      httpOnly: true,
      maxAge: SESSION_MAX_AGE,
      path: "/",
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
    });
  }
  return response;
}

async function verifyTurnstile(
  token: string,
  action: ProtectedAction,
  remoteIp: string | null,
): Promise<boolean> {
  const secret = process.env.TURNSTILE_SECRET_KEY?.trim();
  const expectedHostname = process.env.TURNSTILE_EXPECTED_HOSTNAME?.trim();
  if (!secret || !expectedHostname) {
    if (process.env.NODE_ENV === "production") return false;
    return token === "development-pass";
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 5_000);
  try {
    const response = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        secret,
        response: token,
        ...(remoteIp ? { remoteip: remoteIp } : {}),
      }),
      signal: controller.signal,
    });
    if (!response.ok) return false;
    const result = (await response.json()) as {
      action?: string;
      hostname?: string;
      success?: boolean;
    };
    return result.success === true && result.action === action && result.hostname === expectedHostname;
  } catch {
    return false;
  } finally {
    clearTimeout(timeout);
  }
}

function securityError(status: number, code: string, cookie: string | null): NextResponse {
  return applySessionCookie(
    NextResponse.json({ error: "Request could not be processed.", code }, { status }),
    cookie,
  );
}

export function identifyApiRequest(req: Request): ProtectionContext {
  const session = sessionIdentity(req);
  const remoteIp = clientAddress(req);
  return {
    deadline: Date.now() + 40_000,
    ipHash: hashIdentity(remoteIp ?? `session:${session.id}`),
    leaseId: null,
    remoteIp,
    sessionHash: hashIdentity(session.id),
    sessionCookie: session.cookie,
  };
}

export async function protectApiRequest(
  req: Request,
  policy: ProtectionPolicy,
): Promise<ProtectionResult> {
  const identity = identifyApiRequest(req);

  // Existing unit tests isolate endpoint behaviour. Dedicated security tests
  // opt in to the real limiter with ENABLE_SECURITY_TESTS=1.
  if (process.env.NODE_ENV === "test" && process.env.ENABLE_SECURITY_TESTS !== "1") {
    return {
      ok: true,
      context: identity,
    };
  }

  const turnstileToken = req.headers.get("x-turnstile-token")?.trim() ?? "";
  const captchaVerified = turnstileToken
    ? await verifyTurnstile(turnstileToken, policy.action, identity.remoteIp)
    : false;
  if (turnstileToken && !captchaVerified) {
    return { ok: false, response: securityError(400, "captcha_invalid", identity.sessionCookie) };
  }

  let budgetResponse: Awaited<ReturnType<typeof supabaseAdmin.rpc>>;
  try {
    budgetResponse = await withSecurityStoreTimeout(supabaseAdmin.rpc("acquire_request_budget", {
      p_action: policy.action,
      p_captcha_verified: captchaVerified,
      p_concurrency_limit: policy.concurrencyLimit,
      p_global_limit: policy.globalLimit,
      p_global_window_seconds: policy.globalWindowSeconds,
      p_ip_hash: identity.ipHash,
      p_ip_limit: policy.ipLimit,
      p_ip_window_seconds: policy.ipWindowSeconds,
      p_lease_seconds: policy.leaseSeconds ?? 45,
      p_session_hash: identity.sessionHash,
      p_session_limit: policy.sessionLimit,
      p_session_window_seconds: policy.sessionWindowSeconds,
    }));
  } catch (error) {
    console.error("[request-protection] limiter timed out", error);
    return { ok: false, response: securityError(503, "security_unavailable", identity.sessionCookie) };
  }
  const { data, error } = budgetResponse;
  if (error) {
    console.error("[request-protection] limiter unavailable", error);
    return { ok: false, response: securityError(503, "security_unavailable", identity.sessionCookie) };
  }

  const budget = (data ?? {}) as BudgetResult;
  if (!budget.allowed) {
    if (budget.reason === "captcha_required") {
      // A partially configured challenge must never send the browser into a
      // flow it cannot complete. Keep the quota closed until Turnstile is
      // fully configured instead.
      if (!turnstileConfigured()) {
        return { ok: false, response: securityError(429, "rate_limited", identity.sessionCookie) };
      }
      return { ok: false, response: securityError(428, "captcha_required", identity.sessionCookie) };
    }
    if (budget.reason === "busy") {
      return { ok: false, response: securityError(503, "busy", identity.sessionCookie) };
    }
    return { ok: false, response: securityError(429, "rate_limited", identity.sessionCookie) };
  }

  return {
    ok: true,
    context: {
      deadline: identity.deadline,
      ipHash: identity.ipHash,
      leaseId: budget.lease_id ?? null,
      remoteIp: identity.remoteIp,
      sessionHash: identity.sessionHash,
      sessionCookie: identity.sessionCookie,
    },
  };
}

export async function acquireConcurrency(
  context: ProtectionContext,
  action: string,
  limit: number,
): Promise<boolean> {
  if (process.env.NODE_ENV === "test" && process.env.ENABLE_SECURITY_TESTS !== "1") return true;
  const { data, error } = await withSecurityStoreTimeout(
    supabaseAdmin.rpc("acquire_concurrency_lease", {
      p_action: action,
      p_concurrency_limit: limit,
      p_lease_seconds: 45,
      p_session_hash: context.sessionHash,
    }),
  );
  if (error) throw error;
  if (typeof data !== "string") return false;
  context.leaseId = data;
  return true;
}

export function secureResponse(response: NextResponse, context: ProtectionContext): NextResponse {
  return applySessionCookie(response, context.sessionCookie);
}

export async function releaseProtection(context: ProtectionContext | null): Promise<void> {
  if (!context?.leaseId) return;
  try {
    const { error } = await withSecurityStoreTimeout(
      supabaseAdmin.rpc("release_request_lease", {
        p_lease_id: context.leaseId,
      }),
      SECURITY_RELEASE_TIMEOUT_MS,
    );
    if (error) console.error("[request-protection] failed to release lease", error);
  } catch (error) {
    console.error("[request-protection] lease release timed out", error);
  }
}

export class RequestBodyError extends Error {
  constructor(readonly status: number, readonly code: string) {
    super(code);
  }
}

export async function readLimitedJson(
  req: Request,
  maxBytes: number,
): Promise<Record<string, unknown>> {
  const contentType = req.headers.get("content-type")?.split(";", 1)[0].trim().toLowerCase();
  const testRequest = process.env.NODE_ENV === "test" && contentType === "text/plain";
  if (contentType !== "application/json" && !testRequest) {
    throw new RequestBodyError(415, "unsupported_media_type");
  }

  const announcedLength = Number(req.headers.get("content-length"));
  if (Number.isFinite(announcedLength) && announcedLength > maxBytes) {
    throw new RequestBodyError(413, "body_too_large");
  }

  if (!req.body) return {};
  const reader = req.body.getReader();
  const chunks: Uint8Array[] = [];
  let size = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.byteLength;
    if (size > maxBytes) {
      await reader.cancel();
      throw new RequestBodyError(413, "body_too_large");
    }
    chunks.push(value);
  }

  try {
    const text = Buffer.concat(chunks.map((chunk) => Buffer.from(chunk))).toString("utf8");
    const parsed = JSON.parse(text) as unknown;
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      throw new Error("invalid object");
    }
    return parsed as Record<string, unknown>;
  } catch {
    throw new RequestBodyError(400, "invalid_json");
  }
}
