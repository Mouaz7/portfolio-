import { expect, test } from "@playwright/test";

// Hold external application scripts while allowing streamed HTML and CSS to
// render. This verifies the actual pre-hydration layout, rather than merely
// asserting that the new selectors exist in the source.
const profiles = [
  [390, 500], [390, 844], [640, 960], [675, 900], [676, 900],
  [967, 943], [1000, 800], [1200, 1000], [1600, 1000],
  [1366, 768], [2200, 1100], [2200, 1400], [3200, 1500],
];

for (const locale of ["en", "sv", "ar"]) {
  test(`Skills fits before hydration and preserves its layout (${locale})`, async ({ browser }) => {
    test.setTimeout(120_000);
    const sizes = locale === "en" ? profiles : [[390, 500], [1366, 768]];
    for (const [width, height] of sizes) {
      const context = await browser.newContext({ viewport: { width, height }, reducedMotion: "reduce" });
      await context.addInitScript(() => { localStorage.setItem("theme", "light"); });
      const page = await context.newPage();
      // As in browser-compatibility.spec.ts, the HTTP-only loopback server
      // cannot satisfy WebKit's HTTPS upgrades. Preserve all other CSP rules.
      await page.route("**/*", async (route) => {
        const url = new URL(route.request().url());
        if (!route.request().isNavigationRequest() || url.protocol !== "http:" || url.hostname !== "127.0.0.1") {
          await route.fallback();
          return;
        }
        const response = await route.fetch();
        const headers = response.headers();
        if (headers["content-security-policy"]) {
          headers["content-security-policy"] = headers["content-security-policy"].replace(/upgrade-insecure-requests;?/g, "");
        }
        await route.fulfill({ response, headers });
      });
      let releaseScripts!: () => void;
      const scriptsReady = new Promise<void>((resolve) => { releaseScripts = resolve; });
      await page.route(/\/_next\/static\/.*\.js(?:\?|$)/, async (route) => {
        await scriptsReady;
        await route.continue();
      });
      const errors: string[] = [];
      page.on("pageerror", (error) => errors.push(error.message));
      try {
        await page.goto(locale === "en" ? "/skills" : `/${locale}/skills`, { waitUntil: "commit" });
        const main = page.locator(".skills-stage");
        await expect(main).toHaveAttribute("data-initial-layout", "pending");
        const supportsInitialLayout = await page.evaluate(() => CSS.supports("transform", "scale(calc(1px / 1px))"));
        const grid = page.locator(".skills-bento-grid");
        const geometry = () => grid.evaluate((element) => {
          const nodes = [element, ...element.querySelectorAll("li, .skills-card-surface, .skills-card-title, .skills-card-body, .skills-card-label, [data-skill-canvas], svg")];
          return nodes.map((node) => {
            const box = node.getBoundingClientRect();
            const style = getComputedStyle(node);
            return {
              box: [box.x, box.y, box.width, box.height],
              fontSize: style.fontSize,
              lineHeight: style.lineHeight,
              display: style.display,
            };
          });
        });
        let before: Awaited<ReturnType<typeof geometry>> | undefined;
        if (supportsInitialLayout) {
          await expect(grid).toBeVisible();
          await expect.poll(() => page.evaluate(() => document.fonts.status)).toBe("loaded");
          before = await geometry();
        } else {
          await expect(grid).toBeHidden();
        }
        releaseScripts();
        await expect(main).not.toHaveAttribute("data-initial-layout", "pending");
        await expect(main).toHaveAttribute("data-skills-layout", width >= 640 ? "desktop" : "phone");
        await expect(grid).toBeVisible();
        await expect.poll(() => page.evaluate(() => document.fonts.status)).toBe("loaded");
        if (before) {
          const after = await geometry();
          expect(after.length).toBe(before.length);
          for (let index = 0; index < after.length; index += 1) {
            const label = `${locale} ${width}x${height}, node ${index}`;
            expect(after[index].fontSize, label).toBe(before[index].fontSize);
            expect(after[index].lineHeight, label).toBe(before[index].lineHeight);
            expect(after[index].display, label).toBe(before[index].display);
            for (let axis = 0; axis < 4; axis += 1) {
              expect(Math.abs(after[index].box[axis] - before[index].box[axis]), `${label}, axis ${axis}`).toBeLessThanOrEqual(1);
            }
          }
        }
        if (height === 500) {
          await expect(main).toHaveAttribute("data-skills-overflow", "scroll");
          await grid.locator("li").last().scrollIntoViewIfNeeded();
          await expect(grid.locator("li").last()).toBeInViewport();
        }
        expect(errors).toEqual([]);
      } finally {
        releaseScripts();
        await context.close();
      }
    }
  });
}
