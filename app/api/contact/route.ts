// app/api/contact/route.ts
import { NextResponse } from "next/server";
import { sharedCacheHeaders } from "@/lib/cache";
import { getContactLinks } from "@/lib/contact/data.server";

export const revalidate = 3600;

export async function GET() {
  try {
    return NextResponse.json(await getContactLinks(), { headers: sharedCacheHeaders(revalidate) });
  } catch (error) {
    console.error("[/api/contact] db error:", error);
    return NextResponse.json({ error: "db" }, { status: 500 });
  }
}
