/**
 * @jest-environment node
 */

import { POST } from "@/app/api/contact/prepare/route";
import { supabaseAdmin } from "@/lib/backend/supabaseAdminClient";
import { CONTACT_MAX_TOTAL_BYTES } from "@/lib/contact/file-policy";

jest.mock("@/lib/backend/supabaseAdminClient", () => ({
  supabaseAdmin: {
    from: jest.fn(),
    storage: { from: jest.fn() },
  },
}));

const fromMock = supabaseAdmin.from as jest.Mock;
const storageFromMock = supabaseAdmin.storage.from as jest.Mock;
const submissionInsert = jest.fn();
const uploadInsert = jest.fn();
const deleteEq = jest.fn();
const createSignedUploadUrl = jest.fn();

function contactRequest(body: unknown, headers?: HeadersInit) {
  return new Request("http://localhost/api/contact/prepare", {
    body: JSON.stringify(body),
    headers,
    method: "POST",
  });
}

describe("/api/contact/prepare", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    delete process.env.ENABLE_SECURITY_TESTS;
    submissionInsert.mockResolvedValue({ error: null });
    uploadInsert.mockResolvedValue({ error: null });
    deleteEq.mockResolvedValue({ error: null });
    createSignedUploadUrl.mockResolvedValue({ data: { token: "upload-token" }, error: null });
    fromMock.mockImplementation((table: string) => {
      if (table === "contact_upload") return { insert: uploadInsert };
      if (table === "contact_submission") {
        return {
          delete: jest.fn(() => ({ eq: deleteEq })),
          insert: submissionInsert,
        };
      }
      throw new Error(`unexpected table ${table}`);
    });
    storageFromMock.mockReturnValue({ createSignedUploadUrl });
  });

  it("creates a private submission and signed upload destinations", async () => {
    const response = await POST(contactRequest({
      email: "hello@example.com",
      files: [{ name: "../brief.pdf", size: 128, type: "application/pdf" }],
      message: "A secure project enquiry",
      name: "Mouaz",
    }));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toMatchObject({ ok: true, uploads: [{ token: "upload-token" }] });
    expect(body.submissionId).toMatch(/^[a-f0-9-]{36}$/i);
    expect(submissionInsert).toHaveBeenCalledWith(expect.objectContaining({
      email: "hello@example.com",
      id: body.submissionId,
      message: "A secure project enquiry",
      name: "Mouaz",
    }));
    expect(uploadInsert).toHaveBeenCalledWith([
      expect.objectContaining({
        declared_mime: "application/pdf",
        declared_size: 128,
        object_path: expect.stringMatching(new RegExp(`^${body.submissionId}/[a-f0-9-]{36}-brief\\.pdf$`, "i")),
        original_name: "../brief.pdf",
      }),
    ]);
    expect(storageFromMock).toHaveBeenCalledWith("contact-uploads");
  });

  it("rejects invalid contact details and attachment metadata", async () => {
    const invalidContact = await POST(contactRequest({ name: "", email: "bad", message: "", files: [] }));
    expect(invalidContact.status).toBe(400);

    const invalidFile = await POST(contactRequest({
      name: "A", email: "a@example.com", message: "Hello", files: [{ name: "bad.exe", size: 1, type: "application/octet-stream" }],
    }));
    expect(invalidFile.status).toBe(400);
    expect(submissionInsert).not.toHaveBeenCalled();
  });

  it("rejects attachment totals over 10 MB", async () => {
    const response = await POST(contactRequest({
      name: "A", email: "a@example.com", message: "Hello", files: [{ name: "large.pdf", size: CONTACT_MAX_TOTAL_BYTES + 1, type: "application/pdf" }],
    }));
    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toMatchObject({ error: "Attachments exceed 10 MB." });
  });

  it("removes the submission if signed URL creation fails", async () => {
    const consoleError = jest.spyOn(console, "error").mockImplementation(() => undefined);
    createSignedUploadUrl.mockResolvedValue({ data: null, error: new Error("storage offline") });
    const response = await POST(contactRequest({
      name: "A", email: "a@example.com", message: "Hello", files: [{ name: "brief.pdf", size: 5, type: "application/pdf" }],
    }));
    expect(response.status).toBe(500);
    expect(deleteEq).toHaveBeenCalledWith("id", expect.stringMatching(/^[a-f0-9-]{36}$/i));
    consoleError.mockRestore();
  });

  it("rejects a non-JSON request before database work", async () => {
    const response = await POST(contactRequest({ ok: true }, { "content-type": "text/html" }));
    expect(response.status).toBe(415);
    await expect(response.json()).resolves.toMatchObject({ code: "unsupported_media_type" });
    expect(fromMock).not.toHaveBeenCalled();
  });
});
