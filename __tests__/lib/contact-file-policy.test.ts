/**
 * @jest-environment node
 */

import {
  CONTACT_FILE_TYPES,
  contactFileExtension,
  sanitizeAttachmentName,
  validContactFileMetadata,
} from "@/lib/contact/file-policy";
import { validateContactFileBytes } from "@/lib/contact/file-signature.server";

const metadata = (name: string, type: string, bytes: Buffer) => ({
  name,
  size: bytes.length,
  type,
});

describe("contact attachment policy", () => {
  it("accepts only exact allowlisted extension and MIME pairs", () => {
    expect(contactFileExtension("REPORT.PDF")).toBe(".pdf");
    expect(contactFileExtension("archive.exe")).toBeNull();
    expect(contactFileExtension("no-extension")).toBeNull();
    expect(validContactFileMetadata({ name: "report.pdf", size: 10, type: CONTACT_FILE_TYPES[".pdf"] })).toBe(true);
    expect(validContactFileMetadata(null)).toBe(false);
    expect(validContactFileMetadata({ name: "", size: 10, type: "application/pdf" })).toBe(false);
    expect(validContactFileMetadata({ name: "a.pdf", size: 0, type: "application/pdf" })).toBe(false);
    expect(validContactFileMetadata({ name: "a.pdf", size: 10.5, type: "application/pdf" })).toBe(false);
    expect(validContactFileMetadata({ name: "a.pdf", size: 10, type: "text/plain" })).toBe(false);
    expect(validContactFileMetadata({ name: "a.doc", size: 10, type: "application/msword" })).toBe(false);
    expect(validContactFileMetadata({ name: "a.docx", size: 10, type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document" })).toBe(false);
  });

  it("removes traversal and unsafe filename characters", () => {
    expect(sanitizeAttachmentName("../../résumé<script>.pdf")).toBe("résumé_script_.pdf");
    expect(sanitizeAttachmentName("..." )).toBe("attachment");
    expect(sanitizeAttachmentName("a".repeat(220))).toHaveLength(180);
  });

  it.each([
    ["file.pdf", "application/pdf", Buffer.from("%PDF-1.7")],
    ["file.png", "image/png", Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])],
    ["file.jpg", "image/jpeg", Buffer.from([0xff, 0xd8, 0xff, 0x00])],
    ["file.jpeg", "image/jpeg", Buffer.from([0xff, 0xd8, 0xff, 0x00])],
    ["file.webp", "image/webp", Buffer.from("RIFFxxxxWEBP")],
    ["file.txt", "text/plain", Buffer.from("safe utf-8 text åäö")],
  ])("validates the real signature for %s", (name, type, bytes) => {
    expect(validateContactFileBytes(metadata(name, type, bytes), bytes)).toBe(true);
  });

  it("rejects spoofed, truncated, binary text, mismatched-size and invalid UTF-8 files", () => {
    const fakePdf = Buffer.from("not a PDF");
    expect(validateContactFileBytes(metadata("file.pdf", "application/pdf", fakePdf), fakePdf)).toBe(false);
    expect(validateContactFileBytes({ name: "file.pdf", size: fakePdf.length + 1, type: "application/pdf" }, fakePdf)).toBe(false);
    expect(validateContactFileBytes(metadata("file.exe", "application/octet-stream", fakePdf), fakePdf)).toBe(false);
    expect(validateContactFileBytes(metadata("file.docx", "application/vnd.openxmlformats-officedocument.wordprocessingml.document", Buffer.from("PK\u0003\u0004")), Buffer.from("PK\u0003\u0004"))).toBe(false);
    expect(validateContactFileBytes(metadata("file.txt", "text/plain", Buffer.from([0x61, 0, 0x62])), Buffer.from([0x61, 0, 0x62]))).toBe(false);
    expect(validateContactFileBytes(metadata("file.txt", "text/plain", Buffer.from([0xc3, 0x28])), Buffer.from([0xc3, 0x28]))).toBe(false);
  });
});
