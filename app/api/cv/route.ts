import crypto from "node:crypto";
import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/backend/supabaseAdminClient";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

const CACHE_CONTROL = "public, max-age=300, s-maxage=3600, stale-while-revalidate=86400";
const DOWNLOAD_FILENAME = "Mouaz-Naji-CV.pdf";

function storageLocation() {
  return {
    bucket: process.env.CV_STORAGE_BUCKET?.trim() || "private-cv",
    objectPath:
      process.env.CV_STORAGE_OBJECT?.trim()
      || "cv/Mouaz-Naji-CV-2026-08.pdf",
  };
}

function hasPdfSignature(buffer: Buffer): boolean {
  return buffer.length >= 5
    && buffer.subarray(0, 5).toString("ascii") === "%PDF-";
}

function strongEtag(buffer: Buffer): string {
  return `"${crypto.createHash("sha256").update(buffer).digest("base64url")}"`;
}

function matchesEtag(header: string | null, etag: string): boolean {
  return header?.split(",").some((candidate) => {
    const normalized = candidate.trim();
    return normalized === "*" || normalized === etag;
  }) ?? false;
}

function notModifiedSince(header: string | null, lastModified: Date): boolean {
  if (!header) return false;
  const timestamp = Date.parse(header);
  return Number.isFinite(timestamp) && lastModified.getTime() <= timestamp;
}

function responseHeaders(etag: string, lastModified: Date) {
  return {
    "Cache-Control": CACHE_CONTROL,
    "Content-Disposition": `attachment; filename="${DOWNLOAD_FILENAME}"`,
    "Content-Type": "application/pdf",
    ETag: etag,
    "Last-Modified": lastModified.toUTCString(),
  };
}

export async function GET(request: Request) {
  try {
    const { bucket, objectPath } = storageLocation();
    const separator = objectPath.lastIndexOf("/");
    const directory = separator >= 0 ? objectPath.slice(0, separator) : "";
    const filename = separator >= 0
      ? objectPath.slice(separator + 1)
      : objectPath;
    const storage = supabaseAdmin.storage.from(bucket);
    const { data: objects, error: listError } = await storage.list(directory, {
      limit: 2,
      search: filename,
    });
    if (listError) throw listError;
    const metadata = objects?.find((object) => object.name === filename);
    if (!metadata?.updated_at) {
      return NextResponse.json({ error: "CV file not found" }, { status: 404 });
    }

    const { data, error } = await storage.download(objectPath);
    if (error) throw error;
    if (!data) {
      return NextResponse.json({ error: "CV file not found" }, { status: 404 });
    }

    const buffer = Buffer.from(await data.arrayBuffer());
    if (!hasPdfSignature(buffer)) {
      console.error("[/api/cv] invalid PDF signature");
      return NextResponse.json({ error: "File is not a PDF" }, { status: 400 });
    }

    const lastModified = new Date(metadata.updated_at);
    if (!Number.isFinite(lastModified.getTime())) {
      throw new Error("CV storage metadata has an invalid updated_at value");
    }
    const etag = strongEtag(buffer);
    const headers = responseHeaders(etag, lastModified);
    const ifNoneMatch = request.headers.get("if-none-match");
    const isNotModified = matchesEtag(ifNoneMatch, etag)
      || (!ifNoneMatch
        && notModifiedSince(
          request.headers.get("if-modified-since"),
          lastModified,
        ));
    if (isNotModified) {
      return new NextResponse(null, { status: 304, headers });
    }

    const body = buffer.buffer.slice(
      buffer.byteOffset,
      buffer.byteOffset + buffer.byteLength,
    ) as ArrayBuffer;
    return new NextResponse(body, {
      status: 200,
      headers: {
        ...headers,
        "Content-Length": buffer.length.toString(),
      },
    });
  } catch (error) {
    console.error("[/api/cv] storage error", error);
    return NextResponse.json(
      { error: "Failed to fetch CV from storage" },
      { status: 500 },
    );
  }
}
