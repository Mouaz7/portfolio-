import { NextResponse } from "next/server";
import { assertProductionSecurityConfig } from "@/lib/security/production-config";
import { logServerError, safeLog } from "@/lib/security/safe-logger.server";

const REQUIRED_PRODUCTION_SETTINGS = [
  "CONTACT_TO",
  "CV_STORAGE_BUCKET",
  "CV_STORAGE_OBJECT",
  "SMTP_HOST",
  "SMTP_PASS",
  "SMTP_USER",
  "SUPABASE_SECRET_KEY",
] as const;

const HEALTH_CACHE = "public, max-age=15, s-maxage=60, stale-while-revalidate=300";

export async function GET() {
  try {
    assertProductionSecurityConfig();
    if (process.env.NODE_ENV === "production") {
      const missing = REQUIRED_PRODUCTION_SETTINGS.filter(
        (name) => !process.env[name]?.trim(),
      );
      if (missing.length > 0) {
        safeLog("error", "api.health.settings_missing", {
          code: "production_settings_missing",
          count: missing.length,
          route: "/api/health",
          status: 503,
        });
        return NextResponse.json(
          { ok: false },
          { status: 503, headers: { "Cache-Control": "no-store" } },
        );
      }
    }

    return NextResponse.json(
      { ok: true },
      { headers: { "Cache-Control": HEALTH_CACHE } },
    );
  } catch (error) {
    logServerError("api.health.configuration_invalid", error, {
      route: "/api/health",
      status: 503,
    });
    return NextResponse.json(
      { ok: false },
      { status: 503, headers: { "Cache-Control": "no-store" } },
    );
  }
}
