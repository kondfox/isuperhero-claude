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
      'apps/web/vitest.config.ts',
      {
        test: {
          name: 'server',
          root: './apps/server',
          setupFiles: ['./vitest.setup.ts'],
        },
      },
    ],
  },
})
