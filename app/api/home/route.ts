import { NextResponse } from "next/server";
import {
  getHomeContent,
  HOME_CONTENT_REVALIDATE_SECONDS,
} from "@/lib/home/content.server";
import { sharedCacheHeaders } from "@/lib/cache";
import { defaultLocale, isLocale } from "@/lib/i18n/config";

export const revalidate = 1800;

export async function GET(request: Request) {
  const requestedLocale = new URL(request.url).searchParams.get("locale");
  const locale = isLocale(requestedLocale) ? requestedLocale : defaultLocale;
  return NextResponse.json(await getHomeContent(locale), {
    headers: sharedCacheHeaders(HOME_CONTENT_REVALIDATE_SECONDS),
  });
}
