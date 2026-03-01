import { expect } from '@playwright/test'
import { createBdd } from 'playwright-bdd'

const { Then, When } = createBdd()

Then('I should see the {string} field', async ({ page }, name: string) => {
  await expect(page.getByLabel(name)).toBeVisible()
})

Then('I should see a {string} dropdown', async ({ page }, name: string) => {
  await expect(page.getByLabel(name)).toBeVisible()
})

When('I fill in {string} with {string}', async ({ page }, label: string, value: string) => {
  await page.getByLabel(label).fill(value)
})

When('I select {string} from {string}', async ({ page }, value: string, label: string) => {
  await page.getByLabel(label).selectOption({ label: value })
})
