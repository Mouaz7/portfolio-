import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0; // Don't cache, always fetch latest

const BUCKET = "cv-icons";
const FILE_PATH = "CV.pdf";

// Use the service-role key server-side so the download works regardless of the
// bucket's public/RLS state. Falls back to the anon key if not configured.
const supabaseAdmin = createClient(
  process.env.SUPABASE_URL ?? "https://placeholder.supabase.co",
  process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.SUPABASE_ANON_KEY ?? "placeholder",
  { auth: { persistSession: false } }
);

/**
 * GET /api/cv — streams the CV PDF from Supabase Storage (bucket `cv-icons`,
 * path `cv/CV.pdf`). Update the CV by replacing that file in Storage; no code
 * change needed. On failure we redirect to /contact instead of returning a JSON
 * body (which the browser would otherwise save as a broken "cv.json").
 */
export async function GET(req: Request) {
  try {
    const { data, error } = await supabaseAdmin.storage.from(BUCKET).download(FILE_PATH);

    if (error || !data) {
      console.error("[/api/cv] CV not available in storage:", error?.message ?? "no data", `(${BUCKET}/${FILE_PATH})`);
      // Don't hand the browser a JSON error to "download" — send them somewhere useful.
      return NextResponse.redirect(new URL("/contact", req.url), 302);
    }

    const buffer = Buffer.from(await data.arrayBuffer());

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": 'attachment; filename="Mouaz-Naji-CV.pdf"',
        "Content-Length": buffer.length.toString(),
        "Cache-Control": "no-cache, no-store, must-revalidate",
      },
    });
  } catch (err) {
    console.error("[/api/cv] Unexpected error:", err);
    return NextResponse.redirect(new URL("/contact", req.url), 302);
  }
}
