import { NextResponse } from "next/server";
import { sharedCacheHeaders } from "@/lib/cache";
import { defaultLocale, isLocale } from "@/lib/i18n/config";
import {
  getProjects,
  ProjectDatabaseError,
} from "@/lib/projects/data.server";

export const revalidate = 1800;
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const category = searchParams.get("category");
    const requestedLocale = searchParams.get("locale");
    const locale = isLocale(requestedLocale) ? requestedLocale : defaultLocale;

    return NextResponse.json(await getProjects(category, locale), {
      headers: sharedCacheHeaders(revalidate),
    });
  } catch (error) {
    if (error instanceof ProjectDatabaseError) {
      console.error("[/api/project] db error:", error.cause);
      return NextResponse.json({ error: "db" }, { status: 500 });
    }
    console.error("[/api/project] error:", error);
    return NextResponse.json({ error: "server error" }, { status: 500 });
  }
}
