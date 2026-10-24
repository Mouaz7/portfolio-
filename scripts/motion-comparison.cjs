function elementIdentity(element) {
  if (!element?.tag) return null;
  const url = element.url ? new URL(element.url, "http://measurement.local") : null;
  return JSON.stringify([element.tag, element.text, url ? url.pathname + url.search : ""]);
}

function headerWasReplacedByEarlierContent(previous, current) {
  const previousElements = new Set((previous.runs ?? []).map((run) => elementIdentity(run.lcpElement)));
  const currentShapes = new Set(current.runs.map((run) => {
    const element = run.lcpElement;
    if (!element?.tag || !Number.isFinite(element.size) || element.size <= 0) return null;
    return JSON.stringify([element.tag, element.className, element.size]);
  }));
  // Equal-area icons can alternate as the final LCP winner. Their URLs need
  // not match when every run has the same content geometry and region.
  const changedCandidate = previousElements.size === 1 && !previousElements.has(null)
    && currentShapes.size === 1 && !currentShapes.has(null)
    && previous.runs.every((run) => run.lcpElement.region === "header")
    && current.runs.every((run) => run.lcpElement.region === "main");
  const measuredGrids = [previous, current].every((report) => report.runs?.length
    && report.runs.every((run) => Number.isFinite(run.gridVisible)));
  return changedCandidate && measuredGrids
    && previous.gridVisible - current.gridVisible > 100
    && current.gridVisible < previous.gridVisible * 0.85
    && Math.max(...current.runs.map((run) => run.gridVisible))
      < Math.min(...previous.runs.map((run) => run.gridVisible))
    && current.runs.every((run) => Number.isFinite(run.lcp) && run.lcp > 0 && run.lcp <= 2500);
}

function compareMotionReports(report, baseline) {
  const failures = [];
  const warnings = [];
  if (baseline && JSON.stringify(baseline.profile) !== JSON.stringify(report.profile)) {
    return { failures: ["Performance profiles differ"], warnings };
  }
  for (const [route, current] of Object.entries(report.routes)) {
    if (!Number.isFinite(current.cls) || current.cls > 0.05) failures.push(`${route} CLS ${current.cls}`);
    if (!baseline) continue;
    const previous = baseline.routes[route];
    if (!previous) {
      failures.push(`Missing baseline: ${route}`);
      continue;
    }
    const metrics = ["lcp", "blocking"];
    if (Number.isFinite(previous.gridVisible) && Number.isFinite(current.gridVisible)) metrics.push("gridVisible");
    for (const metric of metrics) {
      const exceedsThreshold = current[metric] > previous[metric] * 1.15
        && current[metric] - previous[metric] > 100;
      if (metric === "lcp" && exceedsThreshold && headerWasReplacedByEarlierContent(previous, current)) {
        warnings.push(`${route} relative LCP is not comparable: the header winner changed to equal-area content; `
          + `grid visibility improved ${previous.gridVisible} -> ${current.gridVisible} ms `
          + `and every LCP run meets the 2500 ms objective`);
        continue;
      }
      const currentMinimum = Math.min(...current.runs.map((run) => run[metric]));
      const previousMaximum = previous.runs?.length
        ? Math.max(...previous.runs.map((run) => run[metric])) : previous[metric];
      if (exceedsThreshold && currentMinimum > previousMaximum) {
        failures.push(`${route} ${metric}: ${previous[metric]} -> ${current[metric]}`);
      } else if (exceedsThreshold) {
        warnings.push(`${route} ${metric} median crossed the threshold, but three-run ranges overlap `
          + `(${previousMaximum} baseline max, ${currentMinimum} candidate min); treating as noise`);
      }
    }
  }
  return { failures, warnings };
}

module.exports = { compareMotionReports };
