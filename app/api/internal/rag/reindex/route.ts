import { NextResponse } from "next/server";
import { refreshRagIndex } from "@/lib/ai/rag";
import { hasValidBearerSecret } from "@/lib/security/request-protection";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;
export const maxDuration = 300;

async function run(req: Request) {
  if (!hasValidBearerSecret(req, [process.env.RAG_JOB_SECRET, process.env.CRON_SECRET])) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const result = await refreshRagIndex();
    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    console.error("RAG reindex failed:", error);
    return NextResponse.json({ ok: false, error: "Reindex failed" }, { status: 500 });
  }
}

export const GET = run;
export const POST = run;
