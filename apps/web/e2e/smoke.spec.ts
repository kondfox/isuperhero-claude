import { expect, test } from "@playwright/test";

test("homepage loads", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveTitle(/iSuperhero/);
  await expect(page.getByRole("heading", { name: "iSuperhero Online" })).toBeVisible();
});
