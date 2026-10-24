import { expect, test } from "@playwright/test";

const sizes = [
  [390, 500], [390, 844], [844, 390], [967, 943],
  [800, 600], [900, 600], [1024, 600], [1024, 768], [1280, 720], [1366, 768],
  [712, 1138], [768, 1024], [853, 1280], [912, 1368], [960, 1440], [1032, 1376], [1280, 800],
];
const pages = ["/", "/skills", "/journey", "/projects", "/contact"];

test("home slide and navigation fit short viewports", async ({ page }) => {
  for (const viewport of [
    { width: 390, height: 500 },
    { width: 844, height: 390 },
  ]) {
    await page.setViewportSize(viewport);
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/");

    const slide = page.locator("[data-home-viewport]");
    await expect.poll(async () => Number(await slide.getAttribute("data-home-slide-scale")))
      .toBeLessThan(1);

    const geometry = await page.evaluate(() => {
      const slideRect = document.querySelector("[data-home-viewport]")!.getBoundingClientRect();
      const actionRect = document.querySelector("[data-home-actions]")!.getBoundingClientRect();
      return {
        slideTop: slideRect.top,
        slideBottom: slideRect.bottom,
        actionsBottom: actionRect.bottom,
        documentWidth: document.documentElement.scrollWidth,
      };
    });

    expect(geometry.slideTop).toBeCloseTo(0, 0);
    expect(geometry.slideBottom).toBeLessThanOrEqual(viewport.height + 1);
    expect(geometry.actionsBottom).toBeLessThanOrEqual(viewport.height + 1);
    expect(geometry.documentWidth).toBeLessThanOrEqual(viewport.width + 1);

    if (viewport.width < 676) {
      await page.locator(".site-header-mobile-controls button").click();
      await expect(page.locator(".site-header-mobile-panel")).toHaveAttribute("data-open", "true");
      const panel = await page.locator(".site-header-mobile-panel").boundingBox();
      expect(panel).not.toBeNull();
      expect(panel!.y).toBeCloseTo(0, 0);
      expect(panel!.y + panel!.height).toBeGreaterThanOrEqual(viewport.height - 1);
    }
  }
});

test("Home keeps the portrait clear of its title across phone and tablet sizes", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });

  for (const viewport of [
    { width: 320, height: 568, headerHeight: 48 },
    { width: 390, height: 844, headerHeight: 48 },
    { width: 800, height: 600, headerHeight: 58 },
    { width: 967, height: 943, headerHeight: 58 },
  ]) {
    await page.setViewportSize(viewport);
    await page.goto("/");
    await expect.poll(async () => page.evaluate(() => {
      const image = document.querySelector<HTMLImageElement>(".home-portrait-artbox img");
      return Boolean(image?.naturalWidth);
    })).toBe(true);

    await expect.poll(async () => page.evaluate(() => {
      const title = document.querySelector("[data-home-title]")!.getBoundingClientRect();
      const box = document.querySelector(".home-portrait-artbox")!.getBoundingClientRect();
      const image = document.querySelector<HTMLImageElement>(".home-portrait-artbox img")!;
      const imageHeight = Math.min(box.height, box.width * image.naturalHeight / image.naturalWidth);
      return box.bottom - imageHeight + imageHeight * (151 / 2405) - title.bottom;
    })).toBeGreaterThanOrEqual(12);

    const geometry = await page.evaluate(() => {
      const header = document.querySelector(".site-header")!.getBoundingClientRect();
      return { headerTop: header.top, headerHeight: header.height };
    });
    expect(geometry.headerTop).toBeCloseTo(0, 0);
    expect(geometry.headerHeight).toBeCloseTo(viewport.headerHeight, 0);
  }
});

test("the localized master headline fits phone, tablet and desktop widths", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  for (const locale of ["en", "sv", "ar"]) {
    for (const viewport of [
      { width: 320, height: 568 },
      { width: 390, height: 844 },
      { width: 967, height: 943 },
      { width: 1280, height: 800 },
    ]) {
      await page.setViewportSize(viewport);
      await page.goto(locale === "en" ? "/" : `/${locale}`);
      const role = page.locator("[data-role-cycler-active]");
      await expect(role).toBeVisible();
      const box = await role.boundingBox();
      expect(box, `${locale} ${viewport.width}x${viewport.height}`).not.toBeNull();
      expect(box!.x).toBeGreaterThanOrEqual(-1);
      expect(box!.x + box!.width).toBeLessThanOrEqual(viewport.width + 1);
    }
  }
});

