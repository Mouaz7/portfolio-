import { expect, test, type Page } from "@playwright/test";

async function measureHeader(page: Page) {
  // Streamed markup can exist in a hidden Suspense container while the
  // route loader is still visible. Measure only the painted desktop header.
  await expect(page.locator(".site-header-brand")).toBeVisible();
  await expect(page.locator(".site-header > .site-header-nav")).toBeVisible();
  await page.evaluate(async () => { await document.fonts.ready; });
  return page.evaluate(() => {
    const header = document.querySelector<HTMLElement>(".site-header");
    const brand = header?.querySelector<HTMLElement>(".site-header-brand");
    const nav = header?.querySelector<HTMLElement>(".site-header-nav");
    const label = nav?.querySelector<HTMLElement>(".site-header-nav-label");
    const active = nav?.querySelector<HTMLElement>(
      '.site-header-nav-item[aria-current="page"]',
    );
    const activeLabel = active?.querySelector<HTMLElement>(".site-header-nav-label");

    if (!header || !brand || !nav || !label || !active || !activeLabel) {
      throw new Error("Desktop header is incomplete");
    }

    const brandRect = brand.getBoundingClientRect();
    const navRect = nav.getBoundingClientRect();
    const underline = getComputedStyle(active, "::after");

    return {
      brandLeft: Math.round(brandRect.left),
      brandNavClearance: navRect.left - brandRect.right,
      navRightGap: Math.round(window.innerWidth - navRect.right),
      navGap: getComputedStyle(nav).columnGap,
      labelSize: getComputedStyle(label).fontSize,
      underlineHeight: underline.height,
      underlineColor: underline.backgroundColor,
      activeLabelColor: getComputedStyle(activeLabel).color,
      activeLabelWeight: getComputedStyle(activeLabel).fontWeight,
      documentOverflow: document.documentElement.scrollWidth - window.innerWidth,
      headerOverflow: header.scrollWidth - header.clientWidth,
    };
  });
}

test("desktop header keeps edge spacing and portfolio colors", async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem("theme", "light"));
  const profiles = [
    { path: "/sv", width: 1240, height: 900 },
    { path: "/", width: 1728, height: 900 },
    { path: "/", width: 3439, height: 1325 },
  ] as const;

  for (const profile of profiles) {
    await page.setViewportSize({ width: profile.width, height: profile.height });
    await page.goto(profile.path);

    const geometry = await measureHeader(page);
    const context = `${profile.path} at ${profile.width}px`;

    expect(geometry.brandLeft, context).toBe(12);
    expect(geometry.navRightGap, context).toBe(12);
    expect(geometry.labelSize, context).toBe("20px");
    expect(geometry.navGap, context).toBe("20px");
    expect(geometry.underlineHeight, context).toBe("2px");
    expect(geometry.underlineColor, context).toBe("rgb(8, 185, 190)");
    expect(geometry.activeLabelColor, context).toBe("rgb(0, 109, 115)");
    expect(geometry.activeLabelWeight, context).toBe("800");
    expect(geometry.brandNavClearance, context).toBeGreaterThan(0);
    expect(geometry.documentOverflow, context).toBeLessThanOrEqual(1);
    expect(geometry.headerOverflow, context).toBeLessThanOrEqual(1);
  }
});

test("active desktop navigation uses the dark portfolio palette", async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem("theme", "dark"));
  await page.setViewportSize({ width: 1240, height: 900 });
  await page.goto("/sv");

  const geometry = await measureHeader(page);
  expect(geometry.underlineColor).toBe("rgb(25, 227, 194)");
  expect(geometry.activeLabelColor).toBe("rgb(47, 208, 186)");
  expect(geometry.activeLabelWeight).toBe("800");
});

test("compact desktop and phone navigation keep their available space", async ({ page }) => {
  await page.setViewportSize({ width: 901, height: 900 });
  await page.goto("/sv");

  await expect(page.locator(".site-header > .site-header-nav")).toBeVisible();
  const compact = await measureHeader(page);
  expect(compact.brandNavClearance).toBeGreaterThan(0);
  expect(compact.navRightGap).toBeGreaterThanOrEqual(0);
  expect(compact.documentOverflow).toBeLessThanOrEqual(1);
  expect(compact.headerOverflow).toBeLessThanOrEqual(1);

  await page.setViewportSize({ width: 390, height: 844 });
  await expect(page.locator(".site-header > .site-header-nav")).toBeHidden();
  const menuButton = page.getByRole("button", { name: "Öppna meny" });
  await expect(menuButton).toBeVisible();
  await menuButton.click();
  await expect(page.locator(".site-header-mobile-panel")).toHaveAttribute("data-open", "true");
  expect(await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth))
    .toBeLessThanOrEqual(1);
});
