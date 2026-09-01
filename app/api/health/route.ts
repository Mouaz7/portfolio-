import { NextResponse } from "next/server";
import { assertProductionSecurityConfig } from "@/lib/security/production-config";

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
        console.error(`[health] invalid production settings: ${missing.map((name) => `${name}:missing`).join(", ")}`);
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
    console.error("[health] invalid production configuration", error);
    return NextResponse.json(
      { ok: false },
      { status: 503, headers: { "Cache-Control": "no-store" } },
    );
  }
}
