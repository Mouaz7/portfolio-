import fs from "node:fs/promises";
import { chromium, firefox, webkit } from "@playwright/test";

const baseUrl = process.env.PLAYWRIGHT_BASE_URL ?? "http://127.0.0.1:3000";
const outputPath = process.env.CSP_REPORT_OUTPUT;
const routes = ["/", "/skills", "/journey", "/projects", "/code-review", "/contact", "/privacy"];
const engines = { chromium, firefox, webkit };
const results = [];

for (const [engineName, engine] of Object.entries(engines)) {
  const browser = await engine.launch({ headless: true });
  try {
    const page = await browser.newPage();
    await page.addInitScript(() => {
      window.__cspViolations = [];
      document.addEventListener("securitypolicyviolation", (event) => {
        window.__cspViolations.push({
          blockedURI: event.blockedURI,
          disposition: event.disposition,
          effectiveDirective: event.effectiveDirective,
          sourceFile: event.sourceFile,
        });
      });
    });

    for (const route of routes) {
      const response = await page.goto(new URL(route, baseUrl).toString(), {
        waitUntil: "networkidle",
      });
      if (!response?.ok()) {
        throw new Error(`${engineName} ${route}: HTTP ${response?.status() ?? "no response"}`);
      }

      const policy = response.headers()["content-security-policy-report-only"];
      if (!policy) {
        throw new Error(`${engineName} ${route}: missing Content-Security-Policy-Report-Only`);
      }

      const violations = await page.evaluate(() => window.__cspViolations ?? []);
      results.push({ engine: engineName, route, violations });
      console.log(`${engineName} ${route}: ${violations.length} report-only violation(s)`);
    }
  } finally {
    await browser.close();
  }
}

if (outputPath) {
  await fs.writeFile(outputPath, `${JSON.stringify({ baseUrl, results }, null, 2)}\n`);
}

const violationCount = results.reduce((total, result) => total + result.violations.length, 0);
if (violationCount > 0) {
  console.error(
    `CSP report-only gate failed: ${violationCount} violation(s) across ${results.length} browser-route checks.`,
  );
  process.exitCode = 1;
}
