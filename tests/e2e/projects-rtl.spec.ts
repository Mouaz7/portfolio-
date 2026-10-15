import { expect, test, type Page } from "@playwright/test";

async function firstDesktopCardLayout(page: Page) {
  await expect(page.locator(".projects-project-row").first()).toBeVisible();

  return page.locator(".projects-project-row").first().evaluate((row) => {
    const heading = row.querySelector<HTMLElement>(".projects-repo-heading");
    const copy = row.querySelector<HTMLElement>(".projects-project-copy");
    const title = row.querySelector<HTMLElement>(".projects-project-title");
    const description = row.querySelector<HTMLElement>(".projects-project-description");
    const chip = row.querySelector<HTMLElement>(".projects-tech-chip");
    const metadata = row.querySelector<HTMLElement>(".projects-repo-metadata");
    if (!heading || !copy || !title || !description || !chip || !metadata) {
      throw new Error("The desktop project card is incomplete");
    }

    return {
      rowX: row.getBoundingClientRect().x,
      headingX: heading.getBoundingClientRect().x,
      chipX: chip.getBoundingClientRect().x,
      metadataX: metadata.getBoundingClientRect().x,
      headingDirection: getComputedStyle(heading).direction,
      copyDirection: getComputedStyle(copy).direction,
      titleDirection: getComputedStyle(title).direction,
      descriptionDirection: getComputedStyle(description).direction,
      titleAlign: getComputedStyle(title).textAlign,
      descriptionAlign: getComputedStyle(description).textAlign,
      titleDirAttribute: title.getAttribute("dir"),
      descriptionDirAttribute: description.getAttribute("dir"),
    };
  });
}

test("Arabic Projects cards keep the shared desktop composition and readable text direction", async ({ page }) => {
  await page.setViewportSize({ width: 1716, height: 1319 });
  await page.emulateMedia({ reducedMotion: "reduce" });

  await page.goto("/projects");
  const english = await firstDesktopCardLayout(page);

  await page.goto("/ar/projects");
  await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
  const arabic = await firstDesktopCardLayout(page);

  expect(arabic.headingDirection).toBe("ltr");
  expect(arabic.copyDirection).toBe("ltr");
  expect(arabic.titleDirection).toBe("rtl");
  expect(arabic.descriptionDirection).toBe("rtl");
  expect(arabic.titleDirAttribute).toBe("auto");
  expect(arabic.descriptionDirAttribute).toBe("auto");
  expect(arabic.titleAlign).toBe("left");
  expect(arabic.descriptionAlign).toBe("left");
  for (const key of ["rowX", "headingX", "chipX", "metadataX"] as const) {
    expect(Math.abs(arabic[key] - english[key]), key).toBeLessThan(2);
  }
  expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(1);
});

test("Arabic Projects phone cards retain their existing mobile layout", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/ar/projects");

  await expect(page.locator(".projects-mobile-card-wrap").first()).toBeVisible();
  await expect(page.locator(".projects-project-row")).toHaveCount(0);
  expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(1);
});
