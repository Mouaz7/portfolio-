"use client";

import { useMemo, useState } from "react";

function fileKey(file: File): string {
  return `${file.name}__${file.size}__${file.lastModified}`;
}

export function useContactFiles(
  maxTotalMb: number,
  tooLargeMessage?: (selectedMb: string) => string,
) {
  const [files, setFiles] = useState<File[]>([]);
  const maxTotalBytes = useMemo(() => maxTotalMb * 1024 * 1024, [maxTotalMb]);
  const totalBytes = useMemo(() => files.reduce((total, file) => total + file.size, 0), [files]);

  function addFiles(fileList: FileList | null): string | null {
    if (!fileList) return null;
    const merged = [...files, ...Array.from(fileList)];
    const deduplicated = [...new Map(merged.map((file) => [fileKey(file), file])).values()];
    const bytes = deduplicated.reduce((total, file) => total + file.size, 0);
    if (bytes > maxTotalBytes) {
      const selectedMb = (bytes / (1024 * 1024)).toFixed(1);
      return tooLargeMessage?.(selectedMb)
        ?? `Attachments exceed ${maxTotalMb} MB (selected ${selectedMb} MB).`;
    }
    setFiles(deduplicated);
    return null;
  }

  return {
    files,
    totalBytes,
    totalOk: totalBytes <= maxTotalBytes,
    addFiles,
    removeFile: (key: string) => setFiles((current) => current.filter((file) => fileKey(file) !== key)),
    clearFiles: () => setFiles([]),
    fileKey,
  };
}
