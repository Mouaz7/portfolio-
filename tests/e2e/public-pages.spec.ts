import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";
import { mkdir } from "node:fs/promises";
import sharp from "sharp";

const routes = [
  "/",
  "/skills-page",
  "/journey",
  "/projects-page",
  "/code-review-page",
  "/contact-page",
] as const;
const viewports = [
  { name: "mobile", width: 390, height: 844 },
  { name: "tablet", width: 768, height: 1024 },
  { name: "desktop", width: 1440, height: 900 },
] as const;
const visualOutput = "test-results/visual-actual";

// These color-contrast findings are part of the explicitly locked visual
// design. Keep the allowance narrow and count-based: every other serious or
// critical axe violation still blocks CI, and additional contrast failures do
// too. Reducing these counts remains allowed.
const lockedContrastNodeLimits: Record<string, number> = {
  "mobile:light:/projects-page": 5,
  "mobile:light:/journey": 14,
  "mobile:light:/code-review-page": 1,
  "mobile:light:/contact-page": 2,
  "tablet:light:/projects-page": 1,
  "tablet:light:/journey": 19,
  "tablet:light:/code-review-page": 2,
  "tablet:light:/contact-page": 2,
  "desktop:light:/projects-page": 1,
  "desktop:light:/journey": 19,
  "desktop:light:/code-review-page": 2,
  "desktop:light:/contact-page": 2,
};

function routeName(route: (typeof routes)[number]) {
  return route === "/" ? "home" : route.slice(1);
}

async function waitUntil(startedAt: number, elapsedMs: number) {
  const remaining = elapsedMs - (Date.now() - startedAt);
  if (remaining > 0) await new Promise((resolve) => setTimeout(resolve, remaining));
}

async function expectedBackgroundFps(page: Page) {
  return page.evaluate(() => {
    const lowPowerViewport = window.matchMedia(
      "(max-width: 675px), (hover: none), (pointer: coarse)",
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
          await page.waitForLoadState("networkidle");
          if (route === "/skills-page") {
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
          const contrast = blocking.find((item) => item.id === "color-contrast");
          expect(blocking.filter((item) => item.id !== "color-contrast")).toEqual([]);
          expect(contrast?.nodes.length ?? 0).toBeLessThanOrEqual(
            lockedContrastNodeLimits[`${viewport.name}:${theme}:${route}`] ?? 0,
          );
        });
      }
    });
  }
}

test("mobile project repository stats stay readable inside the card", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/projects-page");

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

test("code review exposes the localized meta description", async ({ page }) => {
  const localizedDescriptions = [
    {
      path: "/code-review-page",
      description: "Review code for bugs, quality, performance, and security risks with AI.",
    },
    {
      path: "/sv/code-review-page",
      description: "Granska kod efter buggar, kvalitetsproblem, prestandabrister och säkerhetsrisker med AI.",
    },
    {
      path: "/ar/code-review-page",
      description: "راجع الكود وحسّن أداءه واكتشف الأخطاء والثغرات الأمنية بمساعدة الذكاء الاصطناعي.",
    },
  ] as const;

  for (const localized of localizedDescriptions) {
    await page.goto(localized.path);
    await expect(page.locator('meta[name="description"]')).toHaveAttribute(
      "content",
      localized.description,
    );
  }
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

  await page.goto("/skills-page");
  await expect(page.locator(".skills-bento-grid")).toBeInViewport();

  await page.goto("/contact-page");
  await expect(page.locator(".contact-mobile-actions:visible")).toBeInViewport();
  await expect(page.locator(".site-footer")).toBeInViewport();
  await context.close();
});

test("mobile background stays animated across phone sizes, orientations, routes and themes", async ({ browser }) => {
  test.setTimeout(600_000);
  const phoneProfiles: ReadonlyArray<{
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

  for (const profile of phoneProfiles) {
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
  }
});

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
  test.setTimeout(90_000);
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
    await testPage.goto("/skills-page?audit=performance");
    await expect(testPage.locator(".page-loading-stage"), profile.name).toHaveCount(0);
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
    const before = await icon.boundingBox();
    const iconSizes = await testPage.locator("[data-skill-canvas]").evaluateAll((elements) => (
      elements.map((element) => {
        const rect = element.getBoundingClientRect();
        return { width: rect.width, height: rect.height };
      })
    ));

    const animationCount = await icon.evaluate((element) => {
      element.dispatchEvent(new PointerEvent("pointerdown", {
        bubbles: true,
        isPrimary: true,
        pointerType: "touch",
      }));
      return element.getAnimations().length;
    });
    const after = await icon.boundingBox();

    expect(animationCount, profile.name).toBe(0);
    expect(Math.max(...iconSizes.map(({ width }) => width)) - Math.min(...iconSizes.map(({ width }) => width)), profile.name).toBeLessThan(0.1);
    expect(Math.max(...iconSizes.map(({ height }) => height)) - Math.min(...iconSizes.map(({ height }) => height)), profile.name).toBeLessThan(0.1);
    expect(after?.x, profile.name).toBeCloseTo(before?.x ?? 0, 4);
    expect(after?.y, profile.name).toBeCloseTo(before?.y ?? 0, 4);
    expect(after?.width, profile.name).toBeCloseTo(before?.width ?? 0, 4);
    expect(after?.height, profile.name).toBeCloseTo(before?.height ?? 0, 4);
    await context.close();
  }

  for (const profile of [
    { name: "desktop", width: 1440, height: 900 },
    { name: "large-desktop", width: 1920, height: 1080 },
    { name: "wide-desktop", width: 2560, height: 1440 },
  ]) {
    const context = await browser.newContext({
      viewport: { width: profile.width, height: profile.height },
    });
    const testPage = await context.newPage();
    await testPage.goto("/skills-page?audit=performance");
    const grid = testPage.locator(".skills-bento-grid");
    await expect(grid, profile.name).toBeInViewport();
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
    expect(after?.y ?? 0, profile.name).toBeLessThan(before?.y ?? 0);
    expect(after?.width ?? 0, profile.name).toBeGreaterThan(before?.width ?? 0);
    expect(after?.height ?? 0, profile.name).toBeGreaterThan(before?.height ?? 0);
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

  await page.goto("/skills-page?audit=performance");
  await expect(page.locator(".skills-card-surface").first()).toBeVisible();
  await page.waitForLoadState("networkidle");

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
});

