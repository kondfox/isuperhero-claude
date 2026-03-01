import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    projects: [
      'packages/game-logic/vitest.config.ts',
      {
        test: {
          name: 'game-data',
          root: './packages/game-data',
        },
      },
      {
        test: {
          name: 'web',
          root: './apps/web',
          exclude: ['e2e/**', 'node_modules/**'],
        },
      },
      {
        test: {
          name: 'server',
          root: './apps/server',
        },
      },
    ],
  },
})
