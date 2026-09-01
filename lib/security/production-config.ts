import "server-only";

export const SECURITY_SECRET_NAMES = [
  "RATE_LIMIT_PEPPER",
  "SESSION_COOKIE_SECRET",
  "CRON_SECRET",
  "RAG_JOB_SECRET",
  "REVALIDATE_SECRET",
] as const;

export type SecuritySecretName = (typeof SECURITY_SECRET_NAMES)[number];

type Environment = Readonly<Record<string, string | undefined>>;

const MINIMUM_SECRET_BYTES = 32;
const PLACEHOLDER_PATTERN = /(?:change[-_ ]?me|example|generate|placeholder|replace[-_ ]?me|your[-_ ]|ci[-_ ]?only|development[-_ ]?only|test[-_ ])/i;

export function productionSecurityConfigIssues(
  environment: Environment = process.env,
): string[] {
  if (environment.NODE_ENV !== "production") return [];

  const issues: string[] = [];
  const values = new Map<string, SecuritySecretName[]>();

  for (const name of SECURITY_SECRET_NAMES) {
    const value = environment[name]?.trim() ?? "";
    if (!value) {
      issues.push(`${name}:missing`);
      continue;
    }
    if (Buffer.byteLength(value, "utf8") < MINIMUM_SECRET_BYTES) {
      issues.push(`${name}:too_short`);
    }
    if (PLACEHOLDER_PATTERN.test(value)) {
      issues.push(`${name}:placeholder`);
    }
    values.set(value, [...(values.get(value) ?? []), name]);
  }

  for (const names of values.values()) {
    if (names.length > 1) issues.push(`${names.join("+")}:duplicate`);
  }

  return issues.sort();
}

export function assertProductionSecurityConfig(
  environment: Environment = process.env,
): void {
  const issues = productionSecurityConfigIssues(environment);
  if (issues.length > 0) {
    throw new Error(`Invalid production security configuration: ${issues.join(", ")}`);
  }
}

export function securitySecret(name: SecuritySecretName): string {
  assertProductionSecurityConfig();
  const value = process.env[name]?.trim();
  if (value) return value;
  if (process.env.NODE_ENV !== "production") return `local-${name}-development-only`;
  throw new Error(`Invalid production security configuration: ${name}:missing`);
}

assertProductionSecurityConfig();
