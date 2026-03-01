import type { BrowserContext, Page } from '@playwright/test'
import { test as base } from 'playwright-bdd'

interface World {
  roomCode: string
  aliceContext: BrowserContext | null
  alicePage: Page | null
}

export const test = base.extend<{ world: World }>({
  // biome-ignore lint/correctness/noEmptyPattern: Playwright fixture API requires destructuring
  world: async ({}, use) => {
    const world: World = {
      roomCode: '',
      aliceContext: null,
      alicePage: null,
    }
    await use(world)
    // Cleanup: close Alice's context if it was created
    if (world.aliceContext) {
      await world.aliceContext.close()
    }
  },
})
