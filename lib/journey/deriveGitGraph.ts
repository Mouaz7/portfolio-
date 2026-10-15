// lib/journey/deriveGitGraph.ts
//
// Pure, framework-free derivation of a git-graph model from journey rows.
// Every visible git detail (commit hash, branch ref, commit type, verified
// state, lane/edge layout, header stats) is DERIVED from the data here — nothing
// is hardcoded per row. Add or reorder a `journey_item` and the graph re-derives.
//
// Kept React-free so it can be reasoned about and unit-tested in isolation.

export type JourneyItem = {
  id: string;
  title: string;
  description: string;
  icon?: string;
  from?: string;
  to?: string | null;
  topic?: string | null;
  brand?: string | null; // dominant logo color (colorful logos), else null
  mono?: boolean; // logo is single-hue → tint via mask to follow theme
};

type CommitType = "edu" | "feat";
type CommitStatus = "verified" | "head";

export type Branch = {
  ref: string; // display ref, e.g. "bth/main" | "softhouse"
  org: string; // human org name, e.g. "BTH"
  slug: string; // "bth"
  lane: number; // 0 = trunk
  isTrunk: boolean;
  color: string; // CSS color expression (two-hue system)
  firstRow: number; // top-most row this branch occupies
  lastRow: number; // bottom-most row this branch occupies
};

export type Commit = {
  id: string;
  hash: string; // 7-char hex, deterministic from id
  type: CommitType;
  status: CommitStatus;
  subject: string; // title with the org suffix stripped
  org: string;
  branch: Branch;
  lane: number;
  row: number; // 0 = top (oldest)
  from?: string;
  to?: string | null;
  description: string;
  topic?: string | null;
  icon?: string;
  mono?: boolean;
};

type GitGraphModel = {
  commits: Commit[];
  branches: Branch[];
  laneCount: number;
  stats: { commits: number; branches: number; updated: string | null };
};

// The two committed brand hues. New branches cycle these and fade on-hue via
// color-mix, so we never introduce a third accent.
const BRANCH_HUES = ["var(--accent)", "var(--accent-2)"];

const EDU_RE =
  /\b(b\.?\s?sc|m\.?\s?sc|bachelor|master|ph\.?\s?d|degree|examen|universit|h[oö]gskola|diploma|education)\b/i;

