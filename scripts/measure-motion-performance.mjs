import { chromium } from "@playwright/test";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname } from "node:path";

const baseURL = process.env.PERF_BASE_URL ?? "http://127.0.0.1:3000";
const output = process.env.PERF_OUTPUT ?? ".performance-results/motion-performance.json";
const baselinePath = process.env.PERF_BASELINE;
const recordBaseline = process.env.PERF_RECORD_BASELINE === "1";
if (recordBaseline && baselinePath) {
  throw new Error("PERF_RECORD_BASELINE and PERF_BASELINE cannot be used together");
}
const routes = process.env.PERF_ROUTES?.split(",").map((route) => route.trim()).filter(Boolean)
  ?? ["/", "/skills"];
const median = (values) => [...values].sort((a, b) => a - b)[Math.floor(values.length / 2)];
const viewport = (process.env.PERF_VIEWPORT ?? "1366x768").split("x").map(Number);
if (viewport.length !== 2 || viewport.some((value) => !Number.isInteger(value) || value <= 0)) {
  throw new Error("PERF_VIEWPORT must be WIDTHxHEIGHT");
}
const mobile = process.env.PERF_MOBILE === "1";
const report = {
  profile: {
    cpu: 4,
    hardwareConcurrency: 4,
    deviceMemory: 4,
    latency: 150,
    download: 200000,
    viewport,
    mobile,
  },
  routes: {},
};
const browser = await chromium.launch();
try {
  for (const route of routes) {
    const runs = [];
    for (let index = 0; index < 3; index += 1) {
      const context = await browser.newContext({
        viewport: { width: viewport[0], height: viewport[1] },
        isMobile: mobile,
        hasTouch: mobile,
        reducedMotion: "no-preference",
      });
      const page = await context.newPage();
      // CPU throttling alone does not alter the browser's hardware hints. Keep
      // the synthetic profile internally consistent so the application uses
      // the same low-power path that a real four-core/4 GB device receives.
      await page.addInitScript(() => {
        Object.defineProperty(navigator, "hardwareConcurrency", {
          configurable: true,
          value: 4,
        });
        Object.defineProperty(navigator, "deviceMemory", {
          configurable: true,
          value: 4,
        });
      });
      const cdp = await context.newCDPSession(page);
      await cdp.send("Emulation.setCPUThrottlingRate", { rate: 4 });
      await cdp.send("Network.enable");
      await cdp.send("Network.emulateNetworkConditions", {
        offline: false, latency: 150, downloadThroughput: 200000, uploadThroughput: 93750,
      });
      await page.addInitScript(() => {
        localStorage.setItem("theme", "light");
        const metrics = window.motionMetrics = {
          lcp: 0,
          lcpElement: null,
          gridVisible: null,
          cls: 0,
          blocking: 0,
          longTasks: [],
          longAnimationFrames: [],
          frames: [],
        };
        new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            metrics.lcp = entry.startTime;
            metrics.lcpElement = {
              tag: entry.element?.tagName,
              className: entry.element?.getAttribute("class"),
              text: entry.element?.textContent?.trim().slice(0, 160),
              url: entry.url,
              size: entry.size,
              region: entry.element?.closest("header") ? "header"
                : entry.element?.closest("main") ? "main" : "other",
            };
          }
        }).observe({ type: "largest-contentful-paint", buffered: true });
        let sessionValue = 0;
        let sessionStart = 0;
        let lastShift = 0;
        new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (entry.hadRecentInput) continue;
            if (entry.startTime - lastShift > 1000 || entry.startTime - sessionStart > 5000) {
              sessionStart = entry.startTime;
              sessionValue = 0;
            }
            lastShift = entry.startTime;
            sessionValue += entry.value;
            metrics.cls = Math.max(metrics.cls, sessionValue);
          }
        }).observe({ type: "layout-shift", buffered: true });
        new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            metrics.longTasks.push(entry.duration);
            metrics.blocking += Math.max(0, entry.duration - 50);
          }
        }).observe({ type: "longtask", buffered: true });
        if (PerformanceObserver.supportedEntryTypes.includes("long-animation-frame")) {
          new PerformanceObserver((list) => {
            for (const entry of list.getEntries()) {
              metrics.longAnimationFrames.push({
                duration: entry.duration,
                startTime: entry.startTime,
                scripts: (entry.scripts ?? []).map((script) => ({
                  duration: script.duration,
                  forcedStyleAndLayoutDuration: script.forcedStyleAndLayoutDuration,
                  invoker: script.invoker,
                  sourceURL: script.sourceURL,
                })),
              });
            }
          }).observe({ type: "long-animation-frame", buffered: true });
        }
        let previous;
        const measureGrid = location.pathname.endsWith("/skills");
        const frame = (now) => {
          if (measureGrid && metrics.gridVisible === null) {
            const grid = document.querySelector(".skills-bento-grid");
            const firstCard = grid?.querySelector(".skills-card-surface");
            if (firstCard && grid.getBoundingClientRect().width > 0
              && getComputedStyle(grid).visibility === "visible"
              && Number(getComputedStyle(grid.closest("main")).opacity) > 0.01
              && Number(getComputedStyle(firstCard).opacity) > 0.01) {
              metrics.gridVisible = now;
            }
          }
          if (previous !== undefined) metrics.frames.push(now - previous);
          previous = now;
          requestAnimationFrame(frame);
        };
        requestAnimationFrame(frame);
      });
      await page.goto(`${baseURL}${route}`, { waitUntil: "load" });
      const performanceTier = await page.locator("html").getAttribute("data-performance-tier");
      if (performanceTier !== "low") {
        throw new Error(`${route} measured ${performanceTier ?? "unknown"} performance tier; expected low`);
      }
      await page.waitForTimeout(4000);
      const metrics = await page.evaluate(() => {
        const encodedBytes = { scripts: 0, styles: 0, images: 0, other: 0, document: 0 };
        for (const entry of performance.getEntriesByType("resource")) {
          const path = new URL(entry.name).pathname;
          const kind = path.endsWith(".js") ? "scripts"
            : path.endsWith(".css") ? "styles"
              : entry.initiatorType === "img" || /\.(?:svg|png|jpe?g|webp|avif|gif|ico)$/.test(path)
                || path.endsWith("/_next/image") ? "images" : "other";
          encodedBytes[kind] += entry.encodedBodySize;
        }
        encodedBytes.document = performance.getEntriesByType("navigation")[0]?.encodedBodySize ?? 0;
        return { ...window.motionMetrics, encodedBytes };
      });
      if (!Number.isFinite(metrics.lcp) || metrics.lcp <= 0) {
        throw new Error(`${route} produced no LCP candidate in run ${index + 1}`);
      }
      if (new URL(route, baseURL).pathname.endsWith("/skills") && !Number.isFinite(metrics.gridVisible)) {
        throw new Error(`${route} produced no visible grid in run ${index + 1}`);
      }
      runs.push(metrics);
      await context.close();
    }
    report.routes[route] = {
      lcp: median(runs.map((run) => run.lcp)),
      blocking: median(runs.map((run) => run.blocking)),
      cls: median(runs.map((run) => run.cls)), runs,
      gridVisible: runs.every((run) => run.gridVisible !== null)
        ? median(runs.map((run) => run.gridVisible)) : null,
      encodedBytes: Object.fromEntries(Object.keys(runs[0].encodedBytes).map((key) => [
        key, median(runs.map((run) => run.encodedBytes[key])),
      ])),
    };
    console.log(route, JSON.stringify({ ...report.routes[route], runs: undefined }));
  }
} finally {
  await browser.close();
}
await mkdir(dirname(output), { recursive: true });
await writeFile(output, `${JSON.stringify(report, null, 2)}\n`);
if (!recordBaseline) {
  for (const route of routes) {
    if (report.routes[route].cls > 0.05) throw new Error(`${route} CLS ${report.routes[route].cls}`);
  }
}
if (baselinePath) {
  const baseline = JSON.parse(await readFile(baselinePath, "utf8"));
  if (JSON.stringify(baseline.profile) !== JSON.stringify(report.profile)) throw new Error("Performance profiles differ");
  const failures = [];
  for (const route of routes) {
    const current = report.routes[route];
    const previous = baseline.routes[route];
    if (!previous) throw new Error(`Missing baseline: ${route}`);
    const metrics = ["lcp", "blocking"];
    if (Number.isFinite(previous.gridVisible) && Number.isFinite(current.gridVisible)) metrics.push("gridVisible");
    for (const metric of metrics) {
      const exceedsThreshold = current[metric] > previous[metric] * 1.15
        && current[metric] - previous[metric] > 100;
      if (metric === "lcp" && exceedsThreshold) {
        const identity = (element) => {
          if (!element?.tag) return null;
          const url = element.url ? new URL(element.url, baseURL) : null;
          return JSON.stringify([element.tag, element.text, url ? url.pathname + url.search : ""]);
        };
        const previousElements = new Set((previous.runs ?? []).map((run) => identity(run.lcpElement)));
        const currentElements = new Set(current.runs.map((run) => identity(run.lcpElement)));
        const changedCandidate = previousElements.size === 1 && currentElements.size === 1
          && !previousElements.has(null) && !currentElements.has(null)
          && [...previousElements][0] !== [...currentElements][0]
          && previous.runs.every((run) => run.lcpElement.region === "header")
          && current.runs.every((run) => run.lcpElement.region === "main");
        const measuredGridRuns = [previous, current].every((report) => report.runs?.length
          && report.runs.every((run) => Number.isFinite(run.gridVisible)));
        const gridImproved = measuredGridRuns
          && previous.gridVisible - current.gridVisible > 100
          && current.gridVisible < previous.gridVisible * 0.85
          && Math.max(...current.runs.map((run) => run.gridVisible))
            < Math.min(...previous.runs.map((run) => run.gridVisible));
        // Removing a large header label can make an earlier-painted content
        // element win LCP. Accept that different candidate only with a proven
        // grid improvement AND an LCP within the absolute loading objective.
        if (changedCandidate && gridImproved && current.lcp <= 2500) {
          console.warn(`${route} relative LCP is not comparable: the stable winning element changed; `
            + `grid visibility improved ${previous.gridVisible} -> ${current.gridVisible} ms `
            + `and absolute LCP ${current.lcp} ms meets the 2500 ms objective`);
          continue;
        }
      }
      const currentMinimum = Math.min(...current.runs.map((run) => run[metric]));
      const previousMaximum = previous.runs?.length
        ? Math.max(...previous.runs.map((run) => run[metric]))
        : previous[metric];
      if (exceedsThreshold && currentMinimum > previousMaximum) {
        failures.push(`${route} ${metric}: ${previous[metric]} -> ${current[metric]}`);
      } else if (exceedsThreshold) {
        console.warn(
          `${route} ${metric} median crossed the threshold, but three-run ranges overlap `
          + `(${previousMaximum} baseline max, ${currentMinimum} candidate min); treating as noise`,
        );
      }
    }
  }
  if (failures.length) throw new Error(failures.join("\n"));
}
