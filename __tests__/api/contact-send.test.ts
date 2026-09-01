/**
 * @jest-environment node
 */

import { POST } from "@/app/api/contact/send/route";
import { supabaseAdmin } from "@/lib/backend/supabaseAdminClient";
import { CONTACT_MAX_TOTAL_BYTES } from "@/lib/contact/file-policy";
import { sendContactMail } from "@/lib/contact/mailer";

jest.mock("@/lib/backend/supabaseAdminClient", () => ({
  supabaseAdmin: {
    from: jest.fn(),
    rpc: jest.fn(),
    storage: { from: jest.fn() },
  },
}));
jest.mock("@/lib/contact/mailer", () => ({ sendContactMail: jest.fn() }));

const ID = "11111111-1111-1111-1111-111111111111";
const fromMock = supabaseAdmin.from as jest.Mock;
const rpcMock = supabaseAdmin.rpc as jest.Mock;
const storageFromMock = supabaseAdmin.storage.from as jest.Mock;
const mailMock = sendContactMail as jest.Mock;
const pendingMaybeSingle = jest.fn();
const uploadEq = jest.fn();
const statusUpdateResult = jest.fn();
const download = jest.fn();
const list = jest.fn();
const remove = jest.fn();

const pendingQuery: {
  eq: jest.Mock;
  gt: jest.Mock;
  maybeSingle: jest.Mock;
} = {
  eq: jest.fn(),
  gt: jest.fn(),
  maybeSingle: pendingMaybeSingle,
};
pendingQuery.eq.mockReturnValue(pendingQuery);
pendingQuery.gt.mockReturnValue(pendingQuery);

const statusQuery: { eq: jest.Mock } = { eq: jest.fn() };
statusQuery.eq.mockImplementation(() => {
  if (statusQuery.eq.mock.calls.length % 2 === 0) {
    return Promise.resolve({ error: null });
  }
  return statusQuery;
});

function sendRequest(body: unknown, headers?: HeadersInit) {
  return new Request("http://localhost/api/contact/send", {
    body: JSON.stringify(body),
    headers,
    method: "POST",
  });
}

function uploadRow(size: number, path = `${ID}/brief.pdf`) {
  return {
    declared_mime: "application/pdf",
    declared_size: size,
    object_path: path,
    original_name: "brief.pdf",
  };
}

