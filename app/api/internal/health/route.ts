import { NextResponse } from "next/server";
import { supabase } from "@/lib/backend/supabaseClient";
import { assertProductionSecurityConfig } from "@/lib/security/production-config";
import { hasValidBearerSecret } from "@/lib/security/request-protection";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(request: Request) {
  if (!hasValidBearerSecret(request, [process.env.CRON_SECRET])) {
    return NextResponse.json(
      { ok: false },
      { status: 401, headers: { "Cache-Control": "no-store" } },
    );
  }

  try {
    assertProductionSecurityConfig();
    const { error } = await supabase.from("site_profile").select("id").limit(1);
    if (error) throw error;
    return NextResponse.json(
      { ok: true },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    console.error("[internal-health] check failed", error);
    return NextResponse.json(
      { ok: false },
      { status: 503, headers: { "Cache-Control": "no-store" } },
    );
  }
}
