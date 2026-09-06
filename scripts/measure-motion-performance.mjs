import { chromium } from "@playwright/test";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname } from "node:path";

const baseURL = process.env.PERF_BASE_URL ?? "http://127.0.0.1:3000";
const output = process.env.PERF_OUTPUT ?? ".performance-results/motion-performance.json";
const baselinePath = process.env.PERF_BASELINE;
const routes = ["/", "/skills-page", "/code-review-page"];
const median = (values) => [...values].sort((a, b) => a - b)[Math.floor(values.length / 2)];
const report = { profile: { cpu: 4, latency: 150, download: 200000, viewport: [1366, 768] }, routes: {} };
const browser = await chromium.launch();
try {
  for (const route of routes) {
    const runs = [];
    for (let index = 0; index < 3; index += 1) {
      const context = await browser.newContext({ viewport: { width: 1366, height: 768 }, reducedMotion: "no-preference" });
      const page = await context.newPage();
      const cdp = await context.newCDPSession(page);
      await cdp.send("Emulation.setCPUThrottlingRate", { rate: 4 });
      await cdp.send("Network.enable");
      await cdp.send("Network.emulateNetworkConditions", {
        offline: false, latency: 150, downloadThroughput: 200000, uploadThroughput: 93750,
      });
      await page.addInitScript(() => {
        localStorage.setItem("theme", "light");
        const metrics = window.motionMetrics = { lcp: 0, cls: 0, blocking: 0, longTasks: [], frames: [] };
        new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) metrics.lcp = entry.startTime;
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
        let previous;
        const frame = (now) => {
          if (previous !== undefined) metrics.frames.push(now - previous);
          previous = now;
          requestAnimationFrame(frame);
        };
        requestAnimationFrame(frame);
      });
      await page.goto(`${baseURL}${route}`, { waitUntil: "load" });
      await page.waitForTimeout(4000);
      runs.push(await page.evaluate(() => window.motionMetrics));
      await context.close();
    }
    report.routes[route] = {
      lcp: median(runs.map((run) => run.lcp)),
      blocking: median(runs.map((run) => run.blocking)),
      cls: median(runs.map((run) => run.cls)), runs,
    };
    console.log(route, JSON.stringify({ ...report.routes[route], runs: undefined }));
  }
} finally {
  await browser.close();
}
await mkdir(dirname(output), { recursive: true });
await writeFile(output, `${JSON.stringify(report, null, 2)}\n`);
for (const route of routes) {
  if (report.routes[route].cls > 0.05) throw new Error(`${route} CLS ${report.routes[route].cls}`);
}
if (baselinePath) {
  const baseline = JSON.parse(await readFile(baselinePath, "utf8"));
  if (JSON.stringify(baseline.profile) !== JSON.stringify(report.profile)) throw new Error("Performance profiles differ");
  const failures = [];
  for (const route of routes) {
    const current = report.routes[route];
    const previous = baseline.routes[route];
    if (!previous) throw new Error(`Missing baseline: ${route}`);
    for (const metric of ["lcp", "blocking"]) {
      if (current[metric] > previous[metric] * 1.15 && current[metric] - previous[metric] > 100) {
        failures.push(`${route} ${metric}: ${previous[metric]} -> ${current[metric]}`);
      }
    }
  }
  if (failures.length) throw new Error(failures.join("\n"));
}
