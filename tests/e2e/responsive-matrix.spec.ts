import { expect, test } from "@playwright/test";

const sizes = [
  [800, 600], [900, 600], [1024, 600], [1024, 768], [1280, 720], [1366, 768],
  [712, 1138], [768, 1024], [853, 1280], [912, 1368], [960, 1440], [1032, 1376], [1280, 800],
];
const pages = ["/", "/skills-page", "/journey", "/projects-page", "/code-review-page", "/contact-page"];
for (const [width, height] of sizes) {
  for (const theme of ["light", "dark"]) {
    test(`${theme} public pages stay reachable at ${width}x${height}`, async ({ page }) => {
      await page.setViewportSize({ width, height });
      await page.emulateMedia({ reducedMotion: "reduce" });
      await page.addInitScript((value) => localStorage.setItem("theme", value), theme);
      for (const route of pages) {
        await page.goto(route);
        await expect(page.locator("main").first()).toBeVisible();
        const viewportRoot = page.locator("[data-viewport-page]").first();
        await expect(viewportRoot).toBeVisible();
        await expect(page.locator(".la-window")).toHaveCount(0);
        const viewportGeometry = await page.evaluate(() => {
          const root = document.querySelector<HTMLElement>("[data-viewport-page]");
          const rect = root?.getBoundingClientRect();
          return {
            horizontalOverflow: document.documentElement.scrollWidth - innerWidth,
            documentHeight: document.documentElement.scrollHeight,
            rootTop: rect?.top ?? -1,
            rootBottom: rect?.bottom ?? -1,
            viewportHeight: innerHeight,
          };
        });
        expect(viewportGeometry.horizontalOverflow, route).toBeLessThanOrEqual(1);
        expect(viewportGeometry.documentHeight, route).toBeLessThanOrEqual(viewportGeometry.viewportHeight + 1);
        expect(viewportGeometry.rootTop, route).toBeGreaterThanOrEqual(0);
        expect(viewportGeometry.rootBottom, route).toBeLessThanOrEqual(viewportGeometry.viewportHeight + 1);
        const controls = page.locator('main button:visible:not([disabled]), main input:visible:not([disabled]), main textarea:visible:not([disabled])');
        if (await controls.count()) {
          const last = controls.last();
          await last.scrollIntoViewIfNeeded();
          await expect(last, route).toBeInViewport({ ratio: 0.95 });
        }
      }
    });
  }
}
