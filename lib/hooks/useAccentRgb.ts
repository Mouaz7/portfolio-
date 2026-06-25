"use client";

import { useEffect, useState } from "react";

// Reads the live --accent hex from the DB-driven theme (set in the root layout)
// for canvas/SVG animations. Re-reads when the theme flips (html.light class
// toggles), so dark/light stay in sync.
export function useAccentHex(fallback = "#19e3c2"): string {
  const [hex, setHex] = useState(fallback);

  useEffect(() => {
    const read = () => {
      const v = getComputedStyle(document.documentElement)
        .getPropertyValue("--accent")
        .trim();
      if (v) setHex(v);
    };
    read();
    const obs = new MutationObserver(read);
    obs.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class", "style"],
    });
    return () => obs.disconnect();
  }, []);

  return hex;
}
