import { expect } from '@playwright/test'
import { createBdd } from 'playwright-bdd'

const { Then } = createBdd()

Then('I should see the room code', async ({ page }) => {
  await expect(page.locator('[class*=codeValue]')).toBeVisible()
})

Then('the room code should be 6 characters', async ({ page }) => {
  const codeText = await page.locator('[class*=codeValue]').textContent()
  expect(codeText?.trim()).toHaveLength(6)
})

Then('I should see {string} in the player list', async ({ page }, name: string) => {
  await expect(page.getByText(name)).toBeVisible()
})

Then('I should see {string}', async ({ page }, text: string) => {
  await expect(page.getByText(text)).toBeVisible()
})
