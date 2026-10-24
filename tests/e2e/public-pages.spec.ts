import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";
import { mkdir } from "node:fs/promises";
import sharp from "sharp";

const routes = [
  "/",
  "/skills",
  "/journey",
  "/projects",
  "/contact",
] as const;
const publicSurfaceSelectors: Record<(typeof routes)[number], string> = {
  "/": ".home-main",
  "/skills": ".skills-bento-grid",
  "/journey": '[data-journey-fit="desktop"]',
  "/projects": ".projects-shell",
  "/contact": ".contact-repository-shell",
};
const viewports = [
  { name: "mobile", width: 390, height: 844 },
  { name: "tablet", width: 768, height: 1024 },
  { name: "desktop", width: 1440, height: 900 },
] as const;
const adaptiveViewports = [
  { name: "reported-windows-split", width: 1723, height: 608 },
  { name: "compact-laptop-800", width: 800, height: 600 },
  { name: "compact-laptop-900", width: 900, height: 600 },
  { name: "compact-laptop-1024", width: 1024, height: 600 },
  { name: "small-laptop", width: 1024, height: 768 },
  { name: "short-desktop", width: 1280, height: 720 },
  { name: "standard-laptop", width: 1366, height: 768 },
  { name: "standard-desktop", width: 1440, height: 900 },
  { name: "galaxy-tab-s4", width: 712, height: 1138 },
  { name: "ipad-mini", width: 768, height: 1024 },
  { name: "zenbook-fold", width: 853, height: 1280 },
  { name: "surface-pro-7", width: 912, height: 1368 },
  { name: "surface-pro-10", width: 960, height: 1440 },
  { name: "ipad-pro-13", width: 1032, height: 1376 },
  { name: "nest-hub-max", width: 1280, height: 800 },
] as const;
const visualOutput = "test-results/visual-actual";

function routeName(route: (typeof routes)[number]) {
  // Preserve the approved screenshot filenames while exercising canonical URLs.
  return route === "/" ? "home" : route === "/journey" ? "journey" : `${route.slice(1)}-page`;
}

async function waitUntil(startedAt: number, elapsedMs: number) {
  const remaining = elapsedMs - (Date.now() - startedAt);
  if (remaining > 0) await new Promise((resolve) => setTimeout(resolve, remaining));
}

async function expectedBackgroundFps(page: Page) {
  return page.evaluate(() => {
    const lowPowerViewport = window.matchMedia(
      "(max-width: 675px), (max-width: 960px) and (hover: none), (max-width: 960px) and (pointer: coarse)",
    ).matches || (navigator.hardwareConcurrency > 0 && navigator.hardwareConcurrency <= 4);
    return lowPowerViewport ? "30" : "60";
  });
}

async function backgroundSmoothness(png: Buffer) {
  const { data, info } = await sharp(png)
    .removeAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const luminance = new Uint16Array(info.width * info.height);

  for (let source = 0, pixel = 0; source < data.length; source += info.channels, pixel += 1) {
    luminance[pixel] = (
      (77 * data[source])
      + (150 * data[source + 1])
      + (29 * data[source + 2])
    ) >> 8;
  }

  let maxNeighborDelta = 0;
  let maxLaplacian = 0;
  for (let y = 1; y < info.height - 1; y += 1) {
    for (let x = 1; x < info.width - 1; x += 1) {
      const index = (y * info.width) + x;
      maxNeighborDelta = Math.max(
        maxNeighborDelta,
        Math.abs(luminance[index] - luminance[index + 1]),
        Math.abs(luminance[index] - luminance[index + info.width]),
      );
      maxLaplacian = Math.max(
        maxLaplacian,
        Math.abs(
          (4 * luminance[index])
          - luminance[index - 1]
          - luminance[index + 1]
          - luminance[index - info.width]
          - luminance[index + info.width]
        ),
      );
    }
  }

  return { maxLaplacian, maxNeighborDelta };
}

async function backgroundFrameDelta(firstPng: Buffer, secondPng: Buffer) {
  const [first, second] = await Promise.all([
    sharp(firstPng).removeAlpha().raw().toBuffer({ resolveWithObject: true }),
    sharp(secondPng).removeAlpha().raw().toBuffer({ resolveWithObject: true }),
  ]);
  if (
    first.info.width !== second.info.width
    || first.info.height !== second.info.height
    || first.info.channels !== second.info.channels
  ) {
    throw new Error("Background frames must have identical dimensions");
  }

  let totalDelta = 0;
  for (let index = 0; index < first.data.length; index += 1) {
    totalDelta += Math.abs(first.data[index] - second.data[index]);
  }
  return totalDelta / first.data.length;
}

async function backgroundColorSignature(png: Buffer) {
  const { data, info } = await sharp(png)
    .removeAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const pixelCount = data.length / info.channels;
  const sums = [0, 0, 0];
  const squaredSums = [0, 0, 0];

  for (let source = 0; source < data.length; source += info.channels) {
    for (let channel = 0; channel < 3; channel += 1) {
      const value = data[source + channel];
      sums[channel] += value;
      squaredSums[channel] += value * value;
    }
  }

  const mean = sums.map((sum) => sum / pixelCount);
  const deviation = squaredSums.map((sum, channel) => (
    Math.sqrt((sum / pixelCount) - (mean[channel] * mean[channel]))
  ));
  return { deviation, mean };
}

for (const viewport of viewports) {
  for (const theme of ["light", "dark"] as const) {
    test.describe(`${viewport.name} ${theme}`, () => {
      test.use({ viewport });
      for (const route of routes) {
        test(`${route} has no serious accessibility failures`, async ({ page }) => {
          await page.emulateMedia({ reducedMotion: "reduce" });
          await page.addInitScript((selectedTheme) => localStorage.setItem("theme", selectedTheme), theme);
          const startedAt = Date.now();
          await page.goto(route);
          const navigationFinishedAt = Date.now();
          await page.addStyleTag({
            content: "*,*::before,*::after{animation:none!important;transition:none!important;caret-color:transparent!important}canvas{visibility:hidden!important}",
          });
          await mkdir(visualOutput, { recursive: true });
          await waitUntil(startedAt, 790);
          await page.screenshot({
            path: `${visualOutput}/${viewport.name}-${routeName(route)}-${theme}-before-800.png`,
          });
          await waitUntil(startedAt, 810);
          await page.screenshot({
            path: `${visualOutput}/${viewport.name}-${routeName(route)}-${theme}-after-800.png`,
          });
          await waitUntil(navigationFinishedAt, 5_000);
          if (route === "/skills") {
            await expect(page.locator(".skills-card-surface").first()).toBeVisible();
          }
          await page.evaluate(async () => {
            await document.fonts.ready;
            await Promise.all(Array.from(document.images, (image) => {
              if (image.complete) return Promise.resolve();
              return new Promise<void>((resolve) => {
                image.addEventListener("load", () => resolve(), { once: true });
                image.addEventListener("error", () => resolve(), { once: true });
              });
            }));
          });
          await expect(page.locator("body")).toBeVisible();
          await page.screenshot({
            path: `${visualOutput}/${viewport.name}-${routeName(route)}-${theme}.png`,
          });
          const results = await new AxeBuilder({ page }).analyze();
          const blocking = results.violations.filter(
            (item) => ["serious", "critical"].includes(item.impact ?? ""),
          );
          expect(blocking).toEqual([]);
        });
      }
    });
  }
}

test("privacy page remains accessible in both themes and at 400 percent reflow", async ({ browser }) => {
  test.setTimeout(90_000);

  for (const viewport of [
    { name: "400-percent-reflow", width: 320, height: 800 },
    { name: "desktop", width: 1440, height: 900 },
  ] as const) {
    for (const theme of ["light", "dark"] as const) {
      const context = await browser.newContext({ viewport });
      await context.addInitScript((selectedTheme) => localStorage.setItem("theme", selectedTheme), theme);
      const page = await context.newPage();
      await page.emulateMedia({ reducedMotion: "reduce" });
      await page.goto("/privacy");

      const label = `${viewport.name} ${theme}`;
      const privacyPage = page.locator("[data-privacy-page]");
      const privacyMain = privacyPage.locator("main");
      await expect(page.getByRole("heading", { name: "Privacy", level: 1 }), label).toBeVisible();
      await expect(page.locator(".site-footer"), label).toBeInViewport();
      expect(
        await page.evaluate(() => document.documentElement.scrollWidth - innerWidth),
        label,
      ).toBeLessThanOrEqual(1);

      await privacyMain.evaluate((element) => element.scrollTo(0, element.scrollHeight));
      await expect(page.getByRole("link", { name: "Go to Contact" }), label).toBeVisible();

      const results = await new AxeBuilder({ page }).analyze();
      const blocking = results.violations.filter(
        (item) => ["serious", "critical"].includes(item.impact ?? ""),
      );
      expect(blocking, label).toEqual([]);
      await context.close();
    }
  }
});

test("privacy page is localized in English, Swedish and Arabic", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.emulateMedia({ reducedMotion: "reduce" });

  for (const entry of [
    { route: "/privacy", locale: "en", direction: "ltr", title: "Privacy" },
    { route: "/sv/privacy", locale: "sv", direction: "ltr", title: "Integritet" },
    { route: "/ar/privacy", locale: "ar", direction: "rtl", title: "الخصوصية" },
  ] as const) {
    await page.goto(entry.route);
    await expect(page.locator("html")).toHaveAttribute("lang", entry.locale);
    await expect(page.locator("html")).toHaveAttribute("dir", entry.direction);
    await expect(page.getByRole("heading", { name: entry.title, level: 1 })).toBeVisible();
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth - innerWidth),
      entry.route,
    ).toBeLessThanOrEqual(1);
  }
});

test("mobile project repository stats stay readable inside the card", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/projects");

  const firstCard = page.locator(".projects-mobile-card-row").first();
  const stats = firstCard.locator(".projects-mobile-repo-stats");
  await expect(stats).toBeVisible();
  await expect(firstCard.locator(".projects-mobile-head")).toHaveText("HEAD");

  const geometry = await firstCard.evaluate((card) => {
    const panel = card.querySelector<HTMLElement>(".projects-mobile-repo-stats");
    const links = Array.from(card.querySelectorAll<HTMLElement>(".projects-mobile-repo-stat"));
    const boxes = links.map((link) => link.getBoundingClientRect());
    return {
      pageOverflow: document.documentElement.scrollWidth - window.innerWidth,
      panelWidth: panel?.getBoundingClientRect().width ?? 0,
      linksFit: links.every((link) => link.scrollWidth <= link.clientWidth),
      linksAreHorizontal:
        boxes.length === 3
        && Math.max(...boxes.map((box) => box.top))
          - Math.min(...boxes.map((box) => box.top)) <= 1,
      linksHaveTouchHeight: boxes.every((box) => box.height >= 24),
    };
  });

  expect(geometry.pageOverflow).toBeLessThanOrEqual(1);
  expect(geometry.panelWidth).toBeGreaterThanOrEqual(220);
  expect(geometry.linksFit).toBe(true);
  expect(geometry.linksAreHorizontal).toBe(true);
  expect(geometry.linksHaveTouchHeight).toBe(true);
});

