import { expect, test } from '@playwright/test'

test('homepage loads', async ({ page }) => {
  await page.goto('/')
  await expect(page).toHaveTitle(/iSuperhero/)
  await expect(page.getByRole('heading', { name: 'iSuperhero Online' })).toBeVisible()
  await expect(page.getByRole('link', { name: 'Create Room' })).toBeVisible()
  await expect(page.getByRole('link', { name: 'Join Room' })).toBeVisible()
})

test('navigates to lobby', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('link', { name: 'Create Room' }).click()
  await expect(page.getByRole('heading', { name: 'Lobby' })).toBeVisible()
})
