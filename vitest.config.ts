import { defineConfig } from 'vitest/config'

// Separate from vite.config.ts: the tests cover pure logic only (no DOM, no React plugin)
export default defineConfig({
  test: {
    include: ['src/**/*.test.ts'],
  },
})
