import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    // Exclude Playwright E2E tests — those run via `bun run test:e2e`
    exclude: ['e2e/**', 'node_modules/**'],
  },
})
