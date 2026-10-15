export const CONTACT_MAX_FILES = 5;
export const CONTACT_MAX_TOTAL_BYTES = 10 * 1024 * 1024;

export const CONTACT_FILE_TYPES = {
  ".jpeg": "image/jpeg",
  ".jpg": "image/jpeg",
  ".pdf": "application/pdf",
  ".png": "image/png",
  ".txt": "text/plain",
  ".webp": "image/webp",
} as const;

export type ContactFileExtension = keyof typeof CONTACT_FILE_TYPES;

export type ContactFileMetadata = {
  name: string;
  size: number;
  type: string;
};

export function contactFileExtension(name: string): ContactFileExtension | null {
  const match = name.toLowerCase().match(/\.[a-z0-9]+$/);
  const extension = match?.[0] as ContactFileExtension | undefined;
  return extension && extension in CONTACT_FILE_TYPES ? extension : null;
}

export function validContactFileMetadata(value: unknown): value is ContactFileMetadata {
  if (!value || typeof value !== "object") return false;
  const file = value as Partial<ContactFileMetadata>;
  if (typeof file.name !== "string" || file.name.length < 1 || file.name.length > 180) return false;
  if (typeof file.size !== "number" || !Number.isSafeInteger(file.size) || file.size < 1) return false;
  if (typeof file.type !== "string") return false;
  const extension = contactFileExtension(file.name);
  return extension !== null && file.type.toLowerCase() === CONTACT_FILE_TYPES[extension];
}

export function sanitizeAttachmentName(name: string): string {
  const leaf = name.split(/[\\/]/).pop() ?? "attachment";
  const sanitized = leaf.replace(/[^\p{L}\p{N}._ ()-]/gu, "_").replace(/^\.+/, "");
  return (sanitized || "attachment").slice(0, 180);
}