test("home actions stay compact and balanced at every layout breakpoint", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });

  for (const viewport of [
    { width: 320, height: 568 },
    { width: 390, height: 844 },
    { width: 860, height: 427 },
    { width: 967, height: 943 },
    { width: 1366, height: 768 },
  ]) {
    await page.setViewportSize(viewport);
    await page.goto("/");

    const actions = page.locator("[data-home-actions]");
    // Streamed Home markup can be attached inside a hidden Suspense container.
    // Measure the painted controls after their fonts have finished loading.
    await expect(actions).toBeVisible();
    await expect(actions.getByRole("link", { name: "View Projects" })).toBeVisible();
    await expect(actions.getByRole("button", { name: "Download CV" })).toBeVisible();
    await page.evaluate(async () => { await document.fonts.ready; });

    const geometry = await actions.evaluate((actions) => {
      const actionRect = actions.getBoundingClientRect();
      const buttons = Array.from(actions.children).map((button) =>
        button.getBoundingClientRect(),
      );
      const icons = Array.from(actions.querySelectorAll("svg")).map((icon) =>
        icon.getBoundingClientRect(),
      );
      return {
        actionWidth: actionRect.width,
        actionBottom: actionRect.bottom,
        buttonWidths: buttons.map((button) => button.width),
        buttonHeights: buttons.map((button) => button.height),
        iconSizes: icons.map((icon) => Math.max(icon.width, icon.height)),
      };
    });

    const context = `${viewport.width}x${viewport.height}`;
    expect(geometry.actionWidth, context).toBeLessThanOrEqual(462);
    expect(geometry.actionBottom, context).toBeLessThanOrEqual(viewport.height + 1);
    expect(Math.abs(geometry.buttonWidths[0] - geometry.buttonWidths[1]), context).toBeLessThanOrEqual(2);
    expect(Math.max(...geometry.buttonHeights), context).toBeLessThanOrEqual(55);
    // The full Home stage scales down as one unit on very short
    // landscape screens, so the rendered height may dip below the CSS size.
    expect(Math.min(...geometry.buttonHeights), context).toBeGreaterThanOrEqual(36);
    expect(Math.max(...geometry.iconSizes), context).toBeLessThanOrEqual(23);
  }
});

test("Skills keeps its existing short-phone scroll behavior", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  const viewport = { width: 390, height: 500 };
  await page.setViewportSize(viewport);
  await page.goto("/skills");

  const main = page.locator(".skills-stage");
  await expect(main).toHaveAttribute("data-skills-layout", "phone");
  await expect(main).toHaveAttribute("data-skills-overflow", "scroll");
  await expect.poll(async () => Number(await main.getAttribute("data-viewport-scale")))
    .toBeGreaterThanOrEqual(0.5);

  const cards = page.locator(".skills-bento-grid > li");
  await expect(cards).toHaveCount(9);
  const firstWidth = (await cards.first().boundingBox())!.width;
  expect(firstWidth).toBeGreaterThanOrEqual(175);

  await cards.last().scrollIntoViewIfNeeded();
  await expect(cards.last()).toBeInViewport({ ratio: 0.9 });
  const geometry = await page.evaluate(() => ({
    documentWidth: document.documentElement.scrollWidth,
    documentHeight: document.documentElement.scrollHeight,
  }));
  expect(geometry.documentWidth).toBeLessThanOrEqual(viewport.width + 1);
  expect(geometry.documentHeight).toBeLessThanOrEqual(viewport.height + 1);
});

test("Skills fits nine larger cards without scroll on tablets and desktops", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });

  for (const viewport of [
    { width: 768, height: 1024, minCardWidth: 230, minIconWidth: 38 },
    { width: 844, height: 390, minCardWidth: 90, minIconWidth: 12 },
    { width: 1440, height: 900, minCardWidth: 440, minIconWidth: 52 },
    { width: 1730, height: 1310, minCardWidth: 480, minIconWidth: 60 },
  ]) {
    await page.setViewportSize(viewport);
    await page.goto("/skills");

    const main = page.locator(".skills-stage");
    await expect(main).toHaveAttribute("data-skills-layout", "desktop");
    await expect(main).toHaveAttribute("data-skills-overflow", "fit");
    const cards = page.locator(".skills-bento-grid > li");
    await expect(cards).toHaveCount(9);
    await expect(cards.last()).toBeInViewport({ ratio: 0.9 });

    const cardWidth = (await page.locator(".skills-card-surface").first().boundingBox())!.width;
    const iconWidth = (await page.locator("[data-skill-canvas]").first().boundingBox())!.width;
    expect(cardWidth).toBeGreaterThanOrEqual(viewport.minCardWidth);
    expect(iconWidth).toBeGreaterThanOrEqual(viewport.minIconWidth);

    const geometry = await main.evaluate((element) => ({
      documentWidth: document.documentElement.scrollWidth,
      documentHeight: document.documentElement.scrollHeight,
      stageHeight: element.scrollHeight,
      visibleStageHeight: element.clientHeight,
    }));
    expect(geometry.documentWidth).toBeLessThanOrEqual(viewport.width + 1);
    expect(geometry.documentHeight).toBeLessThanOrEqual(viewport.height + 1);
    expect(geometry.stageHeight).toBeLessThanOrEqual(geometry.visibleStageHeight + 1);
  }
});

