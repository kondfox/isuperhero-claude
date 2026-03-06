import { expect } from '@playwright/test'
import { createBdd } from 'playwright-bdd'

const { Given, When, Then } = createBdd()

Given('I am on the homepage', async ({ page }) => {
  await page.goto('/')
})

Given('I am on the create room page', async ({ page }) => {
  await page.goto('/lobby?mode=create')
})

Given('I am on the join room page', async ({ page }) => {
  await page.goto('/lobby?mode=join')
})

Given('I am on the leaderboard page', async ({ page }) => {
  await page.goto('/leaderboard')
})

Then('I should see the text {string}', async ({ page }, text: string) => {
  await expect(page.getByText(text)).toBeVisible()
})

Then('the leaderboard should finish loading', async ({ page }) => {
  // Wait for loading to complete — result depends on whether DB is available
  await expect(page.getByText('Loading...')).toBeHidden({ timeout: 10000 })
  // Should show either empty state, entries table, or error — any non-loading state is valid
  const hasContent = await page
    .getByText('No games played yet')
    .isVisible()
    .catch(() => false)
  const hasTable = await page
    .getByRole('table')
    .isVisible()
    .catch(() => false)
  // Error text varies (JSON parse error, network error, etc.) — check for error paragraph
  const hasError = await page
    .locator('p[class*=error]')
    .isVisible()
    .catch(() => false)
  expect(hasContent || hasTable || hasError).toBe(true)
})

Then('I should see the heading {string}', async ({ page }, name: string) => {
  await expect(page.getByRole('heading', { name })).toBeVisible()
})

Then('I should see a {string} link', async ({ page }, name: string) => {
  await expect(page.getByRole('link', { name })).toBeVisible()
})

When('I click the {string} link', async ({ page }, name: string) => {
  await page.getByRole('link', { name }).click()
})

When('I click the {string} button', async ({ page }, name: string) => {
  await page.getByRole('button', { name }).click()
})

Then('I should see the {string} button', async ({ page }, name: string) => {
  await expect(page.getByRole('button', { name })).toBeVisible()
})