test("mobile menu traps focus, closes with Escape and returns focus", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  const opener = page.getByRole("button", { name: "Open menu" });
  await opener.click();
  const dialog = page.getByRole("dialog", { name: "Site navigation" });
  const close = dialog.getByRole("button", { name: "Close menu" });
  await expect(close).toBeFocused();

  await page.keyboard.press("Shift+Tab");
  await expect(dialog.getByRole("link", { name: "Contact" })).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(close).toBeFocused();

  await page.keyboard.press("Escape");
  await expect(opener).toBeFocused();
  await expect(page.locator('[role="dialog"][aria-hidden="true"]')).toHaveAttribute("inert", "");
});

test("header adapts before navigation becomes cramped at common browser zoom levels", async ({ page }) => {
  const zoomProfiles = [
    { name: "1280 at 125%", effectiveWidth: 1024, compact: false },
    { name: "1280 at 150%", effectiveWidth: 853, compact: true },
    { name: "1280 at 200%", effectiveWidth: 640, compact: true },
    { name: "1366 at 150%", effectiveWidth: 911, compact: false },
    { name: "compact boundary", effectiveWidth: 899, compact: true },
    { name: "desktop boundary", effectiveWidth: 900, compact: false },
  ] as const;

  await page.goto("/contact");

  for (const profile of zoomProfiles) {
    await page.setViewportSize({ width: profile.effectiveWidth, height: 800 });
    const desktopNav = page.locator(".site-header > .site-header-nav");
    const menuButton = page.getByRole("button", { name: "Open menu" });

    if (profile.compact) {
      await expect(desktopNav, profile.name).toBeHidden();
      await expect(menuButton, profile.name).toBeVisible();
    } else {
      await expect(desktopNav, profile.name).toBeVisible();
      await expect(menuButton, profile.name).toBeHidden();
    }

    const geometry = await page.evaluate(() => {
      const header = document.querySelector<HTMLElement>(".site-header");
      if (!header) throw new Error("Header is missing");
      const rect = header.getBoundingClientRect();
      return {
        documentOverflow: document.documentElement.scrollWidth - window.innerWidth,
        headerOverflow: header.scrollWidth - header.clientWidth,
        left: rect.left,
        right: rect.right,
      };
    });

    expect(geometry.documentOverflow, profile.name).toBeLessThanOrEqual(1);
    expect(geometry.headerOverflow, profile.name).toBeLessThanOrEqual(1);
    expect(geometry.left, profile.name).toBeGreaterThanOrEqual(0);
    expect(geometry.right, profile.name).toBeLessThanOrEqual(profile.effectiveWidth + 1);
  }

  await page.setViewportSize({ width: 853, height: 800 });
  const menuButton = page.getByRole("button", { name: "Open menu" });
  await menuButton.click();
  await expect(page.getByRole("dialog", { name: "Site navigation" })).toBeVisible();

  await page.setViewportSize({ width: 1024, height: 800 });
  await expect(page.locator('[role="dialog"][aria-hidden="true"]')).toHaveAttribute("inert", "");
});

test("contact recomputes its viewport profile when a window is resized both ways", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/contact?audit=performance");

  const root = page.locator('[data-viewport-page="contact"]');
  const stage = page.locator("[data-viewport-stage]");
  await expect(root).toHaveAttribute("data-viewport-profile", "fit");
  const roomyScale = Number(await stage.getAttribute("data-viewport-scale"));

  await page.setViewportSize({ width: 1723, height: 450 });
  await expect(root).toHaveAttribute("data-viewport-profile", "accessible-overflow");
  const shortScale = Number(await stage.getAttribute("data-viewport-scale"));
  expect(shortScale).toBeLessThan(roomyScale);
  await expect(page.locator(".contact-repository-shell")).toBeInViewport();
  await expect(page.locator(".site-footer")).toBeInViewport();

  await page.setViewportSize({ width: 1440, height: 900 });
  await expect(root).toHaveAttribute("data-viewport-profile", "fit");
  const restoredScale = Number(await stage.getAttribute("data-viewport-scale"));
  expect(restoredScale).toBeCloseTo(roomyScale, 2);
  expect(await page.evaluate(() => document.documentElement.scrollHeight - innerHeight)).toBeLessThanOrEqual(1);
});

test("all public pages remain bounded and centered on ultrawide displays", async ({ browser }) => {
  test.setTimeout(240_000);
  const profiles = [
    { name: "full-hd", width: 1920, height: 1080 },
    { name: "qhd", width: 2560, height: 1440 },
    { name: "ultrawide", width: 3440, height: 1440 },
    { name: "uhd", width: 3840, height: 2160 },
  ] as const;
  const maximumSurfaceWidths: Record<(typeof routes)[number], number> = {
    "/": 3000,
    "/skills": 2750,
    "/journey": 2800,
    "/projects": 3000,
    "/contact": 3400,
  };

  for (const profile of profiles) {
    const context = await browser.newContext({ viewport: profile });
    const testPage = await context.newPage();
    await testPage.emulateMedia({ reducedMotion: "reduce" });

    for (const route of routes) {
      const label = `${profile.name} ${route}`;
      await testPage.goto(`${route}${route.includes("?") ? "&" : "?"}audit=performance`);
      const surface = testPage.locator(publicSurfaceSelectors[route]).first();
      await expect(surface, label).toBeVisible();
      if (route === "/skills") {
        const expectedSkillsSize = profile.width >= 3200 && profile.height >= 1500
          ? "ultra-wide"
          : profile.width >= 2200 && profile.height >= 1100
            ? "extra-wide"
            : profile.width >= 1000 && profile.width / profile.height >= 8 / 5
              ? "wide"
              : "default";
        await expect(testPage.locator(".skills-stage"), label).toHaveAttribute(
          "data-skills-size",
          expectedSkillsSize,
        );
      }

      const geometry = await surface.evaluate((element) => {
        const header = document.querySelector<HTMLElement>(".site-header");
        const nav = header?.querySelector<HTMLElement>(".site-header-nav");
        const surfaceRect = element.getBoundingClientRect();
        const headerRect = header?.getBoundingClientRect();
        const navRect = nav?.getBoundingClientRect();
        return {
          documentOverflow: document.documentElement.scrollWidth - window.innerWidth,
          headerLeft: headerRect?.left ?? -1,
          headerRight: headerRect?.right ?? -1,
          headerWidth: headerRect?.width ?? -1,
          navRightGap: navRect ? window.innerWidth - navRect.right : -1,
          surfaceLeft: surfaceRect.left,
          surfaceRight: surfaceRect.right,
          surfaceWidth: surfaceRect.width,
          surfaceCentreDelta: Math.abs(
            ((surfaceRect.left + surfaceRect.right) / 2) - (window.innerWidth / 2),
          ),
          viewportWidth: window.innerWidth,
        };
      });

      expect(geometry.documentOverflow, label).toBeLessThanOrEqual(1);
      expect(geometry.headerLeft, label).toBeGreaterThanOrEqual(0);
      expect(geometry.headerRight, label).toBeLessThanOrEqual(profile.width + 1);
      expect(Math.abs(geometry.headerWidth - profile.width), label).toBeLessThanOrEqual(1);
      expect(geometry.surfaceLeft, label).toBeGreaterThanOrEqual(0);
      expect(geometry.surfaceRight, label).toBeLessThanOrEqual(profile.width + 1);
      expect(geometry.surfaceWidth, label).toBeLessThanOrEqual(maximumSurfaceWidths[route] + 1);
      if (route === "/journey") {
        await expect.poll(async () => {
          const last = await testPage.locator(".commit-row").last().boundingBox();
          return last ? last.y + last.height : Number.POSITIVE_INFINITY;
        }, { message: label }).toBeLessThanOrEqual(profile.height + 1);
      }
      if (route === "/contact") {
        await expect(
          testPage.locator(".contact-adaptive-layout .contact-send-button button"),
          label,
        ).toBeInViewport();
      }
      if (profile.width >= 2200) {
        expect(Math.abs(geometry.navRightGap - 12), label).toBeLessThanOrEqual(4);
        expect(geometry.surfaceWidth / profile.width, label).toBeGreaterThanOrEqual(0.65);

        if (route === "/contact") {
          const portraitCoverage = await testPage.evaluate(() => {
            const panel = document.querySelector<HTMLElement>(".contact-profile-portrait-row")
              ?.getBoundingClientRect();
            const portrait = document.querySelector<HTMLImageElement>(".contact-portrait-frame img")
              ?.getBoundingClientRect();
            if (!panel || !portrait) throw new Error("Contact portrait geometry is missing");
            return {
              width: portrait.width / panel.width,
              height: portrait.height / panel.height,
            };
          });
          expect(portraitCoverage.width, label).toBeGreaterThanOrEqual(0.65);
          expect(portraitCoverage.height, label).toBeGreaterThanOrEqual(1);
        }
      }
      expect(geometry.surfaceCentreDelta, label).toBeLessThanOrEqual(2);
    }

    await context.close();
  }
});

test("layout follows CSS viewport size instead of physical pixel density", async ({ browser }) => {
  const layouts: Array<Record<string, { width: number; left: number }>> = [];

  for (const deviceScaleFactor of [1, 2]) {
    const context = await browser.newContext({
      viewport: { width: 1280, height: 720 },
      screen: { width: 2560, height: 1440 },
      deviceScaleFactor,
    });
    const testPage = await context.newPage();
    await testPage.emulateMedia({ reducedMotion: "reduce" });
    const layout: Record<string, { width: number; left: number }> = {};

    for (const route of routes) {
      await testPage.goto(`${route}?audit=performance`);
      const selector = publicSurfaceSelectors[route];
      const surface = testPage.locator(selector).first();
      await expect(surface, `${route} at DPR ${deviceScaleFactor}`).toBeVisible();

      // The fitted Skills/Journey surfaces replace their SSR fallback scale
      // during hydration. Compare DPRs only after two consecutive layout
      // samples agree, otherwise this test can compare the fallback with the
      // final CSS-pixel geometry under parallel CI load.
      await expect.poll(async () => {
        const first = await surface.evaluate((element) => {
          const rect = element.getBoundingClientRect();
          return { left: rect.left, width: rect.width };
        });
        await testPage.evaluate(() => new Promise<void>((resolve) => {
          requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
        }));
        const second = await surface.evaluate((element) => {
          const rect = element.getBoundingClientRect();
          return { left: rect.left, width: rect.width };
        });
        return Math.max(
          Math.abs(first.left - second.left),
          Math.abs(first.width - second.width),
        );
      }, { message: `${route} at DPR ${deviceScaleFactor} should settle` }).toBeLessThanOrEqual(0.5);

      const box = await surface.boundingBox();
      expect(box, `${route} at DPR ${deviceScaleFactor}`).not.toBeNull();
      layout[route] = { width: box!.width, left: box!.x };
      expect(
        await testPage.evaluate(() => document.documentElement.scrollWidth - window.innerWidth),
        `${route} at DPR ${deviceScaleFactor}`,
      ).toBeLessThanOrEqual(1);
    }

    layouts.push(layout);
    await context.close();
  }

  for (const route of routes) {
    expect(Math.abs(layouts[0][route].width - layouts[1][route].width), route).toBeLessThanOrEqual(1);
    expect(Math.abs(layouts[0][route].left - layouts[1][route].left), route).toBeLessThanOrEqual(1);
  }
});