test("AI icon canvases match the other skill icons on tall desktops", async ({ page }) => {
  await page.setViewportSize({ width: 1730, height: 1310 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/skills");

  const stage = page.locator(".skills-stage");
  await expect.poll(async () => Number(await stage.getAttribute("data-viewport-scale")))
    .toBeGreaterThan(1.3);
  await expect(page.locator(".skills-card-surface")).toHaveCount(9);

  const widths = await page.locator("[data-skill-canvas]").evaluateAll((elements) =>
    elements.map((element) => element.getBoundingClientRect().width),
  );
  expect(Math.max(...widths) - Math.min(...widths)).toBeLessThan(0.1);
});

test("shared navigation uses the same viewport heights on every page", async ({ page }) => {
  for (const viewport of [
    { width: 390, height: 844, headerHeight: 48 },
    { width: 967, height: 943, headerHeight: 58 },
  ]) {
    await page.setViewportSize(viewport);
    for (const route of pages) {
      await page.goto(route);
      await expect(page.locator(".site-header"), route).toBeVisible();
      const header = await page.locator(".site-header").boundingBox();
      expect(header, route).not.toBeNull();
      expect(header!.y, route).toBeCloseTo(0, 0);
      expect(header!.height, route).toBeCloseTo(viewport.headerHeight, 0);
    }
  }
});

test("Journey keeps all commits visible without card or marker shadows", async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem("theme", "dark"));
  await page.emulateMedia({ reducedMotion: "reduce" });

  for (const viewport of [
    { width: 967, height: 943 },
    { width: 390, height: 844 },
    { width: 390, height: 500 },
    { width: 844, height: 390 },
  ]) {
    await page.setViewportSize(viewport);
    await page.goto("/journey");
    const cards = page.locator(".commit-card");
    await expect.poll(async () => cards.count()).toBeGreaterThanOrEqual(6);
    expect(await cards.count()).toBeLessThanOrEqual(7);

    await expect.poll(async () => page.evaluate(() => {
      const main = document.querySelector(".journey-main")!.getBoundingClientRect();
      const cards = document.querySelectorAll(".commit-card");
      const last = cards[cards.length - 1].getBoundingClientRect();
      return last.bottom - main.bottom;
    })).toBeLessThanOrEqual(1);

    const shadows = await page.locator(".git-head, .commit-card").evaluateAll((elements) =>
      elements.map((element) => getComputedStyle(element).boxShadow),
    );
    expect(shadows.every((shadow) => shadow === "none")).toBe(true);
    const marker = await page.locator(".rail-dot").first().evaluate((element) => ({
      shadow: getComputedStyle(element).boxShadow,
      after: getComputedStyle(element, "::after").content,
    }));
    expect(marker.shadow).toBe("none");
    expect(marker.after).toBe("none");
  }
});

test("Arabic Journey card ports stay connected to the left-side rail", async ({ page }) => {
  await page.setViewportSize({ width: 1728, height: 1316 });
  await page.emulateMedia({ reducedMotion: "reduce" });

  for (const route of ["/journey", "/ar/journey"]) {
    await page.goto(route);
    const row = page.locator(".commit-row").first();
    await expect(row).toBeVisible();

    const positions = await row.evaluate((element) => {
      const rail = element.firstElementChild?.getBoundingClientRect();
      const card = element.querySelector(".commit-card")?.getBoundingClientRect();
      const port = element.querySelector(".commit-rail-port")?.getBoundingClientRect();
      if (!rail || !card || !port) throw new Error("Journey rail or card is missing");
      return {
        railRight: rail.right,
        cardLeft: card.left,
        cardRight: card.right,
        portLeft: port.left,
      };
    });

    expect(positions.railRight, route).toBeLessThan(positions.cardLeft);
    expect(Math.abs(positions.portLeft - positions.cardLeft), route).toBeLessThanOrEqual(2);
    expect(positions.portLeft, route).toBeLessThan(positions.cardRight - 20);
  }
});

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
