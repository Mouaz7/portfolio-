/**
 * @jest-environment node
 */

import { GET } from "@/app/api/cv/route";
import { supabaseAdmin } from "@/lib/backend/supabaseAdminClient";

jest.mock("@/lib/backend/supabaseAdminClient", () => ({
  supabaseAdmin: {
    storage: {
      from: jest.fn(),
    },
  },
}));

const storageFrom = supabaseAdmin.storage.from as jest.Mock;
const list = jest.fn();
const download = jest.fn();
const UPDATED_AT = "2026-08-28T10:30:00.000Z";

function cvRequest(headers?: HeadersInit) {
  return new Request("https://portfolio.test/api/cv", { headers });
}

describe("/api/cv", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.CV_STORAGE_BUCKET = "private-cv";
    process.env.CV_STORAGE_OBJECT = "cv/Mouaz-Naji-CV-2026-08.pdf";
    list.mockResolvedValue({
      data: [{
        name: "Mouaz-Naji-CV-2026-08.pdf",
        updated_at: UPDATED_AT,
      }],
      error: null,
    });
    download.mockResolvedValue({
      data: new Blob(["%PDF-1.7\nprivate storage cv"], {
        type: "application/pdf",
      }),
      error: null,
    });
    storageFrom.mockReturnValue({ download, list });
  });

  it("downloads only the configured private versioned Storage object", async () => {
    const response = await GET(cvRequest());

    expect(response.status).toBe(200);
    expect(storageFrom).toHaveBeenCalledWith("private-cv");
    expect(list).toHaveBeenCalledWith("cv", {
      limit: 2,
      search: "Mouaz-Naji-CV-2026-08.pdf",
    });
    expect(download).toHaveBeenCalledWith("cv/Mouaz-Naji-CV-2026-08.pdf");
    expect(response.headers.get("Content-Type")).toBe("application/pdf");
    expect(response.headers.get("Content-Disposition")).toBe(
      'attachment; filename="Mouaz-Naji-CV.pdf"',
    );
    expect(response.headers.get("Cache-Control")).toBe(
      "public, max-age=300, s-maxage=3600, stale-while-revalidate=86400",
    );
    expect(response.headers.get("ETag")).toMatch(/^"[A-Za-z0-9_-]{43}"$/);
    expect(response.headers.get("Last-Modified")).toBe(
      new Date(UPDATED_AT).toUTCString(),
    );
  });

  it("returns 304 for matching ETag and Last-Modified validators", async () => {
    const initial = await GET(cvRequest());
    const etag = initial.headers.get("ETag")!;

    const byEtag = await GET(cvRequest({ "If-None-Match": etag }));
    expect(byEtag.status).toBe(304);
    expect(byEtag.headers.get("ETag")).toBe(etag);

    const byDate = await GET(cvRequest({
      "If-Modified-Since": new Date(UPDATED_AT).toUTCString(),
    }));
    expect(byDate.status).toBe(304);
  });

  it("gives If-None-Match precedence over If-Modified-Since", async () => {
    const response = await GET(cvRequest({
      "If-None-Match": '"different"',
      "If-Modified-Since": new Date(UPDATED_AT).toUTCString(),
    }));

    expect(response.status).toBe(200);
  });

  it("rejects a Storage object with a spoofed PDF body", async () => {
    download.mockResolvedValue({
      data: new Blob(["not a pdf"], { type: "application/pdf" }),
      error: null,
    });
    const consoleError = jest.spyOn(console, "error").mockImplementation(() => undefined);

    const response = await GET(cvRequest());

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({ error: "File is not a PDF" });
    consoleError.mockRestore();
  });

  it("returns 404 when the configured version is absent", async () => {
    list.mockResolvedValue({ data: [], error: null });

    const response = await GET(cvRequest());

    expect(response.status).toBe(404);
    expect(download).not.toHaveBeenCalled();
  });
});