test("light and dark contact themes stay responsive across all adaptive viewports", async ({ browser }) => {
  test.setTimeout(240_000);

  for (const profile of adaptiveViewports) {
    for (const theme of ["dark", "light"] as const) {
      const context = await browser.newContext({ viewport: profile });
      await context.addInitScript((selectedTheme) => {
        localStorage.setItem("theme", selectedTheme);
      }, theme);
      const testPage = await context.newPage();
      await testPage.emulateMedia({ reducedMotion: "reduce" });
      const label = `${profile.name} ${theme}`;
      await testPage.goto("/contact?audit=performance");
      const shell = testPage.locator(".contact-repository-shell");
      await expect(shell, label).toBeVisible();
      const before = await shell.evaluate((element) => {
        const rect = element.getBoundingClientRect();
        return {
          horizontalOverflow: document.documentElement.scrollWidth - window.innerWidth,
          isLight: document.documentElement.classList.contains("light"),
          themeColor: document.querySelector<HTMLMetaElement>('meta[name="theme-color"]')?.content,
          width: rect.width,
          height: rect.height,
        };
      });

      expect(before.horizontalOverflow, label).toBeLessThanOrEqual(1);
      expect(before.isLight, label).toBe(theme === "light");
      expect(before.themeColor, label).toBe(theme === "light" ? "#defaf5" : "#0a0b10");

      const targetTheme = theme === "light" ? "dark" : "light";
      const toggleLabel = `Switch to ${targetTheme} mode`;
      let toggle = testPage.locator(`button[aria-label="${toggleLabel}"]:visible`);
      if (await toggle.count() === 0) {
        await testPage.getByRole("button", { name: "Open menu" }).click();
        toggle = testPage.locator(`button[aria-label="${toggleLabel}"]:visible`);
      }
      await toggle.evaluate((button) => (button as HTMLButtonElement).click());

      const after = await shell.evaluate((element) => {
        const rect = element.getBoundingClientRect();
        return {
          horizontalOverflow: document.documentElement.scrollWidth - window.innerWidth,
          isLight: document.documentElement.classList.contains("light"),
          themeColor: document.querySelector<HTMLMetaElement>('meta[name="theme-color"]')?.content,
          width: rect.width,
          height: rect.height,
        };
      });
      expect(after.horizontalOverflow, label).toBeLessThanOrEqual(1);
      expect(after.isLight, label).toBe(targetTheme === "light");
      expect(after.themeColor, label).toBe(targetTheme === "light" ? "#defaf5" : "#0a0b10");
      expect(after.width, label).toBeCloseTo(before.width, 0);
      expect(after.height, label).toBeCloseTo(before.height, 0);

      await context.close();
    }
  }
});

test("contact validation focuses and identifies every invalid field at high zoom", async ({ browser }) => {
  test.setTimeout(90_000);
  const zoomProfiles = [
    { name: "150-percent", width: 853, height: 800 },
    { name: "200-percent", width: 640, height: 800 },
    { name: "400-percent-reflow", width: 320, height: 800 },
  ] as const;

  for (const profile of zoomProfiles) {
    const context = await browser.newContext({ viewport: profile });
    const testPage = await context.newPage();
    await testPage.emulateMedia({ reducedMotion: "reduce" });
    await testPage.goto("/contact?audit=performance");

    const form = testPage.locator('form[aria-label="Contact form"]:visible');
    const name = form.getByPlaceholder("Name");
    const email = form.getByPlaceholder("Email");
    const message = form.getByPlaceholder("Message");
    const submit = form.getByRole("button", { name: /Commit & send|Send/ });

    await submit.click();
    await expect(name, profile.name).toBeFocused();
    await expect(name, profile.name).toHaveAttribute("aria-invalid", "true");
    await expect(form.getByRole("alert"), profile.name).toBeVisible();

    await name.fill("Zoom Test");
    await submit.click();
    await expect(email, profile.name).toBeFocused();
    await expect(email, profile.name).toHaveAttribute("aria-invalid", "true");

    await email.fill("not-an-email");
    await message.fill("Validation must remain readable at high zoom.");
    await submit.click();
    await expect(email, profile.name).toBeFocused();
    await expect(email, profile.name).toHaveAttribute("aria-invalid", "true");
    await expect(form.getByRole("alert"), profile.name).toContainText("valid email");

    await email.fill("zoom@example.com");
    await message.fill("");
    await submit.click();
    await expect(message, profile.name).toBeFocused();
    await expect(message, profile.name).toHaveAttribute("aria-invalid", "true");
    await expect(message, profile.name).toHaveAttribute("aria-describedby", /-error$/);

    const errorGeometry = await form.getByRole("alert").evaluate((alert) => {
      const rect = alert.getBoundingClientRect();
      return {
        documentOverflow: document.documentElement.scrollWidth - window.innerWidth,
        left: rect.left,
        right: rect.right,
        scrollWidth: alert.scrollWidth,
        clientWidth: alert.clientWidth,
        viewportWidth: window.innerWidth,
      };
    });
    expect(errorGeometry.documentOverflow, profile.name).toBeLessThanOrEqual(1);
    expect(errorGeometry.left, profile.name).toBeGreaterThanOrEqual(0);
    expect(errorGeometry.right, profile.name).toBeLessThanOrEqual(errorGeometry.viewportWidth + 1);
    expect(errorGeometry.scrollWidth, profile.name).toBeLessThanOrEqual(errorGeometry.clientWidth + 1);

    await context.close();
  }
});

test("Windows forced colors preserves keyboard focus and contact errors", async ({ browser }) => {
  const profiles = [
    { name: "400-percent-reflow", width: 320, height: 800 },
    { name: "compact-laptop", width: 800, height: 600 },
    { name: "desktop", width: 1366, height: 768 },
  ] as const;

  for (const profile of profiles) {
    const context = await browser.newContext({
      viewport: profile,
      forcedColors: "active",
    });
    const testPage = await context.newPage();
    await testPage.emulateMedia({ reducedMotion: "reduce" });
    await testPage.goto("/contact?audit=performance");

    const form = testPage.locator('form[aria-label="Contact form"]:visible');
    const name = form.getByPlaceholder("Name");
    const submit = form.getByRole("button", { name: /Commit & send|Send/ });
    await submit.evaluate((button) => (button as HTMLButtonElement).click());
    await expect(name, profile.name).toBeFocused();
    await expect(name, profile.name).toHaveAttribute("aria-invalid", "true");

    const state = await name.evaluate((element) => {
      const input = element as HTMLInputElement;
      const inputStyle = getComputedStyle(input);
      const alert = input.form?.querySelector<HTMLElement>('[role="alert"]');
      const alertStyle = alert ? getComputedStyle(alert) : null;
      return {
        forcedColors: matchMedia("(forced-colors: active)").matches,
        horizontalOverflow: document.documentElement.scrollWidth - innerWidth,
        inputOutlineStyle: inputStyle.outlineStyle,
        inputOutlineWidth: parseFloat(inputStyle.outlineWidth),
        alertBorderWidth: alertStyle ? parseFloat(alertStyle.borderTopWidth) : 0,
      };
    });
    expect(state.forcedColors, profile.name).toBe(true);
    expect(state.horizontalOverflow, profile.name).toBeLessThanOrEqual(1);
    expect(state.inputOutlineStyle, profile.name).toBe("dashed");
    expect(state.inputOutlineWidth, profile.name).toBeGreaterThanOrEqual(2);
    expect(state.alertBorderWidth, profile.name).toBeGreaterThanOrEqual(2);

    await submit.focus();
    const buttonFocus = await submit.evaluate((button) => {
      const style = getComputedStyle(button);
      return {
        outlineStyle: style.outlineStyle,
        outlineWidth: parseFloat(style.outlineWidth),
      };
    });
    expect(buttonFocus.outlineStyle, profile.name).toBe("solid");
    expect(buttonFocus.outlineWidth, profile.name).toBeGreaterThanOrEqual(2);

    await context.close();
  }
});

test("all public pages reflow without horizontal scrolling at 400 percent", async ({ browser }) => {
  const context = await browser.newContext({ viewport: { width: 320, height: 800 } });
  const testPage = await context.newPage();
  await testPage.emulateMedia({ reducedMotion: "reduce" });

  for (const route of routes) {
    await testPage.goto(`${route}${route.includes("?") ? "&" : "?"}audit=performance`);
    await expect(testPage.locator("body"), route).toBeVisible();
    await expect(testPage.getByRole("button", { name: "Open menu" }), route).toBeVisible();
    const geometry = await testPage.evaluate(() => ({
      documentOverflow: document.documentElement.scrollWidth - innerWidth,
      bodyOverflow: document.body.scrollWidth - innerWidth,
      viewportWidth: innerWidth,
    }));
    expect(geometry.viewportWidth, route).toBe(320);
    expect(geometry.documentOverflow, route).toBeLessThanOrEqual(1);
    expect(geometry.bodyOverflow, route).toBeLessThanOrEqual(1);
  }

  await context.close();
});

test("Samsung browser viewport keeps visible geometry and theme chrome in sync", async ({ browser }) => {
  const context = await browser.newContext({
    viewport: { width: 360, height: 610 },
    screen: { width: 360, height: 800 },
    deviceScaleFactor: 2,
    hasTouch: true,
    isMobile: true,
  });
  const page = await context.newPage();
  await page.addInitScript(() => localStorage.setItem("theme", "dark"));
  await page.goto("/");

  const viewport = await page.evaluate(() => ({
    inner: { width: innerWidth, height: innerHeight },
    client: {
      width: document.documentElement.clientWidth,
      height: document.documentElement.clientHeight,
    },
    visual: {
      width: visualViewport?.width,
      height: visualViewport?.height,
      scale: visualViewport?.scale,
    },
    screen: { width: screen.width, height: screen.height },
    devicePixelRatio,
  }));
  expect(viewport).toEqual({
    inner: { width: 360, height: 610 },
    client: { width: 360, height: 610 },
    visual: { width: 360, height: 610, scale: 1 },
    screen: { width: 360, height: 800 },
    devicePixelRatio: 2,
  });
  await expect(page.locator('meta[name="theme-color"]')).toHaveAttribute("content", "#0a0b10");

  const canvas = page.locator("canvas[data-background-fps]");
  await expect(canvas).toHaveAttribute("data-background-renderer", "webgl");
  await expect(canvas).toHaveAttribute("data-background-thread", "main");
  await expect(canvas).toHaveAttribute("data-background-profile", "continuous-mobile");
  await expect(canvas).toHaveAttribute("data-background-mode", "animated");
  await expect(canvas).toHaveAttribute("data-background-fps", "30");
  const canvasBox = await canvas.boundingBox();
  expect(canvasBox).toMatchObject({ x: 0, y: 0, width: 360, height: 610 });
  const firstWaveFrame = await canvas.screenshot();
  await page.waitForTimeout(350);
  const nextWaveFrame = await canvas.screenshot();
  expect(nextWaveFrame.equals(firstWaveFrame)).toBe(false);
  await expect(page.locator(".home-hero-actions")).toBeInViewport();

  await page.getByRole("button", { name: "Open menu" }).click();
  await page.getByRole("button", { name: "Switch to light mode" }).click();
  await expect(page.locator("html")).toHaveClass(/light/);
  await expect(page.locator('meta[name="theme-color"]')).toHaveAttribute("content", "#defaf5");
  const firstLightWaveFrame = await canvas.screenshot();
  await page.waitForTimeout(350);
  const nextLightWaveFrame = await canvas.screenshot();
  expect(nextLightWaveFrame.equals(firstLightWaveFrame)).toBe(false);

  await page.goto("/skills");
  await expect(page.locator(".skills-bento-grid")).toBeInViewport();

  await page.goto("/contact");
  await expect(page.locator(".contact-mobile-actions:visible")).toBeInViewport();
  await expect(page.locator(".site-footer")).toBeInViewport();
  await context.close();
});

