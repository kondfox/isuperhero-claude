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
