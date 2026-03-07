import { expect, type Page } from '@playwright/test'
import { createBdd } from 'playwright-bdd'
import { loginViaApi } from './auth-helper'
import { test, type World } from './fixtures'

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

    // Authenticate Alice via API
    await loginViaApi(alicePage, player1)

    await alicePage.goto('/lobby?mode=create')
    await alicePage.getByLabel('Max Players').selectOption({ label: '2 Players' })
    await alicePage.getByRole('button', { name: 'Create Room' }).click()
    await expect(alicePage.getByRole('heading', { name: 'Lobby' })).toBeVisible()

    const roomCode = await alicePage.locator('[class*=codeValue]').textContent()
    world.roomCode = roomCode?.trim() ?? ''

    // Authenticate Bob via API
    await loginViaApi(page, player2)

    // Bob joins
    await page.goto('/lobby?mode=join')
    await page.getByLabel('Room Code').fill(world.roomCode)
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

  // Wait for the draw to be fully processed — the phase will settle into
  // either TurnComplete (bonus card or monster victory) or BattleDefeatPenalty (monster defeat).
  const endTurnButton = page.getByRole('button', { name: 'End Turn' })
  const penaltySection = page.getByTestId('battle-defeat-penalty')

  // Wait for either End Turn or battle penalty to appear
  await Promise.race([
    endTurnButton.waitFor({ state: 'visible', timeout: 10000 }),
    penaltySection.waitFor({ state: 'visible', timeout: 10000 }),
  ])

  // If penalty visible, choose the first available ability to lose
  if (await penaltySection.isVisible()) {
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
  await expect(page.getByTestId('game-board').getByText(text, { exact: true })).toBeVisible()
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

// === Player passport ===

Then('I should see a passport for each player', async ({ page, world }) => {
  if (!world.alicePage) throw new Error('Alice page not initialized')
  const passports = page.getByTestId('player-passport')
  await expect(passports).toHaveCount(2)
})

Then('each passport should display 5 ability scores', async ({ page }) => {
  const passports = page.getByTestId('player-passport')
  const first = passports.first()
  await expect(first.getByTestId('ability-score')).toHaveCount(5)
})

Then("the active player's passport should show updated ability scores", async ({ world }) => {
  if (!world.activePlayerPage) throw new Error('Active player not determined')
  const page = world.activePlayerPage
  const name = world.initialActivePlayerName
  // Find the passport with the active player's name, wait for score to update
  const passport = page.getByTestId('player-passport').filter({ hasText: name })
  await expect(async () => {
    const texts = await passport.getByTestId('ability-score').allTextContents()
    const hasNonZero = texts.some((t) => Number.parseInt(t.replace(/\D/g, ''), 10) > 0)
    expect(hasNonZero).toBe(true)
  }).toPass({ timeout: 5000 })
})

// === Battle comparison ===

When('the active player draws until a monster appears', async ({ page, world }) => {
  if (!world.activePlayerPage) throw new Error('Active player not determined')
  const pageA = world.alicePage!
  const pageB = page

  // Keep drawing across turns until a monster card appears (with battle comparison)
  for (let attempt = 0; attempt < 10; attempt++) {
    // Determine who is currently active by checking both pages
    const textA = await pageA.getByTestId('turn-indicator').textContent()
    const currentActive = textA?.includes('Your turn') ? pageA : pageB
    const currentInactive = currentActive === pageA ? pageB : pageA

    // Click Draw from Cosmos
    const drawBtn = currentActive.getByRole('button', { name: 'Draw from Cosmos' })
    await expect(drawBtn).toBeVisible({ timeout: 5000 })
    await drawBtn.click()

    // Wait for draw to resolve
    const endTurnBtn = currentActive.getByRole('button', { name: 'End Turn' })
    const penaltySec = currentActive.getByTestId('battle-defeat-penalty')
    await Promise.race([
      endTurnBtn.waitFor({ state: 'visible', timeout: 10000 }),
      penaltySec.waitFor({ state: 'visible', timeout: 10000 }),
    ])

    // Check if a monster was drawn (drawn-card section with battle result)
    const drawnCard = currentActive.getByTestId('drawn-card')
    const hasMonster = await drawnCard
      .getByText(/Monster:/i)
      .isVisible()
      .catch(() => false)
    if (hasMonster) {
      // Found a monster! Update world so the assertions use the right page
      world.activePlayerPage = currentActive
      world.inactivePlayerPage = currentInactive
      return
    }

    // Bonus card — resolve penalty if needed, then end turn
    if (await penaltySec.isVisible()) {
      await penaltySec.getByRole('button').first().click()
    }
    await endTurnBtn.waitFor({ state: 'visible', timeout: 5000 })
    await endTurnBtn.click()

    // Wait for turn to advance
    await expect(currentInactive.getByText('Your turn')).toBeVisible({ timeout: 5000 })
  }

  throw new Error('No monster drawn after 10 attempts')
})

Then('the active player should see the battle comparison', async ({ world }) => {
  if (!world.activePlayerPage) throw new Error('Active player not determined')
  await expect(world.activePlayerPage.getByTestId('battle-comparison')).toBeVisible()
})

Then('the battle comparison should show 5 ability matchups', async ({ world }) => {
  if (!world.activePlayerPage) throw new Error('Active player not determined')
  const comparison = world.activePlayerPage.getByTestId('battle-comparison')
  await expect(comparison.getByTestId('battle-matchup')).toHaveCount(5)
})

// === Ship beds ===

Then('each passport should show 3 ship beds', async ({ page }) => {
  const passports = page.getByTestId('player-passport')
  const first = passports.first()
  await expect(first.getByTestId('ship-bed')).toHaveCount(3)
})

Then('all ship beds should be empty at the start', async ({ page }) => {
  const beds = page.getByTestId('ship-bed')
  const count = await beds.count()
  for (let i = 0; i < count; i++) {
    await expect(beds.nth(i)).toHaveAttribute('data-filled', 'false')
  }
})

// === Task card content ===

Then('the task card should show the task type', async ({ world }) => {
  if (!world.activePlayerPage) throw new Error('Active player not determined')
  await expect(world.activePlayerPage.getByTestId('task-type')).toBeVisible()
})

Then('the task card should show the rewards', async ({ world }) => {
  if (!world.activePlayerPage) throw new Error('Active player not determined')
  const rewards = world.activePlayerPage.getByTestId('task-reward')
  const count = await rewards.count()
  expect(count).toBeGreaterThanOrEqual(1)
})

Then('the task card should show the task title', async ({ world }) => {
  if (!world.activePlayerPage) throw new Error('Active player not determined')
  const title = world.activePlayerPage.getByTestId('task-title')
  await expect(title).toBeVisible()
  const text = await title.textContent()
  expect(text?.trim().length).toBeGreaterThan(0)
})

Then('the task card should show the task instructions', async ({ world }) => {
  if (!world.activePlayerPage) throw new Error('Active player not determined')
  const instructions = world.activePlayerPage.getByTestId('task-instructions')
  await expect(instructions).toBeVisible()
  const html = await instructions.innerHTML()
  expect(html.trim().length).toBeGreaterThan(0)
})

// === Bonus card tray ===

Then('each passport should show a bonus card tray', async ({ page }) => {
  const passports = page.getByTestId('player-passport')
  const first = passports.first()
  await expect(first.getByTestId('bonus-tray')).toBeVisible()
})

Then('all bonus trays should be empty at the start', async ({ page }) => {
  const trays = page.getByTestId('bonus-tray')
  const count = await trays.count()
  for (let i = 0; i < count; i++) {
    await expect(trays.nth(i)).toHaveAttribute('data-empty', 'true')
  }
})

// === Bonus card usage ===

async function drawUntilBonusCard(
  activePage: Page,
  inactivePage: Page,
  world: World,
  filter?: 'boost' | 'passive',
): Promise<void> {
  for (let attempt = 0; attempt < 20; attempt++) {
    // Determine who is currently active
    const textA = await activePage.getByTestId('turn-indicator').textContent()
    const currentActive = textA?.includes('Your turn') ? activePage : inactivePage
    const currentInactive = currentActive === activePage ? inactivePage : activePage

    // Draw from Cosmos
    const drawBtn = currentActive.getByRole('button', { name: 'Draw from Cosmos' })
    await expect(drawBtn).toBeVisible({ timeout: 5000 })
    await drawBtn.click()

    // Wait for draw to resolve
    const endTurnBtn = currentActive.getByRole('button', { name: 'End Turn' })
    const penaltySec = currentActive.getByTestId('battle-defeat-penalty')
    await Promise.race([
      endTurnBtn.waitFor({ state: 'visible', timeout: 10000 }),
      penaltySec.waitFor({ state: 'visible', timeout: 10000 }),
    ])

    // Check if a bonus card was drawn (look at drawn-card section)
    const drawnCard = currentActive.getByTestId('drawn-card')
    const hasBonusText = await drawnCard
      .getByText(/Bonus:/i)
      .isVisible()
      .catch(() => false)

    if (hasBonusText) {
      // Check if it matches the filter
      if (filter === 'boost') {
        // Check if it's a boost card (any +1 ability card)
        const bonusText = await drawnCard.textContent()
        const isBoost =
          bonusText?.includes('Бонус: Управление') ||
          bonusText?.includes('Бонус: Связь') ||
          bonusText?.includes('Бонус: Ориентация') ||
          bonusText?.includes('Бонус: Переработка') ||
          bonusText?.includes('Бонус: Движение-Энергия') ||
          bonusText?.includes('Бонус: Выбор')

        if (isBoost) {
          world.activePlayerPage = currentActive
          world.inactivePlayerPage = currentInactive
          return
        }
      } else if (filter === 'passive') {
        const bonusText = await drawnCard.textContent()
        const isPassive =
          bonusText?.includes('Преимущество в бою') ||
          bonusText?.includes('Иммунитет от поражения') ||
          bonusText?.includes('Иммунитет + цепочка')

        if (isPassive) {
          world.activePlayerPage = currentActive
          world.inactivePlayerPage = currentInactive
          return
        }
      } else {
        // Any bonus card
        world.activePlayerPage = currentActive
        world.inactivePlayerPage = currentInactive
        return
      }
    }

    // Resolve penalty if needed, then end turn
    if (await penaltySec.isVisible()) {
      await penaltySec.getByRole('button').first().click()
    }
    await endTurnBtn.waitFor({ state: 'visible', timeout: 5000 })
    await endTurnBtn.click()

    // Wait for turn to advance
    await expect(currentInactive.getByText('Your turn')).toBeVisible({ timeout: 5000 })
  }

  throw new Error(`No ${filter ?? ''} bonus card drawn after 20 attempts`)
}

When('the active player draws until a bonus card is gained', async ({ page, world }) => {
  if (!world.activePlayerPage) throw new Error('Active player not determined')
  const other = world.activePlayerPage === page ? world.alicePage! : page
  await drawUntilBonusCard(world.activePlayerPage, other, world)
})

When('the active player draws until a boost bonus card is gained', async ({ page, world }) => {
  if (!world.activePlayerPage) throw new Error('Active player not determined')
  const other = world.activePlayerPage === page ? world.alicePage! : page
  await drawUntilBonusCard(world.activePlayerPage, other, world, 'boost')
})

When('the active player draws until a passive bonus card is gained', async ({ page, world }) => {
  if (!world.activePlayerPage) throw new Error('Active player not determined')
  const other = world.activePlayerPage === page ? world.alicePage! : page
  await drawUntilBonusCard(world.activePlayerPage, other, world, 'passive')
})

When('the active player ends their turn after drawing', async ({ world }) => {
  if (!world.activePlayerPage) throw new Error('Active player not determined')
  const endBtn = world.activePlayerPage.getByRole('button', { name: 'End Turn' })
  await expect(endBtn).toBeVisible({ timeout: 5000 })
  await endBtn.click()
})

When('the new active player draws until a bonus card is gained', async ({ page, world }) => {
  if (!world.inactivePlayerPage) throw new Error('Inactive player not determined')
  // Wait for the previously inactive player to become active
  await expect(world.inactivePlayerPage.getByText('Your turn')).toBeVisible({ timeout: 5000 })
  // Swap roles
  const newActive = world.inactivePlayerPage
  const newInactive = world.activePlayerPage!
  world.activePlayerPage = newActive
  world.inactivePlayerPage = newInactive
  const other = newActive === page ? world.alicePage! : page
  await drawUntilBonusCard(newActive, other, world)
})

When('the new active player draws until a boost bonus card is gained', async ({ page, world }) => {
  if (!world.inactivePlayerPage) throw new Error('Inactive player not determined')
  await expect(world.inactivePlayerPage.getByText('Your turn')).toBeVisible({ timeout: 5000 })
  const newActive = world.inactivePlayerPage
  const newInactive = world.activePlayerPage!
  world.activePlayerPage = newActive
  world.inactivePlayerPage = newInactive
  const other = newActive === page ? world.alicePage! : page
  await drawUntilBonusCard(newActive, other, world, 'boost')
})

When(
  'the new active player draws until a passive bonus card is gained',
  async ({ page, world }) => {
    if (!world.inactivePlayerPage) throw new Error('Inactive player not determined')
    await expect(world.inactivePlayerPage.getByText('Your turn')).toBeVisible({ timeout: 5000 })
    const newActive = world.inactivePlayerPage
    const newInactive = world.activePlayerPage!
    world.activePlayerPage = newActive
    world.inactivePlayerPage = newInactive
    const other = newActive === page ? world.alicePage! : page
    await drawUntilBonusCard(newActive, other, world, 'passive')
  },
)

Then('the active player should see a Use button on their bonus card', async ({ world }) => {
  if (!world.activePlayerPage) throw new Error('Active player not determined')
  const useBtn = world.activePlayerPage.locator('[class*=bonusCardUse]').first()
  await expect(useBtn).toBeVisible({ timeout: 5000 })
})

When('the active player uses their first bonus card', async ({ world }) => {
  if (!world.activePlayerPage) throw new Error('Active player not determined')
  const page = world.activePlayerPage
  const useBtn = page.locator('[class*=bonusCardUse]').first()
  await expect(useBtn).toBeVisible({ timeout: 5000 })
  await useBtn.click()

  // If a boostChoice dialog appeared, pick the first ability
  const choiceDialog = page.locator('[class*=boostChoicePanel]')
  if (await choiceDialog.isVisible().catch(() => false)) {
    await choiceDialog.getByRole('button', { name: 'Management' }).click()
  }
})

Then('the bonus card should be removed from the tray', async ({ world }) => {
  if (!world.activePlayerPage) throw new Error('Active player not determined')
  // After using the card, check that the tray has fewer cards (or is empty)
  await expect(async () => {
    const page = world.activePlayerPage!
    // The card should have been removed; check that Use buttons count decreased
    // or the tray shows "No bonus cards"
    const useButtons = page.locator('[class*=bonusCardUse]')
    const emptyTrays = page.getByText('No bonus cards')
    const btnCount = await useButtons.count()
    const hasEmpty = await emptyTrays
      .first()
      .isVisible()
      .catch(() => false)
    expect(btnCount === 0 || hasEmpty).toBeTruthy()
  }).toPass({ timeout: 5000 })
})

Then(
  "the previously inactive player should not see Use buttons on the other player's bonus cards",
  async ({ world }) => {
    if (!world.inactivePlayerPage) throw new Error('Inactive player not determined')
    // Wait for turn to advance
    await expect(world.inactivePlayerPage.getByText('Your turn')).toBeVisible({ timeout: 5000 })
    // Check the previously active player's passport — it should NOT have Use buttons
    // (the now-inactive player's bonus cards should not have Use buttons visible to the other player)
    const page = world.inactivePlayerPage
    // The page should have no Use buttons for the other player's cards
    // We check all passports — only the current player's cards should show Use
    const otherPlayerTray = page.getByTestId('bonus-tray').first()
    const useButtons = otherPlayerTray.locator('[class*=bonusCardUse]')
    // Could be 0 if the other player has no cards, or still 0 if they do but it's not their turn
    const count = await useButtons.count()
    // Use buttons should only appear on own passport and own turn
    expect(count).toBeLessThanOrEqual(0)
  },
)

Then(
  'the active player should see the ability increase after using the boost card',
  async ({ world }) => {
    if (!world.activePlayerPage) throw new Error('Active player not determined')
    const page = world.activePlayerPage

    // Find the active player's passport (the one with a Use button in its bonus tray)
    const myPassport = page.getByTestId('player-passport').filter({
      has: page.locator('[class*=bonusCardUse]'),
    })
    await expect(myPassport).toBeVisible({ timeout: 5000 })

    // Record ability scores before using the card
    const scoresBefore = await myPassport.getByTestId('ability-score').allTextContents()
    const totalBefore = scoresBefore.reduce(
      (sum, t) => sum + Number.parseInt(t.replace(/\D/g, ''), 10),
      0,
    )

    // Use the bonus card
    const useBtn = myPassport.locator('[class*=bonusCardUse]').first()
    await useBtn.click()

    // Handle boostChoice dialog if it appears
    const choiceDialog = page.locator('[class*=boostChoicePanel]')
    if (await choiceDialog.isVisible().catch(() => false)) {
      await choiceDialog.getByRole('button').first().click()
    }

    // Check ability total increased
    await expect(async () => {
      const scoresAfter = await myPassport.getByTestId('ability-score').allTextContents()
      const totalAfter = scoresAfter.reduce(
        (sum, t) => sum + Number.parseInt(t.replace(/\D/g, ''), 10),
        0,
      )
      expect(totalAfter).toBeGreaterThan(totalBefore)
    }).toPass({ timeout: 5000 })
  },
)

Then('the active player should see a passive buff indicator', async ({ world }) => {
  if (!world.activePlayerPage) throw new Error('Active player not determined')
  const page = world.activePlayerPage
  await expect(page.getByTestId('passive-buffs')).toBeVisible({ timeout: 10000 })
})

// === Cosmos deck ===

Then('the game board should show the cosmos deck count', async ({ page }) => {
  await expect(page.getByTestId('cosmos-deck-count')).toBeVisible()
})

Then('the cosmos deck count should be a positive number', async ({ page }) => {
  const text = await page.getByTestId('cosmos-deck-count').textContent()
  const num = Number.parseInt(text?.replace(/\D/g, '') ?? '0', 10)
  expect(num).toBeGreaterThan(0)
})

// === Event log ===

Then('both players should see a card drawn event', async ({ page, world }) => {
  if (!world.alicePage) throw new Error('Alice page not initialized')
  const bobLog = page.getByTestId('event-log')
  const aliceLog = world.alicePage.getByTestId('event-log')
  await expect(bobLog.getByText(/drew/i)).toBeVisible()
  await expect(aliceLog.getByText(/drew/i)).toBeVisible()
})

// === Event log ===

Then('the event log should be visible', async ({ world }) => {
  if (!world.activePlayerPage) throw new Error('Active player not determined')
  await expect(world.activePlayerPage.getByTestId('event-log')).toBeVisible()
})

Then('the active player should see an event in the log', async ({ world }) => {
  if (!world.activePlayerPage) throw new Error('Active player not determined')
  const log = world.activePlayerPage.getByTestId('event-log')
  // Wait for at least one event item to appear (not the "No events yet" placeholder)
  await expect(async () => {
    const items = log.locator('[class*=eventItem]')
    const count = await items.count()
    expect(count).toBeGreaterThan(0)
  }).toPass({ timeout: 5000 })
})

When('the active player toggles the event log', async ({ world }) => {
  if (!world.activePlayerPage) throw new Error('Active player not determined')
  await world.activePlayerPage.getByRole('button', { name: 'Toggle event log' }).click()
})

Then('the active player event log should be collapsed', async ({ world }) => {
  if (!world.activePlayerPage) throw new Error('Active player not determined')
  const log = world.activePlayerPage.getByTestId('event-log')
  await expect(log).toHaveClass(/collapsibleCollapsed/)
})

Then('the active player event log should be expanded', async ({ world }) => {
  if (!world.activePlayerPage) throw new Error('Active player not determined')
  const log = world.activePlayerPage.getByTestId('event-log')
  await expect(log).not.toHaveClass(/collapsibleCollapsed/)
})

// === Mobile responsiveness ===

Given('the viewport is set to mobile', async ({ page, world }) => {
  await page.setViewportSize({ width: 375, height: 812 })
  if (world.activePlayerPage && world.activePlayerPage !== page) {
    await world.activePlayerPage.setViewportSize({ width: 375, height: 812 })
  }
})

Then('each passport should show a compact summary', async ({ page }) => {
  const passports = page.getByTestId('player-passport')
  const count = await passports.count()
  expect(count).toBeGreaterThanOrEqual(2)
  // Compact passports show "monsters" and "ability" summary text
  for (let i = 0; i < count; i++) {
    await expect(passports.nth(i).getByText(/monsters/i)).toBeVisible()
    await expect(passports.nth(i).getByText(/ability/i)).toBeVisible()
  }
})

When('I tap the first player passport', async ({ page }) => {
  await page.getByTestId('player-passport').first().click()
})

Then('the first passport should show ability scores', async ({ page }) => {
  const passport = page.getByTestId('player-passport').first()
  await expect(passport.getByTestId('ability-score').first()).toBeVisible()
})
