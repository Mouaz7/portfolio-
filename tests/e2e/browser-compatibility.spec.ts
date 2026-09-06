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
  await page.goto("/contact-page");
  await page.getByRole("button", { name: "Open menu" }).click();
  await expect(page.getByRole("dialog", { name: "Site navigation" })).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("button", { name: "Open menu" })).toBeFocused();
  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect(page.locator("canvas[data-background-fps]")).toHaveAttribute("data-background-mode", "static");
  const form = page.locator('form[aria-label="Contact form"]:visible');
  const name = form.getByPlaceholder("Name");
  await name.fill("Test");
  await name.press("Enter");
  await expect(form.getByPlaceholder("Email")).toBeFocused();
  expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(1);
});