const phoneBackgroundProfiles: ReadonlyArray<{
  name: string;
  width: number;
  height: number;
  screenHeight?: number;
  dpr: number;
}> = [
  { name: "galaxy-fold", width: 280, height: 653, dpr: 3 },
  { name: "small-phone", width: 320, height: 568, dpr: 2 },
  { name: "narrow-fold", width: 344, height: 882, dpr: 3 },
  { name: "samsung-real-visible", width: 360, height: 610, screenHeight: 800, dpr: 2 },
  { name: "compact-android", width: 360, height: 740, dpr: 3 },
  { name: "galaxy-s20", width: 360, height: 800, dpr: 3 },
  { name: "iphone-se", width: 375, height: 667, dpr: 2 },
  { name: "modern-phone", width: 390, height: 844, dpr: 3 },
  { name: "pixel-5", width: 393, height: 851, dpr: 2.75 },
  { name: "galaxy-s20-ultra", width: 412, height: 915, dpr: 3 },
  { name: "iphone-pro-max", width: 430, height: 932, dpr: 3 },
  { name: "large-android", width: 480, height: 1040, dpr: 3 },
  { name: "phone-landscape", width: 844, height: 390, dpr: 2 },
  { name: "large-phone-landscape", width: 932, height: 430, dpr: 3 },
];

for (const profile of phoneBackgroundProfiles) {
  test(`mobile background stays animated for ${profile.name} across routes and themes`, async ({ browser }) => {
    test.setTimeout(120_000);

    for (const theme of ["light", "dark"] as const) {
      const context = await browser.newContext({
        viewport: { width: profile.width, height: profile.height },
        screen: { width: profile.width, height: profile.screenHeight ?? profile.height },
        deviceScaleFactor: profile.dpr,
        hasTouch: true,
        isMobile: true,
      });
      await context.addInitScript((selectedTheme) => {
        localStorage.setItem("theme", selectedTheme);
      }, theme);
      const page = await context.newPage();

      for (const route of routes) {
        const label = `${profile.name} ${theme} ${route}`;
        await page.goto(route);
        const canvas = page.locator("canvas[data-background-fps]");

        await expect(canvas, label).toHaveAttribute("data-background-renderer", "webgl");
        await expect(canvas, label).toHaveAttribute("data-background-thread", "main");
        await expect(canvas, label).toHaveAttribute(
          "data-background-profile",
          "continuous-mobile",
        );
        await expect(canvas, label).toHaveAttribute("data-background-mode", "animated");
        await expect(canvas, label).toHaveAttribute("data-background-fps", "30");
        await expect(canvas, label).toHaveAttribute("data-background-scale", "adaptive");

        const canvasBox = await canvas.boundingBox();
        expect(canvasBox, label).toMatchObject({
          x: 0,
          y: 0,
          width: profile.width,
          height: profile.height,
        });

        if (theme === "light") await expect(page.locator("html"), label).toHaveClass(/light/);
        else await expect(page.locator("html"), label).not.toHaveClass(/light/);

        const firstFrame = await canvas.screenshot();
        await page.waitForTimeout(250);
        const nextFrame = await canvas.screenshot();
        expect(nextFrame.equals(firstFrame), `${label} background should animate`).toBe(false);

        if (profile.name === "samsung-real-visible") {
          await mkdir(visualOutput, { recursive: true });
          await page.screenshot({
            path: `${visualOutput}/samsung-${routeName(route)}-${theme}-background.png`,
          });
        }
      }

      await context.close();
    }
  });
}

test("mobile background follows dynamic browser chrome and orientation changes", async ({ browser }) => {
  const context = await browser.newContext({
    viewport: { width: 360, height: 610 },
    screen: { width: 360, height: 800 },
    deviceScaleFactor: 3,
    hasTouch: true,
    isMobile: true,
  });
  await context.addInitScript(() => localStorage.setItem("theme", "dark"));
  const page = await context.newPage();
  await page.goto("/");
  const canvas = page.locator("canvas[data-background-fps]");

  for (const viewport of [
    { width: 360, height: 740 },
    { width: 740, height: 360 },
    { width: 360, height: 610 },
  ]) {
    await page.setViewportSize(viewport);
    await expect.poll(async () => canvas.evaluate((element) => {
      const target = element as HTMLCanvasElement;
      return {
        cssWidth: target.getBoundingClientRect().width,
        cssHeight: target.getBoundingClientRect().height,
        renderWidth: target.width,
        renderHeight: target.height,
      };
    })).toEqual({
      cssWidth: viewport.width,
      cssHeight: viewport.height,
      renderWidth: Math.floor(viewport.width * 0.82),
      renderHeight: Math.floor(viewport.height * 0.82),
    });
    await expect(canvas).toHaveAttribute("data-background-renderer", "webgl");
    await expect(canvas).toHaveAttribute("data-background-thread", "main");
    await expect(canvas).toHaveAttribute("data-background-profile", "continuous-mobile");
    const firstFrame = await canvas.screenshot();
    await page.waitForTimeout(250);
    const nextFrame = await canvas.screenshot();
    expect(nextFrame.equals(firstFrame), `${viewport.width}x${viewport.height} should animate`).toBe(false);
  }

  await context.close();
});

test("mobile background keeps moving with the soft fallback when WebGL is unavailable", async ({ browser }) => {
  const context = await browser.newContext({
    viewport: { width: 360, height: 740 },
    deviceScaleFactor: 2,
    hasTouch: true,
    isMobile: true,
  });
  const page = await context.newPage();
  await page.addInitScript(() => {
    const originalGetContext = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function getContext(
      this: HTMLCanvasElement,
      contextId: string,
      options?: unknown,
    ) {
      if (contextId === "webgl") return null;
      return originalGetContext.call(this, contextId, options as never);
    } as typeof HTMLCanvasElement.prototype.getContext;
  });
  await page.goto("/");

  const canvas = page.locator("canvas[data-background-fps]");
  await expect(canvas).toHaveAttribute("data-background-renderer", "css");
  await expect(canvas).toHaveAttribute("data-background-mode", "animated");
  await expect(canvas).toHaveAttribute("data-background-profile", "css-soft");
  await expect.poll(() => canvas.evaluate((element) => (
    element.getAnimations().some((animation) => animation.playState === "running")
  ))).toBe(true);
  const firstFrame = await canvas.screenshot();
  await page.waitForTimeout(500);
  const nextFrame = await canvas.screenshot();
  expect(nextFrame.equals(firstFrame), "CSS fallback should animate").toBe(false);

  await context.close();
});

test("touch laptops keep the desktop background while constrained desktops reduce GPU work", async ({ browser }) => {
  const profiles = [
    {
      name: "touch-laptop",
      cores: 8,
      expectedTier: "desktop",
      expectedScale: "0.52",
      expectedFps: "60",
    },
    {
      name: "constrained-touch-laptop",
      cores: 4,
      expectedTier: "low-power-desktop",
      expectedScale: "0.42",
      expectedFps: "30",
    },
  ] as const;

  for (const profile of profiles) {
    const context = await browser.newContext({
      viewport: { width: 1366, height: 768 },
      hasTouch: true,
      isMobile: false,
    });
    await context.addInitScript((cores) => {
      Object.defineProperty(navigator, "hardwareConcurrency", {
        configurable: true,
        value: cores,
      });
    }, profile.cores);
    const page = await context.newPage();
    await page.goto("/");

    const canvas = page.locator("canvas[data-background-fps]");
    await expect(canvas, profile.name).toHaveAttribute("data-background-renderer", "webgl");
    await expect(canvas, profile.name).toHaveAttribute("data-background-profile", "layered-desktop");
    await expect(canvas, profile.name).toHaveAttribute("data-background-device-tier", profile.expectedTier);
    await expect(canvas, profile.name).toHaveAttribute("data-background-render-scale", profile.expectedScale);
    await expect(canvas, profile.name).toHaveAttribute("data-background-fps", profile.expectedFps);

    await context.close();
  }
});

test("mobile background has no hard facet seams across sizes, themes and animation frames", async ({ browser }) => {
  test.setTimeout(120_000);
  const profiles = [
    { name: "narrow", width: 280, height: 653 },
    { name: "samsung", width: 360, height: 610 },
    { name: "large", width: 430, height: 932 },
    { name: "landscape", width: 932, height: 430 },
  ] as const;

  for (const profile of profiles) {
    for (const theme of ["dark", "light"] as const) {
      const context = await browser.newContext({
        viewport: { width: profile.width, height: profile.height },
        deviceScaleFactor: 2,
        hasTouch: true,
        isMobile: true,
      });
      await context.addInitScript((selectedTheme) => {
        localStorage.setItem("theme", selectedTheme);
      }, theme);
      const page = await context.newPage();
      await page.goto("/");
      const canvas = page.locator("canvas[data-background-fps]");
      await expect(canvas).toHaveAttribute("data-background-renderer", "webgl");
      await expect(canvas).toHaveAttribute("data-background-profile", "continuous-mobile");
      await page.addStyleTag({
        content: "body>:not(canvas[data-background-fps]){display:none!important}",
      });

      let previousScreenshot: Buffer | null = null;
      for (let frame = 0; frame < 2; frame += 1) {
        const screenshot = await page.screenshot();
        const metrics = await backgroundSmoothness(screenshot);
        const label = `${profile.name} ${theme} frame ${frame + 1}`;
        expect(metrics.maxNeighborDelta, `${label} neighbor delta`).toBeLessThanOrEqual(4);
        expect(metrics.maxLaplacian, `${label} local edge curvature`).toBeLessThanOrEqual(8);
        if (previousScreenshot) {
          const meanDelta = await backgroundFrameDelta(previousScreenshot, screenshot);
          expect(meanDelta, `${label} visible animation delta`).toBeGreaterThan(0.2);
        }
        if (profile.name === "samsung" && frame === 0) {
          await mkdir(visualOutput, { recursive: true });
          await sharp(screenshot).toFile(
            `${visualOutput}/samsung-background-only-${theme}.png`,
          );
        }
        previousScreenshot = screenshot;
        await page.waitForTimeout(750);
      }

      await context.close();
    }
  }
});

