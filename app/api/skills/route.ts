import { NextResponse } from "next/server";
import { sharedCacheHeaders } from "@/lib/cache";
import { getSkills } from "@/lib/skills/data.server";
import { logServerError } from "@/lib/security/safe-logger.server";

// Cache skills data for 1 hour (skills don't change frequently)
export const revalidate = 3600;

export async function GET() {
  try {
    return NextResponse.json(await getSkills(), { headers: sharedCacheHeaders(revalidate) });
  } catch (error) {
    logServerError("api.skills.database_failed", error, {
      route: "/api/skills",
    });
    return NextResponse.json({ error: "db" }, { status: 500 });
  }
}
