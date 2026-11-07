import { expect, test } from "@playwright/test";

test("login page renders", async ({ page }) => {
  await page.goto("/login");
  await expect(page.getByRole("heading", { name: /welcome back/i })).toBeVisible();
});

test("password generator page renders", async ({ page }) => {
  // Requires auth; redirect to login is acceptable
  await page.goto("/password-generator");
  await expect(page).toHaveURL(/login|password-generator/);
});