test("mobile background matches desktop color balance in both themes", async ({ browser }) => {
  test.setTimeout(120_000);

  const expectColorParity = (
    mobile: Awaited<ReturnType<typeof backgroundColorSignature>>,
    desktop: Awaited<ReturnType<typeof backgroundColorSignature>>,
    label: string,
  ) => {
    for (let channel = 0; channel < 3; channel += 1) {
      expect(
        Math.abs(mobile.mean[channel] - desktop.mean[channel]),
        `${label} channel ${channel} mean`,
      ).toBeLessThanOrEqual(3);
      expect(
        Math.abs(mobile.deviation[channel] - desktop.deviation[channel]),
        `${label} channel ${channel} contrast`,
      ).toBeLessThanOrEqual(3);
    }
  };

  const colorDistance = (
    first: Awaited<ReturnType<typeof backgroundColorSignature>>,
    second: Awaited<ReturnType<typeof backgroundColorSignature>>,
  ) => Math.max(
    ...first.mean.map((value, channel) => Math.abs(value - second.mean[channel])),
    ...first.deviation.map((value, channel) => Math.abs(value - second.deviation[channel])),
  );

  for (const theme of ["dark", "light"] as const) {
    const signatures = new Map<"desktop" | "mobile", Awaited<ReturnType<typeof backgroundColorSignature>>>();

    // Capture mobile first so its synchronous main-thread frame can be used to
    // distinguish the desktop WebGL frame from the temporary CSS fallback.
    for (const profile of ["mobile", "desktop"] as const) {
      const mobile = profile === "mobile";
      const context = await browser.newContext({
        viewport: mobile ? { width: 360, height: 610 } : { width: 1440, height: 900 },
        deviceScaleFactor: mobile ? 2 : 1,
        hasTouch: mobile,
        isMobile: mobile,
        reducedMotion: "reduce",
      });
      await context.addInitScript((selectedTheme) => {
        localStorage.setItem("theme", selectedTheme);
      }, theme);
      const page = await context.newPage();
      await page.goto("/");
      const canvas = page.locator("canvas[data-background-fps]");
      await expect(canvas).toHaveAttribute("data-background-renderer", "webgl");
      await expect(canvas).toHaveAttribute(
        "data-background-profile",
        mobile ? "continuous-mobile" : "layered-desktop",
      );
      await expect(canvas).toHaveAttribute("data-background-mode", "static");
      await page.addStyleTag({
        content: "body>:not(canvas[data-background-fps]){display:none!important}",
      });
      let screenshot = await page.screenshot();
      let signature = await backgroundColorSignature(screenshot);

      if (!mobile) {
        const mobileReference = signatures.get("mobile");
        expect(mobileReference).toBeDefined();
        await expect.poll(async () => {
          screenshot = await page.screenshot();
          signature = await backgroundColorSignature(screenshot);
          return colorDistance(signature, mobileReference!);
        }, {
          message: `${theme} desktop WebGL frame should be composited`,
          timeout: 5_000,
        }).toBeLessThanOrEqual(3);
      }

      signatures.set(profile, signature);
      await mkdir(visualOutput, { recursive: true });
      await sharp(screenshot).toFile(
        `${visualOutput}/theme-parity-${profile}-${theme}.png`,
      );
      await context.close();
    }

    const desktop = signatures.get("desktop");
    const mobile = signatures.get("mobile");
    expect(desktop).toBeDefined();
    expect(mobile).toBeDefined();
    expectColorParity(mobile!, desktop!, `${theme} /`);

    const mobileContext = await browser.newContext({
      viewport: { width: 360, height: 610 },
      deviceScaleFactor: 2,
      hasTouch: true,
      isMobile: true,
      reducedMotion: "reduce",
    });
    await mobileContext.addInitScript((selectedTheme) => {
      localStorage.setItem("theme", selectedTheme);
    }, theme);
    const mobilePage = await mobileContext.newPage();

    for (const route of routes.slice(1)) {
      await mobilePage.goto(route);
      const canvas = mobilePage.locator("canvas[data-background-fps]");
      await expect(canvas).toHaveAttribute("data-background-renderer", "webgl");
      await expect(canvas).toHaveAttribute("data-background-profile", "continuous-mobile");
      await expect(canvas).toHaveAttribute("data-background-mode", "static");
      await mobilePage.addStyleTag({
        content: "body>:not(canvas[data-background-fps]){display:none!important}",
      });
      const screenshot = await mobilePage.screenshot();
      expectColorParity(
        await backgroundColorSignature(screenshot),
        desktop!,
        `${theme} ${route}`,
      );
      await sharp(screenshot).toFile(
        `${visualOutput}/theme-parity-mobile-${routeName(route)}-${theme}.png`,
      );
    }

    await mobileContext.close();
  }
});

test("theme switches synchronously across phone, landscape and desktop viewports", async ({ browser }) => {
  test.setTimeout(180_000);
  const profiles = [
    { name: "small-phone", width: 320, height: 568, dpr: 2, mobile: true },
    { name: "narrow-fold", width: 344, height: 882, dpr: 3, mobile: true },
    { name: "samsung-real-visible", width: 360, height: 610, dpr: 2, mobile: true },
    { name: "compact-android", width: 360, height: 740, dpr: 3, mobile: true },
    { name: "galaxy-s20-devtools", width: 360, height: 800, dpr: 3, mobile: true },
    { name: "iphone-se", width: 375, height: 667, dpr: 2, mobile: true },
    { name: "modern-phone", width: 390, height: 844, dpr: 3, mobile: true },
    { name: "pixel-5", width: 393, height: 851, dpr: 2.75, mobile: true },
    { name: "galaxy-s20-ultra-devtools", width: 412, height: 915, dpr: 3, mobile: true },
    { name: "large-android", width: 480, height: 1040, dpr: 3, mobile: true },
    { name: "phone-landscape", width: 844, height: 390, dpr: 2, mobile: true },
    { name: "desktop", width: 1366, height: 768, dpr: 1, mobile: false },
  ];

  for (const profile of profiles) {
    const context = await browser.newContext({
      viewport: { width: profile.width, height: profile.height },
      deviceScaleFactor: profile.dpr,
      hasTouch: profile.mobile,
      isMobile: profile.mobile,
    });
    await context.addInitScript(() => localStorage.setItem("theme", "dark"));
    const testPage = await context.newPage();
    await testPage.goto("/");

    const canvas = testPage.locator("canvas[data-background-fps]");
    const canvasBox = await canvas.boundingBox();
    expect(canvasBox, profile.name).toMatchObject({
      x: 0,
      y: 0,
      width: profile.width,
      height: profile.height,
    });
    if (profile.mobile) {
      await expect(canvas, profile.name).toHaveAttribute("data-background-renderer", "webgl");
      await expect(canvas, profile.name).toHaveAttribute("data-background-thread", /^(worker|main)$/);
      await expect(canvas, profile.name).toHaveAttribute("data-background-mode", "animated");
      await expect(canvas, profile.name).toHaveAttribute("data-background-fps", "30");
      await expect(canvas, profile.name).toHaveAttribute(
        "data-background-profile",
        "continuous-mobile",
      );
      const menuButton = testPage.getByRole("button", { name: "Open menu" });
      if (await menuButton.isVisible()) await menuButton.click();
    } else {
      await expect(canvas, profile.name).toHaveAttribute("data-background-thread", /^(worker|main)$/);
      await expect(canvas, profile.name).toHaveAttribute("data-background-mode", "animated");
      await expect(canvas, profile.name).toHaveAttribute(
        "data-background-profile",
        "layered-desktop",
      );
      await expect(canvas, profile.name).toHaveAttribute(
        "data-background-fps",
        await expectedBackgroundFps(testPage),
      );
    }

    const firstFrame = await canvas.screenshot();
    await testPage.waitForTimeout(250);
    const nextFrame = await canvas.screenshot();
    expect(nextFrame.equals(firstFrame), `${profile.name} background should animate`).toBe(false);

    const result = await testPage
      .locator('button[aria-label="Switch to light mode"]:visible')
      .evaluate((button) => {
        const startedAt = performance.now();
        (button as HTMLButtonElement).click();
        const root = document.documentElement;
        return {
          elapsed: performance.now() - startedAt,
          light: root.classList.contains("light"),
          switching: root.dataset.themeSwitching,
          themeColor: document
            .querySelector<HTMLMetaElement>('meta[name="theme-color"]')
            ?.content,
        };
      });

    expect(result.light, profile.name).toBe(true);
    expect(result.themeColor, profile.name).toBe("#defaf5");
    expect(result.switching, profile.name).toBe("true");
    expect(result.elapsed, profile.name).toBeLessThan(50);
    await testPage.evaluate(() => new Promise<void>((resolve) => {
      requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
    }));
    await expect(testPage.locator("html"), profile.name).not.toHaveAttribute("data-theme-switching");
    await context.close();
  }
});

