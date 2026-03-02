import { expect } from '@playwright/test'
import { createBdd } from 'playwright-bdd'
import { test } from './fixtures'

const { Given, When, Then } = createBdd(test)

// === Compound Game Setup ===

Given(
  'a 2-player game has started with {string} and {string}',
  async ({ browser, page, world }, player1: string, player2: string) => {
    // Alice creates room
    const aliceContext = await browser.newContext()
    const alicePage = await aliceContext.newPage()
    world.aliceContext = aliceContext
    world.alicePage = alicePage

    await alicePage.goto('/lobby?mode=create')
    await alicePage.getByLabel('Your Name').fill(player1)
    await alicePage.getByLabel('Max Players').selectOption({ label: '2 Players' })
    await alicePage.getByRole('button', { name: 'Create Room' }).click()
    await expect(alicePage.getByRole('heading', { name: 'Lobby' })).toBeVisible()

    const roomCode = await alicePage.locator('[class*=codeValue]').textContent()
    world.roomCode = roomCode?.trim() ?? ''

    // Bob joins
    await page.goto('/lobby?mode=join')
    await page.getByLabel('Room Code').fill(world.roomCode)
    await page.getByLabel('Your Name').fill(player2)
    await page.getByRole('button', { name: 'Join Room' }).click()
    await expect(page.getByRole('heading', { name: 'Lobby' })).toBeVisible()

    // Both ready up
    await alicePage.getByRole('button', { name: 'Ready' }).click()
    await page.getByRole('button', { name: 'Ready' }).click()

    // Start game
    await expect(page.getByRole('button', { name: 'Start Game' })).toBeVisible({
      timeout: 5000,
    })
    await page.getByRole('button', { name: 'Start Game' }).click()

    // Wait for both to see game board
    await expect(page.getByRole('heading', { name: 'Game Board' })).toBeVisible({
      timeout: 5000,
    })
    await expect(alicePage.getByRole('heading', { name: 'Game Board' })).toBeVisible({
      timeout: 5000,
    })

    // Determine active player by checking turn indicator
    const turnIndicator = page.getByTestId('turn-indicator')
    await expect(turnIndicator).toBeVisible({ timeout: 5000 })
    const turnText = await turnIndicator.textContent()

    if (turnText?.includes('Your turn')) {
      world.activePlayerPage = page
      world.inactivePlayerPage = alicePage
      world.initialActivePlayerName = player2
    } else {
      world.activePlayerPage = alicePage
      world.inactivePlayerPage = page
      world.initialActivePlayerName = player1
    }
  },
)

// === Alice-specific steps ===

When('Alice clicks the {string} button', async ({ world }, name: string) => {
  if (!world.alicePage) throw new Error('Alice page not initialized')
  await world.alicePage.getByRole('button', { name }).click()
})

Then('Alice should see the heading {string}', async ({ world }, name: string) => {
  if (!world.alicePage) throw new Error('Alice page not initialized')
  await expect(world.alicePage.getByRole('heading', { name })).toBeVisible()
})

// === Active player assertions ===

Then('the active player should see {string}', async ({ world }, text: string) => {
  if (!world.activePlayerPage) throw new Error('Active player not determined')
  await expect(world.activePlayerPage.getByText(text)).toBeVisible()
})

Then('the active player should see the {string} button', async ({ world }, name: string) => {
  if (!world.activePlayerPage) throw new Error('Active player not determined')
  await expect(world.activePlayerPage.getByRole('button', { name })).toBeVisible()
})

Then('the active player should see the ability selection', async ({ world }) => {
  if (!world.activePlayerPage) throw new Error('Active player not determined')
  await expect(world.activePlayerPage.getByTestId('ability-selection')).toBeVisible()
})

Then('the active player should see the die result', async ({ world }) => {
  if (!world.activePlayerPage) throw new Error('Active player not determined')
  await expect(world.activePlayerPage.getByTestId('die-result')).toBeVisible()
})

Then('the active player should see the task card', async ({ world }) => {
  if (!world.activePlayerPage) throw new Error('Active player not determined')
  await expect(world.activePlayerPage.getByTestId('task-card')).toBeVisible()
})

Then('the active player should see the drawn card', async ({ world }) => {
  if (!world.activePlayerPage) throw new Error('Active player not determined')
  await expect(world.activePlayerPage.getByTestId('drawn-card')).toBeVisible()
})

// === Active player actions ===

When('the active player clicks the {string} button', async ({ world }, name: string) => {
  if (!world.activePlayerPage) throw new Error('Active player not determined')
  await world.activePlayerPage.getByRole('button', { name }).click()
})

When('the active player chooses the {string} ability', async ({ world }, ability: string) => {
  if (!world.activePlayerPage) throw new Error('Active player not determined')
  await world.activePlayerPage
    .getByTestId('ability-selection')
    .getByRole('button', { name: ability })
    .click()
})

When('the active player resolves the draw outcome', async ({ world }) => {
  if (!world.activePlayerPage) throw new Error('Active player not determined')
  const page = world.activePlayerPage

  // If the draw resulted in a monster battle defeat, the player must choose
  // an ability to lose. Otherwise the draw auto-resolved to TurnComplete.
  const penaltySection = page.getByTestId('battle-defeat-penalty')
  const hasPenalty = await penaltySection.isVisible().catch(() => false)

  if (hasPenalty) {
    // Choose the first available ability to lose
    await penaltySection.getByRole('button').first().click()
  }
})

// === Inactive player assertions ===

Then('the inactive player should see a waiting message', async ({ world }) => {
  if (!world.inactivePlayerPage) throw new Error('Inactive player not determined')
  await expect(world.inactivePlayerPage.getByText(/waiting/i)).toBeVisible()
})

// === Game board content assertions ===

Then('I should see {string} on the game board', async ({ page }, text: string) => {
  await expect(page.getByTestId('game-board').getByText(text)).toBeVisible()
})

// === Turn advancement ===

Then('the turn should advance to the next player', async ({ world }) => {
  if (!world.inactivePlayerPage) throw new Error('Inactive player not determined')
  await expect(world.inactivePlayerPage.getByText('Your turn')).toBeVisible({
    timeout: 5000,
  })
})

Then('the previously inactive player should now be active', async ({ world }) => {
  if (!world.inactivePlayerPage) throw new Error('Inactive player not determined')
  await expect(world.inactivePlayerPage.getByText('Your turn')).toBeVisible({
    timeout: 5000,
  })
})

Then('the previously active player should now be waiting', async ({ world }) => {
  if (!world.activePlayerPage) throw new Error('Active player not determined')
  await expect(world.activePlayerPage.getByText(/waiting/i)).toBeVisible({
    timeout: 5000,
  })
})

// === Event log ===

Then('both players should see a card drawn event', async ({ page, world }) => {
  if (!world.alicePage) throw new Error('Alice page not initialized')
  const bobLog = page.getByTestId('event-log')
  const aliceLog = world.alicePage.getByTestId('event-log')
  await expect(bobLog.getByText(/drew/i)).toBeVisible()
  await expect(aliceLog.getByText(/drew/i)).toBeVisible()
})
