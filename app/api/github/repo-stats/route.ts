import { NextResponse } from "next/server";
import { sharedCacheHeaders } from "@/lib/cache";
import {
  getPublicRepositories,
  normalizeRepositories,
  repositoryStatsFor,
  REPOSITORY_STATS_REVALIDATE_SECONDS,
} from "@/lib/projects/repository-stats.server";
import {
  readLimitedJson,
  RequestBodyError,
} from "@/lib/security/request-protection";

const MAX_REQUEST_BYTES = 8 * 1024;

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  let body: Record<string, unknown>;
  try {
    body = await readLimitedJson(request, MAX_REQUEST_BYTES);
  } catch (error) {
    if (error instanceof RequestBodyError) {
      return NextResponse.json(
        { error: "invalid body", code: error.code },
        { status: error.status },
      );
    }
    return NextResponse.json({ error: "invalid body" }, { status: 400 });
  }

  const repositories = normalizeRepositories(body.repositories);
  const headers = sharedCacheHeaders(REPOSITORY_STATS_REVALIDATE_SECONDS);
  if (repositories.length === 0) {
    return NextResponse.json({ stats: {} }, { headers });
  }

  const publicRepositories = await getPublicRepositories();
  return NextResponse.json(
    { stats: repositoryStatsFor(repositories, publicRepositories) },
    { headers },
  );
}