describe("/api/contact/send", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    delete process.env.ENABLE_SECURITY_TESTS;
    process.env.RATE_LIMIT_PEPPER = "request-protection-pepper";
    process.env.SESSION_COOKIE_SECRET = "request-protection-session";
    pendingQuery.eq.mockReturnValue(pendingQuery);
    pendingQuery.gt.mockReturnValue(pendingQuery);
    pendingMaybeSingle.mockResolvedValue({
      data: {
        email: "hello@example.com",
        id: ID,
        message: "Hello",
        name: "Mouaz",
      },
      error: null,
    });
    const pdf = Buffer.from("%PDF-1.7");
    uploadEq.mockResolvedValue({ data: [uploadRow(pdf.length)], error: null });
    list.mockResolvedValue({
      data: [{ name: "brief.pdf", metadata: { size: pdf.length } }],
      error: null,
    });
    rpcMock.mockResolvedValue({
      data: [{
        email: "hello@example.com",
        id: ID,
        message: "Hello",
        name: "Mouaz",
      }],
      error: null,
    });
    statusQuery.eq.mockImplementation(() => {
      if (statusQuery.eq.mock.calls.length % 2 === 0) {
        return Promise.resolve({ error: null });
      }
      return statusQuery;
    });
    statusUpdateResult.mockReturnValue(statusQuery);
    download.mockResolvedValue({ data: new Blob([pdf]), error: null });
    remove.mockResolvedValue({ error: null });
    mailMock.mockResolvedValue(undefined);
    fromMock.mockImplementation((table: string) => {
      if (table === "contact_upload") {
        return { select: jest.fn(() => ({ eq: uploadEq })) };
      }
      if (table === "contact_submission") {
        return {
          select: jest.fn(() => pendingQuery),
          update: jest.fn(() => ({ eq: statusUpdateResult })),
        };
      }
      throw new Error(`unexpected table ${table}`);
    });
    storageFromMock.mockReturnValue({ download, list, remove });
  });

  it("validates pending state and Storage metadata before claim and SMTP", async () => {
    const response = await POST(sendRequest({ submissionId: ID }));

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ ok: true });
    expect(pendingMaybeSingle).toHaveBeenCalledTimes(1);
    expect(list).toHaveBeenCalledWith(ID, { limit: 6 });
    expect(pendingMaybeSingle.mock.invocationCallOrder[0])
      .toBeLessThan(list.mock.invocationCallOrder[0]);
    expect(list.mock.invocationCallOrder[0])
      .toBeLessThan(rpcMock.mock.invocationCallOrder[0]);
    expect(rpcMock).toHaveBeenCalledWith(
      "claim_contact_submission",
      expect.objectContaining({ p_submission_id: ID }),
    );
    expect(mailMock).toHaveBeenCalledWith(expect.objectContaining({
      attachments: [
        expect.objectContaining({
          name: "brief.pdf",
          type: "application/pdf",
        }),
      ],
      email: "hello@example.com",
    }));
    expect(remove).toHaveBeenCalledWith([`${ID}/brief.pdf`]);
  });

  it("leaves a valid pending submission untouched when concurrency is busy", async () => {
    process.env.ENABLE_SECURITY_TESTS = "1";
    rpcMock.mockResolvedValueOnce({ data: null, error: null });

    const response = await POST(sendRequest({ submissionId: ID }));

    expect(response.status).toBe(503);
    await expect(response.json()).resolves.toMatchObject({ code: "busy" });
    expect(rpcMock).toHaveBeenCalledTimes(1);
    expect(rpcMock).toHaveBeenCalledWith(
      "acquire_concurrency_lease",
      expect.any(Object),
    );
    expect(mailMock).not.toHaveBeenCalled();
    expect(remove).not.toHaveBeenCalled();
  });

  it("rejects invalid, expired and replayed submissions before Storage work", async () => {
    const invalid = await POST(sendRequest({ submissionId: "../bad" }));
    expect(invalid.status).toBe(400);

    pendingMaybeSingle.mockResolvedValue({ data: null, error: null });
    const replay = await POST(sendRequest({ submissionId: ID }));
    expect(replay.status).toBe(404);
    expect(list).not.toHaveBeenCalled();
    expect(mailMock).not.toHaveBeenCalled();
  });

  it.each([
    {
      label: "missing",
      objects: [],
    },
    {
      label: "extra",
      objects: [
        { name: "brief.pdf", metadata: { size: 8 } },
        { name: "extra.pdf", metadata: { size: 8 } },
      ],
    },
    {
      label: "replaced",
      objects: [{ name: "replacement.pdf", metadata: { size: 8 } }],
    },
  ])("rejects $label Storage objects before claim", async ({ objects }) => {
    list.mockResolvedValue({ data: objects, error: null });

    const response = await POST(sendRequest({ submissionId: ID }));

    expect(response.status).toBe(400);
    expect(rpcMock).not.toHaveBeenCalled();
    expect(download).not.toHaveBeenCalled();
  });

  it("rejects an actual aggregate size above 10 MB before claim", async () => {
    const oversized = CONTACT_MAX_TOTAL_BYTES + 1;
    uploadEq.mockResolvedValue({
      data: [uploadRow(oversized)],
      error: null,
    });
    list.mockResolvedValue({
      data: [{ name: "brief.pdf", metadata: { size: oversized } }],
      error: null,
    });

    const response = await POST(sendRequest({ submissionId: ID }));

    expect(response.status).toBe(400);
    expect(rpcMock).not.toHaveBeenCalled();
  });

  it("rejects spoofed bytes after claim and cleans the private object", async () => {
    download.mockResolvedValue({
      data: new Blob([Buffer.from("not-pdf")]),
      error: null,
    });

    const response = await POST(sendRequest({ submissionId: ID }));

    expect(response.status).toBe(400);
    expect(mailMock).not.toHaveBeenCalled();
    expect(remove).toHaveBeenCalledWith([`${ID}/brief.pdf`]);
  });

  it("marks a claimed submission failed and cleans Storage on SMTP failure", async () => {
    const consoleError = jest.spyOn(console, "error").mockImplementation(() => undefined);
    mailMock.mockRejectedValue(new Error("smtp unavailable"));

    const response = await POST(sendRequest({ submissionId: ID }));

    expect(response.status).toBe(500);
    expect(remove).toHaveBeenCalledWith([`${ID}/brief.pdf`]);
    expect(statusUpdateResult).toHaveBeenCalledWith("id", ID);
    consoleError.mockRestore();
  });

  it("rejects malformed request media before database work", async () => {
    const response = await POST(sendRequest(
      { submissionId: ID },
      { "content-type": "text/html" },
    ));

    expect(response.status).toBe(415);
    await expect(response.json()).resolves.toMatchObject({
      code: "unsupported_media_type",
    });
    expect(fromMock).not.toHaveBeenCalled();
  });
});
