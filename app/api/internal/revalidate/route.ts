import { revalidateTag } from "next/cache";
import { NextResponse } from "next/server";
import {
  hasValidBearerSecret,
  readLimitedJson,
  RequestBodyError,
} from "@/lib/security/request-protection";

const ALLOWED_TAGS = new Set(["projects", "skills", "journey", "contact", "home-content"]);

export async function POST(request: Request) {
  if (!hasValidBearerSecret(request, [process.env.REVALIDATE_SECRET])) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  let body: Record<string, unknown>;
  try {
    body = await readLimitedJson(request, 4 * 1024);
  } catch (error) {
    if (error instanceof RequestBodyError) {
      return NextResponse.json(
        { error: "invalid body", code: error.code },
        { status: error.status },
      );
    }
    return NextResponse.json({ error: "invalid body" }, { status: 400 });
  }

  const requestedTags: unknown[] = Array.isArray(body.tags) ? body.tags : [];
  const tags = requestedTags.filter(
    (tag: unknown): tag is string => typeof tag === "string" && ALLOWED_TAGS.has(tag),
  );

  if (tags.length === 0) {
    return NextResponse.json({ error: "invalid tags" }, { status: 400 });
  }

  tags.forEach((tag) => revalidateTag(tag));
  return NextResponse.json({ revalidated: tags });
}
