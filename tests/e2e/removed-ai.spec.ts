import { expect, test } from "@playwright/test";

test("retired pages and APIs return 404 and stay out of the sitemap", async ({ request }) => {
  for (const prefix of ["", "/sv", "/ar"]) {
    for (const path of ["/code-review", "/code-review-page", "/ai-page"]) {
      const response = await request.get(`${prefix}${path}`, { maxRedirects: 0 });
      expect(response.status(), `${prefix}${path}`).toBe(404);
    }
  }
  for (const path of [
    "/api/ai/code-review",
    "/api/ai/code-review/chat",
    "/api/ai/cv-chat",
    "/api/internal/rag/reindex",
  ]) {
    expect((await request.get(path)).status(), `GET ${path}`).toBe(404);
    expect((await request.post(path, { data: {} })).status(), `POST ${path}`).toBe(404);
  }
  const sitemap = await request.get("/sitemap.xml");
  expect(sitemap.ok()).toBe(true);
  expect(await sitemap.text()).not.toMatch(/code-review|api\/ai/);
});

for (const locale of ["en", "sv", "ar"]) {
  for (const mobile of [false, true]) {
    test(`${locale} ${mobile ? "mobile" : "desktop"} navigation keeps all remaining destinations`, async ({ page }) => {
      await page.setViewportSize(mobile ? { width: 390, height: 844 } : { width: 1440, height: 900 });
      const prefix = locale === "en" ? "" : `/${locale}`;
      await page.goto(prefix || "/");
      await expect(page.locator("html")).toHaveAttribute("lang", locale);
      await expect(page.locator("html")).toHaveAttribute("dir", locale === "ar" ? "rtl" : "ltr");
      await expect(page.locator('a[href*="code-review"]')).toHaveCount(0);

      if (mobile) await page.locator('button[aria-controls="mobile-menu"]').click();
      const navigation = mobile ? page.getByRole("dialog") : page.locator(".site-header-nav");
      for (const path of ["", "/skills", "/journey", "/projects", "/contact"]) {
        const href = `${prefix}${path}` || "/";
        await expect(navigation.locator(`a[href="${href}"]`)).toBeVisible();
      }
      await navigation.locator(`a[href="${prefix}/contact"]`).click();
      await expect(page).toHaveURL(new RegExp(`${prefix}/contact$`));
      await expect(page.locator(".contact-main")).toBeVisible();
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - innerWidth);
      expect(overflow).toBeLessThanOrEqual(1);
    });
  }
}
