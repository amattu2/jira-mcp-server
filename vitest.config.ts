import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    include: ["**/*.test.ts"],
    globals: true,
    coverage: {
      enabled: true,
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      reportsDirectory: 'coverage', 
    },
  },
})
