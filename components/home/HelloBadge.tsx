"use client";

import { useEffect } from "react";
import { usePrefersReducedMotion } from "@/hooks/useMediaQuery";

type Props = {
  text?: string;
  className?: string;
  show?: boolean;
  durationMs?: number;
  onDone?: () => void;
};

export default function HelloBadge({
  text = "Hello!",
  className = "",
  show = false,
  durationMs = 520,
  onDone,
}: Props) {
  const prefersReducedMotion = usePrefersReducedMotion();

  useEffect(() => {
    if (!show) return;
    const timeout = setTimeout(
      () => onDone?.(),
      prefersReducedMotion ? 0 : durationMs + 60,
    );
    return () => clearTimeout(timeout);
  }, [show, durationMs, onDone, prefersReducedMotion]);

  return (
    <span className="relative inline-block">
      <span
        className={[
          "relative z-10 inline-flex items-center justify-center",
          "rounded-full bg-cornflowerblue-100 text-white font-urbanist",
          "tracking-[-0.01em] leading-none",
          "text-[clamp(1rem,2.5vw,1.375rem)] px-[1em] py-[0.5em]",
          "transition-[opacity,transform] duration-500 ease-[cubic-bezier(.22,1,.36,1)]",
          show ? "opacity-100 translate-y-0 scale-100" : "opacity-0 translate-y-2 scale-95",
          className,
        ].join(" ")}
        style={{ willChange: "opacity, transform" }}
      >
        {text}
      </span>
    </span>
  );
}
