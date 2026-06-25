"use client";

import Link from "next/link";
import { useEffect, useRef, type ReactNode } from "react";

type Props = {
  href: string;
  children: ReactNode;
  variant?: "primary" | "ghost";
  download?: boolean;
  prefetch?: boolean;
  /** Magnet pull strength (px translate per px of cursor offset). */
  strength?: number;
  className?: string;
};

/**
 * A CTA that magnetically leans toward the cursor on pointer devices, then
 * springs back on leave. Disabled for touch input and `prefers-reduced-motion`.
 * Renders a Next.js <Link> for internal routes and a plain <a> for downloads /
 * external links. Styling is fully theme-var driven (accent + surface tokens)
 * and uses fluid clamp() sizing — no hardcoded pixels.
 */
export default function MagneticButton({
  href,
  children,
  variant = "primary",
  download = false,
  prefetch = true,
  strength = 0.3,
  className = "",
}: Props) {
  const ref = useRef<HTMLAnchorElement>(null);
  const allow = useRef(true);

  useEffect(() => {
    allow.current = !(
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false
    );
  }, []);

  const onMove = (e: React.PointerEvent<HTMLAnchorElement>) => {
    const el = ref.current;
    if (!el || !allow.current || e.pointerType === "touch") return;
    const r = el.getBoundingClientRect();
    const mx = e.clientX - (r.left + r.width / 2);
    const my = e.clientY - (r.top + r.height / 2);
    el.style.transform = `translate(${mx * strength}px, ${my * strength * 1.15}px)`;
  };

  const onLeave = () => {
    const el = ref.current;
    if (el) el.style.transform = "";
  };

  const base =
    "group relative inline-flex items-center justify-center gap-2 rounded-full font-semibold " +
    "px-[clamp(20px,3.2vw,30px)] py-[clamp(11px,1.7vh,15px)] text-[clamp(0.95rem,1.5vw,1.08rem)] " +
    "transition-[transform,box-shadow,background-color,border-color,color] duration-300 ease-[cubic-bezier(.22,1,.36,1)] " +
    "will-change-transform focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/70";

  const look =
    variant === "primary"
      ? "bg-accent text-[#03201b] shadow-[0_10px_34px_rgba(var(--accent-rgb),0.4)] hover:shadow-[0_16px_46px_rgba(var(--accent-rgb),0.55)]"
      : "border border-[var(--surface-border)] bg-[rgba(var(--bg-rgb),0.22)] text-[var(--fg)] backdrop-blur-md hover:border-accent/60 hover:text-accent";

  const cls = `${base} ${look} ${className}`;
  const internal = href.startsWith("/") && !download;

  if (internal) {
    return (
      <Link
        ref={ref}
        href={href}
        prefetch={prefetch}
        onPointerMove={onMove}
        onPointerLeave={onLeave}
        onPointerUp={onLeave}
        className={cls}
      >
        {children}
      </Link>
    );
  }

  const external = href.startsWith("http");
  return (
    <a
      ref={ref}
      href={href}
      {...(download ? { download: true } : {})}
      {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
      onPointerMove={onMove}
      onPointerLeave={onLeave}
      onPointerUp={onLeave}
      className={cls}
    >
      {children}
    </a>
  );
}
