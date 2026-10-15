import "server-only";

type SafeLogLevel = "error" | "info" | "warn";
type SafeLogValue = boolean | number | string | null;

export type SafeLogContext = Partial<Record<
  | "code"
  | "count"
  | "durationMs"
  | "operation"
  | "provider"
  | "requestId"
  | "retryable"
  | "route"
  | "status",
  SafeLogValue
>>;

const EVENT_PATTERN = /^[a-z0-9][a-z0-9._-]{0,95}$/i;
const SAFE_CODE_PATTERN = /^[a-z0-9][a-z0-9._:-]{0,95}$/i;
const SAFE_ROUTE_PATTERN = /^\/[a-z0-9/_-]{0,95}$/i;
const SAFE_REQUEST_ID_PATTERN = /^[a-z0-9][a-z0-9._:-]{0,95}$/i;
const SENSITIVE_TEXT_PATTERNS = [
  /-----BEGIN [A-Z ]*PRIVATE KEY-----/i,
  /\bBearer\s+\S+/i,
  /\b(?:gh[pousr]|nvapi|sb_secret|sk_live|sk_test)[-_][A-Za-z0-9_-]{8,}\b/i,
  /\beyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\b/,
  /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/i,
] as const;

function safeToken(value: string, fallback: string): string {
  const normalized = value.replace(/[\u0000-\u001f\u007f]/g, " ").trim();
  if (!SAFE_CODE_PATTERN.test(normalized)) return fallback;
  if (SENSITIVE_TEXT_PATTERNS.some((pattern) => pattern.test(normalized))) return fallback;
  return normalized;
}

function safeValue(key: keyof SafeLogContext, value: SafeLogValue): SafeLogValue | undefined {
  if (value === null || typeof value === "boolean") return value;
  if (typeof value === "number") return Number.isFinite(value) ? value : undefined;
  const fallback = key === "code" ? "redacted" : "invalid";
  const normalized = value.replace(/[\u0000-\u001f\u007f]/g, " ").trim().slice(0, 96);
  const allowed = key === "route"
    ? SAFE_ROUTE_PATTERN.test(normalized)
    : key === "requestId"
      ? SAFE_REQUEST_ID_PATTERN.test(normalized)
      : SAFE_CODE_PATTERN.test(normalized);
  if (!allowed || SENSITIVE_TEXT_PATTERNS.some((pattern) => pattern.test(normalized))) {
    return fallback;
  }
  return normalized;
}

export function safeErrorContext(error: unknown): Pick<SafeLogContext, "code" | "status"> {
  const candidate = error && typeof error === "object"
    ? error as { code?: unknown; name?: unknown; status?: unknown }
    : null;
  const rawCode = typeof candidate?.code === "string"
    ? candidate.code
    : typeof candidate?.name === "string"
      ? candidate.name
      : "unknown_error";
  const status = typeof candidate?.status === "number" && Number.isInteger(candidate.status)
    ? candidate.status
    : undefined;

  return {
    code: safeToken(rawCode, rawCode === "unknown_error" ? "unknown_error" : "redacted"),
    ...(status === undefined ? {} : { status }),
  };
}

export function safeLog(
  level: SafeLogLevel,
  event: string,
  context: SafeLogContext = {},
): void {
  const record: Record<string, SafeLogValue> = {
    event: EVENT_PATTERN.test(event) ? event : "invalid_event",
    level,
    timestamp: new Date().toISOString(),
  };

  for (const [rawKey, rawValue] of Object.entries(context)) {
    if (rawValue === undefined) continue;
    const key = rawKey as keyof SafeLogContext;
    const value = safeValue(key, rawValue);
    if (value !== undefined) record[key] = value;
  }

  const output = JSON.stringify(record);
  if (level === "error") console.error(output);
  else if (level === "warn") console.warn(output);
  else console.info(output);
}

export function logServerError(
  event: string,
  error: unknown,
  context: SafeLogContext = {},
): void {
  safeLog("error", event, { ...context, ...safeErrorContext(error) });
}
