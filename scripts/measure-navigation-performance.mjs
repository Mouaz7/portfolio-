import { chromium } from "@playwright/test";
import { writeFile } from "node:fs/promises";

const baseURL = (process.env.NAVIGATION_BASE_URL ?? "http://127.0.0.1:3000").replace(/\/$/, "");
const attempts = 5;
const targets = [
  { label: "Skills", path: "/skills", ready: ".skills-bento-grid" },
  { label: "Journey", path: "/journey", ready: '[data-journey-fit="desktop"]' },
  { label: "Projects", path: "/projects", ready: ".projects-shell" },
  { label: "Contact", path: "/contact", ready: ".contact-repository-shell" },
];

function median(values) {
  const ordered = [...values].sort((left, right) => left - right);
  const middle = Math.floor(ordered.length / 2);
  return ordered.length % 2 === 0
    ? (ordered[middle - 1] + ordered[middle]) / 2
    : ordered[middle];
}

const browser = await chromium.launch();
const context = await browser.newContext({
  locale: "en-US",
  reducedMotion: "reduce",
  viewport: { width: 1440, height: 900 },
});
await context.addCookies([{
  domain: new URL(baseURL).hostname,
  name: "portfolio-locale",
  path: "/",
  value: "en",
}]);
const page = await context.newPage();
const browserErrors = [];
page.on("console", (message) => {
  if (message.type() === "error") browserErrors.push(`console: ${message.text()}`);
});
page.on("pageerror", (error) => browserErrors.push(`page: ${error.message}`));

const results = [];
try {
  for (const target of targets) {
    const samples = [];
    await page.goto(`${baseURL}/`, { waitUntil: "domcontentloaded" });
    await page.locator(".home-main").waitFor({ state: "visible" });
    for (let attempt = 1; attempt <= attempts; attempt += 1) {
      const link = page.locator(`nav a[href="${target.path}"]:visible`).first();
      await link.hover();
      const startedAt = performance.now();
      await Promise.all([
        page.waitForURL((url) => url.pathname === target.path),
        link.click(),
      ]);
      const urlMs = performance.now() - startedAt;
      await page.locator(target.ready).first().waitFor({ state: "visible" });
      const visibleMs = performance.now() - startedAt;
      samples.push({
        attempt,
        urlMs: Number(urlMs.toFixed(1)),
        visibleMs: Number(visibleMs.toFixed(1)),
      });

      const homeLink = page.locator('nav a[href="/"]:visible').first();
      await Promise.all([
        page.waitForURL((url) => url.pathname === "/"),
        homeLink.click(),
      ]);
      await page.locator(".home-main").waitFor({ state: "visible" });
    }

    const medianUrlMs = Number(median(samples.map((sample) => sample.urlMs)).toFixed(1));
    const medianVisibleMs = Number(median(samples.map((sample) => sample.visibleMs)).toFixed(1));
    results.push({
      ...target,
      medianUrlMs,
      medianVisibleMs,
      passed: medianUrlMs < 200 && medianVisibleMs < 500,
      samples,
    });
  }
} finally {
  await browser.close();
}

const report = {
  baseURL,
  browser: "chromium",
  classification: "preliminary_local_observation",
  generatedAt: new Date().toISOString(),
  notes: [
    "urlMs measures client-side URL commitment after an intentional desktop navigation click.",
    "visibleMs measures the first visible route-specific content after the same click.",
    "Each route is clicked five times in one browser session and returns through the Home link, preserving the real App Router cache.",
    "These local repeated-navigation measurements are not Core Web Vitals field data.",
  ],
  targets: { medianUrlMs: 200, medianVisibleMs: 500 },
  results,
  browserErrors,
};

const serialized = `${JSON.stringify(report, null, 2)}\n`;
process.stdout.write(serialized);
if (process.env.NAVIGATION_OUTPUT) {
  await writeFile(process.env.NAVIGATION_OUTPUT, serialized, "utf8");
}

if (browserErrors.length > 0 || results.some((result) => !result.passed)) {
  process.exitCode = 1;
}
