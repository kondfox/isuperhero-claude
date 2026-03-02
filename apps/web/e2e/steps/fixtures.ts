import type { BrowserContext, Page } from '@playwright/test'
import { test as base } from 'playwright-bdd'

interface World {
  roomCode: string
  aliceContext: BrowserContext | null
  alicePage: Page | null
  activePlayerPage: Page | null
  inactivePlayerPage: Page | null
  initialActivePlayerName: string
}

export const test = base.extend<{ world: World }>({
  // biome-ignore lint/correctness/noEmptyPattern: Playwright fixture API requires destructuring
  world: async ({}, use) => {
    const world: World = {
      roomCode: '',
      aliceContext: null,
      alicePage: null,
      activePlayerPage: null,
      inactivePlayerPage: null,
      initialActivePlayerName: '',
    }
    await use(world)
    // Cleanup: close Alice's context if it was created
    if (world.aliceContext) {
      await world.aliceContext.close()
    }
  },
})