/** Deterministic 7-char hex hash of a stable id (FNV-1a, double-mixed). */
function shortHash(id: string): string {
  let h = 0x811c9dc5;
  for (let i = 0; i < id.length; i++) {
    h ^= id.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  const a = (h >>> 0).toString(16).padStart(8, "0");
  const b = (Math.imul(h ^ 0x9e3779b9, 0x85ebca6b) >>> 0).toString(16).padStart(8, "0");
  return (a + b).slice(0, 7);
}

/** Split "Role – Org" on a spaced dash into { subject, org }. */
export function parseOrg(title: string): { subject: string; org: string } {
  const parts = title.split(/\s+[–—-]\s+/);
  if (parts.length >= 2) {
    return {
      subject: parts.slice(0, -1).join(" – ").trim(),
      org: parts[parts.length - 1].trim(),
    };
  }
  return { subject: title.trim(), org: title.trim() };
}

function slug(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function journeyIconForOrg(org: string): string | undefined {
  switch (slug(org)) {
    case "bth":
      return "/journey/bth-logo.webp";
    case "softhouse":
      return "/journey/softhouse.webp";
    default:
      return undefined;
  }
}

/** Education vs work, from keyword signals across title/description/topic. */
function classifyType(item: JourneyItem): CommitType {
  const hay = `${item.title} ${item.description} ${item.topic ?? ""}`;
  return EDU_RE.test(hay) ? "edu" : "feat";
}

/** Completed (end date in the past) reads as a merged/verified commit; an
 *  open-ended or future item is the live branch tip (HEAD). */
function statusOf(item: JourneyItem, now = Date.now()): CommitStatus {
  if (!item.to) return "head";
  const t = new Date(item.to).getTime();
  if (isNaN(t)) return "verified";
  return t <= now ? "verified" : "head";
}

/** Branch color for a given lane — cycles the two brand hues, then fades
 *  on-hue for any further lanes so we stay inside the two-hue system. */
function branchColor(lane: number): string {
  const base = BRANCH_HUES[lane % BRANCH_HUES.length];
  const tier = Math.floor(lane / BRANCH_HUES.length);
  if (tier === 0) return base;
  const pct = Math.max(35, 100 - tier * 30);
  return `color-mix(in srgb, ${base} ${pct}%, transparent)`;
}

function ms(d?: string | null): number {
  if (!d) return NaN;
  const t = new Date(d).getTime();
  return isNaN(t) ? NaN : t;
}

export function fmtMonthYear(d?: string | null, locale = "en-US"): string {
  if (!d) return "";
  const date = new Date(d);
  return isNaN(date.getTime())
    ? ""
    : date.toLocaleString(locale, { month: "short", year: "numeric" });
}

/** "Aug 2023 → Jun 2026" / "Jan 2026 → Present". */
export function fmtRange(from?: string, to?: string | null, locale = "en-US", present = "Present"): string {
  const f = fmtMonthYear(from, locale);
  const t = to ? fmtMonthYear(to, locale) : present;
  if (f && t) return `${f} → ${t}`;
  return f || t || "";
}

/**
 * Build the full git-graph model. Input order is treated as oldest → newest
 * (the API already sorts ascending), so row 0 is the top of the timeline.
 */
export function deriveGraph(items: JourneyItem[], now = Date.now()): GitGraphModel {
  const rows = items.map((item, row) => {
    const { subject, org } = parseOrg(item.title);
    return { item, row, subject, org };
  });

  // Group by org and pick the trunk: most commits, ties broken by earliest start.
  const groups = new Map<
    string,
    { org: string; rows: number[]; first: number; brand: string | null }
  >();
  for (const r of rows) {
    const key = slug(r.org) || "misc";
    const g = groups.get(key) ?? { org: r.org, rows: [], first: Infinity, brand: null };
    g.rows.push(r.row);
    if (!g.brand && r.item.brand) g.brand = r.item.brand; // org's real logo color
    const start = ms(r.item.from);
    if (!isNaN(start)) g.first = Math.min(g.first, start);
    groups.set(key, g);
  }

  const ordered = [...groups.entries()].sort((a, b) => {
    const byCount = b[1].rows.length - a[1].rows.length;
    if (byCount) return byCount;
    return a[1].first - b[1].first; // earliest first
  });

  const total = rows.length;
  const branches: Branch[] = ordered.map(([key, g], i) => {
    const isTrunk = i === 0;
    const first = Math.min(...g.rows);
    const last = Math.max(...g.rows);
    return {
      slug: key,
      org: g.org,
      isTrunk,
      lane: i,
      ref: isTrunk ? `${key}/main` : key,
      // Real brand color when branch has one; fallback to site lane hue.
      color: g.brand ?? branchColor(i),
      // Trunk is the continuous backbone: it spans the whole column.
      firstRow: isTrunk ? 0 : first,
      lastRow: isTrunk ? Math.max(0, total - 1) : last,
    };
  });

  const branchBySlug = new Map(branches.map((b) => [b.slug, b]));

  const commits: Commit[] = rows.map((r) => {
    const branch = branchBySlug.get(slug(r.org) || "misc")!;
    return {
      id: r.item.id,
      hash: shortHash(r.item.id),
      type: classifyType(r.item),
      status: statusOf(r.item, now),
      subject: r.subject,
      org: r.org,
      branch,
      lane: branch.lane,
      row: r.row,
      from: r.item.from,
      to: r.item.to,
      description: r.item.description,
      topic: r.item.topic ?? null,
      icon: r.item.icon ?? journeyIconForOrg(r.org),
      mono: !!r.item.mono,
    };
  });

  const dates = rows.flatMap((r) => [ms(r.item.from), ms(r.item.to)]).filter((n) => !isNaN(n));
  const updated = dates.length ? new Date(Math.max(...dates)).toISOString() : null;

  return {
    commits,
    branches,
    laneCount: branches.length,
    stats: { commits: total, branches: branches.length, updated },
  };
}
