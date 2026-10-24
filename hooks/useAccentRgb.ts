"use client";

import { useEffect, useState } from "react";

// Reads the --accent-rgb CSS variable ("r,g,b") from <html> and keeps it in
// sync with dark/light theme changes for canvas and JavaScript consumers.
export function useAccentRgb(): string {
  const [rgb, setRgb] = useState("25,227,194");

  useEffect(() => {
    const read = () =>
      getComputedStyle(document.documentElement)
        .getPropertyValue("--accent-rgb")
        .trim() || "25,227,194";

    setRgb(read());

    // Re-read whenever the `class` on <html> changes (theme toggle).
    const observer = new MutationObserver(() => setRgb(read()));
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });
    return () => observer.disconnect();
  }, []);

  return rgb;
}

// "25,227,194" -> "#19e3c2". For code/SVG that needs a solid hex string
// (e.g. accentColor props that build `${color}60` alpha suffixes).
export function rgbToHex(rgb: string): string {
  const parts = rgb.split(",").map((n) => Math.max(0, Math.min(255, parseInt(n.trim(), 10) || 0)));
  if (parts.length < 3) return "#19e3c2";
  return "#" + parts.slice(0, 3).map((n) => n.toString(16).padStart(2, "0")).join("");
}
