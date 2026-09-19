import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/backend/supabaseAdminClient";
import { validateContactFileBytes } from "@/lib/contact/file-signature.server";
import {
  CONTACT_MAX_FILES,
  CONTACT_MAX_TOTAL_BYTES,
  sanitizeAttachmentName,
} from "@/lib/contact/file-policy";
import { sendContactMail } from "@/lib/contact/mailer";
import {
  scanAttachment,
  type MalwareScanStatus,
} from "@/lib/contact/malware-scanner.server";
import {
  acquireConcurrency,
  identifyApiRequest,
  readLimitedJson,
  releaseProtection,
  RequestBodyError,
  secureResponse,
} from "@/lib/security/request-protection";
import { logServerError } from "@/lib/security/safe-logger.server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

type Submission = {
  email: string;
  id: string;
  message: string;
  name: string;
};

type UploadRow = {
  declared_mime: string;
  declared_size: number;
  id: string;
  object_path: string;
  original_name: string;
};

type StorageObject = {
  metadata?: { size?: number } | null;
  name: string;
};

class ContactSubmissionError extends Error {
  constructor(
    readonly status: number,
    readonly publicMessage: string,
    readonly code?: string,
    readonly attachmentStatus?: MalwareScanStatus,
  ) {
    super(publicMessage);
  }
}

function storageObjectSize(object: StorageObject): number | null {
  const size = Number(object.metadata?.size);
  return Number.isSafeInteger(size) && size >= 0 ? size : null;
}

function validateStorageManifest(
  submissionId: string,
  uploads: UploadRow[],
  objects: StorageObject[],
): void {
  if (uploads.length > CONTACT_MAX_FILES || objects.length !== uploads.length) {
    throw new ContactSubmissionError(400, "Invalid attachments.");
  }

  const expected = new Map(
    uploads.map((upload) => {
      const prefix = `${submissionId}/`;
      if (!upload.object_path.startsWith(prefix)) {
        throw new ContactSubmissionError(400, "Invalid attachments.");
      }
      return [upload.object_path.slice(prefix.length), upload];
    }),
  );

  let actualTotal = 0;
  for (const object of objects) {
    const size = storageObjectSize(object);
    const upload = expected.get(object.name);
    if (!upload || size === null || size !== Number(upload.declared_size)) {
      throw new ContactSubmissionError(400, "Invalid attachments.");
    }
    actualTotal += size;
    expected.delete(object.name);
  }

  if (expected.size > 0 || actualTotal > CONTACT_MAX_TOTAL_BYTES) {
    throw new ContactSubmissionError(400, "Invalid attachments.");
  }
}

async function pendingSubmission(
  submissionId: string,
  sessionHash: string,
): Promise<Submission> {
  const { data, error } = await supabaseAdmin
    .from("contact_submission")
    .select("id,name,email,message")
    .eq("id", submissionId)
    .eq("session_hash", sessionHash)
    .eq("status", "pending")
    .gt("expires_at", new Date().toISOString())
    .maybeSingle();
  if (error) throw error;
  const submission = data as Submission | null;
  if (!submission) {
    throw new ContactSubmissionError(404, "Submission not found.");
  }
  return submission;
}

async function submissionUploads(submissionId: string): Promise<UploadRow[]> {
  const { data, error } = await supabaseAdmin
    .from("contact_upload")
    .select("id,object_path,original_name,declared_mime,declared_size")
    .eq("submission_id", submissionId);
  if (error) throw error;
  return (data ?? []) as UploadRow[];
}

async function recordScanStatus(
  uploadId: string,
  status: MalwareScanStatus,
): Promise<void> {
  const { error } = await supabaseAdmin
    .from("contact_upload")
    .update({
      scan_status: status,
      scanned_at: status === "pending_scan" ? null : new Date().toISOString(),
    })
    .eq("id", uploadId);
  if (error) throw error;
}

async function markClaimFailed(submissionId: string): Promise<void> {
  const { error } = await supabaseAdmin
    .from("contact_submission")
    .update({ status: "failed" })
    .eq("id", submissionId)
    .eq("status", "sending");
  if (error) {
    logServerError("api.contact.send.status_update_failed", error, {
      route: "/api/contact/send",
    });
  }
}

