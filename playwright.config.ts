import { defineConfig } from "@playwright/test";

const port = process.env.PLAYWRIGHT_PORT ?? "3000";
const externalBaseURL = process.env.PLAYWRIGHT_BASE_URL;
const baseURL = externalBaseURL ?? `http://127.0.0.1:${port}`;

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: true,
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? [["html", { open: "never" }], ["github"]] : "list",
  projects: [
    { name: "chromium", use: { browserName: "chromium" } },
    { name: "firefox", testMatch: ["browser-compatibility.spec.ts", "skills-first-paint.spec.ts"], use: { browserName: "firefox" } },
    { name: "webkit", testMatch: ["browser-compatibility.spec.ts", "skills-first-paint.spec.ts"], use: { browserName: "webkit" } },
  ],
  use: {
    baseURL,
    browserName: "chromium",
    trace: "retain-on-failure",
  },
  webServer: externalBaseURL ? undefined : {
    command: `npm start -- -H 127.0.0.1 -p ${port}`,
    reuseExistingServer: !process.env.CI,
    timeout: 60_000,
    url: baseURL,
  },
});
