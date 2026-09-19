import { NextResponse } from "next/server";
import { sharedCacheHeaders } from "@/lib/cache";
import { defaultLocale, isLocale } from "@/lib/i18n/config";
import {
  getSkillCategories,
} from "@/lib/skills/data.server";
import { logServerError } from "@/lib/security/safe-logger.server";

// Cache skill categories for 1 hour (static data)
export const revalidate = 3600;
// Locale is selected from the request query string; the underlying result is
// still cached per locale with `unstable_cache`.
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const requestedLocale = new URL(request.url).searchParams.get("locale");
    const locale = isLocale(requestedLocale) ? requestedLocale : defaultLocale;
    const categories = await getSkillCategories(locale);
    return NextResponse.json(categories, { headers: sharedCacheHeaders(revalidate) });
  } catch (error) {
    logServerError("api.skill_categories.database_failed", error, {
      route: "/api/skill-categories",
    });
    return NextResponse.json({ error: "db" }, { status: 500 });
  }
}
