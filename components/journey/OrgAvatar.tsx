// components/journey/OrgAvatar.tsx
"use client";

import { useState } from "react";

/** Initials from an org name: multi-word → leading letters, single word →
 *  first two letters. "BTH" → "BTH", "Softhouse" → "SO". */
function initialsOf(org: string): string {
  const words = org.trim().split(/\s+/).filter(Boolean);
  if (words.length >= 2) {
    return words
      .map((w) => w[0])
      .join("")
      .slice(0, 3)
      .toUpperCase();
  }
  return (words[0] ?? "?").slice(0, 2).toUpperCase();
}

/**
 * Commit author avatar. Renders the real org logo when one resolves; on a
 * missing/broken source it degrades to a monospace initials tile tinted with
 * the branch color — so the graph never ships a broken image.
 */
export default function OrgAvatar({
  org,
  color,
  iconUrl,
  mono = false,
  size = 68,
}: {
  org: string;
  color: string;
  iconUrl?: string;
  mono?: boolean;
  size?: number;
}) {
  const [broken, setBroken] = useState(false);
  const showImg = iconUrl && !broken;

  // Single-hue logo (e.g. a monochrome seal): paint it in the branch color via
  // a CSS mask so it stays crisp and legible in BOTH dark and light themes.
  if (showImg && mono) {
    return (
      <span
        role="img"
        aria-label={org}
        className="shrink-0 select-none"
        style={{
          width: size,
          height: size,
          backgroundColor: color,
          WebkitMaskImage: `url("${iconUrl}")`,
          maskImage: `url("${iconUrl}")`,
          WebkitMaskRepeat: "no-repeat",
          maskRepeat: "no-repeat",
          WebkitMaskSize: "contain",
          maskSize: "contain",
          WebkitMaskPosition: "center",
          maskPosition: "center",
        }}
      />
    );
  }

  // Colorful logo: render its own pixels bare (no frame/tile), big and clean.
  if (showImg) {
    return (
      <span className="grid shrink-0 place-items-center" style={{ width: size, height: size }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={iconUrl}
          alt={org}
          width={size}
          height={size}
          onError={() => setBroken(true)}
          className="h-full w-full object-contain select-none"
          draggable={false}
        />
      </span>
    );
  }

  // Fallback only when no logo resolves: a tinted initials tile.
  return (
    <span
      role="img"
      aria-label={org}
      className="grid shrink-0 place-items-center rounded-[10px] font-mono font-bold leading-none tracking-tight"
      data-journey-fallback-avatar="true"
      data-journey-org={org}
      style={{
        width: size,
        height: size,
        color,
        background: `color-mix(in srgb, ${color} 10%, var(--surface-2))`,
        border: `1px solid color-mix(in srgb, ${color} 24%, var(--surface-border))`,
        fontSize: Math.round(size * 0.3),
      }}
    >
      {initialsOf(org)}
    </span>
  );
}
