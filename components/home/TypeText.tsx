"use client";
import { useEffect, useState } from "react";
import { usePrefersReducedMotion } from "@/hooks/useMediaQuery";

type Props = {
  text: string;
  start?: boolean;
  speedMs?: number;       // ms per char
  onDone?: () => void;
  className?: string;
};

export default function TypeText({
  text,
  start = false,
  speedMs = 48,
  onDone,
  className = "",
}: Props) {
  const [n, setN] = useState(0);
  const prefersReducedMotion = usePrefersReducedMotion();

  useEffect(() => {
    if (!start) return;
    if (n >= text.length) return;
    if (prefersReducedMotion) {
      setN(text.length);
      return;
    }
    const t = setTimeout(() => setN((v) => v + 1), speedMs);
    return () => clearTimeout(t);
  }, [start, n, text.length, speedMs, prefersReducedMotion]);

  useEffect(() => {
    if (start && n === text.length) onDone?.();
  }, [start, n, text.length, onDone]);

  return <span className={className}>{text.slice(0, n)}</span>;
}
