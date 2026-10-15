"use client";

import React, { useLayoutEffect, useRef, useState } from "react";

const PRIMARY_X = 8;
const SECONDARY_X = 22;
const NODE_CENTER_REM = 1.18;
const SINGLE_COMMIT_CAP = 12;

type GraphGeometry = {
  height: number;
  primaryPath: string;
  secondaryPath: string | null;
};

const EMPTY_GEOMETRY: GraphGeometry = {
  height: 1,
  primaryPath: "",
  secondaryPath: null,
};

function sameGeometry(left: GraphGeometry, right: GraphGeometry) {
  return (
    left.height === right.height &&
    left.primaryPath === right.primaryPath &&
    left.secondaryPath === right.secondaryPath
  );
}

function buildSecondaryPath(
  nodes: Array<{ lane: string | undefined; y: number }>,
) {
  const secondaryIndexes = nodes
    .map((node, index) => (node.lane === "secondary" ? index : -1))
    .filter((index) => index >= 0);

  if (secondaryIndexes.length === 0) return null;

  const firstIndex = secondaryIndexes[0];
  const lastIndex = secondaryIndexes.at(-1) ?? firstIndex;
  const previousNode = nodes[Math.max(0, firstIndex - 1)];
  const nextNode = nodes[Math.min(nodes.length - 1, lastIndex + 1)];
  const firstSecondaryY = nodes[firstIndex].y;
  const lastSecondaryY = nodes[lastIndex].y;
  const branchStartY = (previousNode.y + firstSecondaryY) / 2;
  const mergeY = (lastSecondaryY + nextNode.y) / 2;
  const branchCurve = Math.min(18, Math.max(10, (firstSecondaryY - branchStartY) * 0.45));
  const mergeCurve = Math.min(18, Math.max(10, (mergeY - lastSecondaryY) * 0.45));

  return [
    `M ${PRIMARY_X} ${branchStartY}`,
    `C ${PRIMARY_X} ${branchStartY + branchCurve} ${SECONDARY_X} ${firstSecondaryY - branchCurve} ${SECONDARY_X} ${firstSecondaryY}`,
    `V ${lastSecondaryY}`,
    `C ${SECONDARY_X} ${lastSecondaryY + mergeCurve} ${PRIMARY_X} ${mergeY - mergeCurve} ${PRIMARY_X} ${mergeY}`,
  ].join(" ");
}

const MobileGitGraph: React.FC<{ nodeCount: number }> = ({ nodeCount }) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const [geometry, setGeometry] = useState<GraphGeometry>(EMPTY_GEOMETRY);

  useLayoutEffect(() => {
    const svg = svgRef.current;
    const grid = svg?.parentElement;
    if (!svg || !grid) return;

    let frameId: number | null = null;
    const measure = () => {
      frameId = null;
      const gridRect = grid.getBoundingClientRect();
      const rootFontSize = Number.parseFloat(
        window.getComputedStyle(document.documentElement).fontSize,
      ) || 16;
      const nodeCenterOffset = NODE_CENTER_REM * rootFontSize;
      const cards = Array.from(
        grid.querySelectorAll<HTMLElement>(".projects-mobile-card-wrap"),
      );
      const nodes = cards.map((card) => ({
        lane: card.dataset.rail,
        y: card.getBoundingClientRect().top - gridRect.top + nodeCenterOffset,
      }));

      if (nodes.length === 0) {
        setGeometry((current) =>
          sameGeometry(current, EMPTY_GEOMETRY) ? current : EMPTY_GEOMETRY,
        );
        return;
      }

      const firstY = nodes[0].y;
      const lastY = nodes.at(-1)?.y ?? firstY;
      const primaryStart = nodes.length === 1 ? firstY - SINGLE_COMMIT_CAP : firstY;
      const primaryEnd = nodes.length === 1 ? firstY + SINGLE_COMMIT_CAP : lastY;
      const nextGeometry: GraphGeometry = {
        height: Math.max(1, Math.ceil(gridRect.height)),
        primaryPath: `M ${PRIMARY_X} ${primaryStart} V ${primaryEnd}`,
        secondaryPath: buildSecondaryPath(nodes),
      };

      setGeometry((current) =>
        sameGeometry(current, nextGeometry) ? current : nextGeometry,
      );
    };

    const scheduleMeasure = () => {
      if (frameId !== null) return;
      frameId = window.requestAnimationFrame(measure);
    };

    scheduleMeasure();

    if (typeof ResizeObserver === "undefined") {
      window.addEventListener("resize", scheduleMeasure);
      return () => {
        window.removeEventListener("resize", scheduleMeasure);
        if (frameId !== null) window.cancelAnimationFrame(frameId);
      };
    }

    const observer = new ResizeObserver(scheduleMeasure);
    observer.observe(grid);
    grid
      .querySelectorAll<HTMLElement>(".projects-mobile-card-wrap")
      .forEach((card) => observer.observe(card));

    return () => {
      observer.disconnect();
      if (frameId !== null) window.cancelAnimationFrame(frameId);
    };
  }, [nodeCount]);

  return (
    <svg
      ref={svgRef}
      className="projects-mobile-category-rails"
      viewBox={`0 0 36 ${geometry.height}`}
      width="36"
      height={geometry.height}
      aria-hidden="true"
    >
      {geometry.primaryPath && (
        <path className="projects-mobile-rail-primary" d={geometry.primaryPath} />
      )}
      {geometry.secondaryPath && (
        <path className="projects-mobile-rail-secondary" d={geometry.secondaryPath} />
      )}
    </svg>
  );
};

export default MobileGitGraph;
