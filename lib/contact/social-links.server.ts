import type { ContactSocialLink } from "./social-links";

type ContactSocialRow = {
  id: number;
  name: string | null;
  href: string | null;
  svg_path: string | null;
  viewbox: string | null;
};

const SAFE_SVG_TAGS = new Set(["svg", "path", "circle", "rect", "line", "polyline", "polygon", "g", "title", "desc"]);
const BEACONS_ICON_VIEWBOX = "1 2 17 20";

function safeHref(value: unknown): string | null {
  if (typeof value !== "string") return null;
  try {
    const url = new URL(value);
    if (url.protocol === "mailto:") return url.toString();
    if (url.protocol !== "https:") return null;
    const hostname = url.hostname.toLowerCase();
    return hostname === "github.com"
      || hostname === "linkedin.com"
      || hostname === "www.linkedin.com"
      || hostname === "beacons.ai"
      || hostname === "www.beacons.ai"
      ? url.toString()
      : null;
  } catch {
    return null;
  }
}

function safeIconUrl(value: string): string | null {
  try {
    const url = new URL(value);
    if (url.protocol !== "https:") return null;
    const configuredUrl = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
    const allowedOrigins = new Set(["https://cdn.simpleicons.org"]);
    if (configuredUrl) allowedOrigins.add(new URL(configuredUrl).origin);
    return allowedOrigins.has(url.origin) ? url.toString() : null;
  } catch {
    return null;
  }
}

function sanitizeSvg(value: string): string | null {
  if (value.length > 16_000 || !/^\s*<svg\b/i.test(value)) return null;

  const withoutBlockedNodes = value
    .replace(/<\s*(script|foreignObject|iframe|object|embed|style|animate|set|use|image)\b[^>]*>[\s\S]*?<\/\s*\1\s*>/gi, "")
    .replace(/<\s*(script|foreignObject|iframe|object|embed|style|animate|set|use|image)\b[^>]*\/?\s*>/gi, "");
  if (/(?:<!|<\?|\b(?:xlink:)?href\s*=|\bsrc\s*=|\bstyle\s*=|\b(?:javascript|data):|url\s*\()/i.test(withoutBlockedNodes)) {
    return null;
  }

  const cleaned = withoutBlockedNodes.replace(/\s+on[a-z]+\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/gi, "").trim();
  const tags = cleaned.matchAll(/<\/?\s*([a-z][\w:-]*)\b[^>]*>/gi);
  for (const tag of tags) {
    if (!SAFE_SVG_TAGS.has(tag[1].toLowerCase())) return null;
  }

  if (!/^<svg\b[\s\S]*<\/svg>$/i.test(cleaned)) return null;
  return `data:image/svg+xml,${encodeURIComponent(cleaned)}`;
}

function safeIcon(value: unknown): string {
  if (typeof value !== "string") return "";
  const trimmed = value.trim();
  if (!trimmed || /^data:/i.test(trimmed)) return "";
  if (/^[MmZzLlHhVvCcSsQqTtAa][MmZzLlHhVvCcSsQqTtAa\d\s,.\-+eE]+$/.test(trimmed)) return trimmed;
  return safeIconUrl(trimmed) ?? sanitizeSvg(trimmed) ?? "";
}

export function normalizeContactSocial(row: ContactSocialRow): ContactSocialLink | null {
  const href = safeHref(row.href);
  const title = row.name?.trim();
  if (!href || !title) return null;
  const hostname = new URL(href).hostname.toLowerCase().replace(/^www\./, "");

  return {
    id: row.id,
    title: title.slice(0, 120),
    href,
    svgPath: safeIcon(row.svg_path),
    viewBox: hostname === "beacons.ai"
      ? BEACONS_ICON_VIEWBOX
      : row.viewbox?.trim().slice(0, 80) || "0 0 24 24",
  };
}
