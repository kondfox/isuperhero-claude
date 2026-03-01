import { expect } from '@playwright/test'
import { createBdd } from 'playwright-bdd'
import { test } from './fixtures'

const { Given, When } = createBdd(test)

Given(
  '{string} has created a room with max {int} players',
  async ({ browser, world }, playerName: string, maxPlayers: number) => {
    // Create a separate browser context for Alice
    const aliceContext = await browser.newContext()
    const alicePage = await aliceContext.newPage()

    world.aliceContext = aliceContext
    world.alicePage = alicePage

    // Navigate to create room form
    await alicePage.goto('/lobby?mode=create')
    await alicePage.getByLabel('Your Name').fill(playerName)
    await alicePage.getByLabel('Max Players').selectOption({ label: `${maxPlayers} Players` })
    await alicePage.getByRole('button', { name: 'Create Room' }).click()

    // Wait for lobby to appear and extract room code
    await expect(alicePage.getByRole('heading', { name: 'Lobby' })).toBeVisible()
    const roomCode = await alicePage.locator('[class*=codeValue]').textContent()
    world.roomCode = roomCode?.trim() ?? ''
  },
)

Given('{string} is in the lobby', async ({ world }) => {
  // Alice's context was already set up by the "has created a room" step.
  // This step just asserts the lobby is visible (which it already is).
  if (!world.alicePage) {
    throw new Error('Alice page not initialized — run the "has created a room" step first')
  }
  await expect(world.alicePage.getByRole('heading', { name: 'Lobby' })).toBeVisible()
})

When('I fill in "Room Code" with the room code', async ({ page, world }) => {
  if (!world.roomCode) {
    throw new Error('Room code not set — run the "has created a room" step first')
  }
  await page.getByLabel('Room Code').fill(world.roomCode)
})
