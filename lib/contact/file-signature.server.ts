import "server-only";
import {
  CONTACT_FILE_TYPES,
  contactFileExtension,
  type ContactFileMetadata,
} from "./file-policy";

function startsWith(buffer: Buffer, signature: readonly number[]): boolean {
  return signature.every((byte, index) => buffer[index] === byte);
}

export function validateContactFileBytes(
  metadata: ContactFileMetadata,
  buffer: Buffer,
): boolean {
  if (buffer.length !== metadata.size) return false;
  const extension = contactFileExtension(metadata.name);
  if (!extension || CONTACT_FILE_TYPES[extension] !== metadata.type.toLowerCase()) return false;

  switch (extension) {
    case ".pdf":
      return buffer.subarray(0, 5).toString("ascii") === "%PDF-";
    case ".png":
      return startsWith(buffer, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
    case ".jpg":
    case ".jpeg":
      return startsWith(buffer, [0xff, 0xd8, 0xff]);
    case ".webp":
      return buffer.subarray(0, 4).toString("ascii") === "RIFF"
        && buffer.subarray(8, 12).toString("ascii") === "WEBP";
    case ".txt":
      try {
        if (buffer.includes(0)) return false;
        new TextDecoder("utf-8", { fatal: true }).decode(buffer);
        return true;
      } catch {
        return false;
      }
  }
}
