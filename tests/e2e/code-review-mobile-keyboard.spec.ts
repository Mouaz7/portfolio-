import { expect, test } from "@playwright/test";

test.use({ viewport: { width: 393, height: 851 }, isMobile: true, hasTouch: true });

for (const viewportMode of ["layout", "visual"] as const) {
  test(`mobile code review stays usable when the keyboard resizes the ${viewportMode} viewport`, async ({ page }, testInfo) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.addInitScript(() => localStorage.setItem("theme", "dark"));
    let submittedCode: string | undefined;
    await page.route("**/api/ai/code-review", async (route) => {
      submittedCode = route.request().postDataJSON().code;
      await route.fulfill({
        json: { review: "## Summary\n\nKeyboard review succeeded.", language: "en", model: "test" },
      });
    });
    await page.goto("/code-review");
    const editor = page.getByRole("textbox", { name: "Code snippet" });
    await expect(editor).toBeVisible();
    await expect(page.getByRole("link", { name: "Privacy & data use" })).toHaveAttribute("href", "/privacy");
    await editor.focus();
    if (viewportMode === "layout") {
      await page.setViewportSize({ width: 393, height: 400 });
    } else {
      // Some mobile browsers shrink only the visible viewport for the keyboard.
      await page.evaluate(() => {
        const viewport = window.visualViewport!;
        Object.defineProperty(viewport, "height", { configurable: true, value: 400 });
        viewport.dispatchEvent(new Event("resize"));
      });
    }
    await expect.poll(async () => (await editor.boundingBox())?.height ?? 0).toBeGreaterThanOrEqual(180);
    const code = `const values = [\n${Array.from({ length: 18 }, (_, index) => `  ${index},`).join("\n")}\n];`;
    await editor.fill(code);
    await expect(editor).toBeFocused();
    await expect(editor).toHaveValue(code);
    expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(1);

    const run = page.getByRole("button", { name: "Run", exact: true });
    await run.scrollIntoViewIfNeeded();
    const editorBox = await editor.boundingBox();
    const runBox = await run.boundingBox();
    expect(editorBox!.y + editorBox!.height).toBeLessThanOrEqual(runBox!.y + 1);
    expect(runBox!.y).toBeGreaterThanOrEqual(0);
    expect(runBox!.y + runBox!.height).toBeLessThanOrEqual(401);
    await page.screenshot({
      path: testInfo.outputPath("keyboard-open.png"),
      clip: { x: 0, y: 0, width: 393, height: 400 },
    });
    await run.click();
    await expect(page.getByText("Keyboard review succeeded.")).toBeVisible();
    expect(submittedCode).toBe(code);

    if (viewportMode === "layout") {
      await page.setViewportSize({ width: 393, height: 851 });
    } else {
      await page.evaluate(() => {
        const viewport = window.visualViewport!;
        Reflect.deleteProperty(viewport, "height");
        viewport.dispatchEvent(new Event("resize"));
      });
    }
    await expect(page.getByRole("heading", { name: "Understand and improve your code" })).toBeVisible();
    await page.getByRole("tab", { name: "Editor", exact: true }).click();
    await expect(editor).toHaveValue(code);
  });
}

test("privacy badge opens the full privacy page", async ({ page }) => {
  await page.goto("/code-review");
  await page.getByRole("link", { name: "Privacy & data use" }).click();
  await expect(page).toHaveURL(/\/privacy$/);
  await expect(page.getByRole("heading", { name: "Privacy", exact: true })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Contact messages" })).toBeVisible();
});