test("skills icons interact inside equal, clipped canvases without shadows", async ({ browser }) => {
  test.setTimeout(60_000);
  const touchProfiles = [
    { name: "small-phone", width: 320, height: 568 },
    { name: "ipad", width: 768, height: 1024 },
    { name: "ipad-pro", width: 1024, height: 1366 },
  ];

  for (const profile of touchProfiles) {
    const context = await browser.newContext({
      viewport: { width: profile.width, height: profile.height },
      deviceScaleFactor: 2,
      hasTouch: true,
      isMobile: true,
    });
    const testPage = await context.newPage();
    await testPage.goto("/skills?audit=performance");
    await expect(testPage.locator(".page-loading-stage"), profile.name).toHaveCount(0);
    await expect(testPage.locator(".skills-stage"), profile.name).toHaveAttribute(
      "data-skills-layout",
      profile.width >= 640 ? "desktop" : "phone",
    );
    await expect.poll(async () => Number(await testPage.locator(".skills-stage").getAttribute("data-viewport-scale"))).toBeLessThan(1);
    const viewportOverflow = await testPage.evaluate(() => ({
      horizontal: document.documentElement.scrollWidth - window.innerWidth,
      vertical: document.documentElement.scrollHeight - window.innerHeight,
    }));
    expect(viewportOverflow.horizontal, profile.name).toBeLessThanOrEqual(1);
    if (profile.width < 640) {
      expect(viewportOverflow.vertical, profile.name).toBeLessThanOrEqual(1);
    }
    const icon = testPage.locator("[data-skill-interaction]").first();
    await expect(icon, profile.name).toBeVisible();
    const canvas = testPage.locator("[data-skill-canvas]").first();
    const before = await canvas.boundingBox();
    const iconSizes = await testPage.locator("[data-skill-canvas]").evaluateAll((elements) => (
      elements.map((element) => {
        const rect = element.getBoundingClientRect();
        return { width: rect.width, height: rect.height };
      })
    ));

    const press = await icon.evaluate((element) => {
      element.dispatchEvent(new PointerEvent("pointerdown", {
        bubbles: true,
        isPrimary: true,
        pointerType: "touch",
      }));
      return {
        pressed: element.dataset.touchPressed === "true",
        markAnimations: element.querySelector(".skill-icon")?.getAnimations().length ?? -1,
      };
    });
    expect(press.pressed, profile.name).toBe(true);
    expect(press.markAnimations, profile.name).toBe(0);
    await expect.poll(
      () => icon.evaluate((element) => new DOMMatrixReadOnly(getComputedStyle(element).transform).a),
      { message: `${profile.name} touch press scale` },
    ).toBeGreaterThan(1.02);
    const after = await canvas.boundingBox();

    expect(Math.max(...iconSizes.map(({ width }) => width)) - Math.min(...iconSizes.map(({ width }) => width)), profile.name).toBeLessThan(0.1);
    expect(Math.max(...iconSizes.map(({ height }) => height)) - Math.min(...iconSizes.map(({ height }) => height)), profile.name).toBeLessThan(0.1);
    expect(after?.x, profile.name).toBeCloseTo(before?.x ?? 0, 4);
    expect(after?.y, profile.name).toBeCloseTo(before?.y ?? 0, 4);
    expect(after?.width, profile.name).toBeCloseTo(before?.width ?? 0, 4);
    expect(after?.height, profile.name).toBeCloseTo(before?.height ?? 0, 4);
    await icon.evaluate((element) => element.dispatchEvent(new PointerEvent("pointerup", {
      bubbles: true,
      isPrimary: true,
      pointerType: "touch",
    })));
    await expect(icon, profile.name).toHaveAttribute("data-touch-pressed", "true");
    await expect(icon, profile.name).not.toHaveAttribute("data-touch-pressed");
    await expect.poll(
      () => icon.evaluate((element) => new DOMMatrixReadOnly(getComputedStyle(element).transform).a),
      { message: `${profile.name} touch release scale` },
    ).toBeLessThan(1.001);
    const unlinkedIcons = testPage.locator('[data-skill-project-unavailable] [data-skill-interaction]');
    expect(await unlinkedIcons.count(), profile.name).toBeGreaterThan(0);
    const tapIcon = unlinkedIcons.first();
    await tapIcon.tap();
    await expect(tapIcon, profile.name).toHaveAttribute("data-touch-pressed", "true");
    await expect.poll(
      () => tapIcon.evaluate((element) => new DOMMatrixReadOnly(getComputedStyle(element).transform).a),
      { message: `${profile.name} real tap scale` },
    ).toBeGreaterThan(1.02);
    await expect(tapIcon, profile.name).not.toHaveAttribute("data-touch-pressed");
    await context.close();
  }

  for (const profile of [
    {
      name: "desktop", width: 1440, height: 900,
      expectedSize: "wide", minimumCardWidth: 400, minimumIconWidth: 40,
    },
    {
      name: "large-desktop", width: 1920, height: 1080,
      expectedSize: "wide", minimumCardWidth: 590, minimumIconWidth: 60,
    },
    {
      name: "wide-desktop", width: 2560, height: 1440,
      expectedSize: "extra-wide", minimumCardWidth: 740, minimumIconWidth: 80,
    },
    {
      name: "uhd", width: 3840, height: 2160,
      expectedSize: "ultra-wide", minimumCardWidth: 880, minimumIconWidth: 90,
    },
  ]) {
    const context = await browser.newContext({
      viewport: { width: profile.width, height: profile.height },
    });
    const testPage = await context.newPage();
    await testPage.goto("/skills?audit=performance");
    const grid = testPage.locator(".skills-bento-grid");
    await expect(grid, profile.name).toBeInViewport();
    await expect(testPage.locator(".skills-stage"), profile.name).toHaveAttribute(
      "data-skills-size",
      profile.expectedSize,
    );
    const card = testPage.locator(".skills-card-surface").first();
    const cardBox = await card.boundingBox();
    const icon = testPage.locator("[data-skill-interaction]").first();
    const before = await icon.boundingBox();
    const beforeStyles = await icon.evaluate((element) => {
      const mark = element.querySelector<HTMLElement>(".skill-icon");
      const card = element.closest<HTMLElement>("[data-skills-category]");
      return {
        filter: mark ? getComputedStyle(mark).filter : "missing",
        shadow: card ? getComputedStyle(card).boxShadow : "missing",
        transform: getComputedStyle(element).transform,
      };
    });
    await icon.hover();
    await expect.poll(
      () => icon.evaluate((element) => getComputedStyle(element).transform),
      { message: `${profile.name} icon hover transform` },
    ).not.toBe(beforeStyles.transform);
    const after = await icon.boundingBox();
    const afterStyles = await icon.evaluate((element) => {
      const card = element.closest<HTMLElement>("[data-skills-category]");
      const canvas = element.closest<HTMLElement>("[data-skill-canvas]");
      const commitBar = card?.querySelector<HTMLElement>("[data-skill-commit-bar]");
      return {
        canvasOverflow: canvas ? getComputedStyle(canvas).overflow : "missing",
        canvasTop: canvas?.getBoundingClientRect().top ?? -1,
        commitBottom: commitBar?.getBoundingClientRect().bottom ?? -1,
        shadow: card ? getComputedStyle(card).boxShadow : "missing",
        transform: getComputedStyle(element).transform,
      };
    });
    const iconSizes = await testPage.locator("[data-skill-canvas]").evaluateAll((elements) => (
      elements.map((element) => {
        const rect = element.getBoundingClientRect();
        return { width: rect.width, height: rect.height };
      })
    ));
    expect(beforeStyles.filter, profile.name).not.toContain("drop-shadow");
    expect(afterStyles.shadow, profile.name).toBe(beforeStyles.shadow);
    expect(afterStyles.transform, profile.name).not.toBe(beforeStyles.transform);
    expect(afterStyles.canvasOverflow, profile.name).toBe("hidden");
    expect(afterStyles.canvasTop, profile.name).toBeGreaterThanOrEqual(afterStyles.commitBottom);
    expect(Math.max(...iconSizes.map(({ width }) => width)) - Math.min(...iconSizes.map(({ width }) => width)), profile.name).toBeLessThan(0.1);
    expect(Math.max(...iconSizes.map(({ height }) => height)) - Math.min(...iconSizes.map(({ height }) => height)), profile.name).toBeLessThan(0.1);
    expect(cardBox?.width ?? 0, profile.name).toBeGreaterThanOrEqual(profile.minimumCardWidth);
    expect(Math.min(...iconSizes.map(({ width }) => width)), profile.name).toBeGreaterThanOrEqual(profile.minimumIconWidth);
    expect(after?.y ?? 0, profile.name).toBeLessThan(before?.y ?? 0);
    expect(after?.width ?? 0, profile.name).toBeGreaterThan(before?.width ?? 0);
    expect(after?.height ?? 0, profile.name).toBeGreaterThan(before?.height ?? 0);
    const unlinkedIcon = testPage.locator('[data-skill-project-unavailable] [data-skill-interaction]').first();
    await expect(unlinkedIcon, profile.name).toBeVisible();
    await unlinkedIcon.hover();
    await expect.poll(
      () => unlinkedIcon.evaluate((element) => new DOMMatrixReadOnly(getComputedStyle(element).transform).a),
      { message: `${profile.name} unlinked icon hover scale` },
    ).toBeGreaterThan(1.02);
    await context.close();
  }
});

test("skills remain stable while scripts load on phone and desktop", async ({ browser }) => {
  test.setTimeout(60_000);
  for (const viewport of [
    { width: 412, height: 823 },
    { width: 1440, height: 900 },
  ]) {
    const context = await browser.newContext({ viewport, reducedMotion: "reduce" });
    const page = await context.newPage();
    const session = await context.newCDPSession(page);
    await session.send("Emulation.setCPUThrottlingRate", { rate: 4 });
    await page.route("**/_next/static/**/*.js", async (route) => {
      await new Promise((resolve) => setTimeout(resolve, 500));
      await route.continue();
    });
    await page.addInitScript(() => {
      const measured = window as unknown as { skillsLayoutShift: number };
      measured.skillsLayoutShift = 0;
      new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          const shift = entry as PerformanceEntry & { hadRecentInput: boolean; value: number };
          if (!shift.hadRecentInput) measured.skillsLayoutShift += shift.value;
        }
      }).observe({ type: "layout-shift", buffered: true });
    });
    await page.goto("/skills?audit=performance");
    await expect(page.locator(".skills-card-surface").first()).toBeVisible();
    await page.waitForTimeout(1_000);
    const cls = await page.evaluate(() => (
      window as unknown as { skillsLayoutShift: number }
    ).skillsLayoutShift);
    expect(cls, `${viewport.width}x${viewport.height} Skills CLS`).toBeLessThanOrEqual(0.05);
    await context.close();
  }
});

test("skills load every icon from the same origin", async ({ page }) => {
  const externalIconRequests: string[] = [];
  page.on("request", (request) => {
    const hostname = new URL(request.url()).hostname;
    if (["icon.icepanel.io", "cdn.simpleicons.org", "api.iconify.design"].includes(hostname)) {
      externalIconRequests.push(request.url());
    }
  });

  await page.goto("/skills?audit=performance");
  await expect(page.locator(".skills-card-surface").first()).toBeVisible();
  await page.waitForLoadState("networkidle");

  expect(externalIconRequests).toEqual([]);
});

test("public routes make no runtime request to legacy icon CDNs", async ({ page }) => {
  const externalIconRequests: string[] = [];
  page.on("request", (request) => {
    const hostname = new URL(request.url()).hostname;
    if (["icon.icepanel.io", "cdn.simpleicons.org", "api.iconify.design"].includes(hostname)) {
      externalIconRequests.push(request.url());
    }
  });

  for (const route of ["/", "/skills", "/journey", "/projects", "/contact", "/privacy"]) {
    await page.goto(`${route}?audit=performance`);
    await expect(page.locator("body")).toBeVisible();
    await page.waitForLoadState("networkidle");
  }

  expect(externalIconRequests).toEqual([]);
});

test("production responses keep the hardened browser security boundary", async ({ request }) => {
  const response = await request.get("/");
  expect(response.ok()).toBe(true);
  const headers = response.headers();

  expect(headers["strict-transport-security"]).toBe("max-age=63072000; includeSubDomains");
  expect(headers["cross-origin-opener-policy"]).toBe("same-origin");
  expect(headers["cross-origin-resource-policy"]).toBe("same-origin");
  expect(headers["origin-agent-cluster"]).toBe("?1");
  expect(headers["x-content-type-options"]).toBe("nosniff");
  expect(headers["x-frame-options"]).toBe("DENY");
  expect(headers["x-permitted-cross-domain-policies"]).toBe("none");
  expect(headers["content-security-policy"]).toContain("object-src 'none'");
  expect(headers["content-security-policy"]).toContain("frame-ancestors 'none'");
  expect(headers["content-security-policy"]).not.toContain("cdn.simpleicons.org");
});

test("performance audit disables continuous motion without changing the rendered design", async ({ page }) => {
  await page.goto("/skills?audit=performance");
  await expect(page.locator(".animate-card").first()).toBeVisible();
  await expect.poll(
    () => page.locator(".animate-card").first().evaluate((element) => (
      getComputedStyle(element).animationName
    )),
  ).toBe("none");
  await expect(page.locator("canvas[data-background-fps]")).toHaveAttribute(
    "data-background-mode",
    "static",
  );
  await expect(page.locator("canvas[data-background-fps]")).toHaveAttribute(
    "data-background-fps",
    "0",
  );

  await page.goto("/skills");
  await expect(page.locator(".animate-card").first()).toBeVisible();
  const expectedCardAnimation = await page.locator("html").evaluate((element) => (
    element.dataset.performanceTier === "low" ? "none" : "cardBounceFadeIn"
  ));
  await expect.poll(
    () => page.locator(".animate-card").first().evaluate((element) => (
      getComputedStyle(element).animationName
    )),
  ).toBe(expectedCardAnimation);
  await expect(page.locator("canvas[data-background-fps]")).toHaveAttribute(
    "data-background-mode",
    "animated",
  );
  await expect(page.locator("canvas[data-background-fps]")).toHaveAttribute(
    "data-background-fps",
    await expectedBackgroundFps(page),
  );
});

