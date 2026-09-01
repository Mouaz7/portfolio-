import crypto from "crypto";
import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/backend/supabaseAdminClient";
import { isValidEmail, clamp, NAME_MAX, MESSAGE_MAX } from "@/lib/contact/validate";
import {
  CONTACT_MAX_FILES,
  CONTACT_MAX_TOTAL_BYTES,
  sanitizeAttachmentName,
  validContactFileMetadata,
  type ContactFileMetadata,
} from "@/lib/contact/file-policy";
import {
  PROTECTION_POLICIES,
  protectApiRequest,
  readLimitedJson,
  releaseProtection,
  RequestBodyError,
  secureResponse,
  type ProtectionContext,
} from "@/lib/security/request-protection";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function POST(req: Request) {
  let securityContext: ProtectionContext | null = null;
  try {
    const protection = await protectApiRequest(req, PROTECTION_POLICIES.contact);
    if (!protection.ok) return protection.response;
    securityContext = protection.context;
    const respond = (response: NextResponse) => secureResponse(response, protection.context);
    const body = await readLimitedJson(req, 16 * 1024);

    const name = clamp(typeof body.name === "string" ? body.name.trim() : "", NAME_MAX);
    const email = typeof body.email === "string" ? body.email.trim() : "";
    const message = clamp(typeof body.message === "string" ? body.message.trim() : "", MESSAGE_MAX);
    const files = Array.isArray(body.files) ? body.files : [];
    if (!name || !email || !message || !isValidEmail(email)) {
      return respond(NextResponse.json({ ok: false, error: "Invalid contact details." }, { status: 400 }));
    }
    if (files.length > CONTACT_MAX_FILES || !files.every(validContactFileMetadata)) {
      return respond(NextResponse.json({ ok: false, error: "Invalid attachment metadata." }, { status: 400 }));
    }

    const metadata = files as ContactFileMetadata[];
    const totalBytes = metadata.reduce((total, file) => total + file.size, 0);
    if (totalBytes > CONTACT_MAX_TOTAL_BYTES) {
      return respond(NextResponse.json({ ok: false, error: "Attachments exceed 10 MB." }, { status: 400 }));
    }

    const submissionId = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString();
    const { error: submissionError } = await supabaseAdmin.from("contact_submission").insert({
      email,
      expires_at: expiresAt,
      id: submissionId,
      ip_hash: protection.context.ipHash,
      message,
      name,
      session_hash: protection.context.sessionHash,
    });
    if (submissionError) throw submissionError;

    try {
      const uploadRows = metadata.map((file) => {
        const id = crypto.randomUUID();
        return {
          declared_mime: file.type.toLowerCase(),
          declared_size: file.size,
          id,
          object_path: `${submissionId}/${id}-${sanitizeAttachmentName(file.name)}`,
          original_name: file.name,
          submission_id: submissionId,
        };
      });

      if (uploadRows.length > 0) {
        const { error: uploadsError } = await supabaseAdmin.from("contact_upload").insert(uploadRows);
        if (uploadsError) throw uploadsError;
      }

      const uploads = await Promise.all(uploadRows.map(async (row) => {
        const { data, error } = await supabaseAdmin.storage
          .from("contact-uploads")
          .createSignedUploadUrl(row.object_path);
        if (error || !data?.token) throw error ?? new Error("Signed upload token missing");
        return { path: row.object_path, token: data.token };
      }));

      return respond(NextResponse.json({ ok: true, submissionId, uploads }));
    } catch (error) {
      await supabaseAdmin.from("contact_submission").delete().eq("id", submissionId);
      throw error;
    }
  } catch (error) {
    if (error instanceof RequestBodyError) {
      const response = NextResponse.json(
        { ok: false, error: "Invalid request body.", code: error.code },
        { status: error.status },
      );
      return securityContext ? secureResponse(response, securityContext) : response;
    }
    console.error("contact/prepare error:", error);
    const response = NextResponse.json({ ok: false, error: "Server error." }, { status: 500 });
    return securityContext ? secureResponse(response, securityContext) : response;
  } finally {
    await releaseProtection(securityContext);
  }
}
