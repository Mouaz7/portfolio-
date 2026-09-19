// app/api/contact/route.ts
import { NextResponse } from "next/server";
import { sharedCacheHeaders } from "@/lib/cache";
import { getContactLinks } from "@/lib/contact/data.server";
import { logServerError } from "@/lib/security/safe-logger.server";

export const revalidate = 3600;

export async function GET() {
  try {
    return NextResponse.json(await getContactLinks(), { headers: sharedCacheHeaders(revalidate) });
  } catch (error) {
    logServerError("api.contact.links_failed", error, {
      route: "/api/contact",
    });
    return NextResponse.json({ error: "db" }, { status: 500 });
  }
}
