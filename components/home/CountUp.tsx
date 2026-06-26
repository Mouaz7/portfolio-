"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Animates a numeric value 0 → target once `show` flips true. Non-numeric
 * values (e.g. "AI") render unchanged. A trailing suffix in the source string
 * is preserved (e.g. "15+" counts to 15 and keeps the "+"). Respects
 * prefers-reduced-motion by jumping straight to the final value.
 */
export default function CountUp({
  value,
  show,
  durationMs = 1100,
}: {
  value: string;
  show: boolean;
  durationMs?: number;
}) {
  const match = value.match(/^(\d+)(.*)$/);
  const target = match ? parseInt(match[1], 10) : null;
  const suffix = match ? match[2] : "";

  const [display, setDisplay] = useState<string>(target === null ? value : "0" + suffix);
  const started = useRef(false);

  useEffect(() => {
    if (target === null) {
      setDisplay(value);
      return;
    }
    if (!show || started.current) return;
    started.current = true;

    const reduced =
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;
    if (reduced) {
      setDisplay(target + suffix);
      return;
    }

    const start = performance.now();
    let raf = 0;
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / durationMs);
      const eased = 1 - Math.pow(1 - t, 3); // easeOutCubic
      setDisplay(Math.round(eased * target) + suffix);
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [show, target, suffix, value, durationMs]);

  return <>{display}</>;
}
