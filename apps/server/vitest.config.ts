import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    name: 'server',
    setupFiles: ['./vitest.setup.ts'],
  },
})
