import { NextResponse } from "next/server";
import { sharedCacheHeaders } from "@/lib/cache";
import { getSkills } from "@/lib/skills/data.server";

// Cache skills data for 1 hour (skills don't change frequently)
export const revalidate = 3600;

export async function GET() {
  try {
    return NextResponse.json(await getSkills(), { headers: sharedCacheHeaders(revalidate) });
  } catch (error) {
    console.error("[/api/skills] db error:", error);
    return NextResponse.json({ error: "db" }, { status: 500 });
  }
}
