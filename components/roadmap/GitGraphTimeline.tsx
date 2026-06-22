"use client";
import { useEffect, useMemo, useState } from "react";

export type RoadmapItem = {
  id: string;
  title: string;
  description: string;
  icon?: string;
  from?: string;
  to?: string | null;
};

/* tiny inline icons (GitHub-flavoured) */
const BranchIcon = ({ size = 12, color = "currentColor" }: { size?: number; color?: string }) => (
  <svg width={size} height={size} viewBox="0 0 16 16" fill={color} aria-hidden>
    <path d="M9.5 3.25a2.25 2.25 0 1 1 3 2.122V6A2.5 2.5 0 0 1 10 8.5H6a1 1 0 0 0-1 1v1.128a2.251 2.251 0 1 1-1.5 0V5.372a2.25 2.25 0 1 1 1.5 0v1.836A2.493 2.493 0 0 1 6 7h4a1 1 0 0 0 1-1v-.628A2.25 2.25 0 0 1 9.5 3.25Zm-6 0a.75.75 0 1 0 1.5 0 .75.75 0 0 0-1.5 0Zm8.25-.75a.75.75 0 1 0 0 1.5.75.75 0 0 0 0-1.5ZM4.25 12a.75.75 0 1 0 0 1.5.75.75 0 0 0 0-1.5Z" />
  </svg>
);
const VerifiedIcon = ({ size = 12 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 16 16" fill="currentColor" aria-hidden>
    <path d="M9.585.52a2.678 2.678 0 0 0-3.17 0l-.928.68a1.178 1.178 0 0 1-.518.215L3.83 1.59a2.678 2.678 0 0 0-2.24 2.24l-.175 1.14a1.178 1.178 0 0 1-.215.518l-.68.928a2.678 2.678 0 0 0 0 3.17l.68.928c.113.153.186.33.215.518l.175 1.14a2.678 2.678 0 0 0 2.24 2.24l1.14.175c.187.029.365.102.518.215l.928.68a2.678 2.678 0 0 0 3.17 0l.928-.68a1.17 1.17 0 0 1 .518-.215l1.14-.175a2.678 2.678 0 0 0 2.24-2.24l.175-1.14c.029-.187.102-.365.215-.518l.68-.928a2.678 2.678 0 0 0 0-3.17l-.68-.928a1.179 1.179 0 0 1-.215-.518L14.41 3.83a2.678 2.678 0 0 0-2.24-2.24l-1.14-.175a1.178 1.178 0 0 1-.518-.215L9.585.52ZM7.303 1.728c.234-.171.55-.171.784 0l.928.68c.27.2.583.329.912.379l1.14.175c.29.044.518.272.562.562l.175 1.14c.05.329.18.642.378.912l.68.928c.172.234.172.55 0 .784l-.68.928a2.678 2.678 0 0 0-.378.912l-.175 1.14a.678.678 0 0 1-.562.562l-1.14.175a2.678 2.678 0 0 0-.912.379l-.928.68a.678.678 0 0 1-.784 0l-.928-.68a2.678 2.678 0 0 0-.912-.379l-1.14-.175a.678.678 0 0 1-.562-.562l-.175-1.14a2.678 2.678 0 0 0-.379-.912l-.68-.928a.678.678 0 0 1 0-.784l.68-.928c.2-.27.329-.583.379-.912l.175-1.14a.678.678 0 0 1 .562-.562l1.14-.175a2.678 2.678 0 0 0 .912-.379l.928-.68ZM11.28 6.78a.75.75 0 0 0-1.06-1.06L7 8.94 5.78 7.72a.75.75 0 0 0-1.06 1.06l1.75 1.75a.75.75 0 0 0 1.06 0l3.75-3.75Z" />
  </svg>
);
const RepoIcon = ({ size = 15, color = "currentColor" }: { size?: number; color?: string }) => (
  <svg width={size} height={size} viewBox="0 0 16 16" fill={color} aria-hidden>
    <path d="M2 2.5A2.5 2.5 0 0 1 4.5 0h8.75a.75.75 0 0 1 .75.75v12.5a.75.75 0 0 1-.75.75h-2.5a.75.75 0 0 1 0-1.5h1.75v-2h-8a1 1 0 0 0-.714 1.7.75.75 0 1 1-1.072 1.05A2.495 2.495 0 0 1 2 11.5Zm10.5-1h-8a1 1 0 0 0-1 1v6.708A2.486 2.486 0 0 1 4.5 9h8ZM5 12.25a.25.25 0 0 1 .25-.25h3.5a.25.25 0 0 1 .25.25v3.25a.25.25 0 0 1-.4.2l-1.45-1.087a.249.249 0 0 0-.3 0L5.4 15.7a.25.25 0 0 1-.4-.2Z" />
  </svg>
);
const CommitIcon = ({ size = 14, color = "currentColor" }: { size?: number; color?: string }) => (
  <svg width={size} height={size} viewBox="0 0 16 16" fill={color} aria-hidden>
    <path d="M11.93 8.5a4.002 4.002 0 0 1-7.86 0H.75a.75.75 0 0 1 0-1.5h3.32a4.002 4.002 0 0 1 7.86 0h3.32a.75.75 0 0 1 0 1.5Zm-1.43-.75a2.5 2.5 0 1 0-5 0 2.5 2.5 0 0 0 5 0Z" />
  </svg>
);

/**
 * Career history rendered as a GitHub-style `git log --graph`.
 * `main` is the trunk; each org (BTH / Softhouse) is a branch lane the
 * commits live on. Per-row CSS gutter → natural heights, fully responsive.
 */
export default function GitGraphTimeline({
  items,
  accentColor = "#19e3c2",
}: {
  items: RoadmapItem[];
  accentColor?: string;
}) {
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 680px)");
    const apply = () => setIsMobile(mq.matches);
    apply();
    mq.addEventListener?.("change", apply);
    return () => mq.removeEventListener?.("change", apply);
  }, []);

  const sorted = useMemo(
    () => [...items].sort((a, b) => new Date(a.from || 0).getTime() - new Date(b.from || 0).getTime()),
    [items]
  );

  const laneFor = (t: string): number => (/(softhouse)/i.test(t) ? 2 : 1);
  const laneColor = (lane: number) => (lane === 0 ? accentColor : lane === 2 ? "#e0782c" : "#33a1e0");
  const branchName = (t: string) => (/(softhouse)/i.test(t) ? "softhouse" : "bth/main");
  const commitPrefix = (t: string) =>
    /(softhouse)/i.test(t) ? "feat:" : /(mentor|teaching|assistant)/i.test(t) ? "feat:" : "edu:";

  // responsive geometry
  const G = isMobile ? 46 : 96;
  const X_MAIN = isMobile ? 12 : 22;
  const laneX = (lane: number) => (lane === 0 ? X_MAIN : lane === 2 ? (isMobile ? 40 : 76) : isMobile ? 26 : 49);
  const nodeR = isMobile ? 5.5 : 7;
  const logoPx = isMobile ? 56 : 76; // large org logos — easy to read in light & dark

  const laneSpans = useMemo(() => {
    const m = new Map<number, { first: number; last: number }>();
    sorted.forEach((it, i) => {
      const ln = laneFor(it.title);
      const cur = m.get(ln);
      if (!cur) m.set(ln, { first: i, last: i });
      else cur.last = i;
    });
    return m;
  }, [sorted]);

  const fmt = (from?: string, to?: string | null) => {
    const safe = (d?: string | null) => {
      if (!d) return "";
      const x = new Date(d);
      return isNaN(x.getTime()) ? "" : x.toLocaleString("en-US", { month: "short", year: "numeric" });
    };
    const f = safe(from);
    const t = to ? safe(to) : "present";
    return f ? `${f} → ${t}` : "";
  };
  const hashOf = (seed: string) => {
    let h = 0;
    for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
    return h.toString(16).padStart(7, "0").slice(0, 7);
  };

  const branchCount = laneSpans.size;

  return (
    <div className={`relative mx-auto w-full ${isMobile ? "max-w-[460px]" : "max-w-[760px]"}`}>
      {/* GitHub-style repo header */}
      <div
        className="mb-4 overflow-hidden rounded-xl"
        style={{
          background: "color-mix(in srgb, var(--surface) 82%, transparent)",
          backdropFilter: "blur(12px)",
          WebkitBackdropFilter: "blur(12px)",
          border: "1px solid var(--surface-border)",
          boxShadow: "0 8px 24px rgba(0,0,0,0.14)",
        }}
      >
        <div className="flex items-center justify-between gap-3 px-4 py-3">
          <div className="flex min-w-0 items-center gap-2" style={{ fontSize: isMobile ? 13 : 15 }}>
            <span style={{ color: accentColor, display: "inline-flex" }}>
              <RepoIcon size={isMobile ? 15 : 17} color={accentColor} />
            </span>
            <span className="truncate font-semibold" style={{ color: "var(--fg-70)" }}>
              Mouaz-Naji
            </span>
            <span style={{ color: "var(--fg-50)" }}>/</span>
            <span className="truncate font-bold" style={{ color: accentColor }}>
              career
            </span>
          </div>
          <span
            className="flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 font-mono"
            style={{
              fontSize: isMobile ? 10.5 : 12,
              color: "var(--fg-70)",
              background: "color-mix(in srgb, var(--surface) 60%, transparent)",
              border: "1px solid var(--surface-border)",
            }}
          >
            <BranchIcon size={isMobile ? 11 : 13} color={accentColor} /> main
          </span>
        </div>
        <div
          className="flex items-center gap-2 px-4 py-2 font-mono"
          style={{
            fontSize: isMobile ? 10.5 : 12,
            color: "var(--fg-70)",
            borderTop: "1px solid var(--surface-border)",
            background: "color-mix(in srgb, var(--surface) 40%, transparent)",
          }}
        >
          <span style={{ color: accentColor, display: "inline-flex" }}>
            <CommitIcon size={isMobile ? 12 : 14} color={accentColor} />
          </span>
          <span style={{ color: "var(--fg)", fontWeight: 600 }}>{sorted.length}</span> commits
          <span style={{ color: "var(--fg-50)" }}>·</span>
          <span style={{ color: "var(--fg)", fontWeight: 600 }}>{branchCount}</span> branches
        </div>
      </div>

      {/* commit graph */}
      <div className="flex flex-col">
        {sorted.map((it, i) => {
          const myLane = laneFor(it.title);
          const myX = laneX(myLane);
          const myColor = laneColor(myLane);

          const lines: { x: number; color: string; span: "full" | "top" | "bottom" }[] = [];
          lines.push({ x: X_MAIN, color: accentColor, span: i === 0 ? "bottom" : i === sorted.length - 1 ? "top" : "full" });
          [...laneSpans.entries()].forEach(([lane, span]) => {
            if (i < span.first || i > span.last) return;
            const x = laneX(lane);
            const color = laneColor(lane);
            let s: "full" | "top" | "bottom" = "full";
            if (span.first !== span.last) {
              if (i === span.first) s = "bottom";
              else if (i === span.last) s = "top";
            }
            lines.push({ x, color, span: s });
          });
          const isBranchStart = laneSpans.get(myLane)?.first === i;

          return (
            <div key={it.id} className="git-row group flex items-stretch opacity-0" style={{ animationDelay: `${240 + i * 110}ms` }}>
              {/* graph gutter */}
              <div className="relative shrink-0" style={{ width: G }}>
                {lines.map((l, idx) => (
                  <span
                    key={idx}
                    aria-hidden
                    style={{
                      position: "absolute",
                      left: l.x - 1.25,
                      width: 2.5,
                      background: l.color,
                      opacity: 0.9,
                      borderRadius: 2,
                      top: l.span === "bottom" ? "50%" : 0,
                      bottom: l.span === "top" ? "50%" : 0,
                    }}
                  />
                ))}
                {isBranchStart && (
                  <span
                    aria-hidden
                    style={{
                      position: "absolute",
                      left: X_MAIN - 1.25,
                      width: myX - X_MAIN,
                      height: 2.5,
                      background: myColor,
                      opacity: 0.9,
                      top: "calc(50% - 1.25px)",
                      borderRadius: 2,
                    }}
                  />
                )}
                <span
                  aria-hidden
                  style={{ position: "absolute", left: myX, width: G - myX, height: 2.5, background: myColor, opacity: 0.5, top: "calc(50% - 1.25px)" }}
                />
                <span
                  aria-hidden
                  style={{
                    position: "absolute",
                    left: myX,
                    top: "50%",
                    transform: "translate(-50%,-50%)",
                    width: nodeR * 2,
                    height: nodeR * 2,
                    borderRadius: "50%",
                    background: "var(--surface)",
                    border: `${isMobile ? 2.5 : 3}px solid ${myColor}`,
                    boxShadow: `0 0 0 4px ${myColor}22, 0 0 12px ${myColor}`,
                  }}
                />
              </div>

              {/* commit card — GitHub commit row style */}
              <div className="min-w-0 flex-1" style={{ padding: `${isMobile ? 6 : 8}px 0` }}>
                <div
                  className="relative rounded-xl transition-all duration-300 group-hover:-translate-y-0.5"
                  style={{
                    padding: isMobile ? "12px 13px" : "14px 18px",
                    background: "color-mix(in srgb, var(--surface) 80%, transparent)",
                    backdropFilter: "blur(12px)",
                    WebkitBackdropFilter: "blur(12px)",
                    border: "1px solid var(--surface-border)",
                    borderLeft: `3px solid ${myColor}`,
                    boxShadow: `0 10px 30px rgba(0,0,0,0.16), 0 0 18px ${myColor}14`,
                  }}
                >
                  <div className="flex items-start gap-3.5">
                    {/* BIG org logo — clean, no box */}
                    {it.icon && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={it.icon}
                        alt=""
                        className="shrink-0 select-none object-contain transition-transform duration-300 group-hover:scale-105"
                        style={{ width: logoPx, height: logoPx }}
                      />
                    )}

                    <div className="min-w-0 flex-1">
                      {/* commit message + verified */}
                      <div className="flex items-start justify-between gap-2">
                        <div className="leading-snug" style={{ color: "var(--fg)" }}>
                          <span className="font-mono font-bold" style={{ color: myColor, fontSize: isMobile ? 11.5 : 12.5 }}>
                            {commitPrefix(it.title)}{" "}
                          </span>
                          <span className="font-bold" style={{ fontSize: isMobile ? 14.5 : 16.5, textWrap: "balance" }}>
                            {it.title}
                          </span>
                        </div>
                        {!isMobile && (
                          <span
                            className="flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 font-mono font-semibold"
                            style={{ fontSize: 10.5, color: "#3fb950", background: "#3fb95018", border: "1px solid #3fb95040" }}
                          >
                            <VerifiedIcon size={11} /> Verified
                          </span>
                        )}
                      </div>

                      {/* commit meta row */}
                      <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1.5 font-mono" style={{ fontSize: isMobile ? 10 : 11.5 }}>
                        <span
                          className="rounded-md px-1.5 py-[2px]"
                          style={{ color: "var(--fg-70)", background: "color-mix(in srgb, var(--surface) 55%, transparent)", border: "1px solid var(--surface-border)" }}
                        >
                          {hashOf(it.id)}
                        </span>
                        <span style={{ color: accentColor }}>{fmt(it.from, it.to)}</span>
                        <span
                          className="flex items-center gap-1 rounded-full px-2 py-[1px]"
                          style={{ color: myColor, background: `${myColor}1a`, border: `1px solid ${myColor}40` }}
                        >
                          <BranchIcon size={isMobile ? 9 : 10} color={myColor} />
                          {branchName(it.title)}
                        </span>
                      </div>

                      {/* commit body */}
                      <p className="mt-2.5 font-medium leading-relaxed" style={{ fontSize: isMobile ? 12.5 : 13.5, color: "var(--fg-70)", textWrap: "balance" }}>
                        {it.description}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <style>{`
        @keyframes gitRowIn { 0% { opacity: 0; transform: translateX(-12px); filter: blur(2px); } 100% { opacity: 1; transform: none; filter: none; } }
        .git-row { animation: gitRowIn 500ms cubic-bezier(.2,.7,.2,1) both; }
      `}</style>
    </div>
  );
}