export async function POST(req: Request) {
  const securityContext = identifyApiRequest(req);
  let cleanupPaths: string[] = [];
  let submissionId = "";
  let claimed = false;

  try {
    const body = await readLimitedJson(req, 4 * 1024);
    submissionId = typeof body.submissionId === "string"
      ? body.submissionId
      : "";
    if (!/^[a-f0-9-]{36}$/i.test(submissionId)) {
      throw new ContactSubmissionError(400, "Invalid submission.");
    }

    await pendingSubmission(submissionId, securityContext.sessionHash);
    const uploads = await submissionUploads(submissionId);
    const storage = supabaseAdmin.storage.from("contact-uploads");
    const { data: objectData, error: listError } = await storage.list(
      submissionId,
      { limit: CONTACT_MAX_FILES + 1 },
    );
    if (listError) throw listError;
    validateStorageManifest(
      submissionId,
      uploads,
      (objectData ?? []) as StorageObject[],
    );

    if (!(await acquireConcurrency(securityContext, "contact_send", 2))) {
      return secureResponse(
        NextResponse.json(
          { ok: false, error: "Service is busy.", code: "busy" },
          { status: 503 },
        ),
        securityContext,
      );
    }

    const { data: claimData, error: claimError } = await supabaseAdmin.rpc(
      "claim_contact_submission",
      {
        p_session_hash: securityContext.sessionHash,
        p_submission_id: submissionId,
      },
    );
    if (claimError) throw claimError;
    const submission = Array.isArray(claimData)
      ? claimData[0] as Submission | undefined
      : undefined;
    if (!submission) {
      throw new ContactSubmissionError(404, "Submission not found.");
    }
    claimed = true;
    cleanupPaths = uploads.map((upload) => upload.object_path);

    const attachments: Array<{ data: Buffer; name: string; type: string }> = [];
    let downloadedTotal = 0;
    for (const upload of uploads) {
      const { data, error } = await storage.download(upload.object_path);
      if (error || !data) throw error ?? new Error("Attachment missing");
      const buffer = Buffer.from(await data.arrayBuffer());
      downloadedTotal += buffer.length;
      if (downloadedTotal > CONTACT_MAX_TOTAL_BYTES) {
        throw new ContactSubmissionError(400, "Invalid attachments.");
      }
      const metadata = {
        name: upload.original_name,
        size: Number(upload.declared_size),
        type: upload.declared_mime,
      };
      if (!validateContactFileBytes(metadata, buffer)) {
        throw new ContactSubmissionError(400, "Invalid attachments.");
      }

      const scan = await scanAttachment({
        data: buffer,
        mediaType: upload.declared_mime,
        name: sanitizeAttachmentName(upload.original_name),
      });
      await recordScanStatus(upload.id, scan.status);
      if (scan.status === "infected") {
        throw new ContactSubmissionError(
          422,
          "An attachment could not be accepted.",
          "attachment_infected",
          "infected",
        );
      }
      if (scan.status !== "clean") {
        throw new ContactSubmissionError(
          503,
          "Attachment scanning is temporarily unavailable.",
          "attachment_scan_failed",
          "scan_failed",
        );
      }
      attachments.push({
        data: buffer,
        name: sanitizeAttachmentName(upload.original_name),
        type: upload.declared_mime,
      });
    }

    await sendContactMail({
      attachments,
      email: submission.email,
      message: submission.message,
      name: submission.name,
    });
    const { error: updateError } = await supabaseAdmin
      .from("contact_submission")
      .update({
        sent_at: new Date().toISOString(),
        status: "sent",
      })
      .eq("id", submissionId)
      .eq("status", "sending");
    if (updateError) throw updateError;

    return secureResponse(NextResponse.json({ ok: true }), securityContext);
  } catch (error) {
    if (error instanceof RequestBodyError) {
      return secureResponse(
        NextResponse.json(
          {
            ok: false,
            error: "Invalid request body.",
            code: error.code,
          },
          { status: error.status },
        ),
        securityContext,
      );
    }
    if (error instanceof ContactSubmissionError) {
      if (claimed && submissionId) await markClaimFailed(submissionId);
      return secureResponse(
        NextResponse.json(
          {
            ok: false,
            error: error.publicMessage,
            ...(error.code ? { code: error.code } : {}),
            ...(error.attachmentStatus
              ? { attachmentStatus: error.attachmentStatus }
              : {}),
          },
          { status: error.status },
        ),
        securityContext,
      );
    }

    logServerError("api.contact.send.failed", error, {
      route: "/api/contact/send",
    });
    if (claimed && submissionId) await markClaimFailed(submissionId);
    return secureResponse(
      NextResponse.json(
        { ok: false, error: "Server error." },
        { status: 500 },
      ),
      securityContext,
    );
  } finally {
    if (claimed && cleanupPaths.length > 0) {
      const { error } = await supabaseAdmin.storage
        .from("contact-uploads")
        .remove(cleanupPaths);
      if (error) {
        logServerError("api.contact.send.cleanup_failed", error, {
          route: "/api/contact/send",
        });
      }
    }
    await releaseProtection(securityContext);
  }
}