test("constrained computers render the final Skills state without delayed content", async ({ browser }) => {
  const context = await browser.newContext({ viewport: { width: 1366, height: 768 } });
  await context.addInitScript(() => {
    Object.defineProperty(navigator, "hardwareConcurrency", {
      configurable: true,
      value: 4,
    });
    Object.defineProperty(navigator, "deviceMemory", {
      configurable: true,
      value: 4,
    });
  });
  const page = await context.newPage();
  await page.goto("/skills");

  await expect(page.locator("html")).toHaveAttribute("data-performance-tier", "low");
  const animation = await page.locator(".animate-card").first().evaluate((element) => {
    const runningAnimation = element.getAnimations()[0];
    runningAnimation?.pause();
    if (runningAnimation) runningAnimation.currentTime = 100;
    const styles = getComputedStyle(element);
    return {
      duration: styles.animationDuration,
      filter: styles.filter,
      name: styles.animationName,
      opacity: styles.opacity,
      transform: styles.transform,
    };
  });

  expect(animation.name).toBe("none");
  expect(animation.duration).toBe("0s");
  expect(animation.filter).toBe("none");
  expect(animation.opacity).toBe("1");
  expect(animation.transform).toBe("matrix(1, 0, 0, 1, 0, 0)");
  await context.close();
});

test("contact is a keyboard-submittable JSON form", async ({ page }) => {
  const submissionId = "11111111-1111-4111-8111-111111111111";
  let preparedBody: Record<string, unknown> | null = null;
  let sentBody: Record<string, unknown> | null = null;
  await page.route("**/api/contact/prepare", async (route) => {
    preparedBody = route.request().postDataJSON() as Record<string, unknown>;
    await route.fulfill({
      contentType: "application/json",
      body: JSON.stringify({ ok: true, submissionId, uploads: [] }),
    });
  });
  await page.route("**/api/contact/send", async (route) => {
    sentBody = route.request().postDataJSON() as Record<string, unknown>;
    await route.fulfill({ contentType: "application/json", body: JSON.stringify({ ok: true }) });
  });

  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/contact");
  const form = page.locator('form[aria-label="Contact form"]:visible');
  await form.getByPlaceholder("Name").fill("Accessibility Test");
  await form.getByPlaceholder("Email").fill("test@example.com");
  await form.getByPlaceholder("Message").fill("Keyboard submission test");
  await form.getByRole("button", { name: "Send" }).click();
  await expect(form.getByRole("status")).toHaveText("Message sent");
  expect(preparedBody).toMatchObject({
    email: "test@example.com",
    files: [],
    message: "Keyboard submission test",
    name: "Accessibility Test",
  });
  expect(sentBody).toEqual({ submissionId });
});

test("contact exposes the canonical Beacons profile without tracking parameters", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/contact");

  const beacons = page.getByRole("link", { name: "Beacons" });
  await expect(beacons).toBeVisible();
  await expect(beacons).toHaveAttribute("href", "https://beacons.ai/mouaz98");
  await expect(beacons).toHaveAttribute("rel", "noopener noreferrer");
});

test("journey and contact stay fully framed across compact laptops and portrait tablets", async ({ browser }) => {
  test.setTimeout(180_000);

  for (const profile of adaptiveViewports) {
    const context = await browser.newContext({
      viewport: { width: profile.width, height: profile.height },
    });
    const testPage = await context.newPage();
    await testPage.emulateMedia({ reducedMotion: "reduce" });
    await testPage.goto("/contact");
    await expect(testPage.locator(".contact-stage-surface")).toHaveAttribute(
      "style",
      /translate\(-50%, -50%\) scale/,
    );

    const layout = await testPage.evaluate(() => {
      const contactPage = document.querySelector<HTMLElement>(".contact-page");
      const shell = document.querySelector<HTMLElement>(".contact-repository-shell");
      const send = document.querySelector<HTMLElement>(
        ".contact-adaptive-layout .contact-send-button button",
      );
      const command = document.querySelector<HTMLElement>(
        ".contact-adaptive-layout .contact-command-strip",
      );
      const footer = document.querySelector<HTMLElement>(".contact-page .site-footer");
      const portraitRow = document.querySelector<HTMLElement>(".contact-profile-portrait-row");
      const portrait = document.querySelector<HTMLElement>(".contact-portrait-frame");
      if (!contactPage || !shell || !send || !command || !footer || !portraitRow || !portrait) {
        throw new Error("Contact layout is incomplete");
      }
      const shellRect = shell.getBoundingClientRect();
      const sendRect = send.getBoundingClientRect();
      const commandRect = command.getBoundingClientRect();
      const footerRect = footer.getBoundingClientRect();
      const portraitRowRect = portraitRow.getBoundingClientRect();
      const portraitRect = portrait.getBoundingClientRect();
      return {
        horizontalOverflow: document.documentElement.scrollWidth - window.innerWidth,
        documentHeight: document.documentElement.scrollHeight,
        pageScrollOverflow: contactPage.scrollHeight - contactPage.clientHeight,
        shell: {
          left: shellRect.left,
          right: shellRect.right,
          top: shellRect.top,
          bottom: shellRect.bottom,
          height: shellRect.height,
        },
        send: { top: sendRect.top, bottom: sendRect.bottom },
        command: { top: commandRect.top, bottom: commandRect.bottom },
        footer: { top: footerRect.top, bottom: footerRect.bottom },
        portrait: {
          width: portraitRect.width,
          top: portraitRect.top,
          bottom: portraitRect.bottom,
          height: portraitRect.height,
          rowWidth: portraitRowRect.width,
          rowHeight: portraitRowRect.height,
          centreDelta: Math.abs(
            (portraitRect.top + portraitRect.bottom) / 2
              - (portraitRowRect.top + portraitRowRect.bottom) / 2,
          ),
        },
        viewportHeight: window.innerHeight,
        viewportWidth: window.innerWidth,
      };
    });

    expect(layout.horizontalOverflow, profile.name).toBeLessThanOrEqual(1);
    expect(layout.shell.left, profile.name).toBeGreaterThanOrEqual(0);
    expect(layout.shell.right, profile.name).toBeLessThanOrEqual(layout.viewportWidth + 1);
    expect(layout.shell.top, profile.name).toBeGreaterThanOrEqual(0);
    expect(layout.shell.bottom, profile.name).toBeLessThanOrEqual(layout.documentHeight + 1);
    expect(layout.send.top, profile.name).toBeGreaterThanOrEqual(layout.shell.top);
    expect(layout.send.bottom, profile.name).toBeLessThanOrEqual(layout.shell.bottom + 1);
    expect(layout.command.top, profile.name).toBeGreaterThanOrEqual(layout.shell.top);
    expect(layout.command.bottom, profile.name).toBeLessThanOrEqual(layout.shell.bottom + 1);
    expect(layout.shell.bottom, profile.name).toBeLessThanOrEqual(layout.footer.top + 1);
    expect(layout.footer.bottom, profile.name).toBeLessThanOrEqual(layout.documentHeight + 1);
    expect(layout.portrait.top, profile.name).toBeGreaterThanOrEqual(layout.shell.top);
    expect(layout.portrait.bottom, profile.name).toBeLessThanOrEqual(layout.shell.bottom + 1);
    expect(layout.portrait.centreDelta, profile.name).toBeLessThanOrEqual(2);

    expect(layout.footer.bottom, profile.name).toBeLessThanOrEqual(layout.viewportHeight + 1);
    expect(layout.pageScrollOverflow, profile.name).toBeLessThanOrEqual(1);

    if (profile.height <= 720) {
      expect(layout.shell.height, profile.name).toBeGreaterThanOrEqual(430);
      expect(layout.documentHeight, profile.name).toBeLessThanOrEqual(layout.viewportHeight + 1);
    }

    if (profile.height >= 1024) {
      expect(layout.shell.height, profile.name).toBeGreaterThanOrEqual(690);
      expect(layout.shell.bottom, profile.name).toBeLessThanOrEqual(layout.footer.top + 1);
      expect(layout.portrait.height, profile.name).toBeGreaterThanOrEqual(275);
      expect(Math.abs(layout.portrait.width - layout.portrait.rowWidth), profile.name).toBeLessThanOrEqual(1);
      expect(Math.abs(layout.portrait.height - layout.portrait.rowHeight), profile.name).toBeLessThanOrEqual(1);
    }

    await context.close();
  }

  const journeyContext = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const journeyPage = await journeyContext.newPage();
  await journeyPage.emulateMedia({ reducedMotion: "reduce" });
  await journeyPage.goto("/journey");
  const journeyRows = journeyPage.locator(".commit-row");
  await expect.poll(async () => journeyRows.count()).toBeGreaterThanOrEqual(6);
  expect(await journeyRows.count()).toBeLessThanOrEqual(7);

  const journeyLayout = await journeyPage.evaluate(() => {
    const main = document.querySelector<HTMLElement>(".journey-main");
    const rows = [...document.querySelectorAll<HTMLElement>(".commit-row")];
    if (!main || rows.length === 0) throw new Error("Journey layout is incomplete");
    const lastRect = rows.at(-1)!.getBoundingClientRect();
    return {
      horizontalOverflow: document.documentElement.scrollWidth - window.innerWidth,
      mainOverflow: main.scrollHeight - main.clientHeight,
      lastBottom: lastRect.bottom,
      viewportHeight: window.innerHeight,
    };
  });

  expect(journeyLayout.horizontalOverflow).toBeLessThanOrEqual(1);
  expect(journeyLayout.mainOverflow).toBeLessThanOrEqual(1);
  expect(journeyLayout.lastBottom).toBeLessThanOrEqual(journeyLayout.viewportHeight + 1);
  await journeyContext.close();
});

test("very short desktop windows fit contact controls without document scrolling", async ({ browser }) => {
  for (const profile of [
    { name: "wide-450", width: 1723, height: 450 },
    { name: "desktop-500", width: 1366, height: 500 },
    { name: "laptop-550", width: 1024, height: 550 },
    { name: "compact-450", width: 800, height: 450 },
  ]) {
    const context = await browser.newContext({ viewport: profile });
    const page = await context.newPage();
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/contact?audit=performance");
    await expect(page.locator(".contact-stage-surface")).toHaveAttribute(
      "style",
      /translate\(-50%, -50%\) scale/,
    );

    const geometry = await page.evaluate(() => {
      const contactPage = document.querySelector<HTMLElement>(".contact-page");
      const shell = document.querySelector<HTMLElement>(".contact-repository-shell");
      const send = document.querySelector<HTMLElement>(
        ".contact-adaptive-layout .contact-send-button button",
      );
      const command = document.querySelector<HTMLElement>(
        ".contact-adaptive-layout .contact-command-strip",
      );
      const footer = document.querySelector<HTMLElement>(".contact-page .site-footer");
      if (!contactPage || !shell || !send || !command || !footer) {
        throw new Error("Short contact layout is incomplete");
      }
      const shellRect = shell.getBoundingClientRect();
      const sendRect = send.getBoundingClientRect();
      const commandRect = command.getBoundingClientRect();
      const footerRect = footer.getBoundingClientRect();
      return {
        horizontalOverflow: document.documentElement.scrollWidth - innerWidth,
        pageScrollOverflow: contactPage.scrollHeight - contactPage.clientHeight,
        documentHeight: document.documentElement.scrollHeight,
        viewportHeight: innerHeight,
        shell: { top: shellRect.top, bottom: shellRect.bottom },
        send: { top: sendRect.top, bottom: sendRect.bottom },
        command: { top: commandRect.top, bottom: commandRect.bottom },
        footer: { top: footerRect.top, bottom: footerRect.bottom },
      };
    });

    expect(geometry.horizontalOverflow, profile.name).toBeLessThanOrEqual(1);
    expect(geometry.pageScrollOverflow, profile.name).toBeLessThanOrEqual(1);
    expect(geometry.documentHeight, profile.name).toBeLessThanOrEqual(geometry.viewportHeight + 1);
    expect(geometry.send.top, profile.name).toBeGreaterThanOrEqual(geometry.shell.top);
    expect(geometry.send.bottom, profile.name).toBeLessThanOrEqual(geometry.shell.bottom + 1);
    expect(geometry.command.top, profile.name).toBeGreaterThanOrEqual(geometry.shell.top);
    expect(geometry.command.bottom, profile.name).toBeLessThanOrEqual(geometry.shell.bottom + 1);
    expect(geometry.footer.top, profile.name).toBeGreaterThanOrEqual(geometry.shell.bottom);
    await expect(page.locator(".contact-page .site-footer"), profile.name).toBeInViewport();
    await expect(
      page.locator(".contact-adaptive-layout .contact-send-button button"),
      profile.name,
    ).toBeInViewport();
    await context.close();
  }
});

