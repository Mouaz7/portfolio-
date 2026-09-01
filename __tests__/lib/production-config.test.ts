/**
 * @jest-environment node
 */

import {
  assertProductionSecurityConfig,
  productionSecurityConfigIssues,
  SECURITY_SECRET_NAMES,
} from "@/lib/security/production-config";

function productionEnvironment(
  overrides: Record<string, string | undefined> = {},
) {
  const environment: Record<string, string | undefined> = {
    NODE_ENV: "production",
  };
  SECURITY_SECRET_NAMES.forEach((name, index) => {
    environment[name] = `${name.toLowerCase()}-${index}-${"x".repeat(40)}`;
  });
  return { ...environment, ...overrides };
}

describe("production security configuration", () => {
  it("accepts five distinct non-placeholder secrets of at least 32 UTF-8 bytes", () => {
    const environment = productionEnvironment();

    expect(productionSecurityConfigIssues(environment)).toEqual([]);
    expect(() => assertProductionSecurityConfig(environment)).not.toThrow();
  });

  it("reports missing, short, placeholder and duplicate values by name only", () => {
    const duplicated = "a-secure-value-that-is-definitely-long-enough";
    const environment = productionEnvironment({
      RATE_LIMIT_PEPPER: undefined,
      SESSION_COOKIE_SECRET: "short",
      CRON_SECRET: "generate-your-secret-value-that-is-long-enough",
      RAG_JOB_SECRET: duplicated,
      REVALIDATE_SECRET: duplicated,
    });

    const issues = productionSecurityConfigIssues(environment);
    expect(issues).toEqual(expect.arrayContaining([
      "RATE_LIMIT_PEPPER:missing",
      "SESSION_COOKIE_SECRET:too_short",
      "CRON_SECRET:placeholder",
      "RAG_JOB_SECRET+REVALIDATE_SECRET:duplicate",
    ]));
    expect(() => assertProductionSecurityConfig(environment)).toThrow(
      /RATE_LIMIT_PEPPER:missing/,
    );
    try {
      assertProductionSecurityConfig(environment);
    } catch (error) {
      expect(String(error)).not.toContain(duplicated);
      expect(String(error)).not.toContain("generate-your-secret");
    }
  });

  it("counts UTF-8 bytes rather than JavaScript characters", () => {
    const value = "🔐".repeat(8);
    expect(Buffer.byteLength(value, "utf8")).toBe(32);
    expect(productionSecurityConfigIssues(productionEnvironment({
      RATE_LIMIT_PEPPER: value,
    }))).toEqual([]);
  });

  it("does not enforce production-only rules in test or development", () => {
    expect(productionSecurityConfigIssues({ NODE_ENV: "test" })).toEqual([]);
    expect(productionSecurityConfigIssues({ NODE_ENV: "development" })).toEqual([]);
  });
});
