import { expect, test } from "@playwright/test";

test("a skill icon opens every matching project category", async ({ page }) => {
  await page.setViewportSize({ width: 967, height: 943 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/skills");

  await page.locator('[data-skill-project-link="Python"]').click();
  await expect(page).toHaveURL(/\/projects\?technology=Python$/);
  await expect(page.locator('[data-active-technology="Python"]')).toBeVisible();
  await expect(page.getByRole("button", { name: /Build/i })).toBeVisible();
  await expect(page.getByRole("button", { name: /Systems/i })).toBeVisible();
  await expect(page.locator(".projects-project-row").first()).toContainText("Python");

  await page.getByRole("button", { name: /Systems/i }).click();
  await expect(page.locator('[data-active-category="Systems"]')).toBeVisible();
  await expect(page.getByText("Linked List in Python")).toBeVisible();
  await expect(
    page.locator(".projects-project-row").filter({ hasText: "Linked List in Python" }),
  ).toContainText("Python");
});

test("AegisDB links to its public repository and appears for Java", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/projects");

  await page.getByRole("button", { name: /Systems/i }).click();
  const aegis = page.locator(".projects-mobile-card-row").filter({ hasText: "AegisDB" });
  await expect(aegis).toBeVisible();
  await aegis.scrollIntoViewIfNeeded();
  await expect(aegis).toBeInViewport({ ratio: 0.95 });
  await expect(aegis).toContainText("Java");
  await expect(aegis.locator('a[href="https://github.com/Mouaz7/AegisDB"]')).toHaveCount(1);
  await expect(page.locator("[data-viewport-page]")).toBeInViewport();

  await page.goto("/projects?technology=Java");
  await expect(page.locator('[data-active-technology="Java"]')).toBeVisible();
  await expect(page.getByRole("button", { name: /Systems/i })).toBeVisible();
  await page.getByRole("button", { name: /Systems/i }).click();
  await expect(page.getByText("AegisDB")).toBeVisible();
});

test("a skill with no published projects has a clear exit", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 500 });
  await page.goto("/skills");

  await expect(page.locator('[data-skill-project-unavailable="Swift"]')).toBeVisible();
  await expect(page.locator('[data-skill-project-link="Swift"]')).toHaveCount(0);

  // A manually entered, stale filter URL remains recoverable.
  await page.goto("/projects?technology=Swift");

  await expect(page.locator('[data-active-technology="Swift"]')).toBeVisible();
  await expect(page.getByText("No repositories match current filters.")).toBeVisible();
  await page.getByRole("link", { name: "Show all projects" }).click();
  await expect(page).toHaveURL(/\/projects$/);
  await expect(page.getByRole("button", { name: /Full-Stack/i })).toBeVisible();
});

test("the skill link keeps the Swedish locale and works from the keyboard", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/sv/skills");

  const link = page.getByRole("link", { name: "Visa projekt med Python" });
  await link.focus();
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/\/sv\/projects\?technology=Python$/);
  await expect(page.getByText("Projekt med Python")).toBeVisible();
  await expect(page.getByRole("link", { name: "Visa alla projekt" }))
    .toHaveAttribute("href", "/sv/projects");
});

test("audited repository tools open real matching projects", async ({ page }) => {
  await page.setViewportSize({ width: 1366, height: 768 });
  await page.emulateMedia({ reducedMotion: "reduce" });

  const cases = [
    ["HTML5", "Move-Out: Moving Box System"],
    ["CSS3", "Move-Out: Moving Box System"],
    ["Vercel", "Developer Portfolio"],
    ["CI/CD", "Move-Out: Moving Box System"],
    ["Cypress", "BSV Edutask"],
    ["Flask", "BSV Edutask"],
    ["Pytest", "BSV Edutask"],
    ["MariaDB", "E-Shop Management System"],
    ["Bun", "Team Temp App Showcase"],
  ] as const;

  await page.goto("/skills");
  for (const [skill] of cases) {
    await expect(page.locator(`[data-skill-project-link="${skill}"]`)).toHaveCount(1);
  }

  for (const [skill] of cases) {
    await page.goto(`/projects?technology=${encodeURIComponent(skill)}`);
    await expect(page.locator(`[data-active-technology="${skill}"]`)).toBeVisible();
    await expect(page.locator(".projects-project-row").first()).toContainText(skill);
    await expect(page.getByText("No repositories match current filters.")).toHaveCount(0);
  }

  await expect(page.locator("[data-nextjs-dialog]")).toHaveCount(0);
  await expect(page.locator("body")).not.toHaveText("");
});