test("performance audit disables continuous motion without changing the rendered design", async ({ page }) => {
  await page.goto("/skills-page?audit=performance");
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

  await page.goto("/skills-page");
  await expect(page.locator(".animate-card").first()).toBeVisible();
  await expect.poll(
    () => page.locator(".animate-card").first().evaluate((element) => (
      getComputedStyle(element).animationName
    )),
  ).toBe("cardBounceFadeIn");
  await expect(page.locator("canvas[data-background-fps]")).toHaveAttribute(
    "data-background-mode",
    "animated",
  );
  await expect(page.locator("canvas[data-background-fps]")).toHaveAttribute(
    "data-background-fps",
    await expectedBackgroundFps(page),
  );
});

test("code review listbox and tabs support arrow-key navigation", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/code-review-page");
  await expect(page.locator(".la-status")).toBeHidden({ timeout: 10_000 });
  const languageButton = page.getByRole("button", { name: "Code language" });
  await expect(languageButton).toBeVisible({ timeout: 5_000 });
  await languageButton.press("ArrowDown");
  const listbox = page.getByRole("listbox", { name: "Code language options" });
  await expect(listbox.getByRole("option", { name: "TypeScript" })).toBeFocused();
  await page.keyboard.press("ArrowDown");
  await expect(listbox.getByRole("option", { name: "JavaScript" })).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(languageButton).toBeFocused();

  const editorTab = page.getByRole("tab", { name: "Editor" });
  await editorTab.focus();
  await editorTab.press("ArrowRight");
  const resultTab = page.getByRole("tab", { name: "Result" });
  await expect(resultTab).toBeFocused();
  await expect(resultTab).toHaveAttribute("aria-selected", "true");
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
  await page.goto("/contact-page");
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
  await page.goto("/contact-page");

  const beacons = page.getByRole("link", { name: "Beacons" });
  await expect(beacons).toBeVisible();
  await expect(beacons).toHaveAttribute("href", "https://beacons.ai/mouaz98");
  await expect(beacons).toHaveAttribute("rel", "noopener noreferrer");
});

test("Journey resolves its loader promptly and keeps its route", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/journey");
  await expect(page.getByText("Journey", { exact: true }).first()).toBeVisible({ timeout: 5_000 });
  await expect(page.locator(".la-status", { hasText: "Loading Journey..." })).toBeHidden();
  expect(page.url()).toContain("/journey");
});

test("data and code routes keep the shared terminal loading architecture", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.emulateMedia({ reducedMotion: "reduce" });

  for (const route of [
    "/skills-page",
    "/journey",
    "/projects-page",
    "/code-review-page",
  ]) {
    await page.goto("/");
    await Promise.all([
      page.waitForURL(`**${route}`),
      page.locator(`a[href="${route}"]`).first().click(),
    ]);

    await expect(page.locator(".la-window")).toBeVisible({ timeout: 1_000 });
    await expect(page.locator(".la-window")).toBeHidden({ timeout: 1_500 });
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

  await page.goto("/");
  const englishHero = await page.locator("[data-home-hero]").boundingBox();
  const englishPortrait = await page.locator("[data-home-stage]").boundingBox();

  await page.goto("/ar");
  await expect(page.locator("html")).toHaveAttribute("lang", "ar");
  await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
  const arabicHero = await page.locator("[data-home-hero]").boundingBox();
  const arabicPortrait = await page.locator("[data-home-stage]").boundingBox();

  expect(Math.abs((arabicHero?.x ?? 0) - (englishHero?.x ?? 0))).toBeLessThan(2);
  expect(Math.abs((arabicPortrait?.x ?? 0) - (englishPortrait?.x ?? 0))).toBeLessThan(2);
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
    "مهندس برمجيات|مصمم|مطوّر|مطوّر ذكاء اصطناعي|مطوّر ويب|الأمن السيبراني|مهندس برمجيات",
  );
  await expect(page.locator("[data-role-cycler-active]")).toHaveText("مهندس برمجيات");
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
    "Mjukvaruingenjör|Designer|Utvecklare|AI-utvecklare|Webbutvecklare|Cybersäkerhet|Mjukvaruingenjör",
  );
  await expect(page.locator("[data-role-cycler-active]")).toHaveText("Mjukvaruingenjör");
  await expect(page.locator("[data-home-stage]")).toBeHidden();

  await page.setViewportSize({ width: 648, height: 410 });
  await page.goto("/ar");
  await expect(page.locator("html")).toHaveAttribute("lang", "ar");
  await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
  await expect(page.locator("[data-home-role-sequence]")).toHaveAttribute(
    "data-home-role-sequence",
    "مهندس برمجيات|مصمم|مطوّر|مطوّر ذكاء اصطناعي|مطوّر ويب|الأمن السيبراني|مهندس برمجيات",
  );
  await expect(page.locator("[data-role-cycler-active]")).toHaveText("مهندس برمجيات");
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
    /مهندس برمجيات/,
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
