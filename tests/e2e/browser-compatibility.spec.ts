import { expect, test } from "@playwright/test";

test("background, menu and contact validation remain usable", async ({ page }) => {
  // WebKit upgrades loopback HTTP assets when production CSP asks for HTTPS.
  // The local Next server is HTTP-only; keep the rest of CSP intact. Real
  // preview/production checks use HTTPS and need no such harness adjustment.
  await page.route("**/*", async (route) => {
    if (!route.request().isNavigationRequest() || new URL(route.request().url()).hostname !== "127.0.0.1") {
      await route.continue();
      return;
    }
    const response = await route.fetch();
    const headers = response.headers();
    if (headers["content-security-policy"]) {
      headers["content-security-policy"] = headers["content-security-policy"].replace(/upgrade-insecure-requests;?/g, "");
    }
    await route.fulfill({ response, headers });
  });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/contact", { waitUntil: "domcontentloaded" });
  const canvas = page.locator("canvas[data-background-fps]");
  await expect(canvas).not.toHaveAttribute("data-background-device-tier", "pending");
  await page.getByRole("button", { name: "Open menu" }).click();
  await expect(page.getByRole("dialog", { name: "Site navigation" })).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("button", { name: "Open menu" })).toBeFocused();
  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect(canvas).toHaveAttribute("data-background-mode", "static");
  const form = page.locator('form[aria-label="Contact form"]:visible');
  const name = form.getByPlaceholder("Name");
  await name.fill("Test");
  await name.press("Enter");
  await expect(form.getByPlaceholder("Email")).toBeFocused();
  expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(1);
});

test("short desktop windows keep every public page usable", async ({ page }) => {
  test.setTimeout(120_000);
  await page.route("**/*", async (route) => {
    if (!route.request().isNavigationRequest() || new URL(route.request().url()).hostname !== "127.0.0.1") {
      await route.continue();
      return;
    }
    const response = await route.fetch();
    const headers = response.headers();
    if (headers["content-security-policy"]) {
      headers["content-security-policy"] = headers["content-security-policy"].replace(/upgrade-insecure-requests;?/g, "");
    }
    await route.fulfill({ response, headers });
  });
  await page.setViewportSize({ width: 1366, height: 600 });
  await page.emulateMedia({ reducedMotion: "reduce" });

  const checks = [
    { route: "/", ready: ".home-main", target: "[data-home-actions]" },
    { route: "/skills", ready: ".skills-bento-grid", target: ".skills-card-surface" },
    { route: "/journey", ready: ".commit-row", target: ".commit-row" },
    { route: "/projects", ready: ".projects-shell", target: ".projects-project-row" },
    { route: "/contact", ready: ".contact-repository-shell", target: ".site-footer" },
  ] as const;

  for (const check of checks) {
    await page.goto(`${check.route}?audit=performance`, { waitUntil: "domcontentloaded" });
    await expect(page.locator(check.ready).first(), check.route).toBeVisible();
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth - innerWidth),
      check.route,
    ).toBeLessThanOrEqual(1);
    const target = page.locator(check.target).last();
    if (check.route === "/projects") {
      // The last repository card is intentionally below the fold on this
      // scrolling page; verify that it can be reached instead of requiring
      // every card to fit in a 600 px-tall window at once.
      await target.scrollIntoViewIfNeeded();
    }
    await expect(target, check.route).toBeInViewport();

    if (check.route === "/journey") {
      const main = await page.locator(".journey-main").boundingBox();
      expect(main!.y + main!.height).toBeLessThanOrEqual(601);
    }
  }
});
