import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/backend/supabaseAdminClient";
import { hasValidBearerSecret } from "@/lib/security/request-protection";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(req: Request) {
  if (!hasValidBearerSecret(req, [process.env.CRON_SECRET])) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const cutoff = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString();
  const { data: submissions, error } = await supabaseAdmin
    .from("contact_submission")
    .select("id,contact_upload(object_path)")
    .lt("expires_at", new Date().toISOString())
    .lt("created_at", cutoff)
    .neq("status", "sending")
    .limit(100);
  if (error) {
    console.error("contact cleanup query error:", error);
    return NextResponse.json({ error: "Cleanup failed" }, { status: 500 });
  }

  const rows = submissions ?? [];
  const paths = rows.flatMap((submission) => {
    const uploads = Array.isArray(submission.contact_upload) ? submission.contact_upload : [];
    return uploads.flatMap((upload) =>
      upload && typeof upload.object_path === "string" ? [upload.object_path] : [],
    );
  });
  if (paths.length > 0) {
    const { error: storageError } = await supabaseAdmin.storage.from("contact-uploads").remove(paths);
    if (storageError) {
      console.error("contact cleanup storage error:", storageError);
      return NextResponse.json({ error: "Cleanup failed" }, { status: 500 });
    }
  }

  const ids = rows.map((submission) => submission.id);
  if (ids.length > 0) {
    const { error: deleteError } = await supabaseAdmin.from("contact_submission").delete().in("id", ids);
    if (deleteError) {
      console.error("contact cleanup delete error:", deleteError);
      return NextResponse.json({ error: "Cleanup failed" }, { status: 500 });
    }
  }

  return NextResponse.json({ ok: true, removed: ids.length });
}
