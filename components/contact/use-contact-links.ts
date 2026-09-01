"use client";

import { useEffect, useState } from "react";
import type { ContactSocialLink } from "@/lib/contact/social-links";

export function useContactLinks(
  enabled = true,
  initialLinks?: ContactSocialLink[],
): ContactSocialLink[] {
  const [links, setLinks] = useState<ContactSocialLink[]>(initialLinks ?? []);

  useEffect(() => {
    if (!enabled) {
      setLinks([]);
      return;
    }

    if (initialLinks) {
      setLinks(initialLinks);
      return;
    }

    const controller = new AbortController();
    void fetch("/api/contact", { cache: "no-store", signal: controller.signal })
      .then(async (response) => (response.ok ? response.json() : []))
      .then((data: unknown) => {
        if (Array.isArray(data)) setLinks(data as ContactSocialLink[]);
      })
      .catch(() => undefined);

    return () => controller.abort();
  }, [enabled, initialLinks]);

  return links;
}