test("all public pages keep their primary content visible or reachable in short browser windows", async ({ browser }) => {
  test.setTimeout(240_000);
  const shortProfiles = [
    { name: "wide-split-screen", width: 1723, height: 450 },
    { name: "wide-short-laptop", width: 1723, height: 608 },
    { name: "small-short-laptop", width: 1024, height: 600 },
    { name: "compact-short-laptop", width: 800, height: 600 },
  ] as const;

  for (const profile of shortProfiles) {
    const context = await browser.newContext({ viewport: profile });
    const page = await context.newPage();
    await page.emulateMedia({ reducedMotion: "reduce" });

    for (const route of routes) {
      const label = `${profile.name} ${route}`;
      await page.goto(`${route}?audit=performance`);
      await expect(page.locator(publicSurfaceSelectors[route]).first(), label).toBeVisible();

      const frame = await page.evaluate(() => {
        const header = document.querySelector<HTMLElement>(".site-header")?.getBoundingClientRect();
        return {
          horizontalOverflow: document.documentElement.scrollWidth - innerWidth,
          headerTop: header?.top ?? -1,
          headerBottom: header?.bottom ?? -1,
          viewportHeight: innerHeight,
        };
      });
      expect(frame.horizontalOverflow, label).toBeLessThanOrEqual(1);
      expect(frame.headerTop, label).toBeGreaterThanOrEqual(0);
      expect(frame.headerBottom, label).toBeLessThanOrEqual(frame.viewportHeight + 1);

      if (route === "/") {
        await expect(page.locator("[data-home-actions]"), label).toBeInViewport();
        const capabilities = page.locator("[data-home-capability]:visible");
        if (await capabilities.count()) {
          await capabilities.last().scrollIntoViewIfNeeded();
          await expect(capabilities.last(), label).toBeInViewport();
        }
      } else if (route === "/skills") {
        const stage = page.locator(".skills-stage");
        const firstCard = page.locator(".skills-card-surface").first();
        const lastCard = page.locator(".skills-card-surface").last();
        await expect(firstCard, label).toBeInViewport();
        await expect(lastCard, label).toBeInViewport();
        const [stageBox, firstBox, lastBox] = await Promise.all([
          stage.boundingBox(), firstCard.boundingBox(), lastCard.boundingBox(),
        ]);
        expect(firstBox!.y, label).toBeGreaterThanOrEqual(stageBox!.y - 1);
        expect(lastBox!.y + lastBox!.height, label)
          .toBeLessThanOrEqual(stageBox!.y + stageBox!.height + 1);
      } else if (route === "/journey") {
        const main = page.locator(".journey-main");
        const lastCommit = page.locator(".commit-row").last();
        const mainBox = await main.boundingBox();
        expect(mainBox!.y + mainBox!.height, label).toBeLessThanOrEqual(profile.height + 1);
        await lastCommit.scrollIntoViewIfNeeded();
        await expect(lastCommit, label).toBeInViewport();
      } else if (route === "/projects") {
        const lastProject = page.locator(".projects-project-row:visible, .projects-mobile-card-wrap:visible").last();
        await lastProject.scrollIntoViewIfNeeded();
        await expect(lastProject, label).toBeInViewport();
      } else {
        await expect(page.locator(".site-footer"), label).toBeInViewport();
        await expect(
          page.locator(".contact-adaptive-layout .contact-send-button button"),
          label,
        ).toBeInViewport();
      }
    }

    await context.close();
  }
});

test("Journey resolves its loader promptly and keeps its route", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/journey");
  await expect(page.getByText("Journey", { exact: true }).first()).toBeVisible({ timeout: 5_000 });
  await expect(page.locator(".la-status", { hasText: "Loading Journey..." })).toBeHidden();
  expect(page.url()).toContain("/journey");
});

test("server-preloaded routes do not add an artificial loading delay", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  const duplicateDataRequests: string[] = [];
  page.on("request", (request) => {
    const pathname = new URL(request.url()).pathname;
    if (["/api/skills", "/api/skill-categories", "/api/journey", "/api/project"].includes(pathname)) {
      duplicateDataRequests.push(pathname);
    }
  });

  for (const { route, readySelector } of [
    { route: "/skills", readySelector: ".skills-bento-grid" },
    { route: "/journey", readySelector: ".commit-row" },
    { route: "/projects", readySelector: ".projects-shell" },
  ]) {
    await page.goto("/");
    await Promise.all([
      page.waitForURL(`**${route}`),
      page.locator(`a[href="${route}"]`).first().click(),
    ]);

    await expect(page.locator(readySelector).first()).toBeVisible({ timeout: 5_000 });
    await expect(page.locator(".la-window")).toHaveCount(0);
  }
  expect(duplicateDataRequests).toEqual([]);
});

test("canonical public routes replace legacy page suffixes without breaking locale or query", async ({ page }) => {
  for (const [legacy, canonical] of [
    ["/skills", "/skills"],
    ["/projects", "/projects"],
    ["/contact", "/contact"],
    ["/sv/skills", "/sv/skills"],
  ] as const) {
    await page.goto(`${legacy}?redirect-check=1`);
    const url = new URL(page.url());
    expect(url.pathname).toBe(canonical);
    expect(url.searchParams.get("redirect-check")).toBe("1");
  }
});

test("Arabic keeps the established home composition and reports no app errors", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });

  const readStableHomeComposition = async () => {
    const hero = page.locator("[data-home-hero]");
    const portrait = page.locator("[data-home-stage]");
    await expect(hero).toBeVisible();
    await expect(portrait).toBeVisible();
    await page.evaluate(async () => {
      await document.fonts.ready;
      await Promise.all(Array.from(document.images, (image) => {
        if (image.complete) return Promise.resolve();
        return new Promise<void>((resolve) => {
          image.addEventListener("load", () => resolve(), { once: true });
          image.addEventListener("error", () => resolve(), { once: true });
        });
      }));
      await new Promise<void>((resolve) => {
        requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
      });
    });
    const [heroBox, portraitBox] = await Promise.all([
      hero.boundingBox(),
      portrait.boundingBox(),
    ]);
    expect(heroBox).not.toBeNull();
    expect(portraitBox).not.toBeNull();
    return { hero: heroBox!, portrait: portraitBox! };
  };

  await page.goto("/");
  const english = await readStableHomeComposition();

  await page.goto("/ar");
  await expect(page.locator("html")).toHaveAttribute("lang", "ar");
  await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
  const arabic = await readStableHomeComposition();

  expect(Math.abs(arabic.hero.x - english.hero.x)).toBeLessThan(2);
  expect(Math.abs(arabic.portrait.x - english.portrait.x)).toBeLessThan(2);
  expect(errors).toEqual([]);
});

test("Arabic is localized and remains inside the mobile viewport", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/ar");

  await expect(page.locator("html")).toHaveAttribute("lang", "ar");
  await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
  await expect(page.locator("[data-home-role-sequence]")).toHaveAttribute(
    "data-home-role-sequence",
    "ماجستير في هندسة البرمجيات|مصمم|مطوّر|مطوّر ذكاء اصطناعي|مطوّر ويب|الأمن السيبراني|ماجستير في هندسة البرمجيات",
  );
  await expect(page.locator("[data-role-cycler-active]")).toHaveText("ماجستير في هندسة البرمجيات");
  await expect(page.getByRole("link", { name: /عرض المشاريع/ }).first()).toBeVisible();

  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  expect(overflow).toBeLessThanOrEqual(1);
});

test("localized compact landscape never falls back to English or overlaps the portrait", async ({ page }) => {
  await page.setViewportSize({ width: 790, height: 410 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/sv");

  await expect(page.locator("html")).toHaveAttribute("lang", "sv");
  await expect(page.locator("[data-home-role-sequence]")).toHaveAttribute(
    "data-home-role-sequence",
    "Master i programvaruteknik|Designer|Utvecklare|AI-utvecklare|Webbutvecklare|Cybersäkerhet|Master i programvaruteknik",
  );
  await expect(page.locator("[data-role-cycler-active]")).toHaveText("Master i programvaruteknik");
  await expect(page.locator("[data-home-stage]")).toBeHidden();

  await page.setViewportSize({ width: 648, height: 410 });
  await page.goto("/ar");
  await expect(page.locator("html")).toHaveAttribute("lang", "ar");
  await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
  await expect(page.locator("[data-home-role-sequence]")).toHaveAttribute(
    "data-home-role-sequence",
    "ماجستير في هندسة البرمجيات|مصمم|مطوّر|مطوّر ذكاء اصطناعي|مطوّر ويب|الأمن السيبراني|ماجستير في هندسة البرمجيات",
  );
  await expect(page.locator("[data-role-cycler-active]")).toHaveText("ماجستير في هندسة البرمجيات");
  await expect(page.locator("[data-home-stage]")).toBeHidden();
});

test("language switching keeps localized content responsive", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");

  await page.getByRole("button", { name: "Open menu" }).click();
  await page.getByRole("button", { name: "Choose language" }).click();
  await page.getByRole("menuitemradio", { name: "العربية" }).click();

  await expect(page).toHaveURL(/\/ar$/);
  await expect(page.locator("html")).toHaveAttribute("lang", "ar");
  await expect(page.locator("[data-home-role-sequence]")).toHaveAttribute(
    "data-home-role-sequence",
    /ماجستير في هندسة البرمجيات/,
  );
});

test("Swedish and Arabic public routes stay localized without horizontal overflow", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.emulateMedia({ reducedMotion: "reduce" });

  for (const locale of ["sv", "ar"] as const) {
    for (const route of routes) {
      const localizedRoute = route === "/" ? `/${locale}` : `/${locale}${route}`;
      await page.goto(localizedRoute);
      await expect(page.locator("html")).toHaveAttribute("lang", locale);
      await expect(page.locator("html")).toHaveAttribute(
        "dir",
        locale === "ar" ? "rtl" : "ltr",
      );
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth - window.innerWidth,
      );
      expect(overflow, `${localizedRoute} overflow`).toBeLessThanOrEqual(1);
    }
  }
});

test("known Bitdefender marker is removed before React hydration", async ({ page }) => {
  await page.addInitScript(() => {
    const injector = new MutationObserver(() => {
      const target = document.querySelector("div");
      if (!target) return;
      target.setAttribute("bis_skin_checked", "1");
      injector.disconnect();
    });
    injector.observe(document, { childList: true, subtree: true });
  });

  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });

  await page.goto("/ar");
  await expect(page.locator("[bis_skin_checked]")).toHaveCount(0);
  expect(errors.filter((error) => /hydrated.*didn.t match/i.test(error))).toEqual([]);
});
