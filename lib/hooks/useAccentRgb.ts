"use client";

import { useEffect, useState } from "react";

// Reads the live --accent-rgb CSS variable (set by the DB-driven theme in the
// root layout) as an "r,g,b" string for canvas/particle animations. Re-reads
// when the theme flips (html.light class toggles), so dark/light stay in sync.
export function useAccentRgb(fallback = "25,227,194"): string {
  const [rgb, setRgb] = useState(fallback);

  useEffect(() => {
    const read = () => {
      const v = getComputedStyle(document.documentElement)
        .getPropertyValue("--accent-rgb")
        .trim();
      if (v) setRgb(v);
    };
    read();
    const obs = new MutationObserver(read);
    obs.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class", "style"],
    });
    return () => obs.disconnect();
  }, []);

  return rgb;
}

// Convenience: the same accent as a hex string from --accent.
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
