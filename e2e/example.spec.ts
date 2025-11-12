import { test, expect } from "@playwright/test";

test("homepage loads", async ({ page }) => {
  await page.goto("/");
  
  // Check for main heading
  await expect(page.locator("h1")).toContainText("Welcome to ShiftProto");
  
  // Check for navigation links
  await expect(page.locator('a[href="/ops"]')).toBeVisible();
  await expect(page.locator('a[href="/admin"]')).toBeVisible();
  await expect(page.locator('a[href="/payroll"]')).toBeVisible();
});

test("navigate to ops page", async ({ page }) => {
  await page.goto("/");
  await page.click('a[href="/ops"]');
  
  await expect(page).toHaveURL(/.*\/ops/);
  await expect(page.locator("h1")).toContainText("Operations");
});

test("navigate to admin page", async ({ page }) => {
  await page.goto("/");
  await page.click('a[href="/admin"]');
  
  await expect(page).toHaveURL(/.*\/admin/);
  await expect(page.locator("h1")).toContainText("Admin");
});

test("navigate to payroll page", async ({ page }) => {
  await page.goto("/");
  await page.click('a[href="/payroll"]');
  
  await expect(page).toHaveURL(/.*\/payroll/);
  await expect(page.locator("h1")).toContainText("Payroll");
});
