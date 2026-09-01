// components/journey/GraphRail.tsx
"use client";

import type { CSSProperties, ReactNode } from "react";
import type { Branch, Commit } from "@/lib/journey/deriveGitGraph";

export type RailGeometry = {
  padX: number;
  laneGap: number;
  dotR: number;
  overshoot: number;
  nodeY: number;
  width: number;
  cardGap: number;
};

/** Rail width scales with the number of branches; compact on small screens. */
export function railGeometry(laneCount: number, mobile = false): RailGeometry {
  const padX = mobile ? 10 : 16;
  const laneGap = mobile ? 14 : 24;
  const dotR = mobile ? 4 : 6;
  const overshoot = mobile ? 14 : 3;
  const nodeY = mobile ? 42 : 50;
  const cardGap = mobile ? 8 : 12;
  const width = padX * 2 + Math.max(0, laneCount - 1) * laneGap;
  return { padX, laneGap, dotR, overshoot, nodeY, width, cardGap };
}

function laneX(lane: number, g: RailGeometry): number {
  return g.padX + lane * g.laneGap;
}

/**
 * The graph column for ONE commit row. Drawn per-row (not one tall SVG) so it
 * auto-aligns with variable row heights: vertical branch lines use a
 * non-scaling stroke in a 0–100 y viewBox, while dots are real DOM circles so
 * they never distort. Lines connecting to neighbouring rows meet at the cell
 * edges, forming a continuous graph.
 */
export default function RailCell({
  commit,
  branches,
  geo,
}: {
  commit: Commit;
  branches: Branch[];
  geo: RailGeometry;
}) {
  const row = commit.row;
  const active = branches.filter((b) => row >= b.firstRow && row <= b.lastRow);
  const x0 = laneX(0, geo);

  return (
    <span
      className="relative block h-full shrink-0"
      style={{ width: geo.width }}
      aria-hidden
    >
      <svg
        className="absolute inset-0 h-full w-full overflow-visible"
        data-rail-overshoot={geo.overshoot > 0 ? "true" : "false"}
        data-rail-node-y={geo.nodeY}
        width={geo.width}
        height="100%"
        viewBox={`0 0 ${geo.width} 100`}
        preserveAspectRatio="none"
        fill="none"
      >
        <line
          className="rail-line rail-card-connector"
          style={{ "--rail-color": commit.branch.color } satisfies CSSProperties}
          x1={laneX(commit.lane, geo)}
          x2={geo.width + geo.cardGap}
          y1={geo.nodeY}
          y2={geo.nodeY}
          stroke={commit.branch.color}
          strokeWidth={2}
          strokeLinecap="round"
          vectorEffect="non-scaling-stroke"
        />

        {active.map((b) => {
          const x = laneX(b.lane, geo);
          const isHere = b.lane === commit.lane;
          const hasAbove = row > b.firstRow;
          const hasBelow = row < b.lastRow;
          const top = hasAbove ? -geo.overshoot : 0;
          const bottom = hasBelow ? 100 + geo.overshoot : 100;
          const els: ReactNode[] = [];
          const railStyle = { "--rail-color": b.color } satisfies CSSProperties;

          // Fork elbow: a side branch springs off the trunk at its first row.
          if (b.lane > 0 && row === b.firstRow) {
            els.push(
              <path
                key={`fork-${b.lane}`}
                className="rail-line rail-fork-line"
                style={railStyle}
                d={`M ${x0} ${top} C ${x0} ${geo.nodeY - 6} ${x} 8 ${x} ${geo.nodeY}`}
                stroke={b.color}
                strokeWidth={2}
                strokeLinecap="round"
                vectorEffect="non-scaling-stroke"
              />
            );
            els.push(
              <path
                key={`fork-flow-${b.lane}`}
                className="rail-flow-line rail-fork-flow"
                style={railStyle}
                d={`M ${x0} ${top} C ${x0} ${geo.nodeY - 6} ${x} 8 ${x} ${geo.nodeY}`}
                stroke={b.color}
                strokeWidth={2}
                strokeLinecap="round"
                vectorEffect="non-scaling-stroke"
              />
            );
          }

          const y1 = isHere ? (hasAbove ? top : geo.nodeY) : top;
          const y2 = isHere ? (hasBelow ? bottom : geo.nodeY) : bottom;
          if (y1 !== y2) {
            els.push(
              <line
                key={`ln-${b.lane}`}
                className="rail-line"
                style={railStyle}
                x1={x}
                x2={x}
                y1={y1}
                y2={y2}
                stroke={b.color}
                strokeWidth={2}
                strokeLinecap="round"
                vectorEffect="non-scaling-stroke"
              />
            );
            els.push(
              <line
                key={`ln-flow-${b.lane}`}
                className="rail-flow-line"
                style={railStyle}
                x1={x}
                x2={x}
                y1={y1}
                y2={y2}
                stroke={b.color}
                strokeWidth={2}
                strokeLinecap="round"
                vectorEffect="non-scaling-stroke"
              />
            );
          }
          return <g key={b.lane}>{els}</g>;
        })}
      </svg>

      {/* Commit node — a real circle so it stays perfectly round. */}
      <span
        className="rail-dot absolute -translate-x-1/2 -translate-y-1/2 rounded-full"
        style={{
          left: laneX(commit.lane, geo),
          top: `${geo.nodeY}%`,
          width: geo.dotR * 2,
          height: geo.dotR * 2,
          "--rail-color": commit.branch.color,
          background: commit.branch.color,
          boxShadow: [
            `0 0 0 1px color-mix(in srgb, ${commit.branch.color} 44%, var(--surface-border))`,
            `0 0 10px color-mix(in srgb, ${commit.branch.color} 55%, transparent)`,
          ].join(", "),
        }}
      />
    </span>
  );
}
